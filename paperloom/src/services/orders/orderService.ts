import { getSupabase } from '../../lib/supabase'
import type { CartLine } from '../../types/cart'

export interface CreateOrderInput {
  userId?: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  city: string
  area?: string
  address: string
  instructions?: string
  subtotal: number
  deliveryFee: number
  total: number
  deliveryLat?: number | null
  deliveryLng?: number | null
  deliveryLocationName?: string | null
  lines: CartLine[]
  getUnitPrice: (line: CartLine) => number
  getProductName: (line: CartLine) => string
}

export async function createRealOrder(input: CreateOrderInput) {
  const client = getSupabase()
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

  const { data: order, error: orderErr } = await client
    .from('orders')
    .insert({
      user_id: input.userId || null,
      order_number: orderNumber,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      customer_phone: input.customerPhone.trim(),
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
      shipping_address_snapshot: {
        address_line_1: input.address.trim(),
        city: input.city.trim(),
        area: input.area?.trim() || '',
        instructions: input.instructions?.trim() || '',
      },
      delivery_lat: input.deliveryLat || null,
      delivery_lng: input.deliveryLng || null,
      delivery_location_name: input.deliveryLocationName || `${input.area ? input.area + ', ' : ''}${input.city}`,
      delivery_location_captured_at: input.deliveryLat ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (orderErr) throw new Error(orderErr.message)

  for (const line of input.lines) {
    await client.from('order_items').insert({
      order_id: order.id,
      product_id: line.productId,
      variant_id: line.variantId || null,
      product_name_snapshot: input.getProductName(line),
      quantity: line.quantity,
      unit_price: input.getUnitPrice(line),
      line_total: input.getUnitPrice(line) * line.quantity,
    })
  }

  return {
    orderNumber,
    orderId: order.id,
import type { Json } from '../../types/database'
import type {
  MarketplaceCaseRecord,
  OrderItemRecord,
  OrderRecord,
  PlaceOrderInput,
  PlacedOrder,
} from '../../types/order'

const ORDER_COLUMNS = 'id, order_number, customer_name, customer_phone, customer_email, shipping_address_snapshot, customer_note, currency, subtotal, delivery_fee, discount_amount, total, order_status, payment_method, payment_status, delivery_lat, delivery_lng, delivery_location_name, delivery_location_captured_at, created_at, updated_at'
const ITEM_COLUMNS = 'id, order_id, product_id, variant_id, seller_id, seller_name_snapshot, product_name_snapshot, sku_snapshot, variant_snapshot, quantity, unit_price, line_total, vendor_fulfillment_status'
const CASE_COLUMNS = 'id, order_id, order_item_id, buyer_id, seller_id, case_type, status, reason, evidence_path, seller_response, admin_decision, created_at, updated_at'

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await getSupabase().rpc('place_order', {
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_customer_email: input.customerEmail,
    p_shipping_address: input.shippingAddress,
    p_items: input.items as unknown as Json,
    p_idempotency_key: input.idempotencyKey,
    p_customer_note: input.customerNote,
    p_delivery_lat: input.deliveryLat,
    p_delivery_lng: input.deliveryLng,
    p_delivery_location_name: input.deliveryLocationName,
    p_delivery_location_captured_at: input.deliveryLocationCapturedAt,
  })
  throwIfError(error)
  const row = data?.[0]
  if (!row) throw new Error('The order was not created. Please try again.')
  return {
    orderId: row.order_id,
    orderNumber: row.order_number,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
  }
}

export async function listMyOrders(): Promise<OrderRecord[]> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select(ORDER_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100)
  throwIfError(error)
  return (data ?? []) as OrderRecord[]
}

export async function getMyOrderByNumber(orderNumber: string): Promise<OrderRecord | null> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('order_number', orderNumber)
    .maybeSingle()
  throwIfError(error)
  if (!data) return null
  const order = data as OrderRecord
  order.items = await listOrderItems(order.id)
  return order
}

export async function listOrderItems(orderId: string): Promise<OrderItemRecord[]> {
  const { data, error } = await getSupabase()
    .from('order_items')
    .select(ITEM_COLUMNS)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  throwIfError(error)
  return (data ?? []) as OrderItemRecord[]
}

export async function listMyCases(): Promise<MarketplaceCaseRecord[]> {
  const { data, error } = await getSupabase()
    .from('marketplace_cases')
    .select(CASE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100)
  throwIfError(error)
  return (data ?? []) as MarketplaceCaseRecord[]
}

export async function uploadComplaintEvidence(orderId: string, file: File): Promise<string> {
  const client = getSupabase()
  const user = (await client.auth.getUser()).data.user
  if (!user) throw new Error('Sign in before uploading evidence.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Evidence files must be 10 MB or smaller.')
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${user.id}/${orderId}-${crypto.randomUUID()}.${ext}`
  const { error } = await client.storage.from('complaint-evidence').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  throwIfError(error)
  return path
}

export async function createMarketplaceCase(input: {
  orderId: string
  orderItemId: string | null
  sellerId: string | null
  caseType: MarketplaceCaseRecord['case_type']
  reason: string
  evidencePath: string | null
}): Promise<MarketplaceCaseRecord> {
  const client = getSupabase()
  const user = (await client.auth.getUser()).data.user
  if (!user) throw new Error('Sign in before opening a case.')
  const { data, error } = await client
    .from('marketplace_cases')
    .insert({
      order_id: input.orderId,
      order_item_id: input.orderItemId,
      buyer_id: user.id,
      seller_id: input.sellerId,
      case_type: input.caseType,
      reason: input.reason.trim(),
      evidence_path: input.evidencePath,
    })
    .select(CASE_COLUMNS)
    .single()
  throwIfError(error)
  if (!data) throw new Error('The case was not created.')
  return data as MarketplaceCaseRecord
}

export async function getEvidenceSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await getSupabase().storage.from('complaint-evidence').createSignedUrl(path, 600)
  if (error || !data) return null
  return data.signedUrl
}

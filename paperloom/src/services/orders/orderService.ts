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
  }
}

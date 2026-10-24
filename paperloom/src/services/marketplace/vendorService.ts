import { getSupabase } from '../../lib/supabase'
import type { Database } from '../../types/database'

export type SellerProfile = Database['public']['Tables']['seller_profiles']['Row']
export type VendorProduct = Database['public']['Tables']['products']['Row'] & { category: { name: string } | null }
export type VendorInventory = Database['public']['Tables']['product_inventory']['Row'] & { product_name: string; variant_name: string | null }
export type MarketplaceCase = Database['public']['Tables']['marketplace_cases']['Row']
export type VendorOrderItem = Database['public']['Functions']['vendor_order_items']['Returns'][number]

function assertError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function uploadVendorDocument(file: File): Promise<string> {
  const client = getSupabase()
  const user = (await client.auth.getUser()).data.user
  if (!user) throw new Error('Sign in required before uploading verification documents.')

  const ext = file.name.split('.').pop() || 'pdf'
  const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await client.storage.from('vendor-documents').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  assertError(error)
  return path
}

export async function getOwnSellerProfile() {
  const { data, error } = await getSupabase().from('seller_profiles').select('*').maybeSingle()
  assertError(error)
  return data as SellerProfile | null
}

export async function applyAsSeller(input: Pick<Database['public']['Tables']['seller_profiles']['Insert'], 'shop_name' | 'slug' | 'description' | 'contact_email'> & {
  document_path?: string
}) {
  const user = (await getSupabase().auth.getUser()).data.user
  if (!user) throw new Error('Sign in before applying as a vendor.')
  const { data, error } = await getSupabase().from('seller_profiles').insert({
    shop_name: input.shop_name,
    slug: input.slug,
    description: input.description,
    contact_email: input.contact_email,
    user_id: user.id,
  }).select().single()
  assertError(error)
  return data as SellerProfile
}

export async function updateOwnShop(input: Pick<Database['public']['Tables']['seller_profiles']['Update'], 'shop_name' | 'slug' | 'description' | 'contact_email'>) {
  const { data, error } = await getSupabase().from('seller_profiles').update(input).select().single()
  assertError(error)
  return data as SellerProfile
}

export async function listOwnProducts(): Promise<VendorProduct[]> {
  const { data, error } = await getSupabase().from('products').select('*, categories(name)').order('created_at', { ascending: false }).limit(100)
  assertError(error)
  return (data ?? []) as unknown as VendorProduct[]
}

export async function createVendorProduct(input: {
  category_id: string | null
  name: string
  slug: string
  sku: string | null
  short_description: string
  description: string
  price: number
  supplier_cost: number | null
  fulfillment_expense: number
  minimum_profit: number
  track_inventory: boolean
}) {
  const { data, error } = await getSupabase().rpc('vendor_create_product', {
    p_category_id: input.category_id,
    p_name: input.name,
    p_slug: input.slug,
    p_sku: input.sku,
    p_short_description: input.short_description,
    p_description: input.description,
    p_price: input.price,
    p_supplier_cost: input.supplier_cost,
    p_fulfillment_expense: input.fulfillment_expense,
    p_minimum_profit: input.minimum_profit,
    p_track_inventory: input.track_inventory,
  })
  assertError(error)
  return data
}

export async function updateVendorProduct(productId: string, input: { name: string; slug: string; sku: string | null; short_description: string; description: string; price: number; supplier_cost: number | null; fulfillment_expense: number; minimum_profit: number }) {
  const { data, error } = await getSupabase().rpc('vendor_update_product', { p_product_id: productId, p_name: input.name, p_slug: input.slug, p_sku: input.sku, p_short_description: input.short_description, p_description: input.description, p_price: input.price, p_supplier_cost: input.supplier_cost, p_fulfillment_expense: input.fulfillment_expense, p_minimum_profit: input.minimum_profit })
  assertError(error)
  return data
}

export async function listOwnInventory(): Promise<VendorInventory[]> {
  const { data, error } = await getSupabase().from('product_inventory').select('id, product_id, variant_id, quantity, low_stock_threshold, updated_at, products!inner(name, seller_id), product_variants(option_label, option_value)').order('updated_at', { ascending: false }).limit(200)
  assertError(error)
  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants
    return { ...row, product_name: product?.name ?? 'Unknown product', variant_name: variant ? `${variant.option_label}: ${variant.option_value}` : null }
  }) as unknown as VendorInventory[]
}

export async function adjustOwnInventory(id: string, quantity: number, note: string) {
  const { error } = await getSupabase().rpc('vendor_adjust_inventory', { p_inventory_id: id, p_new_quantity: quantity, p_note: note })
  assertError(error)
}

export async function listOwnCases(): Promise<MarketplaceCase[]> {
  const { data, error } = await getSupabase().from('marketplace_cases').select('*').order('created_at', { ascending: false }).limit(100)
  assertError(error)
  return (data ?? []) as MarketplaceCase[]
}

export async function respondToCase(id: string, seller_response: string) {
  const { error } = await getSupabase().from('marketplace_cases').update({ seller_response, status: 'seller_responded' }).eq('id', id)
  assertError(error)
}

export async function listOwnOrderItems(): Promise<VendorOrderItem[]> {
  const { data, error } = await getSupabase().rpc('vendor_order_items')
  assertError(error)
  return data ?? []
}

export async function updateOwnOrderItem(id: string, status: string, trackingNumber: string | null, trackingUrl: string | null, note: string | null) {
  const { error } = await getSupabase().rpc('vendor_update_order_item', { p_item_id: id, p_status: status, p_tracking_number: trackingNumber, p_tracking_url: trackingUrl, p_vendor_note: note })
  assertError(error)
}

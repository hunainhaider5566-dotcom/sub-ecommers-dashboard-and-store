import { getSupabase } from '../../lib/supabase'
import type { Database, Json } from '../../types/database'

export type AdminSummary = Database['public']['Functions']['admin_dashboard_summary']['Returns'][number]
export type AdminProduct = Database['public']['Tables']['products']['Row'] & { category: { name: string } | null; inventory: number; image_url: string | null }
export type AdminCategory = Database['public']['Tables']['categories']['Row']
export type AdminOrder = Database['public']['Tables']['orders']['Row']
export type AdminOrderItem = Database['public']['Tables']['order_items']['Row']
export type AdminInventory = Database['public']['Tables']['product_inventory']['Row'] & { product_name: string; variant_name: string | null }
export type AdminCustomer = Database['public']['Functions']['admin_customer_summary']['Returns'][number]
export type AdminVariant = Database['public']['Tables']['product_variants']['Row']
export type AdminSeller = Database['public']['Tables']['seller_profiles']['Row']
export type AdminCase = Database['public']['Tables']['marketplace_cases']['Row']
export type AdminStoreSettings = Database['public']['Tables']['store_settings']['Row']

export interface AdminHero {
  id: string
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_destination: string | null
  image_url: string
  mobile_image_url: string | null
  image_alt_text: string | null
  status: 'draft' | 'published' | 'archived'
  display_order: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface AdminPromotion {
  id: string
  title: string
  description: string | null
  banner_image_url: string | null
  cta_text: string | null
  cta_destination: string | null
  is_platform_wide: boolean
  seller_id: string | null
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'hidden' | 'archived'
  rejection_reason: string | null
  display_position: string
  priority: number
  coupon_code: string | null
  discount_percent: number | null
  created_at: string
  updated_at: string
}

function assertError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function getAdminSummary() {
  const { data, error } = await getSupabase().rpc('admin_dashboard_summary')
  assertError(error)
  return data?.[0] ?? null
}

const PRODUCT_SAFE_COLUMNS = 'id, category_id, seller_id, name, slug, sku, short_description, description, price, currency, specifications, publication_status, moderation_status, moderated_by, moderated_at, moderation_reason, stock_verification_status, is_featured, track_inventory, weight_grams, dimensions, seo_title, seo_description, created_at, updated_at'

export async function listAdminProducts(search = ''): Promise<AdminProduct[]> {
  const client = getSupabase()
  const { data, error } = await client.rpc('admin_list_products', { p_search: search.trim() })
  assertError(error)
  const rows = (data ?? []) as Database['public']['Tables']['products']['Row'][]
  if (rows.length === 0) return []

  const productIds = rows.map((row) => row.id)
  const [categoriesResult, inventoryResult, imagesResult] = await Promise.all([
    client.from('categories').select('id, name').limit(500),
    client.from('product_inventory').select('product_id, quantity').in('product_id', productIds).limit(1000),
    client.from('product_images').select('product_id, image_url, storage_path, is_primary, sort_order').in('product_id', productIds).order('sort_order').limit(1000),
  ])
  assertError(categoriesResult.error); assertError(inventoryResult.error); assertError(imagesResult.error)

  const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]))
  const inventoryTotals = new Map<string, number>()
  for (const row of inventoryResult.data ?? []) {
    inventoryTotals.set(row.product_id, (inventoryTotals.get(row.product_id) ?? 0) + (row.quantity ?? 0))
  }
  const imagesByProduct = new Map<string, { image_url: string | null; is_primary: boolean | null }[]>()
  for (const image of imagesResult.data ?? []) {
    const list = imagesByProduct.get(image.product_id) ?? []
    list.push(image)
    imagesByProduct.set(image.product_id, list)
  }

  return rows.map((row) => {
    const images = imagesByProduct.get(row.id) ?? []
    const primary = images.find((image) => image.is_primary) ?? images[0]
    return {
      ...row,
      category: row.category_id ? { name: categoryNames.get(row.category_id) ?? 'Unassigned' } : null,
      inventory: inventoryTotals.get(row.id) ?? 0,
      image_url: primary?.image_url ?? null,
    }
  })
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const { data, error } = await getSupabase().from('categories').select('id, parent_id, name, slug, description, eyebrow, image_url, is_active, sort_order, seo_title, seo_description, created_at, updated_at').order('sort_order').order('name').limit(200)
  assertError(error)
  return (data ?? []) as AdminCategory[]
}

export async function saveCategory(input: Database['public']['Tables']['categories']['Insert'], id?: string) {
  const client = getSupabase()
  const result = id ? await client.from('categories').update(input).eq('id', id).select().single() : await client.from('categories').insert(input).select().single()
  assertError(result.error)
  return result.data
}

export async function saveProduct(input: Database['public']['Tables']['products']['Insert'], id?: string) {
  const client = getSupabase()
  const result = id
    ? await client.from('products').update(input).eq('id', id).select(PRODUCT_SAFE_COLUMNS).single()
    : await client.from('products').insert(input).select(PRODUCT_SAFE_COLUMNS).single()
  assertError(result.error)
  return result.data
}

export async function getAdminProductEditor(id: string) {
  const client = getSupabase()
  const [product, variants, images] = await Promise.all([
    client.from('products').select('id, category_id, name, slug, sku, short_description, description, price, currency, specifications, publication_status, is_featured, track_inventory, weight_grams, dimensions, seo_title, seo_description, created_at, updated_at').eq('id', id).single(),
    client.from('product_variants').select('id, product_id, option_label, option_value, sku, price_override, attributes, is_active, sort_order, created_at, updated_at').eq('product_id', id).order('sort_order').limit(100),
    client.from('product_images').select('id, product_id, image_url, storage_path, alt_text, sort_order, is_primary, created_at').eq('product_id', id).order('sort_order').limit(100),
  ])
  assertError(product.error); assertError(variants.error); assertError(images.error)
  return { product: product.data, variants: (variants.data ?? []) as AdminVariant[], images: images.data ?? [] }
}

export async function saveProductVariant(input: Database['public']['Tables']['product_variants']['Insert'], id?: string) {
  const client = getSupabase()
  const result = id ? await client.from('product_variants').update(input).eq('id', id).select().single() : await client.from('product_variants').insert(input).select().single()
  assertError(result.error)
  return result.data
}

export async function deleteProductVariant(id: string) {
  const { error } = await getSupabase().from('product_variants').delete().eq('id', id)
  assertError(error)
}

export async function updateProductStatus(id: string, publication_status: Database['public']['Tables']['products']['Row']['publication_status']) {
  const { error } = await getSupabase().from('products').update({ publication_status }).eq('id', id)
  assertError(error)
}

export async function moderateProduct(id: string, status: Database['public']['Tables']['products']['Row']['moderation_status'], reason?: string) {
  const { error } = await getSupabase().rpc('admin_moderate_product', { p_product_id: id, p_status: status, p_reason: reason ?? null })
  assertError(error)
}

export async function uploadProductImage(productId: string, file: File, draft = true) {
  const client = getSupabase()
  const bucket = draft ? 'product-drafts' : 'product-images'
  const path = `${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const upload = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type })
  assertError(upload.error)
  const imageUrl = draft ? null : client.storage.from(bucket).getPublicUrl(path).data.publicUrl
  const image = await client.from('product_images').insert({ product_id: productId, storage_path: draft ? path : null, image_url: imageUrl, alt_text: file.name, is_primary: true, sort_order: 0 }).select().single()
  assertError(image.error)
  return image.data
}

export async function listAdminOrders(search = '', status = 'all'): Promise<AdminOrder[]> {
  let query = getSupabase().from('orders').select('id, order_number, customer_id, customer_name, customer_phone, customer_email, shipping_address_snapshot, customer_note, currency, subtotal, delivery_fee, discount_amount, total, order_status, payment_method, payment_status, delivery_lat, delivery_lng, delivery_location_name, delivery_location_captured_at, created_at, updated_at').order('created_at', { ascending: false }).limit(200)
  if (search.trim()) query = query.or(`order_number.ilike.%${search.trim()}%,customer_name.ilike.%${search.trim()}%,customer_phone.ilike.%${search.trim()}%`)
  if (status !== 'all') query = query.eq('order_status', status as Database['public']['Tables']['orders']['Row']['order_status'])
  const { data, error } = await query
  assertError(error)
  return (data ?? []) as AdminOrder[]
}

export async function getAdminOrderDetail(id: string) {
  const client = getSupabase()
  const [order, items, notes] = await Promise.all([
    client.from('orders').select('id, order_number, customer_id, customer_name, customer_phone, customer_email, shipping_address_snapshot, customer_note, currency, subtotal, delivery_fee, discount_amount, total, order_status, payment_method, payment_status, delivery_lat, delivery_lng, delivery_location_name, delivery_location_captured_at, created_at, updated_at').eq('id', id).single(),
    client.from('order_items').select('id, order_id, product_id, variant_id, seller_id, seller_name_snapshot, product_name_snapshot, sku_snapshot, variant_snapshot, product_snapshot, quantity, unit_price, line_total, vendor_fulfillment_status, tracking_number, tracking_url, vendor_note, vendor_updated_at, created_at').eq('order_id', id).order('created_at').limit(100),
    client.from('admin_order_notes').select('id, order_id, created_by, note, created_at').eq('order_id', id).order('created_at', { ascending: false }).limit(100),
  ])
  assertError(order.error); assertError(items.error); assertError(notes.error)
  return { order: order.data as AdminOrder, items: (items.data ?? []) as AdminOrderItem[], notes: notes.data ?? [] }
}

export async function updateOrder(id: string, input: Database['public']['Tables']['orders']['Update']) {
  const { error } = await getSupabase().from('orders').update(input).eq('id', id)
  assertError(error)
}

export async function addOrderNote(order_id: string, note: string) {
  const { error } = await getSupabase().from('admin_order_notes').insert({ order_id, note, created_by: (await getSupabase().auth.getUser()).data.user?.id ?? '' })
  assertError(error)
}

export async function listAdminInventory(): Promise<AdminInventory[]> {
  const { data, error } = await getSupabase().from('product_inventory').select('id, product_id, variant_id, quantity, low_stock_threshold, updated_at, products(name), product_variants(option_label, option_value)').order('updated_at', { ascending: false }).limit(300)
  assertError(error)
  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants
    return { ...row, product_name: product?.name ?? 'Unknown product', variant_name: variant ? `${variant.option_label}: ${variant.option_value}` : null } as unknown as AdminInventory
  })
}

export async function adjustInventory(id: string, quantity: number, note: string) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Quantity must be a whole number of zero or more.')
  const { error } = await getSupabase().rpc('admin_adjust_inventory', { p_inventory_id: id, p_new_quantity: quantity, p_note: note })
  assertError(error)
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const { data, error } = await getSupabase().rpc('admin_customer_summary')
  assertError(error)
  return (data ?? []) as AdminCustomer[]
}

export async function getAdminStoreSettings(): Promise<AdminStoreSettings> {
  const { data, error } = await getSupabase()
    .from('store_settings')
    .select('id, store_name, support_email, support_phone, support_whatsapp, delivery_fee, cod_enabled, return_window_days, updated_at')
    .eq('id', 'default')
    .single()
  assertError(error)
  return data as AdminStoreSettings
}

export async function updateAdminStoreSettings(input: {
  store_name: string
  support_email: string | null
  support_phone: string | null
  support_whatsapp: string | null
  delivery_fee: number
  cod_enabled: boolean
  return_window_days: number
}): Promise<AdminStoreSettings> {
  const { data, error } = await getSupabase().rpc('admin_update_store_settings', { p_settings: input })
  assertError(error)
  return data as AdminStoreSettings
}

export async function listAuditLogs() {
  const { data, error } = await getSupabase().from('admin_audit_logs').select('id, actor_id, action, entity, entity_id, details, created_at').order('created_at', { ascending: false }).limit(100)
  assertError(error)
  return data ?? []
}

export function asJsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Json | undefined> : {}
}

export async function listSellerApplications(status = 'all'): Promise<AdminSeller[]> {
  let query = getSupabase().from('seller_profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (status !== 'all') query = query.eq('status', status as Database['public']['Tables']['seller_profiles']['Row']['status'])
  const { data, error } = await query
  assertError(error)
  return (data ?? []) as AdminSeller[]
}

export async function getVendorDocumentSignedUrl(path: string): Promise<string | null> {
  const client = getSupabase()
  const { data, error } = await client.storage.from('vendor-documents').createSignedUrl(path, 600)
  if (error || !data) return null
  return data.signedUrl
}

export async function reviewSellerApplication(id: string, status: Database['public']['Tables']['seller_profiles']['Row']['status'], reason?: string) {
  const { data, error } = await getSupabase().rpc('admin_review_seller', { p_seller_id: id, p_status: status, p_reason: reason ?? null })
  assertError(error)
  return data
}

export async function listMarketplaceCases(status = 'all'): Promise<AdminCase[]> {
  let query = getSupabase().from('marketplace_cases').select('*').order('created_at', { ascending: false }).limit(200)
  if (status !== 'all') query = query.eq('status', status as Database['public']['Tables']['marketplace_cases']['Row']['status'])
  const { data, error } = await query
  assertError(error)
  return (data ?? []) as AdminCase[]
}

export async function decideMarketplaceCase(id: string, status: Database['public']['Tables']['marketplace_cases']['Row']['status'], decision: string) {
  const { error } = await getSupabase().rpc('admin_decide_marketplace_case', { p_case_id: id, p_status: status, p_decision: decision })
  assertError(error)
}

export async function listAdminHeroes(): Promise<AdminHero[]> {
  const { data, error } = await getSupabase().from('homepage_heroes').select('*').order('display_order', { ascending: true })
  assertError(error)
  return (data ?? []) as AdminHero[]
}

export async function saveAdminHero(input: Database['public']['Tables']['homepage_heroes']['Insert'], id?: string) {
  const client = getSupabase()
  const result = id
    ? await client.from('homepage_heroes').update(input).eq('id', id).select().single()
    : await client.from('homepage_heroes').insert(input).select().single()
  assertError(result.error)
  return result.data
}

export async function deleteAdminHero(id: string) {
  const { error } = await getSupabase().from('homepage_heroes').delete().eq('id', id)
  assertError(error)
}

export async function listAdminPromotions(): Promise<AdminPromotion[]> {
  const { data, error } = await getSupabase().from('promotions').select('*').order('priority', { ascending: false })
  assertError(error)
  return (data ?? []) as AdminPromotion[]
}

export async function saveAdminPromotion(input: Database['public']['Tables']['promotions']['Insert'], id?: string) {
  const client = getSupabase()
  const result = id
    ? await client.from('promotions').update(input).eq('id', id).select().single()
    : await client.from('promotions').insert(input).select().single()
  assertError(result.error)
  return result.data
}

export async function deleteAdminPromotion(id: string) {
  const { error } = await getSupabase().from('promotions').delete().eq('id', id)
  assertError(error)
}

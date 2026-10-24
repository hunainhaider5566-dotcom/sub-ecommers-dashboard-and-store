import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Archive, ArrowLeft, BarChart3, Boxes, Check, ChevronRight, CircleAlert, ClipboardList, Edit2, Eye, EyeOff, FolderTree, Image as ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare, Package, Plus, RefreshCw, Search, Settings, ShieldAlert, Store, Tag, Users, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { addOrderNote, adjustInventory, decideMarketplaceCase, deleteAdminHero, deleteAdminPromotion, deleteProductVariant, getAdminOrderDetail, getAdminProductEditor, getAdminStoreSettings, getAdminSummary, getVendorDocumentSignedUrl, listAdminCategories, listAdminCustomers, listAdminHeroes, listAdminInventory, listAdminOrders, listAdminProducts, listAdminPromotions, listAuditLogs, listMarketplaceCases, listSellerApplications, moderateProduct, reviewSellerApplication, saveAdminHero, saveAdminPromotion, saveCategory, saveProduct, saveProductVariant, updateAdminStoreSettings, updateOrder, updateProductStatus, uploadProductImage, type AdminCase, type AdminCategory, type AdminCustomer, type AdminHero, type AdminInventory, type AdminOrder, type AdminProduct, type AdminPromotion, type AdminSeller, type AdminStoreSettings, type AdminSummary, type AdminVariant } from '../services/admin/adminService'
import type { Database } from '../types/database'
import '../admin.css'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/heroes', label: 'Heroes', icon: ImageIcon },
  { to: '/admin/promotions', label: 'Promotions', icon: Tag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/sellers', label: 'Sellers', icon: Store },
  { to: '/admin/cases', label: 'Cases', icon: MessageSquare },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Store settings', icon: Settings },
  { to: '/admin/audit', label: 'Audit log', icon: ShieldAlert },
]

function Loading() { return <div className="admin-state"><RefreshCw className="spin" size={20} /><span>Loading live store data…</span></div> }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="admin-state admin-state--error"><CircleAlert size={20} /><span>{message}</span><button className="admin-button admin-button--outline" onClick={retry}>Try again</button></div> }
function Empty({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) { return <div className="admin-empty"><Tag size={24} /><strong>{title}</strong><p>{detail}</p>{action}</div> }
function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) { return <div className="admin-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div> }
function formatMoney(value: number | string) { return `PKR ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}` }
function formatDate(value: string) { return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value)) }
function statusClass(value: string) { return `admin-status admin-status--${value.replace('_', '-')}` }

function Guard({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin, configured, error } = useAuth()
  if (loading) return <div className="admin-screen"><Loading /></div>
  if (!configured || !user) return <div className="admin-screen admin-screen--center"><ShieldAlert size={34} /><h1>Administrator sign-in required</h1><p>Sign in with an authorized Meridion administrator account to continue.</p><Link className="admin-button" to="/login">Go to sign in</Link></div>
  if (error || !isAdmin) return <div className="admin-screen admin-screen--center"><ShieldAlert size={34} /><h1>Access denied</h1><p>{error ?? 'This account does not have the administrator role.'}</p><Link className="admin-button" to="/">Return to storefront</Link></div>
  return <>{children}</>
}

export function AdminPage() {
  const location = useLocation()
  const path = location.pathname
  return <Guard><AdminShell><AdminContent path={path} /></AdminShell></Guard>
}

function AdminShell({ children }: { children: ReactNode }) {
  const { displayName, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  async function logout() { await signOut(); navigate('/login') }
  return <div className="admin-app">
    <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
      <div className="admin-brand"><span className="admin-brand-mark">M</span><span>Meridion<small>ADMIN STUDIO</small></span></div>
      <nav className="admin-nav" aria-label="Admin navigation">{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setOpen(false)}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
      <div className="admin-sidebar-footer"><Link to="/"><ArrowLeft size={15} /> View storefront</Link><button onClick={() => void logout()}><LogOut size={15} /> Sign out</button></div>
    </aside>
    {open && <button className="admin-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <main className="admin-main"><header className="admin-topbar"><button className="admin-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20} /></button><div><span className="admin-kicker">Meridion operations</span><h1>{nav.find((item) => location.pathname === item.to)?.label ?? 'Admin studio'}</h1></div><div className="admin-user"><span>{displayName ?? 'Administrator'}</span><span className="admin-avatar">{(displayName ?? 'A').slice(0, 1).toUpperCase()}</span></div></header>{children}</main>
  </div>
}

function AdminContent({ path }: { path: string }) {
  if (path === '/admin') return <Overview />
  if (path === '/admin/heroes') return <Heroes />
  if (path === '/admin/promotions') return <Promotions />
  if (path === '/admin/products') return <Products />
  if (path === '/admin/categories') return <Categories />
  if (path === '/admin/orders') return <Orders />
  if (path === '/admin/inventory') return <Inventory />
  if (path === '/admin/sellers') return <Sellers />
  if (path === '/admin/cases') return <Cases />
  if (path === '/admin/customers') return <Customers />
  if (path === '/admin/settings') return <StoreSettings />
  return <Audit />
}

function Overview() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const load = () => { setError(null); void Promise.all([getAdminSummary(), listAdminOrders()]).then(([nextSummary, nextOrders]) => { setSummary(nextSummary); setOrders(nextOrders.slice(0, 6)) }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'The overview could not be loaded.')) }
  useEffect(load, [])
  if (error) return <ErrorState message={error} retry={load} />
  if (!summary) return <Loading />
  return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">A clear view of what needs attention</p><h2>Good morning, keep things moving.</h2></div><button className="admin-button admin-button--outline" onClick={load}><RefreshCw size={15} /> Refresh</button></div><div className="admin-metrics"><Metric label="All products" value={summary.total_products} note={`${summary.published_products} published`} /><Metric label="Active categories" value={summary.active_categories} /><Metric label="Pending orders" value={summary.pending_orders} note={`${summary.open_orders} open orders`} /><Metric label="Paid revenue" value={formatMoney(summary.paid_delivered_value)} note="Delivered and paid" /></div><div className="admin-grid-2"><div className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">Latest activity</p><h3>Recent orders</h3></div><Link to="/admin/orders">View all <ChevronRight size={14} /></Link></div>{orders.length === 0 ? <Empty title="No orders yet" detail="Real orders will appear here once buyers complete checkout." /> : <div className="admin-list">{orders.map((order) => <Link className="admin-list-row" to="/admin/orders" key={order.id}><span><strong>{order.order_number}</strong><small>{order.customer_name} · {formatDate(order.created_at)}</small></span><span><b>{formatMoney(order.total)}</b><em className={statusClass(order.order_status)}>{order.order_status}</em></span></Link>)}</div>}</div><div className="admin-panel admin-panel--tint"><div className="admin-panel-heading"><div><p className="admin-kicker">Operational note</p><h3>Live data only</h3></div><BarChart3 size={20} /></div><p className="admin-copy">This dashboard reads the connected Meridion Supabase project. Empty tables are shown as empty; no sample products, orders, or revenue are created.</p><div className="admin-callout"><Check size={17} /> RLS and the admin role are enforced by the database.</div></div></div></section>
}

function Products() {
  const { push } = useToast()
  const [items, setItems] = useState<AdminProduct[]>([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined)
  const load = () => { setLoading(true); setError(null); void listAdminProducts(search).then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Products could not be loaded.')).finally(() => setLoading(false)) }
  useEffect(load, [search])
  async function setPublication(item: AdminProduct) { const next = item.publication_status === 'published' ? 'draft' : 'published'; const label = next === 'published' ? 'publish' : 'unpublish'; if (!window.confirm(`Are you sure you want to ${label} “${item.name}”?`)) return; try { await updateProductStatus(item.id, next); push(`Product ${label}ed.`); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Publication update failed.', 'error') } }
  async function archive(id: string) { if (!window.confirm('Archive this product? It will no longer be published.')) return; try { await updateProductStatus(id, 'archived'); push('Product archived.'); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Product update failed.', 'error') } }
  async function moderate(item: AdminProduct, next: AdminProduct['moderation_status']) { const reason = next === 'rejected' || next === 'hidden' ? window.prompt('Record a moderation reason', item.moderation_reason ?? '') : undefined; if ((next === 'rejected' || next === 'hidden') && reason === null) return; try { await moderateProduct(item.id, next, reason ?? undefined); push(`Product marked ${next}.`); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Moderation update failed.', 'error') } }
  return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Catalog management</p><h2>Products</h2></div><button className="admin-button" onClick={() => setEditing(null)}><Plus size={16} /> New product</button></div><div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU or slug" /></label><button className="admin-button admin-button--outline" onClick={load}><RefreshCw size={15} /> Refresh</button></div>{editing !== undefined && <ProductEditor product={editing ?? undefined} onSaved={() => { setEditing(undefined); load() }} onCancel={() => setEditing(undefined)} />}{error ? <ErrorState message={error} retry={load} /> : loading ? <Loading /> : items.length === 0 ? <Empty title="No products found" detail="Create a product when your catalog is ready. The storefront will remain empty until products are published." action={<button className="admin-button" onClick={() => setEditing(null)}><Plus size={15} /> Create product</button>} /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Publication</th><th>Moderation</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="admin-product-cell">{item.image_url ? <img src={item.image_url} alt="" /> : <span className="admin-thumb"><Package size={15} /></span>}<span><strong>{item.name}</strong><small>{item.sku ?? 'No SKU'} · {item.slug}</small></span></div></td><td>{item.category?.name ?? 'Unassigned'}</td><td>{formatMoney(item.price)}</td><td>{item.track_inventory ? item.inventory : 'Not tracked'}</td><td><em className={statusClass(item.publication_status)}>{item.publication_status}</em></td><td><em className={statusClass(item.moderation_status)}>{item.moderation_status}</em></td><td><div className="admin-action-row"><button className="admin-icon-button" title="Edit product" onClick={() => setEditing(item)}><Edit2 size={15} /></button>{item.moderation_status === 'pending_review' && <><button className="admin-small-button" onClick={() => void moderate(item, 'approved')}>Approve</button><button className="admin-small-button admin-small-button--danger" onClick={() => void moderate(item, 'rejected')}>Reject</button></>}{item.moderation_status === 'approved' && <button className="admin-small-button admin-small-button--danger" onClick={() => void moderate(item, 'hidden')}>Hide</button>}{item.publication_status !== 'archived' && <button className="admin-icon-button" title={item.publication_status === 'published' ? 'Unpublish product' : 'Publish product'} onClick={() => void setPublication(item)}>{item.publication_status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}</button>}<button className="admin-icon-button" title="Archive product" onClick={() => void archive(item.id)}><Archive size={15} /></button></div></td></tr>)}</tbody></table></div>}</section>
}

function ProductEditor({ product, onSaved, onCancel }: { product?: AdminProduct; onSaved: () => void; onCancel: () => void }) {
  const { push } = useToast(); const [categories, setCategories] = useState<AdminCategory[]>([]); const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAdminProductEditor>> | null>(null); const [saving, setSaving] = useState(false); const [image, setImage] = useState<File | null>(null); const [variantRows, setVariantRows] = useState<AdminVariant[]>([])
  useEffect(() => { void listAdminCategories().then(setCategories).catch(() => undefined); if (product) void getAdminProductEditor(product.id).then((next) => { setDetail(next); setVariantRows(next.variants) }).catch((cause: unknown) => push(cause instanceof Error ? cause.message : 'Product details could not be loaded.', 'error')) }, [product, push])
  if (product && !detail) return <div className="admin-panel"><Loading /></div>
  const current = detail?.product ?? product
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name') ?? '').trim(); const slug = String(data.get('slug') ?? '').trim(); const price = Number(data.get('price')); if (!name || !slug || !Number.isFinite(price) || price < 0) { push('Enter a valid name, slug, and non-negative price.', 'error'); return } let specifications: unknown = []; let dimensions: unknown = {}; try { specifications = JSON.parse(String(data.get('specifications') || '[]')); dimensions = JSON.parse(String(data.get('dimensions') || '{}')) } catch { push('Specifications and dimensions must be valid JSON.', 'error'); return } setSaving(true); try { const saved = await saveProduct({ name, slug, price, currency: 'PKR', short_description: String(data.get('short_description') ?? ''), description: String(data.get('description') ?? ''), publication_status: String(data.get('publication_status') ?? 'draft') as Database['public']['Tables']['products']['Row']['publication_status'], is_featured: data.get('is_featured') === 'on', track_inventory: data.get('track_inventory') === 'on', category_id: String(data.get('category_id') || '') || null, specifications: specifications as Database['public']['Tables']['products']['Insert']['specifications'], dimensions: dimensions as Database['public']['Tables']['products']['Insert']['dimensions'], sku: String(data.get('sku') ?? '') || null, weight_grams: data.get('weight_grams') ? Number(data.get('weight_grams')) : null, seo_title: String(data.get('seo_title') ?? '') || null, seo_description: String(data.get('seo_description') ?? '') || null }, current?.id); if (!saved) throw new Error('The product was not returned after saving.'); if (image) await uploadProductImage(saved.id, image, true); for (const row of variantRows) await saveProductVariant({ product_id: saved.id, option_label: row.option_label, option_value: row.option_value, sku: row.sku, price_override: row.price_override, attributes: row.attributes, is_active: row.is_active, sort_order: row.sort_order }, row.id.startsWith('new-') ? undefined : row.id); push(current ? 'Product changes saved.' : 'Draft product created.'); onSaved() } catch (cause) { push(cause instanceof Error ? cause.message : 'Product could not be saved.', 'error') } finally { setSaving(false) } }
  function addVariant() { setVariantRows((rows) => [...rows, { id: `new-${crypto.randomUUID()}`, product_id: current?.id ?? '', option_label: 'Option', option_value: '', sku: null, price_override: null, attributes: {}, is_active: true, sort_order: rows.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]) }
  function updateVariant(id: string, patch: Partial<AdminVariant>) { setVariantRows((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row)) }
  async function removeVariant(row: AdminVariant) { if (row.id.startsWith('new-')) { setVariantRows((rows) => rows.filter((item) => item.id !== row.id)); return } if (!window.confirm('Delete this variant?')) return; try { await deleteProductVariant(row.id); setVariantRows((rows) => rows.filter((item) => item.id !== row.id)); push('Variant deleted.') } catch (cause) { push(cause instanceof Error ? cause.message : 'Variant could not be deleted.', 'error') } }
  return <form className="admin-form admin-panel" onSubmit={(event) => void submit(event)}><div className="admin-panel-heading"><div><p className="admin-kicker">{current ? 'Edit catalog record' : 'Create safely'}</p><h3>{current ? current.name : 'New product draft'}</h3></div><button type="button" className="admin-icon-button" onClick={onCancel}><X size={18} /></button></div><div className="admin-form-grid"><label>Name<input name="name" defaultValue={current?.name ?? ''} required /></label><label>Slug<input name="slug" defaultValue={current?.slug ?? ''} placeholder="lowercase-with-dashes" required /></label><label>Price (PKR)<input name="price" type="number" min="0" step="0.01" defaultValue={current?.price ?? ''} required /></label><label>SKU<input name="sku" defaultValue={current?.sku ?? ''} /></label><label>Category<select name="category_id" defaultValue={current?.category_id ?? ''}><option value="">Unassigned</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Publication<select name="publication_status" defaultValue={current?.publication_status ?? 'draft'}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-form-span"><span>Short description</span><input name="short_description" defaultValue={current?.short_description ?? ''} /></label><label className="admin-form-span"><span>Description</span><textarea name="description" rows={5} defaultValue={current?.description ?? ''} /></label><label>Weight (grams)<input name="weight_grams" type="number" min="0" defaultValue={current?.weight_grams ?? ''} /></label><label className="admin-form-span"><span>Specifications JSON</span><textarea name="specifications" rows={3} defaultValue={JSON.stringify(current?.specifications ?? [], null, 2)} /></label><label className="admin-form-span"><span>Dimensions JSON</span><textarea name="dimensions" rows={3} defaultValue={JSON.stringify(current?.dimensions ?? {}, null, 2)} /></label><label>SEO title<input name="seo_title" defaultValue={current?.seo_title ?? ''} /></label><label>SEO description<input name="seo_description" defaultValue={current?.seo_description ?? ''} /></label><label className="admin-form-span"><span>{current ? 'Replace/add draft image' : 'Draft image (optional)'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /></label><label className="admin-check"><input name="is_featured" type="checkbox" defaultChecked={current?.is_featured ?? false} /> Featured</label><label className="admin-check"><input name="track_inventory" type="checkbox" defaultChecked={current?.track_inventory ?? true} /> Track inventory</label></div><div className="admin-variants"><div className="admin-panel-heading"><div><p className="admin-kicker">Optional product choices</p><h4>Variants</h4></div><button type="button" className="admin-small-button" onClick={addVariant}><Plus size={13} /> Add variant</button></div>{variantRows.length === 0 ? <p className="admin-copy">No variants configured. Leave this empty for a single-SKU product.</p> : variantRows.map((row) => <div className="admin-variant-row" key={row.id}><input aria-label="Option label" value={row.option_label} onChange={(event) => updateVariant(row.id, { option_label: event.target.value })} placeholder="Size" /><input aria-label="Option value" value={row.option_value} onChange={(event) => updateVariant(row.id, { option_value: event.target.value })} placeholder="A4" /><input aria-label="Variant SKU" value={row.sku ?? ''} onChange={(event) => updateVariant(row.id, { sku: event.target.value || null })} placeholder="SKU" /><input aria-label="Variant price override" type="number" min="0" step="0.01" value={row.price_override ?? ''} onChange={(event) => updateVariant(row.id, { price_override: event.target.value ? Number(event.target.value) : null })} placeholder="Price override" /><button type="button" className="admin-icon-button" onClick={() => void removeVariant(row)}><X size={15} /></button></div>)}</div><div className="admin-form-actions"><button type="button" className="admin-button admin-button--outline" onClick={onCancel}>Cancel</button><button className="admin-button" disabled={saving}>{saving ? 'Saving…' : current ? 'Save product' : 'Create draft'}</button></div></form>
}

function Categories() {
  const { push } = useToast(); const [items, setItems] = useState<AdminCategory[]>([]); const [error, setError] = useState<string | null>(null); const [showForm, setShowForm] = useState(false)
  const load = () => void listAdminCategories().then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Categories could not be loaded.'))
  useEffect(load, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); try { await saveCategory({ name: String(data.get('name') ?? ''), slug: String(data.get('slug') ?? ''), description: String(data.get('description') ?? ''), is_active: data.get('is_active') === 'on', sort_order: Number(data.get('sort_order') ?? 0), parent_id: null, eyebrow: null, image_url: null, seo_title: null, seo_description: null }); push('Category saved.'); setShowForm(false); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Category could not be saved.', 'error') } }
  return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Collections and taxonomy</p><h2>Categories</h2></div><button className="admin-button" onClick={() => setShowForm(true)}><Plus size={16} /> New category</button></div>{showForm && <form className="admin-form admin-panel" onSubmit={(event) => void submit(event)}><div className="admin-form-grid"><label>Name<input name="name" required /></label><label>Slug<input name="slug" required /></label><label>Sort order<input name="sort_order" type="number" min="0" defaultValue="0" /></label><label className="admin-check"><input name="is_active" type="checkbox" /> Visible on storefront</label><label className="admin-form-span"><span>Description</span><textarea name="description" rows={3} /></label></div><div className="admin-form-actions"><button type="button" className="admin-button admin-button--outline" onClick={() => setShowForm(false)}>Cancel</button><button className="admin-button">Create category</button></div></form>}{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No categories yet" detail="Create your first live category, then assign products to it." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Visibility</th><th>Order</th><th>Updated</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.description || 'No description'}</small></td><td>{item.slug}</td><td><em className={statusClass(item.is_active ? 'active' : 'hidden')}>{item.is_active ? 'active' : 'hidden'}</em></td><td>{item.sort_order}</td><td>{formatDate(item.updated_at)}</td></tr>)}</tbody></table></div>}</section>
}

function Orders() {
  const { push } = useToast(); const [items, setItems] = useState<AdminOrder[]>([]); const [selected, setSelected] = useState<AdminOrder | null>(null); const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [error, setError] = useState<string | null>(null)
  const load = () => void listAdminOrders(search, status).then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Orders could not be loaded.'))
  useEffect(load, [search, status])
  async function changeStatus(order: AdminOrder, next: Database['public']['Tables']['orders']['Row']['order_status']) { try { await updateOrder(order.id, { order_status: next }); push(`Order ${order.order_number} updated.`); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'The database rejected this transition.', 'error') } }
  return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Fulfilment workflow</p><h2>Orders</h2></div></div><div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{['pending','confirmed','processing','shipped','delivered','cancelled'].map((value) => <option key={value}>{value}</option>)}</select></div>{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No orders found" detail="Orders are read from the live orders table. New cash-on-delivery orders appear here immediately after a buyer completes checkout." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Next action</th></tr></thead><tbody>{items.map((order) => <tr key={order.id}><td><button className="admin-link-button" onClick={() => setSelected(order)}><strong>{order.order_number}</strong><small>{formatDate(order.created_at)}</small></button></td><td>{order.customer_name}<small>{order.customer_phone}</small></td><td>{formatMoney(order.total)}</td><td><em className={statusClass(order.payment_status)}>{order.payment_status}</em></td><td><em className={statusClass(order.order_status)}>{order.order_status}</em></td><td>{order.order_status === 'pending' && <button className="admin-small-button" onClick={() => void changeStatus(order, 'confirmed')}>Confirm</button>}{order.order_status === 'confirmed' && <button className="admin-small-button" onClick={() => void changeStatus(order, 'processing')}>Process</button>}{order.order_status === 'processing' && <button className="admin-small-button" onClick={() => void changeStatus(order, 'shipped')}>Ship</button>}{order.order_status === 'shipped' && <button className="admin-small-button" onClick={() => void changeStatus(order, 'delivered')}>Deliver</button>}</td></tr>)}</tbody></table></div>}{selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} />}</section>
}

function OrderDrawer({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const { push } = useToast()
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAdminOrderDetail>> | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    void getAdminOrderDetail(order.id).then(setDetail).catch(() => undefined)
  }, [order.id])

  async function saveNote() {
    if (!note.trim()) return
    try {
      await addOrderNote(order.id, note.trim())
      setNote('')
      push('Note added.')
      const next = await getAdminOrderDetail(order.id)
      setDetail(next)
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'Note could not be added.')
    }
  }

  const hasLocation = order.delivery_lat !== null && order.delivery_lng !== null
  const mapsUrl = hasLocation ? `https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}` : null

  return (
    <div className="admin-drawer-backdrop">
      <aside className="admin-drawer">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-kicker">Order detail</p>
            <h3>{order.order_number}</h3>
          </div>
          <button className="admin-icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="admin-drawer-section">
          <strong>{order.customer_name}</strong>
          <span>{order.customer_email ?? 'No email'} · {order.customer_phone}</span>
          <span>
            {String(
              order.shipping_address_snapshot && typeof order.shipping_address_snapshot === 'object'
                ? (order.shipping_address_snapshot as Record<string, unknown>).address_line_1 ?? 'Address snapshot available'
                : 'Address snapshot available'
            )}
          </span>
        </div>

        <div className="admin-drawer-section">
          <h4>Delivery Location & GPS Pin</h4>
          {hasLocation ? (
            <div>
              <p>
                <strong>Coordinates:</strong> {order.delivery_lat}, {order.delivery_lng}
              </p>
              {order.delivery_location_name && <p><strong>Location Name:</strong> {order.delivery_location_name}</p>}
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-button admin-button--outline"
                style={{ marginTop: '0.5rem', display: 'inline-block' }}
              >
                Open Exact Location in Google Maps
              </a>
            </div>
          ) : (
            <p className="admin-copy">No GPS coordinates captured. Order uses street address for delivery.</p>
          )}
        </div>

        <div className="admin-drawer-section">
          <h4>Items</h4>
          {detail?.items.map((item) => (
            <div className="admin-list-row" key={item.id}>
              <span>
                {item.product_name_snapshot}
                <small>Qty {item.quantity}</small>
              </span>
              <b>{formatMoney(item.line_total)}</b>
            </div>
          )) ?? <Loading />}
        </div>

        <div className="admin-drawer-section">
          <h4>Admin notes</h4>
          {detail?.notes.map((item) => (
            <p className="admin-note" key={item.id}>
              {item.note}
              <small>{formatDate(item.created_at)}</small>
            </p>
          ))}
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an internal note" rows={3} />
          <button className="admin-button admin-button--outline" onClick={() => void saveNote()}>
            Add note
          </button>
        </div>
      </aside>
    </div>
  )
}

function Inventory() { const { push } = useToast(); const [items, setItems] = useState<AdminInventory[]>([]); const [error, setError] = useState<string | null>(null); const load = () => void listAdminInventory().then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Inventory could not be loaded.')); useEffect(load, []); async function change(item: AdminInventory) { const value = window.prompt(`Set quantity for ${item.product_name}`, String(item.quantity)); if (value === null) return; const note = window.prompt('Why is this quantity changing?', 'Admin adjustment'); if (note === null) return; try { await adjustInventory(item.id, Number(value), note); push('Inventory updated.'); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Inventory update failed.', 'error') } } return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Stock control</p><h2>Inventory</h2></div></div>{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No inventory records" detail="Inventory records are created when products are configured for tracking." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Variant</th><th>Quantity</th><th>Threshold</th><th>Updated</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.product_name}</strong></td><td>{item.variant_name ?? 'Base product'}</td><td><strong className={item.low_stock_threshold !== null && item.quantity <= item.low_stock_threshold ? 'admin-low-stock' : ''}>{item.quantity}</strong></td><td>{item.low_stock_threshold ?? '—'}</td><td>{formatDate(item.updated_at)}</td><td><button className="admin-small-button" onClick={() => void change(item)}>Adjust</button></td></tr>)}</tbody></table></div>}</section> }

function Sellers() { const { push } = useToast(); const [items, setItems] = useState<AdminSeller[]>([]); const [status, setStatus] = useState('pending'); const [error, setError] = useState<string | null>(null); const load = () => void listSellerApplications(status).then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Seller applications could not be loaded.')); useEffect(load, [status]); async function review(item: AdminSeller, next: AdminSeller['status']) { const reason = next === 'rejected' || next === 'suspended' ? window.prompt('Record a review reason', item.rejection_reason ?? '') : undefined; if ((next === 'rejected' || next === 'suspended') && reason === null) return; try { await reviewSellerApplication(item.id, next, reason ?? undefined); push(`Seller ${next}.`); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Seller review failed.', 'error') } } return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Marketplace governance</p><h2>Seller applications</h2></div><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option><option value="all">All</option></select></div>{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No seller applications" detail="New seller applications will appear here after the reviewed marketplace migration is applied." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Shop</th><th>Contact</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.shop_name}</strong><small>{item.slug}<br />{item.description || 'No description'}</small></td><td>{item.contact_email ?? '-'}{item.phone && <small>{item.phone}</small>}<SellerDocumentLink path={item.document_path} /></td><td><em className={statusClass(item.status)}>{item.status}</em></td><td>{formatDate(item.created_at)}</td><td><div className="admin-action-row">{item.status === 'pending' && <><button className="admin-small-button" onClick={() => void review(item, 'approved')}>Approve</button><button className="admin-small-button admin-small-button--danger" onClick={() => void review(item, 'rejected')}>Reject</button></>}{item.status === 'approved' && <button className="admin-small-button admin-small-button--danger" onClick={() => void review(item, 'suspended')}>Suspend</button>}{item.status === 'suspended' && <button className="admin-small-button" onClick={() => void review(item, 'approved')}>Reactivate</button>}</div></td></tr>)}</tbody></table></div>}</section> }

function Cases() { const { push } = useToast(); const [items, setItems] = useState<AdminCase[]>([]); const [status, setStatus] = useState('all'); const [error, setError] = useState<string | null>(null); const load = () => void listMarketplaceCases(status).then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Marketplace cases could not be loaded.')); useEffect(load, [status]); async function decide(item: AdminCase, next: AdminCase['status']) { const decision = window.prompt('Record the administrative decision', item.admin_decision ?? ''); if (!decision) return; try { await decideMarketplaceCase(item.id, next, decision); push('Case decision recorded.'); load() } catch (cause) { push(cause instanceof Error ? cause.message : 'Case decision failed.', 'error') } } return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Returns, refunds and complaints</p><h2>Marketplace cases</h2></div><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="seller_responded">Seller responded</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="resolved">Resolved</option></select></div>{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No cases" detail="Buyer returns, refund requests and complaints will appear here once the marketplace workflow is enabled." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Type</th><th>Reason</th><th>Status</th><th>Opened</th><th>Decision</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><em className={statusClass(item.case_type)}>{item.case_type}</em></td><td>{item.reason}</td><td><em className={statusClass(item.status)}>{item.status}</em></td><td>{formatDate(item.created_at)}</td><td>{!['resolved', 'rejected'].includes(item.status) && <div className="admin-action-row"><button className="admin-small-button" onClick={() => void decide(item, 'approved')}>Approve</button><button className="admin-small-button" onClick={() => void decide(item, 'rejected')}>Reject</button></div>}{item.admin_decision && <small>{item.admin_decision}</small>}</td></tr>)}</tbody></table></div>}</section> }

function Customers() { const [items, setItems] = useState<AdminCustomer[]>([]); const [error, setError] = useState<string | null>(null); const load = () => void listAdminCustomers().then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Customers could not be loaded.')); useEffect(load, []); return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Authorized customer records</p><h2>Customers</h2></div></div>{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No customer profiles" detail="Customer profiles will appear here after real accounts are created through Supabase Auth." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Lifetime value</th><th>Joined</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="admin-product-cell"><span className="admin-avatar">{(item.full_name ?? 'C').slice(0, 1).toUpperCase()}</span><span><strong>{item.full_name ?? 'Unnamed customer'}</strong><small>{item.email ?? 'No email on file'}</small></span></div></td><td>{item.email ?? '-'}</td><td>{item.phone ?? '-'}</td><td>{item.order_count}</td><td>{formatMoney(item.lifetime_value)}</td><td>{formatDate(item.created_at)}</td></tr>)}</tbody></table></div>}</section> }

function SellerDocumentLink({ path }: { path: string | null }) {
  const { push } = useToast()
  const [opening, setOpening] = useState(false)

  async function open() {
    if (!path) return
    setOpening(true)
    try {
      const url = await getVendorDocumentSignedUrl(path)
      if (!url) throw new Error('A signed document link could not be created.')
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'The verification document could not be opened.', 'error')
    } finally {
      setOpening(false)
    }
  }

  if (!path) return <small>No verification document uploaded</small>
  return <button className="admin-small-button" onClick={() => void open()} disabled={opening}>{opening ? 'Opening…' : 'View document'}</button>
}

function StoreSettings() {
  const { push } = useToast()
  const [settings, setSettings] = useState<AdminStoreSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setError(null)
    void getAdminStoreSettings()
      .then(setSettings)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Store settings could not be loaded.'))
  }
  useEffect(load, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const deliveryFee = Number(data.get('delivery_fee'))
    const returnWindowDays = Number(data.get('return_window_days'))
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      push('Delivery fee must be zero or more.', 'error')
      return
    }
    if (!Number.isInteger(returnWindowDays) || returnWindowDays < 0) {
      push('Return window must be a whole number of days.', 'error')
      return
    }
    setSaving(true)
    try {
      const next = await updateAdminStoreSettings({
        store_name: String(data.get('store_name') ?? '').trim(),
        support_email: String(data.get('support_email') ?? '').trim() || null,
        support_phone: String(data.get('support_phone') ?? '').trim() || null,
        support_whatsapp: String(data.get('support_whatsapp') ?? '').trim() || null,
        delivery_fee: deliveryFee,
        cod_enabled: data.get('cod_enabled') === 'on',
        return_window_days: returnWindowDays,
      })
      setSettings(next)
      push('Store settings saved. Storefront visitors will see the updated values on their next visit.')
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'Store settings could not be saved.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} retry={load} />
  if (!settings) return <Loading />

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Storefront defaults and contact details</p>
          <h2>Store settings</h2>
        </div>
      </div>
      <form className="admin-form admin-panel" onSubmit={(event) => void submit(event)}>
        <div className="admin-panel-heading">
          <div>
            <h3>Public store configuration</h3>
            <p className="admin-copy">These values are read by the storefront checkout, footer and help pages. Delivery fee and cash-on-delivery availability are enforced again by the database when an order is placed.</p>
          </div>
        </div>
        <div className="admin-form-grid">
          <label className="admin-form-span">Store name<input name="store_name" defaultValue={settings.store_name} maxLength={160} required /></label>
          <label>Support email<input name="support_email" type="email" defaultValue={settings.support_email ?? ''} placeholder="support@example.com" /></label>
          <label>Support phone<input name="support_phone" defaultValue={settings.support_phone ?? ''} placeholder="+92 300 0000000" /></label>
          <label>Support WhatsApp<input name="support_whatsapp" defaultValue={settings.support_whatsapp ?? ''} placeholder="+92 300 0000000" /></label>
          <label>Delivery fee (PKR)<input name="delivery_fee" type="number" min="0" step="0.01" defaultValue={settings.delivery_fee} required /></label>
          <label>Return window (days)<input name="return_window_days" type="number" min="0" step="1" defaultValue={settings.return_window_days} required /></label>
          <label className="admin-check"><input name="cod_enabled" type="checkbox" defaultChecked={settings.cod_enabled} /> Cash on delivery available</label>
        </div>
        <div className="admin-form-actions">
          <button className="admin-button" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
    </section>
  )
}

function Audit() { const [items, setItems] = useState<Array<{ id: string; action: string; entity: string; entity_id: string | null; created_at: string }>>([]); const [error, setError] = useState<string | null>(null); const load = () => void listAuditLogs().then(setItems).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Audit log could not be loaded.')); useEffect(load, []); return <section className="admin-content"><div className="admin-page-heading"><div><p className="admin-kicker">Sensitive changes</p><h2>Audit log</h2></div></div>{error ? <ErrorState message={error} retry={load} /> : items.length === 0 ? <Empty title="No audit events" detail="Product, category, inventory, note, and order status changes will be recorded by database triggers." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Entity</th><th>Entity ID</th><th>When</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><em className={statusClass(item.action.toLowerCase())}>{item.action}</em></td><td>{item.entity}</td><td className="admin-mono">{item.entity_id ?? '—'}</td><td>{formatDate(item.created_at)}</td></tr>)}</tbody></table></div>}</section> }

function Promotions() {
  const { push } = useToast()
  const [items, setItems] = useState<AdminPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState<AdminPromotion | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    void listAdminPromotions()
      .then(setItems)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Promotions could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await saveAdminPromotion(
        {
          title: String(data.get('title') ?? '').trim(),
          description: String(data.get('description') ?? '').trim() || null,
          banner_image_url: String(data.get('banner_image_url') ?? '').trim() || null,
          cta_text: String(data.get('cta_text') ?? '').trim() || null,
          cta_destination: String(data.get('cta_destination') ?? '').trim() || null,
          is_platform_wide: data.get('is_platform_wide') === 'on',
          status: String(data.get('status') ?? 'approved') as AdminPromotion['status'],
          display_position: String(data.get('display_position') ?? 'hero_banner'),
          priority: Number(data.get('priority') ?? 0),
          coupon_code: String(data.get('coupon_code') ?? '').trim() || null,
          discount_percent: data.get('discount_percent') ? Number(data.get('discount_percent')) : null,
        },
        editingPromo?.id
      )
      push('Promotion campaign saved.')
      setShowForm(false)
      setEditingPromo(null)
      load()
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'Promotion could not be saved.', 'error')
    }
  }

  async function removePromo(id: string) {
    if (!window.confirm('Delete this promotional campaign?')) return
    try {
      await deleteAdminPromotion(id)
      push('Promotion deleted.')
      load()
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'Delete failed.', 'error')
    }
  }

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Campaign management</p>
          <h2>Promotions & Offers</h2>
        </div>
        <button
          className="admin-button"
          onClick={() => {
            setEditingPromo(null)
            setShowForm(true)
          }}
        >
          <Plus size={16} /> New platform campaign
        </button>
      </div>

      {(showForm || editingPromo) && (
        <form className="admin-form admin-panel" onSubmit={(event) => void submit(event)}>
          <div className="admin-panel-heading">
            <h3>{editingPromo ? 'Edit campaign' : 'New platform promotion'}</h3>
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => {
                setShowForm(false)
                setEditingPromo(null)
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="admin-form-grid">
            <label>
              Title <input name="title" defaultValue={editingPromo?.title ?? ''} required />
            </label>
            <label>
              Coupon code <input name="coupon_code" defaultValue={editingPromo?.coupon_code ?? ''} placeholder="e.g. SAVE20" />
            </label>
            <label>
              Discount % <input name="discount_percent" type="number" min="0" max="100" defaultValue={editingPromo?.discount_percent ?? ''} placeholder="20" />
            </label>
            <label>
              Display position
              <select name="display_position" defaultValue={editingPromo?.display_position ?? 'hero_banner'}>
                <option value="hero_banner">Hero Banner</option>
                <option value="top_promo">Top Promo Bar</option>
                <option value="category_feature">Category Feature</option>
                <option value="product_strip">Product Strip</option>
                <option value="offer_section">Offer Section</option>
              </select>
            </label>
            <label>
              Priority <input name="priority" type="number" defaultValue={editingPromo?.priority ?? 0} />
            </label>
            <label>
              Status
              <select name="status" defaultValue={editingPromo?.status ?? 'approved'}>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="hidden">Hidden</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="admin-form-span">
              <span>Banner Image URL</span>
              <input name="banner_image_url" defaultValue={editingPromo?.banner_image_url ?? ''} placeholder="https://..." />
            </label>
            <label className="admin-form-span">
              <span>CTA text & link</span>
              <input name="cta_text" defaultValue={editingPromo?.cta_text ?? ''} placeholder="CTA Text" />
              <input name="cta_destination" defaultValue={editingPromo?.cta_destination ?? ''} placeholder="CTA Link e.g. /shop" />
            </label>
            <label className="admin-form-span">
              <span>Description</span>
              <textarea name="description" rows={3} defaultValue={editingPromo?.description ?? ''} />
            </label>
            <label className="admin-check">
              <input name="is_platform_wide" type="checkbox" defaultChecked={editingPromo?.is_platform_wide ?? true} /> Platform-wide promotion
            </label>
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button admin-button--outline"
              onClick={() => {
                setShowForm(false)
                setEditingPromo(null)
              }}
            >
              Cancel
            </button>
            <button className="admin-button">Save campaign</button>
          </div>
        </form>
      )}

      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty
          title="No promotional campaigns found"
          detail="Create platform-wide banners or review seller promotional submissions here."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Placement</th>
                <th>Discount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.coupon_code ? `Code: ${item.coupon_code}` : 'No coupon code'}</small>
                  </td>
                  <td>{item.display_position}</td>
                  <td>{item.discount_percent ? `${item.discount_percent}% OFF` : 'Banner'}</td>
                  <td>{item.is_platform_wide ? 'Platform' : 'Vendor'}</td>
                  <td>
                    <em className={statusClass(item.status)}>{item.status}</em>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button className="admin-icon-button" title="Edit" onClick={() => setEditingPromo(item)}>
                        <Edit2 size={15} />
                      </button>
                      <button className="admin-icon-button" title="Delete" onClick={() => void removePromo(item.id)}>
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Heroes() {
  const { push } = useToast()
  const [items, setItems] = useState<AdminHero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingHero, setEditingHero] = useState<AdminHero | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    void listAdminHeroes()
      .then(setItems)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Heroes could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await saveAdminHero(
        {
          title: String(data.get('title') ?? '').trim(),
          subtitle: String(data.get('subtitle') ?? '').trim() || null,
          cta_text: String(data.get('cta_text') ?? '').trim() || null,
          cta_destination: String(data.get('cta_destination') ?? '').trim() || null,
          image_url: String(data.get('image_url') ?? '').trim(),
          display_order: Number(data.get('display_order') ?? 0),
          status: String(data.get('status') ?? 'published') as AdminHero['status'],
        },
        editingHero?.id
      )
      push('Hero slide saved.')
      setShowForm(false)
      setEditingHero(null)
      load()
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'Hero slide could not be saved.', 'error')
    }
  }

  async function removeHero(id: string) {
    if (!window.confirm('Delete this hero slide?')) return
    try {
      await deleteAdminHero(id)
      push('Hero slide deleted.')
      load()
    } catch (cause) {
      push(cause instanceof Error ? cause.message : 'Delete failed.', 'error')
    }
  }

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Storefront branding</p>
          <h2>Homepage Heroes</h2>
        </div>
        <button
          className="admin-button"
          onClick={() => {
            setEditingHero(null)
            setShowForm(true)
          }}
        >
          <Plus size={16} /> New hero slide
        </button>
      </div>

      {(showForm || editingHero) && (
        <form className="admin-form admin-panel" onSubmit={(event) => void submit(event)}>
          <div className="admin-panel-heading">
            <h3>{editingHero ? 'Edit hero slide' : 'New hero slide'}</h3>
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => {
                setShowForm(false)
                setEditingHero(null)
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="admin-form-grid">
            <label>
              Title <input name="title" defaultValue={editingHero?.title ?? ''} required />
            </label>
            <label>
              Subtitle <input name="subtitle" defaultValue={editingHero?.subtitle ?? ''} />
            </label>
            <label>
              CTA text <input name="cta_text" defaultValue={editingHero?.cta_text ?? ''} placeholder="e.g. Shop Now" />
            </label>
            <label>
              CTA destination <input name="cta_destination" defaultValue={editingHero?.cta_destination ?? ''} placeholder="e.g. /shop" />
            </label>
            <label className="admin-form-span">
              <span>Image URL</span>
              <input name="image_url" defaultValue={editingHero?.image_url ?? ''} required placeholder="https://..." />
            </label>
            <label>
              Display order <input name="display_order" type="number" defaultValue={editingHero?.display_order ?? 0} />
            </label>
            <label>
              Status
              <select name="status" defaultValue={editingHero?.status ?? 'published'}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button admin-button--outline"
              onClick={() => {
                setShowForm(false)
                setEditingHero(null)
              }}
            >
              Cancel
            </button>
            <button className="admin-button">Save hero slide</button>
          </div>
        </form>
      )}

      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty
          title="No homepage heroes configured"
          detail="Create your first hero slide to customize the storefront homepage hero banner dynamically."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>CTA Link</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle || 'No subtitle'}</small>
                  </td>
                  <td>{item.cta_destination || '—'}</td>
                  <td>{item.display_order}</td>
                  <td>
                    <em className={statusClass(item.status)}>{item.status}</em>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button className="admin-icon-button" title="Edit" onClick={() => setEditingHero(item)}>
                        <Edit2 size={15} />
                      </button>
                      <button className="admin-icon-button" title="Delete" onClick={() => void removeHero(item.id)}>
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

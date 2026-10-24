import { ArrowRight, Info, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { CartItem } from '../components/cart/CartItem'
import { useCart } from '../contexts/CartContext'
import { useCatalog } from '../contexts/CatalogContext'
import { useToast } from '../contexts/ToastContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { useI18n } from '../i18n/LocaleContext'
import { DELIVERY_FEE } from '../config/store'
import { getCartLineUnitPrice, isCartLineAvailable } from '../utils/cart'
import { formatPKR } from '../utils/money'

function DemoNotice({ t, mode }: { t: (english: string) => string; mode: 'supabase' | 'demo' | 'unconfigured' }) {
  const copy = mode === 'supabase' ? 'Catalog details come from the live catalog, but checkout remains a demonstration and does not submit an order.' : mode === 'demo' ? 'Sample prices, descriptions and availability are not a live offer. Checkout does not submit an order.' : 'No catalog is currently available, and no order can be submitted.'
  return <div className="demo-notice" role="note"><Info size={16} aria-hidden="true" /><span><strong>{t(mode === 'demo' ? 'Demo mode.' : mode === 'supabase' ? 'Live catalog, demo checkout.' : 'Catalog unavailable.')}</strong> {t(copy)}</span></div>
}

function LocalizedOrderSummary({ subtotal, label, mode }: { subtotal: number; label: string; mode: 'supabase' | 'demo' | 'unconfigured' }) {
  const { t } = useI18n()
  const total = subtotal + (DELIVERY_FEE ?? 0)
  return <section className="order-summary" aria-label={label}><h2>{label}</h2><div className="order-summary__row"><span>{t('Item subtotal')} {mode === 'demo' && <small>{t('sample prices')}</small>}</span><strong>{formatPKR(subtotal)}</strong></div><div className="order-summary__row"><span>{t('Delivery fee')} <small>{t('not yet configured')}</small></span><strong>{DELIVERY_FEE === null ? t('To be confirmed') : formatPKR(DELIVERY_FEE)}</strong></div><div className="order-summary__total"><span>{t('Estimated total')}{DELIVERY_FEE === null ? ` ${t('before delivery')}` : ''}</span><strong>{formatPKR(total)}</strong></div><p>{t('Demonstration calculation only. No payment or delivery is arranged.')}</p></section>
}

export function CartPage() {
  const { t } = useI18n()
  const { push } = useToast()
  const { lines, setQuantity, remove, clear } = useCart()
  const { status, error, mode, findProductById } = useCatalog()
  usePageMeta(t('Your demo cart'), t('Review catalog items in a local demo cart. Checkout remains demonstration only and will not create an order.'))
  const subtotal = lines.reduce((sum, line) => sum + getCartLineUnitPrice(findProductById(line.productId), line) * line.quantity, 0)
  const canDemoCheckout = status === 'ready' && lines.length > 0 && lines.every((line) => isCartLineAvailable(findProductById(line.productId), line))
  function handleClear() {
    clear()
    push(t('Your demo cart is clear.'))
  }
  if (lines.length === 0) return <div className="page-shell cart-page"><div className="page-heading"><span className="eyebrow">{t('Your collection')}</span><h1>{t('The')} <em>{t('demo cart.')}</em></h1></div><EmptyState title="A fresh page" description="Your demo cart is empty. Explore the current catalog to try the storefront interactions." actionLabel="Browse the catalog" /><DemoNotice t={t} mode={mode} /></div>
  return <div className="page-shell cart-page"><div className="page-heading page-heading--cart"><div><span className="eyebrow">{t('Your collection')}</span><h1>{t('The')} <em>{t('demo cart.')}</em></h1><p>{t('Items and totals here are local demonstration values; checkout never creates an order.')}</p></div><span className="cart-count-note"><ShoppingBag size={16} /> {lines.reduce((sum, line) => sum + line.quantity, 0)} {t('items')}</span></div><DemoNotice t={t} mode={mode} />{status === 'loading' && <LoadingState label="Checking current catalog items…" />}{status === 'error' && <ErrorState message={error || 'The catalog could not be loaded.'} />}<div className="cart-layout"><section className="cart-lines" aria-label={t('Items in your demo cart')}>{lines.map((line, index) => { const key = `${line.productId}-${line.variantId ?? 'default'}-${index}`; return <CartItem key={key} line={line} onQuantity={(quantity) => setQuantity(line.productId, line.variantId, quantity)} onRemove={() => remove(line.productId, line.variantId)} /> })}<button type="button" className="text-button cart-clear" onClick={handleClear}><Trash2 size={15} /> {t('Clear demo cart')}</button></section><aside className="cart-sidebar"><LocalizedOrderSummary subtotal={subtotal} label={t('Demo summary')} mode={mode} /><div className="cart-checkout-note">{canDemoCheckout ? <Link to="/checkout" className="button button--dark button--full">{t('Continue to demo checkout')} <ArrowRight size={16} /></Link> : <button type="button" className="button button--dark button--full" disabled>{t('Unavailable item cannot continue')}</button>}<p>{t('Checkout is for demonstration only. No order or delivery request will be created.')}</p></div></aside></div></div>
}

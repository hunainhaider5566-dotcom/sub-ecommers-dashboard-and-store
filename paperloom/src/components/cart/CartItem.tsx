import { BookOpen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/LocaleContext'
import { useToast } from '../../contexts/ToastContext'
import type { CartLine } from '../../types/cart'
import { useCatalog } from '../../contexts/CatalogContext'
import { formatPKR } from '../../utils/money'
import { QuantitySelector } from '../products/QuantitySelector'

export function CartItem({ line, onQuantity, onRemove }: { line: CartLine; onQuantity: (quantity: number) => void; onRemove: () => void }) {
  const { findProductById, mode } = useCatalog()
  const product = findProductById(line.productId)
  const variant = product?.variants.find((item) => item.id === line.variantId)
  const unitPrice = variant?.price ?? product?.price ?? 0
  const [imageFailed, setImageFailed] = useState(false)
  const { t } = useI18n()
  const { push } = useToast()
  function handleRemove() {
    onRemove()
    push(t('Removed from demo cart.'))
  }
  if (!product) return <article className="cart-item cart-item--missing"><div className="cart-item__fallback"><BookOpen size={23} /></div><div className="cart-item__info"><strong>{t('Sample item no longer listed')}</strong><p>{t('This saved cart line cannot be matched to a current demo product.')}</p><button type="button" className="text-button text-button--danger" onClick={handleRemove}><Trash2 size={14} /> {t('Remove')}</button></div></article>
  const name = t(product.name)
  const availability = variant?.availabilityStatus ?? product.availabilityStatus
  const available = availability !== 'out-of-stock' && availability !== 'unavailable'
  return <article className="cart-item">
    <Link to={`/products/${product.slug}`} className="cart-item__image" aria-label={`${t('View')} ${name}`}>
      {imageFailed || !product.images[0] ? <span className="cart-item__fallback"><BookOpen size={23} /></span> : <img src={product.images[0]} alt={name} loading="lazy" onError={() => setImageFailed(true)} />}
    </Link>
    <div className="cart-item__info"><div className="cart-item__top"><div><Link to={`/products/${product.slug}`} className="cart-item__name">{name}</Link>{line.variantLabel && <span className="cart-item__variant">{t(line.variantLabel)}</span>}</div><strong>{formatPKR(unitPrice * line.quantity)}</strong></div><p className="cart-item__unit">{formatPKR(unitPrice)} {t('each')}{mode === 'demo' ? ` · ${t('demo price')}` : ''}</p><div className="cart-item__controls"><QuantitySelector value={line.quantity} onChange={onQuantity} label={`${t('Quantity of')} ${name}`} /><span className="cart-item__status">{mode === 'demo' ? t('Demo listing · not verified') : !available ? t('Out of stock') : availability === 'available' ? t('In stock') : t('Availability not confirmed')}</span><button type="button" className="text-button text-button--danger" onClick={handleRemove}><Trash2 size={14} aria-hidden="true" /> {t('Remove')}</button></div></div>
  </article>
}

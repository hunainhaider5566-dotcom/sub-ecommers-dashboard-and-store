import { ArrowLeft, ArrowRight, BookOpen, Check, Info, MessageCircle, PackageCheck, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AvailabilityBadge } from '../components/products/AvailabilityBadge'
import { QuantitySelector } from '../components/products/QuantitySelector'
import { WishlistButton } from '../components/products/WishlistButton'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { useCart } from '../contexts/CartContext'
import { useCatalog } from '../contexts/CatalogContext'
import { useToast } from '../contexts/ToastContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { useI18n } from '../i18n/LocaleContext'
import { formatPKR } from '../utils/money'
import { supportDestination, productInquiryMessage } from '../utils/support'

function CatalogNotice({ t, mode }: { t: (english: string) => string; mode: 'supabase' | 'demo' | 'unconfigured' }) {
  const message = mode === 'demo'
    ? 'Demo data — sample prices, descriptions and availability are not a live offer. Checkout is a demonstration and does not submit an order.'
    : mode === 'supabase'
      ? 'This product is read from the live catalog. Checkout is still a demonstration and does not submit an order.'
      : 'The catalog is currently unavailable. No order can be submitted.'
  return <div className="demo-notice demo-notice--compact" role="note"><Info size={16} aria-hidden="true" /><span><strong>{t(mode === 'demo' ? 'Demo mode.' : mode === 'supabase' ? 'Live catalog.' : 'Catalog unavailable.')}</strong> {t(message)}</span></div>
}

export function ProductPage() {
  const { t } = useI18n()
  const { slug = '' } = useParams()
  const { status, error, mode, findProductBySlug, categories } = useCatalog()
  const product = findProductBySlug(slug)
  const [quantity, setQuantity] = useState(1)
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? '')
  const [imageIndex, setImageIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const [added, setAdded] = useState(false)
  const addLock = useRef(false)
  const { add } = useCart()
  const { push } = useToast()

  useEffect(() => {
    setQuantity(1)
    setVariantId(product?.variants[0]?.id ?? '')
    setImageIndex(0)
    setImageFailed(false)
    setAdded(false)
    addLock.current = false
  }, [product?.id])

  usePageMeta(product ? t(product.name) : t('Product not found'), product ? t(product.shortDescription) : t('This live catalog product could not be found.'))
  if (status === 'loading') return <div className="page-shell"><LoadingState label="Loading product details…" /></div>
  if (status === 'error') return <div className="page-shell"><ErrorState message={error || 'The catalog could not be loaded.'} /></div>
  if (status === 'unconfigured') return <div className="page-shell"><ErrorState message="The product catalog is temporarily unavailable." /></div>
  if (!product) return <div className="page-shell"><EmptyState title="This product is not in the published catalog" description="It may have been unpublished or removed. Browse current active products instead." actionLabel="Browse the catalog" /></div>

  const productName = t(product.name)
  const categoryName = t(categories.find((item) => item.id === product.categoryId)?.name ?? 'Collection')
  const images = product.images
  const activeImage = images[imageIndex]
  const selectedVariant = product.variants.find((variant) => variant.id === variantId)
  const price = selectedVariant?.price ?? product.price
  const support = supportDestination(productInquiryMessage(productName, product.slug))
  const availability = selectedVariant?.availabilityStatus ?? product.availabilityStatus
  const canAdd = product.isPublished && availability !== 'out-of-stock' && availability !== 'unavailable'
  const previousImage = () => { setImageFailed(false); setImageIndex((current) => (current - 1 + images.length) % images.length) }
  const nextImage = () => { setImageFailed(false); setImageIndex((current) => (current + 1) % images.length) }
  function handleAdd() {
    if (!product || !canAdd || added || addLock.current) return
    addLock.current = true
    if (add(product, quantity, variantId || undefined, selectedVariant?.value)) {
      setAdded(true)
      push(t('Added to demo cart.'))
      window.setTimeout(() => { addLock.current = false; setAdded(false) }, 2200)
    } else {
      addLock.current = false
    }
  }

  return <div className="page-shell product-detail-page">
    <Link to="/shop" className="back-link"><ArrowLeft size={15} /> {t('Back to collection')}</Link>
    <CatalogNotice t={t} mode={mode} />
    <div className="product-detail">
      <div className="product-gallery" role="group" aria-label={`${productName} ${t('image gallery')}`}>
        <div className="product-gallery__main">
          {imageFailed || !activeImage ? <div className="image-fallback image-fallback--large"><BookOpen size={42} /><span>{productName}</span></div> : <img src={activeImage} alt={`${productName} ${imageIndex + 1}`} onError={() => setImageFailed(true)} />}
          {images.length > 0 && <span className="gallery-counter" aria-live="polite">{String(imageIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>}
        </div>
        {images.length > 1 && <>
          <div className="product-gallery__controls"><button type="button" aria-label={t('Previous product image')} onClick={previousImage}><ArrowLeft size={17} /></button><span>{t('Image')} {imageIndex + 1} {t('of')} {images.length}</span><button type="button" aria-label={t('Next product image')} onClick={nextImage}><ArrowRight size={17} /></button></div>
          <div className="product-gallery__thumbnails" aria-label={t('Choose a product image')}>{images.map((image, index) => <button type="button" key={image} className={`product-gallery__thumbnail${imageIndex === index ? ' is-active' : ''}`} aria-label={`${t('Show image')} ${index + 1} ${t('of')} ${images.length}`} aria-pressed={imageIndex === index} onClick={() => { setImageFailed(false); setImageIndex(index) }}><img src={image} alt="" aria-hidden="true" loading="lazy" /></button>)}</div>
        </>}
      </div>
      <div className="product-detail__content">
        <div className="product-detail__topline"><span className="eyebrow">{categoryName}{mode === 'demo' ? ` · ${t('SAMPLE')}` : ''}</span><WishlistButton productId={product.id} productName={productName} /></div>
        <h1>{productName}</h1>
        <p className="product-detail__description">{t(product.description)}</p>
        <div className="product-price-row"><strong>{formatPKR(price)}</strong><AvailabilityBadge status={availability} /></div>
        <p className="product-demo-caption">{mode === 'demo' ? t('Illustrative sample price') : t('Current published catalog price')} · {mode === 'demo' ? t('Demo data — sample prices, descriptions and availability are not a live offer.') : t('Availability is separate from publication; exact stock counts are not public.')}</p>
        {product.variants.length > 0 && <fieldset className="variant-picker"><legend>{t(product.variants[0].label)}</legend><div className="variant-options">{product.variants.map((variant) => { const variantUnavailable = variant.availabilityStatus === 'out-of-stock'; return <button type="button" key={variant.id} className={`variant-option${variantId === variant.id ? ' is-selected' : ''}`} aria-pressed={variantId === variant.id} aria-disabled={variantUnavailable} onClick={() => setVariantId(variant.id)}><span>{t(variant.value)}{variant.price !== undefined && variant.price !== product.price ? ` · ${formatPKR(variant.price)}` : ''}</span>{variantId === variant.id && <Check size={14} />}{variantUnavailable && <small>{t('Out of stock')}</small>}</button> })}</div></fieldset>}
        <div className="detail-purchase-row"><span className="eyebrow">{t('Quantity')}</span><QuantitySelector value={quantity} onChange={setQuantity} label={`${t('Quantity for')} ${productName}`} /></div>
        <button type="button" className="button button--dark button--full" disabled={!canAdd || added} onClick={handleAdd}>{added ? <><Check size={17} /> {t('Added to demo cart')}</> : <>{t('Add to demo cart')} <ArrowRight size={17} /></>}</button>
        <p className="product-detail__reassurance"><ShieldCheck size={15} /> {t('No live checkout, COD or order submission.')}</p>
        <div className="detail-accordions"><details><summary><span><BookOpen size={16} /> {t('Product details')}</span><span>+</span></summary><ul>{product.specifications.map((spec) => <li key={spec.label}><span>{t(spec.label)}</span><span>{t(spec.value)}</span></li>)}</ul></details><details><summary><span><PackageCheck size={16} /> {t('Shipping & returns')}</span><span>+</span></summary><p>{t('Shipping fees, timing and return terms have not been confirmed. Please treat all policy details as launch TODOs, not promises.')}</p><Link to="/shipping">{t('Read the provisional shipping note')}</Link></details></div>
        <a className="product-inquiry-link" href={support} target={support.startsWith('https://') ? '_blank' : undefined} rel={support.startsWith('https://') ? 'noopener noreferrer' : undefined}><MessageCircle size={16} /> {t('Ask a question about this listing')}</a>
      </div>
    </div>
    <div className="product-bottom-note"><span className="eyebrow">{t('Before you add anything')}</span><CatalogNotice t={t} mode={mode} /></div>
  </div>
}

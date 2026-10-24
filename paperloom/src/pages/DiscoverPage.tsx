import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Store, ChevronUp, ChevronDown, Sparkles } from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useToast } from '../contexts/ToastContext'
import { formatPKR } from '../utils/money'
import { useI18n } from '../i18n/LocaleContext'
import { usePageMeta } from '../hooks/usePageMeta'
import type { Product } from '../types/product'

interface DiscoverItem {
  product: Product
  sellerName: string
  sellerSlug: string
}

export function DiscoverPage() {
  const { t } = useI18n()
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const { push } = useToast()
  usePageMeta(t('Discover Feed'), t('Explore trending products and top sellers in a swipeable discovery feed.'))

  const [items, setItems] = useState<DiscoverItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadFeed() {
      setLoading(true)
      const client = getSupabase()
      const { data, error } = await client
        .from('products')
        .select(`
          id, name, slug, short_description, description, price, currency, category_id, publication_status, is_featured, track_inventory, created_at,
          seller_profiles!seller_id ( id, shop_name, slug ),
          product_images ( image_url, storage_path, sort_order )
        `)
        .eq('publication_status', 'published')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error || !data) {
        setItems([])
        setLoading(false)
        return
      }

      const mapped: DiscoverItem[] = data.map((row: any) => {
        const images = (row.product_images || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((img: any) => img.image_url || (img.storage_path ? client.storage.from('product-images').getPublicUrl(img.storage_path).data.publicUrl : ''))
          .filter(Boolean)

        const product: Product = {
          id: row.id,
          slug: row.slug,
          name: row.name,
          shortDescription: row.short_description,
          description: row.description,
          price: Number(row.price),
          currency: row.currency || 'PKR',
          categoryId: row.category_id || '',
          images: images.length ? images : ['/images/paperloom-hero.webp'],
          specifications: [],
          variants: [],
          isPublished: true,
          availabilityStatus: 'available',
          isFeatured: row.is_featured,
          trackInventory: row.track_inventory,
          createdAt: row.created_at,
        }

        return {
          product,
          sellerName: row.seller_profiles?.shop_name || 'Meridion Seller',
          sellerSlug: row.seller_profiles?.slug || '',
        }
      })

      setItems(mapped)
      setLoading(false)
    }

    void loadFeed()
  }, [])

  const nextSlide = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="discover-screen discover-screen--loading">
        <Sparkles size={32} className="spin" />
        <p>{t('Loading Discover Feed…')}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <Sparkles size={32} />
          <h2>{t('No Discover items available')}</h2>
          <p>{t('Check back soon as sellers publish new products.')}</p>
          <Link to="/shop" className="button button--dark">{t('Browse Store')}</Link>
        </div>
      </div>
    )
  }

  const current = items[currentIndex]
  const saved = has(current.product.id)

  return (
    <div className="discover-page-container">
      <div className="discover-nav-buttons">
        <button
          className="discover-nav-btn"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          aria-label={t('Previous product')}
        >
          <ChevronUp size={24} />
        </button>
        <span className="discover-counter">{currentIndex + 1} / {items.length}</span>
        <button
          className="discover-nav-btn"
          onClick={nextSlide}
          disabled={currentIndex === items.length - 1}
          aria-label={t('Next product')}
        >
          <ChevronDown size={24} />
        </button>
      </div>

      <div className="discover-card shine-surface" ref={containerRef}>
        <div className="discover-media">
          <img src={current.product.images[0]} alt={current.product.name} />
          <div className="discover-overlay-top">
            <span className="discover-badge"><Sparkles size={14} /> {t('Discover')}</span>
            {current.sellerSlug && (
              <Link to={`/shops/${current.sellerSlug}`} className="discover-shop-tag">
                <Store size={14} /> {current.sellerName}
              </Link>
            )}
          </div>
        </div>

        <div className="discover-content">
          <div className="discover-info">
            <span className="discover-price">{formatPKR(current.product.price)}</span>
            <h2>{current.product.name}</h2>
            <p>{current.product.shortDescription}</p>
          </div>

          <div className="discover-actions">
            <button
              className={`discover-wishlist-btn${saved ? ' is-active' : ''}`}
              onClick={() => {
                toggle(current.product.id)
                push(t(saved ? 'Removed from wishlist' : 'Saved to wishlist'), 'success')
              }}
            >
              <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
              <span>{saved ? t('Saved') : t('Wishlist')}</span>
            </button>

            <button
              className="button button--dark discover-cart-btn"
              onClick={() => {
                if (add(current.product, 1)) {
                  push(t('Added to cart'), 'success')
                }
              }}
            >
              <ShoppingBag size={18} />
              <span>{t('Add to Cart')}</span>
            </button>

            <Link to={`/products/${current.product.slug}`} className="button button--outline">
              {t('View Details')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

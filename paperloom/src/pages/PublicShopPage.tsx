import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import { formatPKR } from '../utils/money'
import { usePageMeta } from '../hooks/usePageMeta'
import { useI18n } from '../i18n/LocaleContext'
import { LoadingState } from '../components/common/States'
import type { Product } from '../types/product'

interface PublicShop {
  id: string
  shopName: string
  slug: string
  description: string
  contactEmail: string | null
  status: string
  createdAt: string
}

export function PublicShopPage() {
  const { t } = useI18n()
  const { slug = '' } = useParams()
  const [shop, setShop] = useState<PublicShop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  usePageMeta(shop ? shop.shopName : t('Vendor Shop'), shop ? `Shop ${shop.shopName} on Meridion Marketplace.` : t('Vendor shop details.'))

  useEffect(() => {
    async function loadShop() {
      setLoading(true)
      setNotFound(false)
      const client = getSupabase()

      const { data: shopData, error: shopError } = await client
        .from('seller_profiles')
        .select('id, shop_name, slug, description, contact_email, status, created_at')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle()

      if (shopError || !shopData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const publicShop: PublicShop = {
        id: shopData.id,
        shopName: shopData.shop_name,
        slug: shopData.slug,
        description: shopData.description,
        contactEmail: shopData.contact_email,
        status: shopData.status,
        createdAt: shopData.created_at,
      }

      setShop(publicShop)

      const { data: productData } = await client
        .from('products')
        .select(`
          id, name, slug, short_description, description, price, currency, category_id, publication_status, is_featured, track_inventory, created_at,
          product_images ( image_url, storage_path, sort_order )
        `)
        .eq('seller_id', shopData.id)
        .eq('publication_status', 'published')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })

      const mappedProducts: Product[] = (productData || []).map((row: any) => {
        const images = (row.product_images || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((img: any) => img.image_url || (img.storage_path ? client.storage.from('product-images').getPublicUrl(img.storage_path).data.publicUrl : ''))
          .filter(Boolean)

        return {
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
      })

      setProducts(mappedProducts)
      setLoading(false)
    }

    void loadShop()
  }, [slug])

  if (loading) return <div className="page-shell"><LoadingState label="Loading shop profile…" /></div>

  if (notFound || !shop) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <ShieldAlert size={32} />
          <h2>{t('Shop Unavailable')}</h2>
          <p>{t('This seller shop is either currently under review, suspended, or does not exist.')}</p>
          <Link to="/shop" className="button button--dark">{t('Return to Marketplace')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell public-shop-page">
      <header className="shop-header-card shine-surface">
        <div className="shop-header-main">
          <span className="shop-avatar"><Store size={32} /></span>
          <div>
            <div className="shop-title-row">
              <h1>{shop.shopName}</h1>
              <span className="vendor-status__badge vendor-status__badge--approved"><CheckCircle2 size={14} /> {t('Verified Seller')}</span>
            </div>
            <p className="shop-description">{shop.description}</p>
            <div className="shop-meta">
              <span><MapPin size={14} /> {t('Verified Vendor Hub')}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="shop-products-section">
        <div className="page-heading">
          <h2>{t('Shop Products')} ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>{t('No published products are currently available from this vendor.')}</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card shine-surface" key={product.id}>
                <Link to={`/products/${product.slug}`} className="product-card__image-wrap">
                  <img src={product.images[0]} alt={product.name} />
                </Link>
                <div className="product-card__body">
                  <h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3>
                  <span className="product-card__price">{formatPKR(product.price)}</span>
                  <Link to={`/products/${product.slug}`} className="button button--outline button--full">
                    {t('View Product')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

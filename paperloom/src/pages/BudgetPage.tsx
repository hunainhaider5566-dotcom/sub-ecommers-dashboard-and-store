import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Filter, ShoppingBag, Info, CheckCircle2 } from 'lucide-react'
import { useCatalog } from '../contexts/CatalogContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { formatPKR } from '../utils/money'
import { useI18n } from '../i18n/LocaleContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { LoadingState } from '../components/common/States'

const BUDGET_OPTIONS = [500, 1000, 2000] as const

export function BudgetPage() {
  const { t } = useI18n()
  const { products, status } = useCatalog()
  const { add } = useCart()
  const { push } = useToast()
  usePageMeta(t('Shop Within Your Budget'), t('Explore quality products under PKR 500, PKR 1,000, and PKR 2,000 budgets.'))

  const [selectedBudget, setSelectedBudget] = useState<number>(1000)

  const eligibleProducts = useMemo(() => {
    return products.filter(
      (product) => product.isPublished && product.price <= selectedBudget && product.availabilityStatus !== 'out-of-stock'
    )
  }, [products, selectedBudget])

  return (
    <div className="page-shell budget-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{t('Budget Shopping Challenge')}</span>
          <h1>{t('Shop Within Your')} <em>{t('Budget.')}</em></h1>
          <p>{t('Select your budget tier to discover products with confirmed live prices.')}</p>
        </div>
      </header>

      <div className="demo-notice demo-notice--compact" role="note">
        <Info size={16} aria-hidden="true" />
        <span>
          <strong>{t('Note:')}</strong> {t('Delivery charges are calculated separately at checkout and are not included in your selected product budget.')}
        </span>
      </div>

      <div className="budget-selector">
        <span className="budget-label"><Filter size={16} /> {t('Select Budget Limit:')}</span>
        <div className="budget-chips">
          {BUDGET_OPTIONS.map((amount) => (
            <button
              key={amount}
              type="button"
              className={`budget-chip${selectedBudget === amount ? ' is-active' : ''}`}
              onClick={() => setSelectedBudget(amount)}
            >
              {formatPKR(amount)}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' ? (
        <LoadingState label="Finding products within budget…" />
      ) : eligibleProducts.length === 0 ? (
        <div className="empty-state">
          <h2>{t('No products found under')} {formatPKR(selectedBudget)}</h2>
          <p>{t('Try selecting a higher budget tier or check back as vendors publish new items.')}</p>
          <div className="budget-chips">
            <button className="button button--outline" onClick={() => setSelectedBudget(2000)}>
              {t('Try PKR 2,000 Budget')}
            </button>
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {eligibleProducts.map((product) => (
            <article className="product-card shine-surface" key={product.id}>
              <Link to={`/products/${product.slug}`} className="product-card__image-wrap">
                <img src={product.images[0] || '/images/paperloom-hero.webp'} alt={product.name} />
              </Link>
              <div className="product-card__body">
                <h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3>
                <span className="product-card__price">{formatPKR(product.price)}</span>
                <span className="budget-tag"><CheckCircle2 size={13} /> {t('Within Budget')}</span>
                <button
                  type="button"
                  className="button button--dark button--full"
                  onClick={() => {
                    if (add(product, 1)) {
                      push(t('Added to cart'), 'success')
                    }
                  }}
                >
                  <ShoppingBag size={16} /> {t('Add to Cart')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

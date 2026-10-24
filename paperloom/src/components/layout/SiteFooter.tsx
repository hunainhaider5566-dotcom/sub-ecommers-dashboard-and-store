import { ArrowUpRight, Facebook, Instagram, MessageCircle, Music2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SOCIAL_LINKS, STORE_NAME } from '../../config/store'
import { useCatalog } from '../../contexts/CatalogContext'
import { useI18n } from '../../i18n/LocaleContext'
import { NewsletterSignup } from '../home/NewsletterSignup'

const socialIcons = { Facebook, Instagram, TikTok: Music2, WhatsApp: MessageCircle }

export function SiteFooter() {
  const { t } = useI18n()
  const { categories, mode } = useCatalog()
  const catalogNote = mode === 'demo' ? 'Product prices, details and availability shown here are sample data, not confirmed offers. Checkout never creates an order.' : mode === 'supabase' ? 'Catalog records are read from the live catalog. Checkout remains a demo and never creates an order.' : 'The catalog is temporarily unavailable. Checkout does not create orders.'
  return <footer className="site-footer">
    <div className="footer-newsletter"><NewsletterSignup /></div>
    <div className="footer-main">
      <div className="footer-brand"><Link className="wordmark wordmark--footer" to="/"><span className="wordmark-mark" aria-hidden="true"><span /></span><span>{STORE_NAME.toLowerCase()}<span className="wordmark-period">.</span></span></Link><p>{t('A multi-category store for thoughtful goods across everyday routines.')}</p><span className="footer-demo">{t(mode === 'demo' ? 'Independent store concept · Demo storefront' : mode === 'supabase' ? 'Live catalog · Demo checkout' : 'Storefront catalog not configured')}</span></div>
      <div className="footer-column"><h2>{t('Explore')}</h2><Link to="/shop">{t('Shop all')}</Link><Link to="/categories">{t('Collections')}</Link>{categories.slice(0, 3).map((category) => <Link key={category.id} to={`/categories/${category.slug}`}>{t(category.name)}</Link>)}</div>
      <div className="footer-column"><h2>{t('Helpful details')}</h2><Link to="/about">{t('Our story')}</Link><Link to="/contact">{t('Contact')}</Link><Link to="/faq">{t('FAQ')}</Link><Link to="/shipping">{t('Shipping')}</Link><Link to="/returns">{t('Returns')}</Link><Link to="/privacy">{t('Privacy')}</Link></div>
      <div className="footer-note"><span className="eyebrow">{t('A note before you browse')}</span><p>{t(catalogNote)}</p><Link to="/faq">{t('Learn about demo mode')} <ArrowUpRight size={14} /></Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {STORE_NAME} · {t('Demo concept')}</span><div className="footer-socials" aria-label={t('Social links')}>{SOCIAL_LINKS.map((item) => { const Icon = socialIcons[item.label]; return item.href.startsWith('https://') ? <a href={item.href} key={item.label} target="_blank" rel="noopener noreferrer" aria-label={t(item.label)}><Icon size={18} aria-hidden="true" /><span className="sr-only">{t(item.label)}</span></a> : <span key={item.label} aria-label={t(item.label)} title={t(item.label)}><Icon size={18} aria-hidden="true" /><span className="sr-only">{t(item.label)}</span></span> })}</div><span>{t('Thoughtfully considered, never assumed.')}</span></div>
  </footer>
}

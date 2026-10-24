import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { useI18n } from '../i18n/LocaleContext'

export function ConfirmationPage() {
  const { t } = useI18n()
  usePageMeta(t('Demo checkout complete'), t('This checkout was a demonstration. No real order or delivery request was created.'))
  const location = useLocation()
  const messageKey = typeof location.state?.message === 'string' ? location.state.message : 'This was a checkout demonstration. No real order or delivery request was created.'
  const message = t(messageKey)
  return <div className="page-shell confirmation-page"><div className="confirmation-card"><span className="confirmation-icon"><CheckCircle2 size={28} /></span><span className="eyebrow">{t('Demo walkthrough complete')}</span><h1>{t('No real order')} <em>{t('was placed.')}</em></h1><p>{message}</p><div className="demo-notice" role="note"><span><strong>{t('Demo mode.')}</strong> {t('Checkout is a demonstration and does not submit an order.')}</span></div><p className="confirmation-small">{t('No delivery request or business order record was created. The confirmation URL does not represent an order.')}</p><Link to="/shop" className="button button--dark">{t('Return to the shop')} <ArrowRight size={16} /></Link></div></div>
}

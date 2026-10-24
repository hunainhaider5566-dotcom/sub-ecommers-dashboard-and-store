import { DELIVERY_FEE } from '../../config/store'
import { useI18n } from '../../i18n/LocaleContext'
import { formatPKR } from '../../utils/money'

export function OrderSummary({ subtotal, label = 'Demo summary' }: { subtotal: number; label?: string }) {
  const { t } = useI18n()
  const total = subtotal + (DELIVERY_FEE ?? 0)
  const totalLabel = DELIVERY_FEE === null ? t('Estimated total before delivery') : t('Estimated total')
  return <section className="order-summary" aria-label={t(label)}><h2>{t(label)}</h2><div className="order-summary__row"><span>{t('Item subtotal')} <small>{t('sample prices')}</small></span><strong>{formatPKR(subtotal)}</strong></div><div className="order-summary__row"><span>{t('Delivery fee')} <small>{t('not yet configured')}</small></span><strong>{DELIVERY_FEE === null ? t('To be confirmed') : formatPKR(DELIVERY_FEE)}</strong></div><div className="order-summary__total"><span>{totalLabel}</span><strong>{formatPKR(total)}</strong></div><p>{t('Sample calculation only. No payment or delivery is arranged by this demo.')}</p></section>
}

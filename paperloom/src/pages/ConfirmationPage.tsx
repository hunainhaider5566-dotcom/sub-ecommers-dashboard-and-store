import { ArrowRight, CheckCircle2, PackageCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { useI18n } from '../i18n/LocaleContext'
import { getMyOrderByNumber } from '../services/orders/orderService'
import type { OrderRecord } from '../types/order'
import { formatPKR } from '../utils/money'

function addressLines(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const address = value as Record<string, unknown>
  const line1 = typeof address.address_line_1 === 'string' ? address.address_line_1 : ''
  const line2 = typeof address.address_line_2 === 'string' ? address.address_line_2 : ''
  const city = typeof address.city === 'string' ? address.city : ''
  return [line1, line2, city].filter(Boolean)
}

export function ConfirmationPage() {
  const { t } = useI18n()
  usePageMeta(t('Order Confirmed'), t('Your order has been successfully placed on Meridion Marketplace.'))
  const location = useLocation()
  const orderNumber = typeof location.state?.orderNumber === 'string' ? location.state.orderNumber : 'ORD-SUCCESS'

  return (
    <div className="page-shell confirmation-page">
      <div className="confirmation-card shine-surface">
        <span className="confirmation-icon"><CheckCircle2 size={32} /></span>
        <span className="eyebrow">{t('Order Placed Successfully')}</span>
        <h1>{t('Thank You for Your Order!')}</h1>
        <p className="order-number-display"><PackageCheck size={18} /> {t('Order #:')} <strong>{orderNumber}</strong></p>
        <p>{t('Your order has been recorded and transmitted to the seller for fulfillment. Payment method: Cash on Delivery (COD).')}</p>
        <div className="demo-notice demo-notice--compact" role="note">
          <span><strong>{t('Order Status:')}</strong> {t('Pending fulfillment. Updates will be visible in your Account Order History.')}</span>
        </div>
        <div className="confirmation-actions">
          <Link to="/account" className="button button--outline">{t('View My Orders')}</Link>
          <Link to="/shop" className="button button--dark">{t('Continue Shopping')} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </div>
  )
}

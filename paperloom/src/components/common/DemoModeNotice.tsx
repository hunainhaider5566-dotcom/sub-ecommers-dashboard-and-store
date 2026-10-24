import { Info } from 'lucide-react'
import { DEMO_DATA_NOTICE } from '../../config/store'
import { getCatalogMode } from '../../config/backend'
import { useI18n } from '../../i18n/LocaleContext'

export function DemoModeNotice({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const demoCatalog = getCatalogMode() === 'demo'
  return (
    <div className={`demo-notice${compact ? ' demo-notice--compact' : ''}`} role="note">
      <Info size={16} aria-hidden="true" />
      <span><strong>{t(demoCatalog ? 'Demo catalog.' : 'Demo checkout.')}</strong> {demoCatalog ? `${t(DEMO_DATA_NOTICE)} ` : ''}{t('Checkout remains demo-only; no real order or delivery request is created.')}</span>
    </div>
  )
}

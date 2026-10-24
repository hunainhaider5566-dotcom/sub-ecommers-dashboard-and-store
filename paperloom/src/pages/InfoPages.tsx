import { ArrowRight, ExternalLink, Leaf, MessageCircle, NotebookPen, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { DemoModeNotice } from '../components/common/DemoModeNotice'
import { usePageMeta } from '../hooks/usePageMeta'
import { supportDestination } from '../utils/support'
import { useI18n } from '../i18n/LocaleContext'

function InfoLayout({ eyebrow, title, intro, children }: { eyebrow: string; title: React.ReactNode; intro: string; children: React.ReactNode }) {
  return <div className="page-shell info-page"><header className="info-page__heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header>{children}</div>
}

export function AboutPage() {
  const { t } = useI18n()
  usePageMeta(t('About Paperloom'), t('A multi-category store concept; the sample stationery and study goods shown are one initial collection.'))
  return <InfoLayout eyebrow={t('A little about us')} title={<>{t('Space for the')} <em>{t('everyday idea.')}</em></>} intro={t('Paperloom is a multi-category store concept. The sample stationery and study goods shown here are one initial collection; other categories may be considered in the future.')}><DemoModeNotice /><div className="info-feature-grid"><article><span><Leaf size={19} /></span><h2>{t('Thoughtful by design')}</h2><p>{t('A quiet visual language for considered goods, creative routines and everyday moments.')}</p></article><article><span><NotebookPen size={19} /></span><h2>{t('Useful, not precious')}</h2><p>{t('Useful goods should fit changing routines, thoughtful spaces and ordinary moments.')}</p></article><article><span><ShieldCheck size={19} /></span><h2>{t('Clear about what’s real')}</h2><p>{t('This storefront is in demo mode. Products, pricing, availability and business arrangements have not been confirmed.')}</p></article></div><section className="placeholder-panel"><span className="eyebrow">{t('Launch note')}</span><h2>{t('Details to confirm')}</h2><p>{t('Brand ownership, registered business details, sourcing and fulfillment arrangements remain to be verified before launch.')}</p></section></InfoLayout>
}

export function ContactPage() {
  const { t } = useI18n()
  usePageMeta(t('Contact'), t('Contact options for the Paperloom demo storefront; verified support details have not yet been configured.'))
  const destination = supportDestination(t('Hello, I have a question about the Paperloom demo storefront.'))
  return <InfoLayout eyebrow={t('Questions & notes')} title={<>{t('Let’s keep the')} <em>{t('conversation clear.')}</em></>} intro={t('A verified business email, address and support channel have not yet been configured. We won’t invent contact details.')}><DemoModeNotice compact /><section className="placeholder-panel contact-placeholder"><span className="contact-placeholder__icon"><MessageCircle size={21} /></span><div><span className="eyebrow">{t('Customer support')}</span><h2>{t('Contact details pending')}</h2><p>{t('A verified support email or business-controlled WhatsApp number has not yet been configured.')}</p>{destination.startsWith('https://') ? <a className="button button--dark" href={destination} target="_blank" rel="noopener noreferrer">{t('Open WhatsApp')} <ExternalLink size={15} /></a> : <Link className="text-link" to="/faq">{t('Read the demo FAQ')} <ArrowRight size={15} /></Link>}</div></section></InfoLayout>
}

const faqItems = [
  { question: 'Is Paperloom accepting orders?', answer: 'No. This is a frontend demo. Live order submission is disabled and the confirmation screen explicitly states that no order or delivery request was created.' },
  { question: 'Is cash on delivery available?', answer: 'No. COD is disabled in the demo. Payment availability has not been confirmed for any future launch.' },
  { question: 'Are the sample products in stock?', answer: 'No stock is represented as confirmed. Sample listings are visual and interaction data only, and no vendor partnership is claimed.' },
  { question: 'What is the delivery fee or timeline?', answer: 'Neither the delivery fee nor delivery timings are confirmed. The demo does not promise free delivery, a courier or a delivery date.' },
  { question: 'What is the return or refund policy?', answer: 'The business has not confirmed return or refund terms. The returns page is an editable launch template, not a promise or final policy.' },
  { question: 'How do I contact support?', answer: 'A verified contact method has not been configured. The Support destination links to the Contact page until a business-controlled WhatsApp number is supplied.' },
  { question: 'Does checkout save my details?', answer: 'No. Form values stay in browser memory while the page is open; the demo does not transmit or store customer details. Cart quantities and wishlist IDs are stored locally in this browser.' },
]

export function FAQPage() {
  const { t } = useI18n()
  usePageMeta(t('Frequently asked questions'), t('Answers about the Paperloom demo storefront, sample products and unconfirmed business policies.'))
  return <InfoLayout eyebrow={t('Helpful notes')} title={<>{t('Frequently')} <em>{t('asked.')}</em></>} intro={t('Straight answers about what this demo does—and what still needs to be confirmed.')}><DemoModeNotice compact /><div className="info-accordion">{faqItems.map((item) => <details className="faq-item" key={item.question}><summary>{t(item.question)}<span aria-hidden="true">+</span></summary><p>{t(item.answer)}</p></details>)}</div></InfoLayout>
}

export function PrivacyPage() {
  const { t } = useI18n()
  usePageMeta(t('Privacy note'), t('A demo privacy note describing local cart and wishlist storage and the checkout form’s non-transmitting behavior.'))
  const cart = useCart()
  const wishlist = useWishlist()
  return <InfoLayout eyebrow={t('Privacy · demo template')} title={<>{t('A careful note on')} <em>{t('your details.')}</em></>} intro={t('This is an editable placeholder for a future verified privacy policy, not final legal advice.')}><DemoModeNotice /><article className="policy-copy"><h2>{t('What this demo does')}</h2><p>{t('Checkout form values remain in browser memory only. This demo does not submit customer information to a business, vendor, courier, analytics provider or other external service.')}</p><h2>{t('What is saved on this device')}</h2><p>{t('For convenience, this browser stores demo cart product IDs and quantities and wishlist product IDs in local storage. These are not customer records. Clear them below or remove the site’s local storage from your browser settings.')}</p><button type="button" className="button button--outline" onClick={() => { cart.clear(); wishlist.ids.forEach((id) => wishlist.toggle(id)) }}>{t('Clear local demo cart & wishlist')}</button><h2>{t('Before a real launch')}</h2><p>{t('Confirm the legal business identity, information collected, purpose, retention period, processors, contact channel and applicable privacy terms before enabling a production checkout.')}</p></article></InfoLayout>
}

export function ShippingPage() {
  const { t } = useI18n()
  usePageMeta(t('Shipping policy placeholder'), t('Shipping fee, courier arrangements and delivery timelines are not confirmed. This is an editable launch placeholder.'))
  return <InfoLayout eyebrow={t('Shipping · editable template')} title={<>{t('The delivery details,')} <em>{t('when confirmed.')}</em></>} intro={t('No shipping terms or courier arrangements are currently confirmed.')}><DemoModeNotice /><article className="policy-copy"><h2>{t('Delivery fee')}</h2><p>{t('Confirm a delivery-fee schedule by destination. The demo has no configured delivery fee and does not represent delivery as free.')}</p><h2>{t('Courier and delivery timing')}</h2><p>{t('Confirm an actual fulfillment partner, service area and realistic delivery timelines before communicating them publicly. No courier partnership or date is promised by this demo.')}</p><h2>{t('Order updates')}</h2><p>{t('This frontend does not create real orders or send fulfillment updates. Live order and courier communications require a secured backend and verified arrangements.')}</p></article><Link to="/contact" className="text-link">{t('Contact details are pending')} <ArrowRight size={15} /></Link></InfoLayout>
}

export function ReturnsPage() {
  const { t } = useI18n()
  usePageMeta(t('Returns policy placeholder'), t('Return and refund terms have not been confirmed. This is an editable launch placeholder, not a guarantee.'))
  return <InfoLayout eyebrow={t('Returns · editable template')} title={<>{t('A fair policy,')} <em>{t('to be confirmed.')}</em></>} intro={t('Return periods, condition rules and refund methods have not been set. This page is a launch TODO, not a guarantee.')}><DemoModeNotice /><article className="policy-copy"><h2>{t('Returns and exchanges')}</h2><p>{t('Confirm whether returns or exchanges will be offered, the applicable time window, product-condition requirements, exclusions, shipping costs and the contact process.')}</p><h2>{t('Refunds')}</h2><p>{t('Confirm eligible payment methods, refund processing responsibilities and realistic timing. No refund guarantee is made by this demo.')}</p><h2>{t('For this demonstration')}</h2><p>{t('Checkout is not live and creates no order, payment, shipment or return request.')}</p></article><Link to="/faq" className="text-link">{t('See the FAQ')} <ArrowRight size={15} /></Link></InfoLayout>
}

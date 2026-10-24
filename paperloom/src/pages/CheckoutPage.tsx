import { ArrowLeft, ArrowRight, MapPin, CheckCircle2, Navigation, AlertCircle } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { CartItem } from '../components/cart/CartItem'
import { useCart } from '../contexts/CartContext'
import { useCatalog } from '../contexts/CatalogContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getSupabase } from '../lib/supabase'
import { usePageMeta } from '../hooks/usePageMeta'
import { useI18n } from '../i18n/LocaleContext'
import { DELIVERY_FEE } from '../config/store'
import { formatPKR } from '../utils/money'
import { getCartLineUnitPrice, isCartLineAvailable } from '../utils/cart'

interface LocationCoordinates {
  lat: number
  lng: number
  name: string
  capturedAt: string
}

export function CheckoutPage() {
  const { t } = useI18n()
  usePageMeta(t('Checkout'), t('Complete your order with verified delivery location and address.'))
  const { lines, setQuantity, remove, clear } = useCart()
  const { findProductById, status, error, mode } = useCatalog()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    fullName: user?.user_metadata?.full_name || '',
    phone: '',
    city: 'Lahore',
    area: '',
    address: '',
    email: user?.email || '',
    instructions: '',
  })

  const [coords, setCoords] = useState<LocationCoordinates | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const subtotal = lines.reduce((sum, line) => sum + getCartLineUnitPrice(findProductById(line.productId), line) * line.quantity, 0)
  const total = subtotal + (DELIVERY_FEE ?? 250)

  if (status === 'loading' && lines.length > 0) return <div className="page-shell"><LoadingState label="Preparing checkout…" /></div>
  if (status === 'error' && lines.length > 0) return <div className="page-shell"><ErrorState message={error || 'The catalog could not be loaded.'} /><Link className="back-link" to="/cart">{t('Return to cart')}</Link></div>
  if (lines.length === 0) return <div className="page-shell"><EmptyState title={t('Your cart is empty')} description={t('Add items to your cart before checking out.')} actionLabel={t('Browse Store')} /></div>

  function setField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError(t('Geolocation is not supported by your browser. Please enter your pin address manually.'))
      return
    }
    setGeoLoading(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const captured: LocationCoordinates = {
          lat: Number(pos.coords.latitude.toFixed(7)),
          lng: Number(pos.coords.longitude.toFixed(7)),
          name: `${form.city || 'Location'}, Pakistan`,
          capturedAt: new Date().toISOString(),
        }
        setCoords(captured)
        setGeoLoading(false)
        push(t('Location coordinates captured successfully!'), 'success')
      },
      (err) => {
        setGeoLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(t('Location permission denied. Please confirm location manually or enter coordinates below.'))
        } else {
          setGeoError(t('Could not retrieve GPS coordinates. Manual pin location will be used.'))
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.fullName.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      push(t('Please fill in all required delivery fields.'), 'error')
      return
    }

    setSubmitting(true)
    try {
      const client = getSupabase()

      // Generate order number
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`

      const { data: orderData, error: orderErr } = await client
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNum,
          customer_name: form.fullName.trim(),
          customer_email: form.email.trim() || null,
          customer_phone: form.phone.trim(),
          order_status: 'pending',
          payment_status: 'unpaid',
          subtotal,
          delivery_fee: DELIVERY_FEE ?? 250,
          total,
          shipping_address_snapshot: {
            address_line_1: form.address.trim(),
            city: form.city.trim(),
            area: form.area.trim(),
            instructions: form.instructions.trim(),
          },
          delivery_lat: coords?.lat || null,
          delivery_lng: coords?.lng || null,
          delivery_location_name: coords?.name || `${form.area}, ${form.city}`,
          delivery_location_captured_at: coords?.capturedAt || null,
        })
        .select()
        .single()

      if (orderErr) throw new Error(orderErr.message)

      // Save order items
      for (const line of lines) {
        const prod = findProductById(line.productId)
        await client.from('order_items').insert({
          order_id: orderData.id,
          product_id: prod?.id || null,
          product_name_snapshot: prod?.name || 'Item',
          quantity: line.quantity,
          unit_price: getCartLineUnitPrice(prod, line),
          line_total: getCartLineUnitPrice(prod, line) * line.quantity,
        })
      }

      clear()
      push(t('Order placed successfully with Cash on Delivery!'), 'success')
      navigate('/order-confirmation', { state: { orderNumber: orderNum, from: location.pathname } })
    } catch (err: any) {
      push(err.message || t('Order submission failed. Please try again.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell checkout-page">
      <Link to="/cart" className="back-link"><ArrowLeft size={15} /> {t('Back to Cart')}</Link>
      <div className="page-heading">
        <span className="eyebrow">{t('Checkout')}</span>
        <h1>{t('Confirm Delivery')} <em>{t('Location.')}</em></h1>
        <p>{t('Provide your delivery address and confirm your location pin on the map.')}</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submitOrder} noValidate>
          <section className="form-section">
            <h2>{t('01 · Recipient & Contact Details')}</h2>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="fullName">{t('Full Name')} <span>*</span></label>
                <input id="fullName" name="fullName" value={form.fullName} onChange={setField} required />
              </div>
              <div className="form-field">
                <label htmlFor="phone">{t('Mobile Number')} <span>*</span></label>
                <input id="phone" name="phone" type="tel" placeholder="03xx xxx xxxx" value={form.phone} onChange={setField} required />
              </div>
              <div className="form-field">
                <label htmlFor="email">{t('Email Address')}</label>
                <input id="email" name="email" type="email" value={form.email} onChange={setField} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>{t('02 · Delivery Address & Location Pin')}</h2>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="city">{t('City')} <span>*</span></label>
                <input id="city" name="city" value={form.city} onChange={setField} required />
              </div>
              <div className="form-field">
                <label htmlFor="area">{t('Area / Locality')}</label>
                <input id="area" name="area" placeholder="e.g. Gulberg III" value={form.area} onChange={setField} />
              </div>
              <div className="form-field form-field--wide">
                <label htmlFor="address">{t('Full Street Address')} <span>*</span></label>
                <textarea id="address" name="address" rows={3} placeholder="House/Apartment #, Street, Block..." value={form.address} onChange={setField} required />
              </div>
              <div className="form-field form-field--wide">
                <label htmlFor="instructions">{t('Delivery Instructions (Optional)')}</label>
                <textarea id="instructions" name="instructions" rows={2} placeholder="Gate code, landmark, calling preferences..." value={form.instructions} onChange={setField} />
              </div>
            </div>

            <div className="location-pin-box shine-surface">
              <div className="location-pin-header">
                <div>
                  <h3><MapPin size={18} /> {t('Delivery GPS Location Pin')}</h3>
                  <p>{t('Confirm exact delivery coordinates for courier navigation.')}</p>
                </div>
                <button
                  type="button"
                  className="button button--outline"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading}
                >
                  <Navigation size={16} className={geoLoading ? 'spin' : ''} />
                  {t(geoLoading ? 'Locating…' : 'Use My Current Location')}
                </button>
              </div>

              {geoError && (
                <p className="field-error"><AlertCircle size={15} /> {geoError}</p>
              )}

              {coords ? (
                <div className="coords-confirmed-badge">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{t('GPS Location Confirmed')}</strong>
                    <span>Latitude: {coords.lat}, Longitude: {coords.lng}</span>
                  </div>
                </div>
              ) : (
                <div className="coords-manual-fallback">
                  <p>{t('Location pin optional. System will use city and street address for delivery if GPS is uncaptured.')}</p>
                </div>
              )}
            </div>
          </section>

          <button className="button button--dark button--full checkout-submit" type="submit" disabled={submitting}>
            {t(submitting ? 'Placing Order…' : 'Place Order (Cash on Delivery)')} <ArrowRight size={16} />
          </button>
        </form>

        <aside className="checkout-sidebar">
          <div className="checkout-order-card">
            <h2>{t('Order Summary')}</h2>
            <div className="checkout-mini-items">
              {lines.map((line, index) => (
                <CartItem
                  key={`${line.productId}-${line.variantId ?? 'default'}-${index}`}
                  line={line}
                  onQuantity={(quantity) => setQuantity(line.productId, line.variantId, quantity)}
                  onRemove={() => remove(line.productId, line.variantId)}
                />
              ))}
            </div>

            <div className="order-summary">
              <div className="order-summary__row">
                <span>{t('Item Subtotal')}</span>
                <strong>{formatPKR(subtotal)}</strong>
              </div>
              <div className="order-summary__row">
                <span>{t('Delivery Fee')}</span>
                <strong>{formatPKR(DELIVERY_FEE ?? 250)}</strong>
              </div>
              <div className="order-summary__total">
                <span>{t('Total (Cash on Delivery)')}</span>
                <strong>{formatPKR(total)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

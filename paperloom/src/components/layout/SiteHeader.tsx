import { Bell, Globe2, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ANNOUNCEMENT_TEXT, STORE_NAME } from '../../config/store'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useI18n } from '../../i18n/LocaleContext'
import { UserAvatar } from '../common/UserAvatar'
import { getOwnSellerProfile } from '../../services/marketplace/vendorService'
import type { SellerStatus } from '../../types/database'

const primaryLinks = [{ to: '/discover', label: 'Discover' }, { to: '/budget', label: 'Budget' }, { to: '/shop', label: 'Shop' }, { to: '/categories', label: 'Collections' }, { to: '/about', label: 'Our story' }]

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <section className="notification-panel" role="region" aria-label={t('Notifications')}>
    <div className="notification-panel__head"><div><span className="eyebrow">{t('Store updates')}</span><h2>{t('Notifications')}</h2></div><button type="button" className="icon-button" aria-label={t('Close notifications')} onClick={onClose}><X size={18} /></button></div>
    <div className="notification-panel__empty"><span className="notification-panel__icon"><Bell size={22} aria-hidden="true" /></span><strong>{t('No notifications yet')}</strong><p>{t('Notifications are not displayed in this storefront yet.')}</p></div>
  </section>
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { itemCount } = useCart()
  const { ids: wishlistIds } = useWishlist()
  const { t, locale, toggleLocale } = useI18n()
  const { user, avatarUrl, displayName } = useAuth()
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null)
  const location = useLocation()
  useEffect(() => { setMenuOpen(false); setNotificationsOpen(false) }, [location.pathname])
  useEffect(() => {
    let active = true
    if (!user) { setSellerStatus(null); return () => { active = false } }
    void getOwnSellerProfile().then((profile) => { if (active) setSellerStatus(profile?.status ?? null) }).catch(() => { if (active) setSellerStatus(null) })
    return () => { active = false }
  }, [user?.id])
  const targetLanguage = locale === 'en' ? 'اردو' : 'English'
  const closeNotifications = () => setNotificationsOpen(false)
  const sellerLink = sellerStatus === 'approved' ? { to: '/vendor', label: 'Vendor dashboard' } : { to: '/vendor/apply', label: sellerStatus === 'pending' ? 'Application status' : 'Become a Seller' }
  return <>
    {ANNOUNCEMENT_TEXT.trim() && <div className="announcement-bar">{ANNOUNCEMENT_TEXT}</div>}
    <header className="site-header">
      <div className="site-header__inner">
        <button className="icon-button menu-toggle" aria-label={t(menuOpen ? 'Close main menu' : 'Open main menu')} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)} type="button">{menuOpen ? <X /> : <Menu />}</button>
        <Link className="wordmark" to="/" aria-label={`${STORE_NAME} · ${t('Home')}`} onClick={() => setMenuOpen(false)}><span className="wordmark-mark" aria-hidden="true"><span /></span><span>meridion<span className="wordmark-period">.</span></span></Link>
        <nav className="desktop-nav" aria-label={t('Main navigation')}>{primaryLinks.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'is-active' : ''}>{t(link.label)}</NavLink>)}<NavLink className="seller-entry" to={sellerLink.to}>{sellerLink.label}</NavLink></nav>
        <div className="header-actions">
          <Link to="/search" aria-label={t('Search')} className="icon-button"><Search size={19} /></Link>
          <Link to="/wishlist" aria-label={`${t('Wishlist')}${wishlistIds.length ? ` · ${wishlistIds.length}` : ''}`} className="icon-button header-wishlist"><Heart size={19} />{wishlistIds.length > 0 && <span className="header-cart__badge">{wishlistIds.length > 99 ? '99+' : wishlistIds.length}</span>}</Link>
          <div className="notification-anchor">
            <button type="button" aria-label={t('Open notifications')} className="icon-button notification-trigger" aria-expanded={notificationsOpen} aria-controls="desktop-notification-panel" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} /></button>
            <div id="desktop-notification-panel" className="notification-panel-anchor">{notificationsOpen && <NotificationPanel onClose={closeNotifications} />}</div>
          </div>
          <Link to={user ? "/account" : "/login"} aria-label={user ? `${t('Account')} · ${displayName || ''}` : t('Sign in')} className={`icon-button account-action${avatarUrl ? ' account-action--has-avatar' : ''}`}><UserAvatar avatarUrl={avatarUrl} name={displayName} size={19} className="header-avatar" /></Link>
          <Link to="/cart" aria-label={`${t('Cart')} · ${itemCount}`} className="icon-button header-cart"><ShoppingBag size={19} />{itemCount > 0 && <span className="header-cart__badge">{itemCount > 99 ? '99+' : itemCount}</span>}</Link>
          <button type="button" className="locale-toggle" aria-label={`${t('Change language')}: ${targetLanguage}`} onClick={toggleLocale}><Globe2 size={16} /><span>{targetLanguage}</span></button>
        </div>
      </div>
      {menuOpen && <nav className="mobile-menu" id="mobile-menu" aria-label={t('Mobile navigation')}>
        {user && <Link to="/account" className="mobile-menu__user" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu__user-avatar-frame">
            <UserAvatar avatarUrl={avatarUrl} name={displayName} size={28} className="mobile-menu__user-avatar" />
          </div>
          <div className="mobile-menu__user-info">
            <strong className="mobile-menu__user-name">{displayName || t('My Account')}</strong>
            <span className="mobile-menu__user-email">{user.email}</span>
          </div>
        </Link>}
        {primaryLinks.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>{t(link.label)}</NavLink>)}
        <Link className="mobile-menu__seller" to={sellerLink.to} onClick={() => setMenuOpen(false)}>{sellerLink.label}</Link>
        <Link to="/wishlist" onClick={() => setMenuOpen(false)}>{t('Wishlist')}{wishlistIds.length > 0 ? ` · ${wishlistIds.length}` : ''}</Link>
        <Link to={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)}>{t(user ? 'Account' : 'Sign in')}</Link>
        <button type="button" className="mobile-menu__notification" aria-expanded={notificationsOpen} aria-controls="mobile-notification-panel" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={17} aria-hidden="true" />{t('Notifications')}</button>
        <div id="mobile-notification-panel" className="notification-panel-anchor notification-panel-anchor--mobile">{notificationsOpen && <NotificationPanel onClose={closeNotifications} />}</div>
        <button type="button" className="mobile-menu__locale" onClick={toggleLocale}><Globe2 size={17} aria-hidden="true" />{targetLanguage}</button>
        <Link to="/faq" onClick={() => setMenuOpen(false)}>{t('FAQ & help')}</Link>
      </nav>}
    </header>
  </>
}

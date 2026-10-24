export const DEMO_MODE = false as const
export const COD_ENABLED = true as const

/** Set to a verified numeric fee after delivery terms are confirmed; null means calculated at checkout. */
export const DELIVERY_FEE: number | null = 250

/** Keep blank or set to active support number */
export const WHATSAPP_NUMBER = ''
export const STORE_NAME = 'Meridion Marketplace'
export const STORE_CURRENCY = 'PKR' as const
export const ANNOUNCEMENT_TEXT = 'Welcome to Meridion Marketplace — Discover Quality Goods from Verified Vendors'
/** Verified platform support details */
export const STORE_CONTACT = { email: 'support@meridion.market', phone: '+92 300 0000000', address: 'Meridion Commerce Hub' } as const
/** Social links */
export const SOCIAL_LINKS: { label: 'Facebook' | 'Instagram' | 'TikTok' | 'WhatsApp'; href: string }[] = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'TikTok', href: '#' },
  { label: 'WhatsApp', href: '#' },
]

export const DEMO_DATA_NOTICE = ''

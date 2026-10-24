import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCatalog } from './CatalogContext'

interface WishlistValue {
  ids: string[]
  toggle: (productId: string) => void
  has: (productId: string) => boolean
}

const WISHLIST_KEY = 'meridion-wishlist-v1'
const WishlistContext = createContext<WishlistValue | null>(null)

function readWishlist(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((id): id is string => typeof id === 'string'))]
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { products, status, findProductById } = useCatalog()
  const [ids, setIds] = useState<string[]>(readWishlist)
  useEffect(() => localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids)), [ids])
  useEffect(() => {
    if (status === 'ready') {
      const availableIds = new Set(products.filter((product) => product.isPublished).map((product) => product.id))
      setIds((current) => current.filter((id) => availableIds.has(id)))
    }
  }, [status, products])
  const value = useMemo(() => ({
    ids,
    toggle: (productId: string) => {
      if (!findProductById(productId)) return
      setIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
    },
    has: (productId: string) => ids.includes(productId),
  }), [ids, findProductById])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistValue {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider')
  return context
}

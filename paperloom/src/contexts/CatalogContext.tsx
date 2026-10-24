import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCatalogMode, type CatalogMode } from '../config/backend'
import { catalogService } from '../services/products/productService'
import type { Category } from '../types/category'
import type { Product } from '../types/product'

type CatalogStatus = 'loading' | 'ready' | 'error' | 'unconfigured'

interface CatalogValue {
  products: Product[]
  categories: Category[]
  status: CatalogStatus
  mode: CatalogMode
  error: string | null
  findProductById: (id: string) => Product | undefined
  findProductBySlug: (slug: string) => Product | undefined
  findCategoryBySlug: (slug: string) => Category | undefined
}

const CatalogContext = createContext<CatalogValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const mode = getCatalogMode()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<CatalogStatus>(mode === 'unconfigured' ? 'unconfigured' : 'loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setProducts([])
    setCategories([])
    setError(null)

    if (mode === 'unconfigured') {
      setStatus('unconfigured')
      return () => { cancelled = true }
    }

    setStatus('loading')
    catalogService.loadCatalog(mode)
      .then((catalog) => {
        if (cancelled) return
        setProducts(catalog.products)
        setCategories(catalog.categories)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'The catalog could not be loaded.')
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [mode])

  const value = useMemo<CatalogValue>(() => ({
    products,
    categories,
    status,
    mode,
    error,
    findProductById: (id) => products.find((product) => product.id === id && product.isPublished),
    findProductBySlug: (slug) => products.find((product) => product.slug === slug && product.isPublished),
    findCategoryBySlug: (slug) => categories.find((category) => category.slug === slug && category.isActive !== false),
  }), [products, categories, status, mode, error])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider')
  return context
}

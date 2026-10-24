export type AvailabilityStatus = 'demo' | 'available' | 'out-of-stock' | 'unavailable' | 'unknown'

export interface ProductVariant {
  id: string
  label: string
  value: string
  price?: number
  sku?: string
  availabilityStatus?: Exclude<AvailabilityStatus, 'demo' | 'unavailable'>
}

export interface ProductSpecification {
  label: string
  value: string
}

export interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  currency: string
  categoryId: string
  images: string[]
  specifications: ProductSpecification[]
  variants: ProductVariant[]
  isPublished: boolean
  availabilityStatus: AvailabilityStatus
  isFeatured?: boolean
  trackInventory?: boolean
  vendorId?: string
  createdAt?: string
}

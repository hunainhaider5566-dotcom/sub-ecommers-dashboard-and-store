import type { CartLine } from './cart'

export interface CheckoutFormValues {
  fullName: string
  phone: string
  city: string
  address: string
  email: string
  instructions: string
}

export interface OrderRequest {
  items: CartLine[]
  form: CheckoutFormValues
  mode: 'demo'
}

export interface OrderResponse {
  mode: 'demo'
  orderCreated: false
  message: string
}

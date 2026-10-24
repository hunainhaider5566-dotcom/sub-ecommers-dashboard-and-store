import type { CheckoutFormValues } from '../types/order'

export type CheckoutErrors = Partial<Record<keyof CheckoutFormValues | 'items', string>>

export function isPakistaniMobile(value: string): boolean {
  const compact = value.replace(/[\s()-]/g, '')
  return /^(?:\+92|0092|0)?3\d{9}$/.test(compact)
}

export function validateCheckout(form: CheckoutFormValues, hasItems: boolean): CheckoutErrors {
  const errors: CheckoutErrors = {}
  if (!hasItems) errors.items = 'Add a demo item to your cart before continuing.'
  if (!form.fullName.trim()) errors.fullName = 'Enter a name for this demo checkout.'
  if (!isPakistaniMobile(form.phone)) errors.phone = 'Enter a Pakistani mobile number, for example 03xx xxx xxxx.'
  if (!form.city.trim()) errors.city = 'Enter a city for this demo checkout.'
  if (form.address.trim().length < 8) errors.address = 'Enter a demo address of at least 8 characters.'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address or leave this optional field blank.'
  return errors
}

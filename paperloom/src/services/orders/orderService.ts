import type { OrderRequest, OrderResponse } from '../../types/order'

/**
 * Demo adapter only: deliberately ignores personal fields and writes nothing.
 * Replace with a protected server endpoint only after fulfillment is verified.
 */
export function submitDemoOrder(_request: OrderRequest): OrderResponse {
  return {
    mode: 'demo',
    orderCreated: false,
    message: 'This was a checkout demonstration. No real order or delivery request was created.',
  }
}

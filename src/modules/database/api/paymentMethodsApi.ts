import type { PaymentMethod, Client } from '../types'
import { getFromStorage, setToStorage, delay } from '../storage/localStorage'
import { seedClients } from '../seed/seed'
import {
  mockStripe,
  toPaymentMethod,
  type CardDetails,
  type MockPaymentConfirmation,
} from '@/lib/stripe/mockStripe'

const STORAGE_KEY = 'clients'

// ============================================
// Helper Functions
// ============================================

function getClients(): Client[] {
  return getFromStorage<Client[]>(STORAGE_KEY, seedClients)
}

function saveClients(clients: Client[]): void {
  setToStorage(STORAGE_KEY, clients)
}

function getClientById(clientId: string): Client | undefined {
  const clients = getClients()
  return clients.find((c) => c.id === clientId)
}

function updateClient(clientId: string, updates: Partial<Client>): Client {
  const clients = getClients()
  const index = clients.findIndex((c) => c.id === clientId)

  if (index === -1) {
    throw new Error('Client not found')
  }

  clients[index] = {
    ...clients[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  saveClients(clients)
  return clients[index]
}

// ============================================
// Payment Methods API
// ============================================

export const paymentMethodsApi = {
  /**
   * Get all payment methods for a client
   */
  async getByClientId(clientId: string): Promise<PaymentMethod[]> {
    await delay()
    const client = getClientById(clientId)

    if (!client) {
      throw new Error('Client not found')
    }

    return client.paymentMethods ?? []
  },

  /**
   * Create a new payment method for a client
   *
   * Uses mockStripe to validate and create the payment method,
   * then stores it in the client's paymentMethods array
   */
  async create(clientId: string, cardDetails: CardDetails): Promise<PaymentMethod> {
    // First, use mockStripe to create and validate the payment method
    const stripeResponse = await mockStripe.createPaymentMethod(cardDetails)

    // Add a small delay to simulate additional API processing
    await delay()

    const client = getClientById(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    const existingMethods = client.paymentMethods ?? []

    // If this is the first payment method, make it the default
    const isDefault = existingMethods.length === 0

    // Convert the Stripe response to our PaymentMethod type
    const paymentMethod = toPaymentMethod(stripeResponse, clientId, isDefault)

    // Update the client with the new payment method
    updateClient(clientId, {
      paymentMethods: [...existingMethods, paymentMethod],
    })

    return paymentMethod
  },

  /**
   * Delete a payment method
   *
   * If the deleted method was the default, the first remaining method
   * becomes the new default
   */
  async delete(paymentMethodId: string): Promise<void> {
    // Call mockStripe to simulate deletion
    await mockStripe.deletePaymentMethod(paymentMethodId)

    await delay()

    const clients = getClients()
    let found = false

    for (const client of clients) {
      const methods = client.paymentMethods ?? []
      const methodIndex = methods.findIndex((m) => m.id === paymentMethodId)

      if (methodIndex !== -1) {
        found = true
        const wasDefault = methods[methodIndex].isDefault

        // Remove the payment method
        const updatedMethods = methods.filter((m) => m.id !== paymentMethodId)

        // If the deleted method was the default and there are remaining methods,
        // make the first one the new default
        if (wasDefault && updatedMethods.length > 0) {
          updatedMethods[0].isDefault = true
        }

        updateClient(client.id, { paymentMethods: updatedMethods })
        break
      }
    }

    if (!found) {
      throw new Error('Payment method not found')
    }
  },

  /**
   * Set a payment method as the default for a client
   *
   * Unsets the current default and sets the specified method as default
   */
  async setDefault(clientId: string, paymentMethodId: string): Promise<PaymentMethod> {
    await delay()

    const client = getClientById(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    const methods = client.paymentMethods ?? []
    const targetIndex = methods.findIndex((m) => m.id === paymentMethodId)

    if (targetIndex === -1) {
      throw new Error('Payment method not found')
    }

    // Update all methods: unset current default, set new default
    const updatedMethods = methods.map((method) => ({
      ...method,
      isDefault: method.id === paymentMethodId,
    }))

    updateClient(clientId, { paymentMethods: updatedMethods })

    return updatedMethods[targetIndex]
  },

  /**
   * Process a payment using a stored payment method
   */
  async processPayment(
    clientId: string,
    paymentMethodId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<MockPaymentConfirmation> {
    const client = getClientById(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    const methods = client.paymentMethods ?? []
    const method = methods.find((m) => m.id === paymentMethodId)

    if (!method) {
      throw new Error('Payment method not found')
    }

    // Use mockStripe to process the payment
    return mockStripe.confirmPayment(amount, paymentMethodId, currency)
  },

  /**
   * Get the default payment method for a client
   */
  async getDefault(clientId: string): Promise<PaymentMethod | null> {
    await delay()

    const client = getClientById(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    const methods = client.paymentMethods ?? []
    return methods.find((m) => m.isDefault) ?? methods[0] ?? null
  },
}

import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import PlaceOrder from '@/components/PlaceOrder.vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock external dependencies
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}))

vi.mock('@/api/axios', () => ({
  connection: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ status: 201, data: { data: { id: 'TEST123' } } })
  }
}))

vi.mock('html2pdf.js', () => ({
  default: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue()
  })
}))

describe('PlaceOrder', () => {
  let wrapper

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify({ id: 1 })),
        setItem: vi.fn(),
      },
      writable: true
    })

    wrapper = mount(PlaceOrder, {
      global: {
        stubs: {
          'Header': true,
          'Sidebar': true,
          'SidebarCashier': true
        },
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    })
  })

  it('mounts component', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('initializes with default values', () => {
    const orderItems = wrapper.vm.orderItems
    const customerName = wrapper.vm.customerName
    const applyDiscount = wrapper.vm.applyDiscount

    expect(orderItems).toHaveLength(0)
    expect(customerName).toBe('Walk-in Customer')
    expect(applyDiscount).toBe(false)
  })

  it('adds product to order successfully', async () => {
    const product = { id: 1, name: 'Test Product', price: 100, stock: 5 }
    await wrapper.vm.addToOrder(product)
    
    const orderItems = wrapper.vm.orderItems
    expect(orderItems).toHaveLength(1)
    expect(orderItems[0]).toEqual(expect.objectContaining({
      id: 1,
      quantity: 1,
      price: 100
    }))
  })

  it('prevents adding more than stock quantity', async () => {
    const product = { id: 1, name: 'Test Product', price: 100, stock: 1 }
    await wrapper.vm.addToOrder(product)
    await wrapper.vm.addToOrder(product)
    
    const orderItems = wrapper.vm.orderItems
    expect(orderItems[0].quantity).toBe(1)
  })

  it('calculates totals with discounts correctly', async () => {
    const product = { id: 1, name: 'Test', price: 100, stock: 5 }
    await wrapper.vm.addToOrder(product)
    await nextTick()
    
    expect(wrapper.vm.subtotal).toBe(100)
    
    wrapper.vm.orderItems[0].productDiscount = 10
    wrapper.vm.applyDiscount = true
    wrapper.vm.customDiscountRate = 10
    await nextTick()
    
    expect(wrapper.vm.total).toBe(81)
  })

  it('clears order and resets customer', async () => {
    const product = { id: 1, name: 'Test', price: 100, stock: 5 }
    await wrapper.vm.addToOrder(product)
    wrapper.vm.customerName = 'Test Customer'
    
    await wrapper.vm.clearOrder()
    
    expect(wrapper.vm.orderItems).toHaveLength(0)
    expect(wrapper.vm.customerName).toBe('Walk-in Customer')
  })

  it('completes order successfully', async () => {
    const product = { id: 1, name: 'Test', price: 100, stock: 5 }
    await wrapper.vm.addToOrder(product)
    wrapper.vm.selectedPaymentMethod = 'CASH'
    
    await wrapper.vm.completeOrder()
    
    expect(wrapper.vm.isPaymentModalOpen).toBe(false)
    expect(wrapper.vm.orderId).toBe('TEST123')
  })
})

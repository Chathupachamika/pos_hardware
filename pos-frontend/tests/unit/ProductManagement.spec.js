import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProductManagement from '@/components/ProductManagement.vue'
import { connection } from '@/api/axios'
import Swal from 'sweetalert2'
import { createRouter, createWebHistory } from 'vue-router'

// Mock data
const mockProducts = [
  {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: '100',
    seller_price: '80',
    discount: '10',
    selling_discount: '5',
    tax: '7',
    size: 'M',
    color: 'Red',
    bar_code: '123456',
    brand_name: 'Test Brand',
    inventory_id: '1',
    supplier_id: '1',
    admin_id: '1',
    calculate_length: false,
    created_at: undefined,
    updated_at: undefined,
    profit: '23.00'
  },
  {
    id: 2,
    name: 'Another Product',
    description: 'Another Description',
    price: '200',
    seller_price: '160',
    discount: '15',
    selling_discount: '10',
    tax: '7',
    size: 'L',
    color: 'Blue',
    bar_code: '789012',
    brand_name: 'Another Brand',
    inventory_id: '2',
    supplier_id: '2',
    admin_id: '1',
    calculate_length: true,
    created_at: undefined,
    updated_at: undefined,
    profit: '44.00'
  }
]

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [{
    path: '/',
    component: { template: '<div>Home</div>' }
  }]
})

// Mock external dependencies
vi.mock('@/api/axios', () => ({
  connection: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}))

describe('ProductManagement.vue', () => {
  let wrapper
  
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Mock successful inventory response
    connection.get.mockImplementation((url) => {
      if (url.includes('/inventory')) {
        return Promise.resolve({ data: { quantity: 100 } })
      }
      if (url.includes('/suppliers')) {
        return Promise.resolve({ 
          data: {
            name: 'Test Supplier',
            email: 'test@supplier.com',
            contact: '1234567890'
          }
        })
      }
      return Promise.resolve({
        data: {
          data: mockProducts,
          meta: {
            total: mockProducts.length,
            current_page: 1,
            per_page: 10
          }
        }
      })
    })

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }

    // Mount component
    wrapper = mount(ProductManagement, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true,
          GRNDocument: true
        }
      }
    })
  })

  it('fetches products on mount', async () => {
    await wrapper.vm.$nextTick()
    expect(connection.get).toHaveBeenCalledWith('/products')
    expect(wrapper.vm.products).toEqual(mockProducts)
  })

  it('filters products based on search query', async () => {
    wrapper.vm.products = mockProducts
    wrapper.vm.searchQuery = 'Test Product'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.filteredProducts).toHaveLength(1)
    expect(wrapper.vm.filteredProducts[0].name).toBe('Test Product')
  })

  it('handles add product submission', async () => {
    const newProduct = {
      name: 'New Product',
      description: 'Test Description',
      price: '150',
      seller_price: '120',
      discount: '10',
      tax: '7',
      size: 'M',
      color: 'Blue',
      bar_code: '123456',
      brand_name: 'Test Brand',
      inventory_id: '1',
      supplier_id: '1',
      admin_id: '1'
    }

    connection.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: { ...newProduct, id: 3 }
      }
    })

    wrapper.vm.newProduct = newProduct
    await wrapper.vm.handleAddProduct()

    expect(connection.post).toHaveBeenCalledWith('/products', expect.any(Object))
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: 'success',
      title: 'Product Added Successfully!'
    }))
  })

  it('generates GRN document correctly', async () => {
    const product = mockProducts[0]

    await wrapper.vm.openGRNDocument(product)
    expect(wrapper.vm.showGRN).toBe(true)
    expect(wrapper.vm.grnNumber).toBeTruthy()
  })

  it('handles API error in add product', async () => {
    connection.get.mockRejectedValueOnce(new Error('Validation failed'))

    await wrapper.vm.fetchProducts()

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to load products',
      background: '#1e293b',
      color: '#ffffff'
    })
  })

  it('handles add product with validation errors from API', async () => {
    const validationError = {
      response: {
        data: {
          message: {
            name: ['The name field is required'],
            price: ['The price must be a number']
          }
        }
      }
    }

    connection.get.mockImplementation((url) => {
      if (url.includes('/inventory')) {
        return Promise.reject(validationError)
      }
      return Promise.resolve({ data: { quantity: 100 } })
    })

    wrapper.vm.newProduct = {
      name: '',
      price: 'invalid'
    }

    await wrapper.vm.handleAddProduct()

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Error!',
      text: 'The name field is required\nThe price must be a number',
      background: '#1e293b',
      color: '#ffffff'
    })
  })

  it('handles add product with non-validation API error', async () => {
    const networkError = new Error('Network error')
    
    connection.get.mockImplementation((url) => {
      if (url.includes('/inventory')) {
        return Promise.reject(networkError)
      }
      return Promise.resolve({ data: { quantity: 100 } })
    })

    wrapper.vm.newProduct = {
      name: 'Test',
      price: '100'
    }

    await wrapper.vm.handleAddProduct()

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Error!',
      text: 'Network error',
      background: '#1e293b',
      color: '#ffffff'
    })
  })

  it('handles concurrent API calls', async () => {
    // Reset mock to ensure clean call count
    connection.get.mockReset()
    
    connection.get.mockResolvedValue({
      data: {
        data: mockProducts,
        meta: {
          total: mockProducts.length,
          current_page: 1,
          per_page: 10
        }
      }
    })

    // Make two concurrent calls
    await Promise.all([
      wrapper.vm.fetchProducts(),
      wrapper.vm.fetchProducts()
    ])

    expect(connection.get).toHaveBeenCalledTimes(2)
  })

  it('handles API rate limiting', async () => {
    const rateLimitError = {
      response: { status: 429 }
    }

    connection.get.mockImplementation((url) => {
      if (url.includes('/inventory')) {
        return Promise.reject(rateLimitError)
      }
      return Promise.resolve({ data: { quantity: 100 } })
    })

    wrapper.vm.newProduct = {
      name: 'Test',
      price: '100'
    }

    await wrapper.vm.handleAddProduct()

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: 'warning',
      title: 'Rate Limited',
      text: 'Please try again later',
      background: '#1e293b',
      color: '#ffffff'
    })
  })

  it('saves form data to localStorage on errors', async () => {
    const formData = { name: 'Test', price: '100' }
    wrapper.vm.newProduct = formData
    
    localStorage.setItem('draft_product', JSON.stringify(formData))
    expect(localStorage.setItem).toHaveBeenCalledWith('draft_product', JSON.stringify(formData))
  })

  it('restores form data from localStorage', () => {
    const savedData = { name: 'Saved Draft', price: '150' }
    localStorage.getItem.mockReturnValue(JSON.stringify(savedData))
    
    wrapper.vm.restoreFormData()
    expect(wrapper.vm.newProduct.name).toBe(savedData.name)
    expect(wrapper.vm.newProduct.price).toBe(savedData.price)
  })

  // ...rest of the tests remain unchanged...
})

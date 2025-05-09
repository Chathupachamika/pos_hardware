import { mount } from '@vue/test-utils'
import SupplierManagement from '@/components/SupplierManagement.vue'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'

// Mock Sweetalert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}))

// Mock vue router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: {
      value: { path: '/suppliers' }
    }
  })
}))

// Mock Header and Sidebar components
vi.mock('@/components/Header.vue', () => ({
  default: {
    template: '<div class="header-stub"></div>'
  }
}))

vi.mock('@/components/Sidebar.vue', () => ({
  default: {
    template: '<div class="sidebar-stub"></div>'
  }
}))

// Mock the entire axios module
vi.mock('@/api/axios', () => ({
  connection: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// Import mocked axios
import { connection } from '@/api/axios'

describe('SupplierManagement.vue', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Setup default mock responses
    connection.get.mockResolvedValue({
      data: [
        { id: 1, name: 'ABC Corp', email: 'abc@corp.com', contact: '1234567890' },
        { id: 2, name: 'XYZ Ltd', email: 'xyz@ltd.com', contact: '0987654321' }
      ]
    })
    connection.post.mockResolvedValue({
      data: { id: 3, name: 'New Corp', email: 'new@corp.com', contact: '5555555555' }
    })
  })

  it('renders the supplier management header', () => {
    const wrapper = mount(SupplierManagement)
    expect(wrapper.find('h1').text()).toContain('Supplier Management')
  })

  it('displays a loading state when fetching suppliers', () => {
    const wrapper = mount(SupplierManagement)
    expect(wrapper.find('.loader').exists()).toBe(true)
  })

  it('renders supplier data in the table', async () => {
    const wrapper = mount(SupplierManagement)
    await nextTick()
    await wrapper.vm.$nextTick()
    
    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.text()).toContain('ABC Corp')
  })

  it('opens the add supplier modal when the button is clicked', async () => {
    const wrapper = mount(SupplierManagement)
    await nextTick()
    const addButton = wrapper.find('button:has(> svg.w-5)')
    await addButton.trigger('click')
    expect(wrapper.vm.showModal).toBe(true)
  })

  it('filters suppliers based on search query', async () => {
    const wrapper = mount(SupplierManagement)
    await nextTick()
    await wrapper.vm.$nextTick()
    
    // Wait for suppliers to load
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Update the search input value instead of using setData
    const searchInput = wrapper.find('input[type="text"][placeholder="Search supplier..."]')
    await searchInput.setValue('XYZ')
    
    expect(wrapper.text()).toContain('XYZ Ltd')
    expect(wrapper.text()).not.toContain('ABC Corp')
  })

  it('validates the add supplier form', async () => {
    const wrapper = mount(SupplierManagement)
    await nextTick()

    // Set empty values to trigger validation
    wrapper.vm.newSupplier = {
      companyName: '',
      contact: '',
      email: ''
    }

    // Manually trigger validation
    wrapper.vm.validateInput('companyName', '')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.formErrors.companyName).toBe('Company name is required')
  })

  it('emits an event when a supplier is successfully added', async () => {
    const wrapper = mount(SupplierManagement)
    await nextTick()
    
    wrapper.vm.newSupplier = {
      companyName: 'Test Corp',
      email: 'test@corp.com',
      contact: '1234567890'
    }
    
    await wrapper.vm.handleAddSupplier()
    await wrapper.vm.$nextTick()
    
    expect(connection.post).toHaveBeenCalled()
  })
})

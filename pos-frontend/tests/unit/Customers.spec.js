import { mount } from '@vue/test-utils'
import Customers from '@/components/Customers.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'

// Mock window.matchMedia
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
})

// Mock components
vi.mock('@/components/Sidebar.vue', () => ({
  default: { template: '<div class="mock-sidebar"></div>' }
}))

vi.mock('@/components/Header.vue', () => ({
  default: { template: '<div class="mock-header"></div>' }
}))

// Mock connection/axios
vi.mock('@/api/axios', () => ({
  connection: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock Sweetalert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  }
}))

describe('Customers.vue', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    router.push('/')
    await router.isReady()
  })

  it('renders the customer management header', () => {
    const wrapper = mount(Customers, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.find('h1').text()).toContain('Customer Management')
  })

  it('displays a loading state when fetching customers', async () => {
    const wrapper = mount(Customers, {
      global: {
        plugins: [router]
      },
      data() {
        return {
          isLoading: true
        }
      }
    })
    expect(wrapper.find('.loader-container').exists()).toBe(true)
  })

  it('renders customer data in the table', async () => {
    const wrapper = mount(Customers, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true
        }
      }
    })

    await wrapper.vm.$nextTick()
    wrapper.vm.customers = [
      { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@example.com', 
        contact: [{ contact_number: '1234567890' }] 
      }
    ]
    wrapper.vm.isLoading = false
    wrapper.vm.searchQuery = ''
    
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('John Doe')
  })

  it('opens the add customer modal when the button is clicked', async () => {
    const wrapper = mount(Customers, {
      global: {
        plugins: [router]
      }
    })
    const addButton = wrapper.find('button')
    expect(addButton.exists()).toBe(true)

    await addButton.trigger('click')
    expect(wrapper.vm.showModal).toBe(true)
  })

  it('filters customers based on search query', async () => {
    const wrapper = mount(Customers, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true
        }
      }
    })

    wrapper.vm.customers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', contact: [{ contact_number: '1234567890' }] },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', contact: [{ contact_number: '0987654321' }] }
    ]
    wrapper.vm.isLoading = false
    wrapper.vm.searchQuery = 'Jane'
    
    await wrapper.vm.$nextTick()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('Jane Smith')
  })

  it('deletes a customer when the delete button is clicked', async () => {
    const wrapper = mount(Customers, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true
        }
      }
    })

    wrapper.vm.customers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', contact: [{ contact_number: '1234567890' }] }
    ]
    wrapper.vm.isLoading = false
    wrapper.vm.searchQuery = ''
    
    await wrapper.vm.$nextTick()

    // Call handleDeleteCustomer directly
    await wrapper.vm.handleDeleteCustomer(wrapper.vm.customers[0])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.customers).toHaveLength(0)
  })
})
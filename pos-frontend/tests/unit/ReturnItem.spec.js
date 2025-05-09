import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReturnItem from '@/components/ReturnItem.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { returnItemApi } from '@/api/axios'

// Mock SweetAlert
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}))

// Mock html2pdf
vi.mock('html2pdf.js', () => ({
  default: vi.fn()
}))

// Mock window.matchMedia
global.matchMedia = global.matchMedia || function() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock API
vi.mock('@/api/axios', () => ({
  returnItemApi: {
    getAll: vi.fn()
  }
}))

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes: []
})

describe('ReturnItem.vue', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue('true')
    returnItemApi.getAll.mockResolvedValue({
      data: {
        status: 'success',
        data: []
      }
    })
  })

  it('renders the ReturnItem component', () => {
    const wrapper = mount(ReturnItem, {
      global: {
        plugins: [router],
        stubs: {
          'Sidebar': true,
          'SidebarCashier': true,
          'Header': true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('toggles the sidebar visibility', async () => {
    const wrapper = mount(ReturnItem, {
      global: {
        plugins: [router],
        stubs: {
          'Sidebar': true,
          'SidebarCashier': true,
          'Header': true
        }
      }
    })
    expect(wrapper.vm.isSidebarVisible).toBe(false)
    await wrapper.vm.toggleSidebar()
    expect(wrapper.vm.isSidebarVisible).toBe(true)
  })

  it('displays returned items correctly', async () => {
    const mockData = [
      { 
        id: 1, 
        product_id: 'PROD001', 
        reason: 'Wrong Item',
        quantity: 1,
        created_at: '2023-01-01',
        sales_id: 'SALE001'
      },
      { 
        id: 2, 
        product_id: 'PROD002', 
        reason: 'Wrong Item',
        quantity: 1,
        created_at: '2023-01-02',
        sales_id: 'SALE002'
      }
    ];

    returnItemApi.getAll.mockResolvedValue({
      data: {
        status: 'success',
        data: mockData
      }
    });

    const wrapper = mount(ReturnItem, {
      global: {
        plugins: [router],
        stubs: {
          'Sidebar': true,
          'SidebarCashier': true,
          'Header': true
        }
      }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(2);
    
    // Verify the content matches what we expect based on the actual component structure
    expect(rows[0].text()).toContain('Wrong Item');
    expect(rows[1].text()).toContain('Wrong Item');
  })
})

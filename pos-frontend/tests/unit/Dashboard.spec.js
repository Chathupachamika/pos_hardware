import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Dashboard from '@/components/Dashboard.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { vi, describe, it, beforeEach, expect } from 'vitest'

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    currentRoute: {
      value: { path: '/dashboard' }
    }
  })
}))

vi.mock('vue-chartjs', () => ({
  Doughnut: vi.fn(() => ({
    mounted: vi.fn(),
    render: () => null
  }))
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  ArcElement: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}))

// Mock child components
const mockChildComponent = {
  template: '<div></div>',
  props: ['isVisible']
}

const mockComponents = {
  Header: mockChildComponent,
  Sidebar: mockChildComponent
}

describe('Dashboard.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountOptions = {
    global: {
      components: mockComponents,
      mocks: {
        $route: { path: '/dashboard' }
      }
    }
  }

  it('renders the Dashboard component', () => {
    const wrapper = mount(Dashboard, mountOptions)
    expect(wrapper.exists()).toBe(true)
  })

  it('displays loading state initially', () => {
    const store = useDashboardStore()
    store.isLoading = true

    const wrapper = mount(Dashboard, mountOptions)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('displays dashboard data after loading', async () => {
    const store = useDashboardStore()
    store.isLoading = false
    store.dashboardStats = {
      totalSales: 1000,
      totalCustomers: 50,
      weeklyEarnings: 5000,
      salesGrowth: '+15%',
      customerGrowth: '+10%',
      totalSuppliers: 20,
      supplierGrowth: '+5%',
      totalProducts: 100,
      productGrowth: '+8%',
      totalEmployees: 15,
      employeeGrowth: '+2%',
      employeeStatus: 'Active'
    }
    store.chartData = {
      labels: ['Cash', 'Credit Card', 'Debit Card'],
      datasets: [{
        data: [30, 40, 30],
        backgroundColor: ['#22c55e', '#3b82f6', '#a855f7']
      }]
    }
    store.recentTransactions = [{
      id: 1,
      product: 'Test Product',
      date: '2023-01-01',
      method: 'CASH',
      amount: 100,
      status: 1
    }]

    const wrapper = mount(Dashboard, mountOptions)

    // Using more specific selectors to find the exact elements
    expect(wrapper.text()).toContain('Rs. 5,000')
    expect(wrapper.text()).toContain('1000')
    expect(wrapper.text()).toContain('50')
    expect(wrapper.text()).toContain('Test Product')
    expect(wrapper.text()).toContain('CASH')
  })
})

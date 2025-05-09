import { mount } from '@vue/test-utils'
import LowStock from '@/components/LowStock.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: []
})

describe('LowStock.vue', () => {
  it('renders the LowStock component', () => {
    const wrapper = mount(LowStock, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows the modal when triggered', async () => {
    const wrapper = mount(LowStock, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true
        }
      }
    })
    
    wrapper.vm.showPreviewModel = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#select-modal').exists()).toBe(true)
  })

  it('displays low stock items correctly', () => {
    const wrapper = mount(LowStock, {
      global: {
        plugins: [router],
        stubs: {
          Header: true,
          Sidebar: true
        }
      },
      setup() {
        return {
          lowStockItems: [
            { id: 201, product_name: 'glasses', quantity: 8, brand_name: 'ATW', discount: '10%' }
          ]
        }
      }
    })
    
    expect(wrapper.text()).toContain('glasses')
    expect(wrapper.text()).toContain('ATW')
    expect(wrapper.text()).toContain('10%')
  })
})

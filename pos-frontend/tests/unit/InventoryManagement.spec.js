import { shallowMount } from '@vue/test-utils'
import InventoryManagement from '@/components/InventoryManagement.vue'

// Mock connection API calls
vi.mock('@/api/axios', () => ({
  connection: {
    get: vi.fn(() => Promise.resolve({ 
      data: [
        { 
          id: 1,
          quantity: 10,
          product: {
            name: 'Item A',
            price: 100,
            seller_price: 80
          },
          location: 'Warehouse A',
          status: 'In Stock'
        },
        { 
          id: 2,
          quantity: 5,
          product: {
            name: 'Item B',
            price: 50,
            seller_price: 40
          },
          location: 'Warehouse B',
          status: 'In Stock'
        }
      ] 
    })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve())
  }
}))

// Mock Sweetalert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve())
  }
}))

describe('InventoryManagement.vue', () => {
  let wrapper;
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    wrapper = shallowMount(InventoryManagement);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders inventory items in the table', async () => {
    wrapper = shallowMount(InventoryManagement, {
      global: {
        stubs: {
          Dialog: true,
          DialogPanel: true,
          TransitionRoot: true,
          TransitionChild: true,
          DialogTitle: true,
        }
      }
    })
    
    await wrapper.vm.$nextTick()
    // Wait for the async data to be loaded
    await wrapper.vm.fetchInventory()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Item A')
    expect(wrapper.text()).toContain('Item B')
  })

  it('opens the add inventory item modal when the button is clicked', async () => {
    wrapper = shallowMount(InventoryManagement, {
      data() {
        return {
          showMultiStepModal: false
        }
      },
      global: {
        stubs: {
          Dialog: true,
          DialogPanel: true,
          TransitionRoot: true,
          TransitionChild: true,
          DialogTitle: true,
        }
      }
    })
    
    const addButton = wrapper.find('.bg-emerald-600')
    expect(addButton.exists()).toBe(true)
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.showMultiStepModal).toBe(true)
  })
})

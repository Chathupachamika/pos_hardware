import { shallowMount } from '@vue/test-utils';
import OrderManagement from '@/components/OrderManagement.vue';
import { vi } from 'vitest';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

// Mock window.matchMedia
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('OrderManagement.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => 'true'),
      setItem: vi.fn(),
      clear: vi.fn()
    };

    // Create wrapper
    wrapper = shallowMount(OrderManagement, {
      global: {
        stubs: {
          'lucide-vue-next': true,
          'Header': true,
          'Sidebar': true,
          'Sidebar-cashier': true
        }
      }
    });

    // Set the orders data directly on the component instance
    wrapper.vm.orders = [
      {
        id: 1,
        customer: { name: 'John Doe' },
        customer_id: 1,
        date: new Date().toISOString(),
        total: 100,
        items: 1,
        payment: 'CASH',
        status: 'completed',
        products: []
      },
      {
        id: 2,
        customer: { name: 'Jane Smith' },
        customer_id: 2,
        date: new Date().toISOString(),
        total: 200,
        items: 2,
        payment: 'CASH',
        status: 'completed',
        products: []
      }
    ];
  });

  it('renders order data in the table', async () => {
    // Force a re-render
    await wrapper.vm.$nextTick();
    
    // Assert the content
    const tbodyText = wrapper.find('tbody').text();
    expect(tbodyText).toContain('John Doe');
    expect(tbodyText).toContain('Jane Smith');
  });
});

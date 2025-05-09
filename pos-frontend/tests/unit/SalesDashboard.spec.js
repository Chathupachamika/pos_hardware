import { shallowMount } from '@vue/test-utils';
import SalesDashboard from '@/components/SalesDashboard.vue';
import { vi } from 'vitest';
import { connection } from '@/api/axios';

// Mock the connection module
vi.mock('@/api/axios', () => ({
  connection: {
    get: vi.fn()
  }
}));

describe('SalesDashboard.vue', () => {
  beforeEach(() => {
    // Mock API responses
    connection.get.mockImplementation((url) => {
      if (url === 'reports/sales/today') {
        return Promise.resolve({
          data: {
            total_income: '5000',
            total_sales: '100',
            total_customers: '50',
            total_suppliers: '17'
          }
        });
      }
      return Promise.resolve({
        data: {
          total_sales: []
        }
      });
    });
  });

  it('renders without crashing', () => {
    const wrapper = shallowMount(SalesDashboard);
    expect(wrapper.exists()).toBe(true);
  });

  it('displays stats correctly', async () => {
    const wrapper = shallowMount(SalesDashboard);
    await wrapper.vm.$nextTick();
    const stats = wrapper.findAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    expect(stats.length).toBe(4);
  });

  it('displays sales data correctly', async () => {
    const wrapper = shallowMount(SalesDashboard);
    await wrapper.vm.$nextTick();
    
    // Wait for API mock to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const stats = wrapper.findAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    expect(stats[0].text()).toContain('5000');
    expect(stats[1].text()).toContain('100');
  });
});

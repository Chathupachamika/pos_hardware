import { mount } from '@vue/test-utils';
import Customers from '@/components/Customers.vue';

describe('Customers.vue', () => {
  it('renders customer data in the table', async () => {
    const mockCustomers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        contact: [{ contact_number: '1234567890' }],
      },
    ];

    const wrapper = mount(Customers, {
      data() {
        return {
          customers: mockCustomers,
          isLoading: false,
        };
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('john.doe@example.com');
    expect(wrapper.text()).toContain('1234567890');
  });

  it('filters customers based on search query', async () => {
    const mockCustomers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        contact: [{ contact_number: '1234567890' }],
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        contact: [{ contact_number: '9876543210' }],
      },
    ];

    const wrapper = mount(Customers, {
      data() {
        return {
          customers: mockCustomers,
          isLoading: false,
          searchQuery: '',
        };
      },
    });

    await wrapper.vm.$nextTick();

    wrapper.setData({ searchQuery: 'John' });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).not.toContain('Jane Smith');
  });

  it('deletes a customer when the delete button is clicked', async () => {
    const mockCustomers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        contact: [{ contact_number: '1234567890' }],
      },
    ];

    const wrapper = mount(Customers, {
      data() {
        return {
          customers: mockCustomers,
          isLoading: false,
        };
      },
    });

    await wrapper.vm.$nextTick();

    wrapper.vm.openDeleteModal(mockCustomers[0]);
    await wrapper.vm.$nextTick();

    wrapper.vm.handleDeleteCustomer(mockCustomers[0]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.customers).toHaveLength(0);
  });
});
import { shallowMount } from '@vue/test-utils';
import ManageAccountDetails from '@/components/ManageAccountDetails.vue';
import Swal from 'sweetalert2';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Sweetalert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
    close: vi.fn()
  }
}));

describe('ManageAccountDetails.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const wrapper = shallowMount(ManageAccountDetails);
    expect(wrapper.exists()).toBe(true);
  });

  it('updates account details correctly', async () => {
    const wrapper = shallowMount(ManageAccountDetails, {
      data() {
        return {
          accountDetails: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          }
        }
      }
    })
    wrapper.setData({ accountDetails: { name: 'Jane Doe', email: 'jane.doe@example.com' } })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.accountDetails.name).toBe('Jane Doe')
    expect(wrapper.vm.accountDetails.email).toBe('jane.doe@example.com')
  });

  it('handles fetchData correctly', async () => {
    const wrapper = shallowMount(ManageAccountDetails);
    await wrapper.vm.fetchData();
    expect(Swal.fire).toHaveBeenCalled();
  });
});

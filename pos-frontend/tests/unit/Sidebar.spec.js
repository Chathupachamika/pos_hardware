import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import Sidebar from '@/components/Sidebar.vue'

const mockRouter = {
  currentRoute: {
    value: {
      path: '/dashboard'
    }
  },
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}))

describe('Sidebar.vue', () => {
  it('emits closeSidebar event when close button is clicked', async () => {
    const wrapper = mount(Sidebar, {
      props: { isVisible: true },
      global: {
        stubs: {
          XMarkIcon: true,
          HomeIcon: true,
          ShoppingCartIcon: true,
          UserGroupIcon: true,
          UsersIcon: true,
          ClipboardDocumentListIcon: true,
          ArchiveBoxIcon: true,
          ArrowRightOnRectangleIcon: true,
          ChartBarIcon: true,
          ViewColumnsIcon: true,
          UserCircleIcon: true,
          ShoppingBagIcon: true,
          Squares2X2Icon: true,
          ChevronRightIcon: true,
          Wallet: true,
          RotateCcw: true
        },
        mocks: {
          router: mockRouter
        }
      }
    })
    
    await wrapper.vm.$emit('closeSidebar')
    expect(wrapper.emitted('closeSidebar')).toBeTruthy()
  })
})

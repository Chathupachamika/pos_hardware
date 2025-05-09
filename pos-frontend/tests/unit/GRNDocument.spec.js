import { mount } from '@vue/test-utils'
import GRNDocument from '@/components/GRNDocument.vue'

describe('GRNDocument.vue', () => {
  it('renders the GRNDocument component', () => {
    const wrapper = mount(GRNDocument, {
      props: {
        productData: { name: 'Test Product', quantity: 10, price: 100 },
        grnNumber: 'GRN123',
        showModal: true
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(GRNDocument, {
      props: {
        productData: { name: 'Test Product', quantity: 10, price: 100 },
        grnNumber: 'GRN123',
        showModal: true
      }
    })
    const closeButton = wrapper.find('[aria-label="Close"]')
    await closeButton.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('close')
  })
})

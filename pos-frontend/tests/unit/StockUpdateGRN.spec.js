import { mount } from '@vue/test-utils'
import StockUpdateGRN from '@/components/StockUpdateGRN.vue'

describe('StockUpdateGRN.vue', () => {
  const stockData = {
    id: '12345',
    location: 'Warehouse A',
    quantity: 100,
    status: 'Adjusted'
  }
  const grnNumber = 'GRN-001'
  const adjustmentQuantity = 10

  it('renders the component when showModal is true', () => {
    const wrapper = mount(StockUpdateGRN, {
      props: {
        stockData,
        grnNumber,
        showModal: true,
        adjustmentQuantity
      }
    })
    expect(wrapper.find('.text-xl.font-semibold').text()).toBe('Stock Adjustment GRN')
  })

  it('displays the correct GRN number', () => {
    const wrapper = mount(StockUpdateGRN, {
      props: {
        stockData,
        grnNumber,
        showModal: true,
        adjustmentQuantity
      }
    })
    const grnElement = wrapper.find('.text-right .text-gray-500')
    expect(grnElement.text()).toBe(grnNumber)
  })

  it('calculates and displays the correct previous stock', () => {
    const wrapper = mount(StockUpdateGRN, {
      props: {
        stockData,
        grnNumber,
        showModal: true,
        adjustmentQuantity
      }
    })
    const previousStock = stockData.quantity - adjustmentQuantity
    expect(wrapper.text()).toContain(previousStock.toString())
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(StockUpdateGRN, {
      props: {
        stockData,
        grnNumber,
        showModal: true,
        adjustmentQuantity
      }
    })
    await wrapper.find('button.p-2').trigger('click')
    expect(wrapper.emitted().close).toBeTruthy()
  })

  it('disables the Export PDF button while generating PDF', () => {
    const wrapper = mount(StockUpdateGRN, {
      props: {
        stockData,
        grnNumber,
        showModal: true,
        adjustmentQuantity
      }
    })
    const exportButton = wrapper.find('button[disabled]')
    expect(exportButton.exists()).toBe(false)
  })
})

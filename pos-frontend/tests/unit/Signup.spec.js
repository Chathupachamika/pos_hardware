import { mount } from '@vue/test-utils'
import Signup from '@/components/Signup.vue'

describe('Signup.vue', () => {
  it('renders the signup form', () => {
    const wrapper = mount(Signup)
    expect(wrapper.find('.mb-8 h2').text()).toBe('Create your account')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('validates email input', async () => {
    const wrapper = mount(Signup)
    const emailInput = wrapper.find('input#email')
    await emailInput.setValue('invalid-email')
    expect(wrapper.find('.text-red-500').text()).toContain('Please enter a valid email address')
  })

  it('validates password input', async () => {
    const wrapper = mount(Signup)
    const passwordInput = wrapper.find('input#password')
    await passwordInput.setValue('short')
    expect(wrapper.find('.text-red-500').text()).toContain('Password must be at least 8 characters')
  })

  it('disables the submit button when form is invalid', async () => {
    const wrapper = mount(Signup)
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.element.disabled).toBe(true)
  })

  it('emits form submit event on successful signup', async () => {
    const wrapper = mount(Signup, {
      data() {
        return {
          credentials: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
            agreeToTerms: true
          },
          formIsValid: true
        }
      }
    })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted()).toHaveProperty('submit')
  })
})

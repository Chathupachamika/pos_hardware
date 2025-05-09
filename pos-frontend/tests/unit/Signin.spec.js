import { mount } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Signin from '@/components/Signin.vue'
import { connection } from '@/api/axios'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('@/api/axios', () => ({
  connection: {
    post: vi.fn()
  }
}))

describe('Signin.vue', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/place-order', name: 'place-order', component: {} }
      ]
    })

    vi.spyOn(router, 'push')

    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    
    vi.resetAllMocks()
  })

  it('renders the signin form', () => {
    const wrapper = mount(Signin)
    expect(wrapper.find('.mb-8 h2').text()).toBe('Login to your account')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('validates email input', async () => {
    const wrapper = mount(Signin)
    const emailInput = wrapper.find('input#email')
    await emailInput.setValue('invalid-email')
    await emailInput.trigger('blur')
    expect(wrapper.find('.text-red-500').text()).toContain('Please enter a valid email address')
  })

  it('validates password input', async () => {
    const wrapper = mount(Signin)
    const passwordInput = wrapper.find('input#password')
    await passwordInput.setValue('123')
    await passwordInput.trigger('blur')
    expect(wrapper.find('.text-red-500').text()).toContain('Password must be at least 6 characters')
  })

  it('disables the submit button when form is invalid', async () => {
    const wrapper = mount(Signin)
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes().disabled).toBeDefined()
  })

  it('handles successful login correctly', async () => {
    connection.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        token: 'fake-token',
        user: { id: 1, name: 'Test User' },
        'is-admin': false
      }
    })

    const wrapper = mount(Signin, {
      global: {
        plugins: [router]
      }
    })

    // Set input values
    const emailInput = wrapper.find('input#email')
    const passwordInput = wrapper.find('input#password')

    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('password123')
    
    await wrapper.find('form').trigger('submit.prevent')
    
    await vi.waitFor(() => {
      expect(connection.post).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password123'
      })
    })

    expect(global.localStorage.setItem).toHaveBeenCalledWith('token', 'fake-token')
    expect(global.localStorage.setItem).toHaveBeenCalledWith('isAdmin', 'false')
    expect(router.push).toHaveBeenCalledWith({ name: 'place-order' })
  })
})

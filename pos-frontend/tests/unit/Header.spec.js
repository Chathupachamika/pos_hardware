import { shallowMount } from '@vue/test-utils';
import Header from '@/components/Header.vue';

describe('Header.vue', () => {
  it('renders without crashing', () => {
    const wrapper = shallowMount(Header);
    expect(wrapper.exists()).toBe(true);
  });

  it('displays the correct title', () => {
    const wrapper = shallowMount(Header)
    const title = wrapper.find('h1').text()
    expect(title).toContain('Hardware Management')
  })

  it('toggles the profile popup when the profile button is clicked', async () => {
    const wrapper = shallowMount(Header, {
      data() {
        return {
          showProfilePopup: false
        }
      }
    })
    const profileButton = wrapper.find('.profile-container button')
    await profileButton.trigger('click')
    expect(wrapper.vm.showProfilePopup).toBe(true)
  })
});

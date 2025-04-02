<script setup>
import Sidebar from './components/Sidebar.vue'
import SidebarCashier from './components/Sidebar-cashier.vue'
import { ref, onMounted } from 'vue'

const showSidebar = ref(false)
const isAdmin = ref(false)

onMounted(() => {
  // Check admin status directly from localStorage string value
  isAdmin.value = localStorage.getItem('isAdmin') === 'true' 
})

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const closeSidebar = () => {
  showSidebar.value = false
}
</script>

<template>
  <div>
    <!-- Switch v-show to v-if to ensure proper component mounting -->
    <Sidebar
      v-if="isAdmin"
      :is-visible="showSidebar"
      @close-sidebar="closeSidebar"
    />
    
    <SidebarCashier
      v-if="!isAdmin"
      :is-visible="showSidebar"
      @close-sidebar="closeSidebar"
    />

    <router-view @toggle-sidebar="toggleSidebar" />
  </div>
</template>
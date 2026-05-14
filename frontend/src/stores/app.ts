import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const collapsed = ref(false)
  const darkMode = ref(false)

  function toggleSidebar() {
    collapsed.value = !collapsed.value
  }

  function toggleDark() {
    darkMode.value = !darkMode.value
  }

  return { collapsed, darkMode, toggleSidebar, toggleDark }
})
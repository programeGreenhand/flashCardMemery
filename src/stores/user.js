import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户状态存储
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '')
  
  // Actions
  function setUser(userData) {
    user.value = userData
  }
  
  function setToken(tokenValue) {
    token.value = tokenValue
    localStorage.setItem('token', tokenValue)
  }
  
  async function login(credentials) {
    try {
      // 在实际应用中，这里应调用后端API
      // 这里模拟登录成功
      const fakeResponse = {
        user: { id: 1, username: credentials.username },
        token: 'fake-jwt-token'
      }
      
      setUser(fakeResponse.user)
      setToken(fakeResponse.token)
      return true
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }
  
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }
  
  async function checkAuth() {
    if (token.value) {
      try {
        // 在实际应用中，这里应验证token有效性
        // 这里模拟验证成功
        setUser({ id: 1, username: '用户' })
        return true
      } catch (error) {
        logout()
        return false
      }
    }
    return false
  }
  
  return {
    user,
    token,
    isLoggedIn,
    username,
    login,
    logout,
    checkAuth
  }
})
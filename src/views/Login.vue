<template>
    <div class="login-container">
      <h1>用户登录</h1>
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="form.username"
            required
            placeholder="请输入用户名"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            placeholder="请输入密码"
          />
        </div>
        <button type="submit" :disabled="isLoading" class="login-button">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  
  const router = useRouter()
  const userStore = useUserStore()
  
  const form = ref({
    username: '',
    password: ''
  })
  
  const isLoading = ref(false)
  const errorMessage = ref('')
  
  const handleSubmit = async () => {
    try {
      isLoading.value = true
      errorMessage.value = ''
      
      const success = await userStore.login(form.value)
      
      if (success) {
        // 登录成功后跳转到首页或其他页面
        router.push('/')
      } else {
        errorMessage.value = '登录失败，请检查用户名和密码'
      }
    } catch (error) {
      errorMessage.value = '登录过程中发生错误'
      console.error('登录错误:', error)
    } finally {
      isLoading.value = false
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 500;
    color: #555;
  }
  
  input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input:focus {
    outline: none;
    border-color: #646cff;
  }
  
  .login-button {
    padding: 0.75rem;
    background-color: #646cff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .login-button:hover {
    background-color: #535bf2;
  }
  
  .login-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #ff4d4f;
    text-align: center;
    margin-top: 0.5rem;
  }
  </style>
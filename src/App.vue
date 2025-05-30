<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <header class="app-header">
      <div class="logo">
        <router-link to="/">超绝至臻闪卡记忆系统</router-link>
      </div>
      <nav class="main-nav">
        <router-link to="/decks">卡片集</router-link>
        <router-link to="/study">学习</router-link>
        <router-link to="/stats">统计</router-link>
        <router-link to="/achievements">成就</router-link>
        <router-link to="/settings">设置</router-link>
        
      </nav>
      <button @click="toggleDarkMode" class="theme-toggle">
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>
    </header>
    
    <main class="app-content">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>超绝至臻闪卡记忆系统 &copy; {{ new Date().getFullYear() }}</p>
      <p>广州大学 - Mr.Yu  @三块给你买麻薯</p>
      <p>仅作展示纯前端实现</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

// 用户状态
const userStore = useUserStore()
const router = useRouter()

// 暗黑模式状态
const isDarkMode = ref(false)

// 初始化时检查本地存储中的主题偏好
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDarkMode.value = savedTheme === 'dark'
  
  // 检查用户登录状态
  userStore.checkAuth()
})

// 切换暗黑模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// 监听主题变化，同步到文档根元素
watch(isDarkMode, (newValue) => {
  if (newValue) {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
})
</script>

<style>
/* 基础样式 */
:root {
  --primary-color: #4a6baf;
  --secondary-color: #6d8ce0;
  --text-color: #333;
  --bg-color: #f9f9f9;
  --card-bg: #ffffff;
  --border-color: #e0e0e0;
}

/* 暗黑模式变量 */
.dark-theme {
  --primary-color: #5d7ece;
  --secondary-color: #738fd0;
  --text-color: #e0e0e0;
  --bg-color: #1a1a1a;
  --card-bg: #2a2a2a;
  --border-color: #444;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--primary-color);
  color: white;
}

.logo a {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.main-nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: white;
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.app-footer {
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  text-align: center;
}
</style>
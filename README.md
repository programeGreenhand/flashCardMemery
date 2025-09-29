超绝至臻闪卡记忆系统 - 技术文档 📚
项目概述 🎯
超绝至臻闪卡记忆系统是一个基于Vue 3 + Pinia + Vue Router构建的现代化闪卡学习应用。该系统采用科学的间隔重复算法(SM-2)，结合游戏化激励机制，为用户提供高效、有趣的学习体验。

技术架构 🏗️
前端框架
Vue 3 - 组合式API

Pinia - 状态管理

Vue Router - 路由管理

VueUse - 工具库

核心特性 ✨
🎮 游戏化学习体验

📊 学习数据统计与分析

🎯 智能复习算法

📱 响应式设计

🌙 暗黑模式支持

💾 离线学习能力

项目结构 📁
text
src/
├── components/          # 通用组件
├── views/              # 页面组件
├── stores/             # 状态管理
├── router/             # 路由配置
├── composables/        # 组合式函数
└── utils/              # 工具函数
核心组件文档 🔧
App.vue - 应用根组件
功能特性
🌗 暗黑模式切换

🧭 全局导航

📱 响应式布局

关键代码
vue
<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <header class="app-header">
      <!-- 导航结构 -->
    </header>
    <main class="app-content">
      <router-view />
    </main>
    <footer class="app-footer">
      <!-- 页脚信息 -->
    </footer>
  </div>
</template>
状态管理
javascript
// 暗黑模式状态
const isDarkMode = ref(false)

// 主题切换功能
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}
CardEditor.vue - 卡片编辑器
功能特性
✏️ 富文本编辑支持

🏷️ 标签管理

🎚️ 难度级别设置

🖼️ 媒体库支持

编辑器工具栏
vue
<div class="editor-toolbar">
  <button @click="applyFormat('bold', 'front')" class="toolbar-btn" title="加粗">B</button>
  <button @click="applyFormat('italic', 'front')" class="toolbar-btn" title="斜体">I</button>
  <button @click="applyFormat('underline', 'front')" class="toolbar-btn" title="下划线">U</button>
  <button @click="applyFormat('code', 'front')" class="toolbar-btn" title="代码">{'}'}</button>
  <button @click="showMediaLibrary('front')" class="toolbar-btn" title="添加图片">🖼️</button>
</div>
难度级别配置
javascript
const difficultyLevels = [
  { value: 'easy', label: '简单', icon: '😊' },
  { value: 'medium', label: '中等', icon: '🤔' },
  { value: 'hard', label: '困难', icon: '😰' }
]
DeckDetail.vue - 卡片集详情
功能特性
📈 学习统计展示

🔍 卡片搜索与筛选

📊 掌握进度可视化

⚡ 快速学习入口

统计信息展示
vue
<div class="deck-stats">
  <div class="stat-item">
    <span class="stat-value">{{ stats.total }}</span>
    <span class="stat-label">总卡片</span>
  </div>
  <div class="stat-item">
    <span class="stat-value">{{ stats.due }}</span>
    <span class="stat-label">待复习</span>
  </div>
  <div class="stat-item">
    <span class="stat-value">{{ stats.mastered }}</span>
    <span class="stat-label">已掌握</span>
  </div>
</div>
Study.vue - 学习界面
功能特性
🃏 闪卡翻转动画

⭐ 6级评分系统

📈 实时进度跟踪

🎉 学习奖励机制

评分系统
javascript
const ratings = [
  { value: 0, label: '完全不记得' },
  { value: 1, label: '不记得' },
  { value: 2, label: '有点记得' },
  { value: 3, label: '记得但有困难' },
  { value: 4, label: '记得' },
  { value: 5, label: '完全记得' }
]
闪卡翻转动画
vue
<div class="flashcard" :class="{ 'flipped': currentSession.showAnswer }">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <!-- 卡片正面内容 -->
    </div>
    <div class="flashcard-back">
      <!-- 卡片背面内容 -->
    </div>
  </div>
</div>
状态管理 Store 📊
user.js - 用户状态
javascript
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  
  const isLoggedIn = computed(() => !!token.value)
  
  // 登录功能
  async function login(credentials) {
    // 实现登录逻辑
  }
  
  return { user, token, isLoggedIn, login, logout, checkAuth }
})
game.js - 游戏化状态
经验值系统
javascript
const experience = useStorage('flashcard-experience', 0)
const level = computed(() => {
  return Math.floor(1 + Math.sqrt(experience.value / 100))
})
成就系统
javascript
const achievements = useStorage('flashcard-achievements', {
  daily_streak_3: { 
    id: 'daily_streak_3', 
    name: '稳步前进', 
    description: '连续学习3天', 
    unlocked: false, 
    date: null 
  },
  // 更多成就定义...
})
study.js - 学习状态
SM-2算法集成
javascript
function answerCard(quality) {
  const cardId = currentSession.value.cards[currentSession.value.currentIndex]
  const oldProgress = cardStore.getCardProgress(cardId)
  
  // 使用SM-2算法计算下次复习时间
  const newProgress = calculateNextReview(oldProgress, quality)
  cardStore.updateCardProgress(cardId, newProgress)
}
路由配置 🧭
index.ts - 路由定义
typescript
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/decks',
    name: 'DeckList',
    component: () => import('../views/DeckList.vue'),
    meta: { requiresAuth: true }
  },
  // 更多路由配置...
]
路由守卫
typescript
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
工具函数 🔧
useToast.js - 消息提示
javascript
export function useToast() {
  function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now()
    
    toasts.value.push({
      id,
      message,
      type,
      visible: false
    })
    
    // 动画和自动关闭逻辑
  }
  
  return { showToast, closeToast, toasts }
}
样式系统 🎨
CSS变量主题系统
css
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
数据持久化 💾
本地存储策略
javascript
// 使用VueUse的useStorage进行响应式本地存储
const experience = useStorage('flashcard-experience', 0)
const achievements = useStorage('flashcard-achievements', {})
const studyStats = useStorage('flashcard-study-stats', {
  totalReviews: 0,
  correctReviews: 0,
  sessionHistory: []
})
响应式设计 📱
移动端适配
css
@media (max-width: 768px) {
  .decks-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
}
性能优化 ⚡
组件懒加载
typescript
{
  path: '/stats',
  name: 'Stats',
  component: () => import('../views/Stats.vue'), // 懒加载
  meta: { requiresAuth: true }
}
图表按需引入
javascript
import * as echarts from 'echarts/core'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册echarts组件
echarts.use([
  LineChart, PieChart, BarChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  CanvasRenderer
])
游戏化机制 🎮
经验值计算公式
javascript
// 等级计算
const level = computed(() => {
  return Math.floor(1 + Math.sqrt(experience.value / 100))
})

// 等级进度
const levelProgress = computed(() => {
  const currentLevelExp = (level.value * level.value) * 100
  const expInCurrentLevel = experience.value - currentLevelExp
  const expNeededForNextLevel = nextLevelExp.value - currentLevelExp
  
  return Math.round((expInCurrentLevel / expNeededForNextLevel) * 100)
})
连续学习系统
javascript
function updateStreak() {
  const today = new Date().toISOString().split('T')[0]
  
  if (!streak.value.lastStudyDate) {
    // 首次学习
    streak.value.current = 1
    streak.value.lastStudyDate = today
    streak.value.highest = 1
    return 1
  }
  
  // 连续学习逻辑...
}
学习算法 🧠
SM-2间隔重复算法
javascript
function calculateNextReview(progress, quality) {
  // SM-2算法实现
  // 根据回答质量计算下次复习间隔
  // 更新难度系数和重复次数
}
部署说明 🚀
构建命令
bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview
浏览器兼容性 🌐
Chrome 90+

Firefox 88+

Safari 14+

Edge 90+

许可证 📄
本项目仅作展示用途，采用纯前端实现。
# 【Demo链接】https://68108b95873063d18693b9db--phenomenal-yeot-746ae4.netlify.app/

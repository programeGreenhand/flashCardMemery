<template>
    <div class="game-dashboard">
      <div class="dashboard-header">
        <h1>学习中心</h1>
        <div class="level-info">
          <div class="level-badge">Lv.{{ level }}</div>
          <div class="user-title">{{ currentTitle }}</div>
        </div>
      </div>
      
      <div class="dashboard-cards">
        <div class="dashboard-card level-card">
          <div class="card-header">
            <h2>等级与经验</h2>
            <div class="level-display">{{ level }}</div>
          </div>
          
          <div class="level-progress">
            <div class="progress-text">
              <span>{{ experience }} XP</span>
              <span>{{ nextLevelExp }} XP</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${levelProgress}%` }"></div>
            </div>
            <div class="progress-value">{{ levelProgress }}%</div>
          </div>
          
          <div class="exp-estimator">
            <p>距离下一级还需 {{ nextLevelExp - experience }} 经验值</p>
            <div class="activity-examples">
              <div class="activity-example">
                <span>复习 {{ Math.ceil((nextLevelExp - experience) / 10) }} 张卡片</span>
                <span class="exp-value">+10 XP/次</span>
              </div>
              <div class="activity-example">
                <span>创建 {{ Math.ceil((nextLevelExp - experience) / 20) }} 个卡片集</span>
                <span class="exp-value">+20 XP/次</span>
              </div>
              <div class="activity-example">
                <span>解锁 {{ Math.ceil((nextLevelExp - experience) / 50) }} 个成就</span>
                <span class="exp-value">+50 XP/次</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-card streak-card">
          <div class="card-header">
            <h2>连续学习</h2>
            <div class="streak-flame" :class="{ 'active': streak.current > 0 }">🔥</div>
          </div>
          
          <div class="streak-display">
            <div class="current-streak">
              <div class="streak-value">{{ streak.current }}</div>
              <div class="streak-label">当前连续天数</div>
            </div>
            <div class="highest-streak">
              <div class="streak-value">{{ streak.highest }}</div>
              <div class="streak-label">最高连续天数</div>
            </div>
          </div>
          
          <div class="streak-calendar">
            <div 
              v-for="(day, index) in lastSevenDays" 
              :key="index"
              class="day-circle"
              :class="{ 'active': isStudyDay(day.date) }"
            >
              <div class="day-label">{{ day.label }}</div>
              <div class="day-number">{{ day.number }}</div>
            </div>
          </div>
          
          <p class="streak-tip">
            <span v-if="isStudiedToday">今天已学习，继续保持！</span>
            <span v-else>今天还没学习，快去复习保持连续吧！</span>
          </p>
        </div>
      </div>
      
      <div class="achievements-section">
        <h2>成就</h2>
        <div class="achievements-stats">
          <div class="achievement-stat">
            <div class="stat-value">{{ unlockedAchievements.length }}</div>
            <div class="stat-label">已解锁</div>
          </div>
          <div class="achievement-stat">
            <div class="stat-value">{{ Object.keys(achievements).length - unlockedAchievements.length }}</div>
            <div class="stat-label">待解锁</div>
          </div>
          <div class="achievement-stat">
            <div class="stat-value">{{ Math.round((unlockedAchievements.length / Object.keys(achievements).length) * 100) }}%</div>
            <div class="stat-label">完成度</div>
          </div>
        </div>
        
        <div class="recent-achievements">
          <h3>最近解锁的成就</h3>
          <div v-if="recentAchievements.length === 0" class="no-achievements">
            还没有解锁成就，继续努力学习吧！
          </div>
          <div v-else class="achievement-list">
            <div 
              v-for="achievement in recentAchievements" 
              :key="achievement.id"
              class="achievement-item"
              :class="{ 'active': activeBadge === achievement.id }"
              @click="setAsBadge(achievement.id)"
            >
              <div class="achievement-icon">🏆</div>
              <div class="achievement-info">
                <div class="achievement-name">{{ achievement.name }}</div>
                <div class="achievement-desc">{{ achievement.description }}</div>
                <div class="achievement-date">
                  {{ formatDate(achievement.date) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button class="view-all-btn" @click="viewAllAchievements">查看所有成就</button>
      </div>
      
      <div class="activity-section">
        <h2>活动记录</h2>
        <div class="activity-list">
          <div 
            v-for="(activity, index) in recentActivities" 
            :key="index"
            class="activity-item"
            :class="activity.type"
          >
            <div class="activity-icon">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="activity-info">
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
            </div>
            <div v-if="activity.value" class="activity-value">
              {{ activity.type === 'points' ? '+' + activity.value + ' XP' : activity.value }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 所有成就模态框 -->
      <div v-if="showAllAchievements" class="modal-overlay" @click="showAllAchievements = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>所有成就</h2>
            <button class="close-btn" @click="showAllAchievements = false">×</button>
          </div>
          
          <div class="modal-body">
            <div class="achievements-grid">
              <div 
                v-for="achievement in allAchievements" 
                :key="achievement.id"
                class="achievement-grid-item"
                :class="{ 
                  'unlocked': achievement.unlocked,
                  'active': activeBadge === achievement.id
                }"
                @click="achievement.unlocked && setAsBadge(achievement.id)"
              >
                <div class="achievement-icon">
                  {{ achievement.unlocked ? '🏆' : '🔒' }}
                </div>
                <div class="achievement-info">
                  <div class="achievement-name">
                    {{ achievement.unlocked ? achievement.name : '???' }}
                  </div>
                  <div class="achievement-desc">
                    {{ achievement.unlocked ? achievement.description : '继续学习解锁此成就' }}
                  </div>
                  <div v-if="achievement.unlocked" class="achievement-date">
                    {{ formatDate(achievement.date) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useGameStore } from '../stores/game'
  import { useToast } from '../composables/useToast'
  
  const router = useRouter()
  const gameStore = useGameStore()
  const { showToast } = useToast()
  
  // 模态框状态
  const showAllAchievements = ref(false)
  
  // 获取游戏状态
  const experience = computed(() => gameStore.experience)
  const level = computed(() => gameStore.level)
  const nextLevelExp = computed(() => gameStore.nextLevelExp)
  const levelProgress = computed(() => gameStore.levelProgress)
  const currentTitle = computed(() => gameStore.currentTitle)
  const streak = computed(() => gameStore.streak)
  const achievements = computed(() => gameStore.achievements)
  const unlockedAchievements = computed(() => gameStore.unlockedAchievements)
  const activeBadge = computed(() => gameStore.activeBadge)
  const activityHistory = computed(() => gameStore.activityHistory)
  
  // 最近解锁的成就 (最多5个)
  const recentAchievements = computed(() => {
    return unlockedAchievements.value
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  })
  
  // 所有成就列表
  const allAchievements = computed(() => {
    return Object.values(achievements.value)
  })
  
  // 最近活动 (最多10条)
  const recentActivities = computed(() => {
    return activityHistory.value.slice(0, 10)
  })
  
  // 最近7天
  const lastSevenDays = computed(() => {
    const days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      
      const dayNames = ['日', '一', '二', '三', '四', '五', '六']
      
      days.push({
        date: date.toISOString().split('T')[0],
        label: '周' + dayNames[date.getDay()],
        number: date.getDate()
      })
    }
    
    return days
  })
  
  // 是否已经学习过今天
  const isStudiedToday = computed(() => {
    if (!streak.value.lastStudyDate) return false
    
    const today = new Date().toISOString().split('T')[0]
    return streak.value.lastStudyDate === today
  })
  
  // 检查某天是否学习过
  function isStudyDay(dateStr) {
    if (!streak.value.lastStudyDate) return false
    
    // 获取最近7天的学习记录
    const studyDates = activityHistory.value
      .filter(a => a.type === 'points')
      .map(a => new Date(a.timestamp).toISOString().split('T')[0])
    
    // 去重
    const uniqueDates = [...new Set(studyDates)]
    
    return uniqueDates.includes(dateStr)
  }
  
  // 格式化日期
  function formatDate(dateStr) {
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }
  
  // 格式化时间
  function formatTime(dateStr) {
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    
    // 小于1分钟
    if (diffMs < 60000) {
      return '刚刚'
    }
    
    // 小于1小时
    if (diffMs < 3600000) {
      return `${Math.floor(diffMs / 60000)}分钟前`
    }
    
    // 小于24小时
    if (diffMs < 86400000) {
      return `${Math.floor(diffMs / 3600000)}小时前`
    }
    
    // 小于7天
    if (diffMs < 604800000) {
      return `${Math.floor(diffMs / 86400000)}天前`
    }
    
    // 常规格式
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }
  
  // 获取活动图标
  function getActivityIcon(type) {
    switch (type) {
      case 'points': return '⭐'
      case 'streak': return '🔥'
      case 'streak_broken': return '💔'
      case 'achievement': return '🏆'
      case 'level_up': return '🎖️'
      case 'new_title': return '👑'
      default: return '📝'
    }
  }
  
  // 设置活跃徽章
  function setAsBadge(achievementId) {
    if (gameStore.setActiveBadge(achievementId)) {
      showToast('已设置为活跃徽章', 'success')
    }
  }
  
  // 查看所有成就
  function viewAllAchievements() {
    showAllAchievements.value = true
  }
  
  // 初始化
  onMounted(() => {
    // 检查时间相关成就
    gameStore.checkTimeBasedAchievements()
    
    // 首次登录成就
    gameStore.unlockAchievement('first_login', '学习之旅', '首次登录应用')
  })
  </script>
  
  <style scoped>
  .game-dashboard {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .level-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .level-badge {
    background-color: var(--primary-color);
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  .user-title {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--primary-color);
  }
  
  .dashboard-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .dashboard-card {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .card-header h2 {
    margin: 0;
    font-size: 1.3rem;
    color: var(--primary-color);
  }
  
  .level-display, .streak-flame {
    font-size: 1.5rem;
    font-weight: bold;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .level-display {
    background-color: var(--primary-color);
    color: white;
  }
  
  .streak-flame {
    opacity: 0.5;
    transition: all 0.3s;
  }
  
  .streak-flame.active {
    opacity: 1;
    transform: scale(1.2);
  }
  
  .level-progress {
    margin-bottom: 1.5rem;
  }
  
  .progress-text {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .progress-bar {
    height: 10px;
    background-color: #eee;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 5px;
    transition: width 0.5s;
  }
  
  .progress-value {
    text-align: center;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .exp-estimator {
    background-color: rgba(0, 0, 0, 0.03);
    padding: 1rem;
    border-radius: 8px;
  }
  
  .exp-estimator p {
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
    font-weight: 500;
  }
  
  .activity-examples {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .activity-example {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }
  
  .exp-value {
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .streak-display {
    display: flex;
    justify-content: space-around;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .streak-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .streak-label {
    font-size: 0.9rem;
    color: #666;
  }
  
  .streak-calendar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  
  .day-circle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  
  .day-label {
    font-size: 0.8rem;
    color: #666;
  }
  
  .day-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .day-circle.active .day-number {
    background-color: var(--primary-color);
    color: white;
  }
  
  .streak-tip {
    text-align: center;
    font-size: 0.9rem;
    margin-bottom: 0;
  }
  
  .achievements-section, .activity-section {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 2rem;
  }
  
  .achievements-section h2, .activity-section h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
  }
  
  .achievements-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #666;
  }
  
  .recent-achievements h3 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  .no-achievements {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .achievement-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-bottom: 1.5rem;
  }
  
  .achievement-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.03);
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
  }
  
  .achievement-item:hover {
    transform: translateY(-2px);
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .achievement-item.active {
    border-left: 4px solid var(--primary-color);
  }
  
  .achievement-icon {
    font-size: 1.8rem;
  }
  
  .achievement-name {
    font-weight: 500;
    margin-bottom: 0.2rem;
  }
  
  .achievement-desc {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.2rem;
  }
  
  .achievement-date {
    font-size: 0.8rem;
    color: #999;
  }
  
  .view-all-btn {
    display: block;
    width: 100%;
    padding: 0.8rem;
    background-color: rgba(0, 0, 0, 0.03);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .view-all-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  .activity-icon {
    font-size: 1.5rem;
  }
  
  .activity-info {
    flex: 1;
  }
  
  .activity-description {
    margin-bottom: 0.2rem;
  }
  
  .activity-time {
    font-size: 0.8rem;
    color: #999;
  }
  
  .activity-value {
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .activity-item.points .activity-icon {
    color: #ffc107;
  }
  
  .activity-item.streak .activity-icon {
    color: #ff5722;
  }
  
  .activity-item.achievement .activity-icon {
    color: #9c27b0;
  }
  
  .activity-item.level_up .activity-icon {
    color: #4caf50;
  }
  
  /* 模态框样式 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-container {
    background-color: var(--card-bg);
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    background-color: var(--card-bg);
    z-index: 10;
  }
  
  .modal-header h2 {
    margin: 0;
    color: var(--primary-color);
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #888;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .achievement-grid-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.03);
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
    opacity: 0.7;
  }
  
  .achievement-grid-item.unlocked {
    opacity: 1;
  }
  
  .achievement-grid-item.unlocked:hover {
    transform: translateY(-2px);
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .achievement-grid-item.active {
    border-left: 4px solid var(--primary-color);
  }
  
  @media (max-width: 768px) {
    .dashboard-cards {
      grid-template-columns: 1fr;
    }
    
    .dashboard-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .level-info {
      width: 100%;
      justify-content: flex-start;
    }
    
    .achievements-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>
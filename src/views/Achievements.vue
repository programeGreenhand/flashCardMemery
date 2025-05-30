<template>
  <div class="achievements-page">
    <div class="page-header">
      <h1>成就中心</h1>
      <div class="achievements-summary">
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
    </div>

    <div class="filter-section">
      <div class="filter-options">
        <button 
          @click="currentFilter = 'all'" 
          :class="{ active: currentFilter === 'all' }"
        >
          全部
        </button>
        <button 
          @click="currentFilter = 'unlocked'" 
          :class="{ active: currentFilter === 'unlocked' }"
        >
          已解锁
        </button>
        <button 
          @click="currentFilter = 'locked'" 
          :class="{ active: currentFilter === 'locked' }"
        >
          未解锁
        </button>
      </div>
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索成就..." 
          @input="debounceSearch"
        />
      </div>
    </div>

    <div class="achievements-grid">
      <div 
        v-for="achievement in filteredAchievements" 
        :key="achievement.id"
        class="achievement-item"
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
            解锁于: {{ formatDate(achievement.date) }}
          </div>
        </div>
        <div v-if="achievement.unlocked && activeBadge === achievement.id" class="badge-indicator">
          当前徽章
        </div>
      </div>
    </div>

    <div v-if="filteredAchievements.length === 0" class="no-achievements">
      没有找到符合条件的成就
    </div>

    <div class="achievement-categories">
      <h2>成就类别</h2>
      <div class="category-list">
        <div class="category-item">
          <h3>学习类</h3>
          <p>与日常学习和复习相关的成就</p>
          <div class="category-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${getLearningProgress()}%` }"></div>
            </div>
            <div class="progress-text">{{ getLearningProgress() }}%</div>
          </div>
        </div>
        <div class="category-item">
          <h3>卡片类</h3>
          <p>与创建和管理卡片相关的成就</p>
          <div class="category-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${getCardProgress()}%` }"></div>
            </div>
            <div class="progress-text">{{ getCardProgress() }}%</div>
          </div>
        </div>
        <div class="category-item">
          <h3>特殊类</h3>
          <p>其他特殊条件相关的成就</p>
          <div class="category-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${getSpecialProgress()}%` }"></div>
            </div>
            <div class="progress-text">{{ getSpecialProgress() }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { useToast } from '../composables/useToast'

const gameStore = useGameStore()
const { showToast } = useToast()

// 过滤和搜索状态
const currentFilter = ref('all')
const searchQuery = ref('')
const searchTimeout = ref(null)

// 从游戏状态获取成就数据
const achievements = computed(() => gameStore.achievements)
const unlockedAchievements = computed(() => gameStore.unlockedAchievements)
const activeBadge = computed(() => gameStore.activeBadge)

// 过滤成就
const filteredAchievements = computed(() => {
  // 转换为数组以便于过滤
  let result = Object.values(achievements.value || {})
  
  // 应用过滤器
  if (currentFilter.value === 'unlocked') {
    result = result.filter(a => a.unlocked)
  } else if (currentFilter.value === 'locked') {
    result = result.filter(a => !a.unlocked)
  }
  
  // 应用搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a => {
      // 对于已解锁的成就，搜索名称和描述
      if (a.unlocked) {
        return a.name.toLowerCase().includes(query) || 
               a.description.toLowerCase().includes(query)
      }
      // 对于未解锁的成就，只能搜索"???"
      return false
    })
  }
  
  return result
})

// 获取学习类成就进度
function getLearningProgress() {
  if (!achievements.value) return 0
  
  const learningAchievements = [
    'daily_streak_3', 'daily_streak_7', 'daily_streak_30',
    'first_review', 'review_10', 'review_100', 'review_1000'
  ]
  
  const total = learningAchievements.length
  const unlocked = learningAchievements.filter(id => 
    achievements.value[id] && achievements.value[id].unlocked
  ).length
  
  return total > 0 ? Math.round((unlocked / total) * 100) : 0
}

// 获取卡片类成就进度
function getCardProgress() {
  if (!achievements.value) return 0
  
  const cardAchievements = [
    'first_card', 'ten_cards', 'fifty_cards',
    'first_deck', 'master_deck'
  ]
  
  const total = cardAchievements.length
  const unlocked = cardAchievements.filter(id => 
    achievements.value[id] && achievements.value[id].unlocked
  ).length
  
  return total > 0 ? Math.round((unlocked / total) * 100) : 0
}

// 获取特殊类成就进度
function getSpecialProgress() {
  if (!achievements.value) return 0
  
  const specialAchievements = [
    'first_login', 'night_owl', 'early_bird'
  ]
  
  const total = specialAchievements.length
  const unlocked = specialAchievements.filter(id => 
    achievements.value[id] && achievements.value[id].unlocked
  ).length
  
  return total > 0 ? Math.round((unlocked / total) * 100) : 0
}

// 设置为活跃徽章
function setAsBadge(achievementId) {
  if (gameStore.setActiveBadge(achievementId)) {
    showToast('已设置为活跃徽章', 'success')
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 防抖搜索
function debounceSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    // 搜索逻辑已通过计算属性处理
    searchTimeout.value = null
  }, 300)
}

// 初始化
onMounted(() => {
  // 检查时间相关成就
  gameStore.checkTimeBasedAchievements()
})
</script>

<style scoped>
.achievements-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  color: var(--primary-color);
}

.achievements-summary {
  display: flex;
  gap: 1.5rem;
}

.achievement-stat {
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

.filter-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-options {
  display: flex;
  gap: 0.5rem;
}

.filter-options button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background-color: transparent;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-options button.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.search-box input {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 200px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
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
  opacity: 0.7;
  position: relative;
}

.achievement-item.unlocked {
  opacity: 1;
}

.achievement-item.unlocked:hover {
  transform: translateY(-2px);
  background-color: rgba(0, 0, 0, 0.05);
}

.achievement-item.active {
  border-left: 4px solid var(--primary-color);
}

.achievement-icon {
  font-size: 1.8rem;
}

.achievement-info {
  flex: 1;
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

.badge-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: var(--primary-color);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.no-achievements {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.achievement-categories {
  margin-top: 3rem;
}

.achievement-categories h2 {
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.category-item {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.category-item h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.category-item p {
  margin-bottom: 1rem;
  color: #666;
}

.category-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
}

.progress-text {
  font-weight: bold;
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .achievements-summary {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
  
  .category-list {
    grid-template-columns: 1fr;
  }
}
</style>
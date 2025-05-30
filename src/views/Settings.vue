<template>
  <div class="settings-container">
    <h1>设置</h1>
    
    <div class="settings-card">
      <div class="settings-section">
        <h2>个人设置</h2>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">用户名</div>
            <div class="setting-description">显示在应用中的用户名</div>
          </div>
          <div class="setting-control">
            <input type="text" v-model="userSettings.username" />
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">邮箱</div>
            <div class="setting-description">用于接收通知和找回密码</div>
          </div>
          <div class="setting-control">
            <input type="email" v-model="userSettings.email" />
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>学习设置</h2>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">每日学习目标</div>
            <div class="setting-description">设置每天要学习的卡片数量</div>
          </div>
          <div class="setting-control">
            <input 
              type="number" 
              v-model.number="userSettings.dailyGoal" 
              min="1" 
              max="500"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">新卡片限制</div>
            <div class="setting-description">每天学习的新卡片上限</div>
          </div>
          <div class="setting-control">
            <input 
              type="number" 
              v-model.number="userSettings.newCardsPerDay" 
              min="0" 
              max="200"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">学习提醒</div>
            <div class="setting-description">每天提醒学习的时间</div>
          </div>
          <div class="setting-control">
            <input type="time" v-model="userSettings.reminderTime" />
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>外观设置</h2>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">暗黑模式</div>
            <div class="setting-description">切换浅色/深色主题</div>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="userSettings.darkMode" @change="toggleDarkMode">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">字体大小</div>
            <div class="setting-description">调整应用中文字的大小</div>
          </div>
          <div class="setting-control">
            <div class="range-with-value">
              <input 
                type="range" 
                v-model.number="userSettings.fontSize" 
                min="12" 
                max="24" 
                step="1"
                @change="updateFontSize"
              />
              <span class="range-value">{{ userSettings.fontSize }}px</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>数据管理</h2>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">导出数据</div>
            <div class="setting-description">将所有卡片集和卡片导出为JSON文件</div>
          </div>
          <div class="setting-control">
            <button class="action-btn export-btn" @click="exportData">导出</button>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">导入数据</div>
            <div class="setting-description">从JSON文件导入卡片集和卡片</div>
          </div>
          <div class="setting-control">
            <input 
              type="file" 
              ref="importFileInput" 
              style="display: none;" 
              accept=".json"
              @change="handleFileImport"
            >
            <button class="action-btn import-btn" @click="triggerFileInput">导入</button>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <div class="label-text">重置学习进度</div>
            <div class="setting-description">清除所有卡片的学习记录和统计数据</div>
          </div>
          <div class="setting-control">
            <button class="action-btn danger-btn" @click="confirmResetProgress">重置</button>
          </div>
        </div>
      </div>
      
      <div class="settings-actions">
        <button class="cancel-btn" @click="resetSettings">取消</button>
        <button class="save-btn" @click="saveSettings">保存设置</button>
      </div>
    </div>
    
    <!-- 确认对话框 -->
    <div class="modal" v-if="showConfirmDialog" @click.self="cancelConfirmDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ confirmDialogTitle }}</h2>
          <button class="close-btn" @click="cancelConfirmDialog">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmDialogMessage }}</p>
          <div class="form-actions">
            <button class="cancel-btn" @click="cancelConfirmDialog">取消</button>
            <button 
              class="confirm-btn" 
              :class="{ 'danger-btn': confirmDialogType === 'danger' }"
              @click="confirmDialogAction"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { useStudyStore } from '../stores/study'
import { useCardStore } from '../stores/card'
import { useDeckStore } from '../stores/deck'
import { useUserStore } from '../stores/user'

const router = useRouter()
const studyStore = useStudyStore()
const cardStore = useCardStore()
const deckStore = useDeckStore()
const userStore = useUserStore()

// 导入文件引用
const importFileInput = ref(null)

// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogAction = ref(() => {})
const confirmDialogType = ref('default')

// 用户设置
const userSettings = reactive({
  username: userStore.username || '用户',
  email: '',
  dailyGoal: studyStore.dailyGoal,
  newCardsPerDay: 20,
  reminderTime: '08:00',
  darkMode: localStorage.getItem('theme') === 'dark',
  fontSize: parseInt(localStorage.getItem('fontSize') || '16')
})

// 原始设置（用于取消操作）
const originalSettings = ref({})

// 生命周期钩子
onMounted(() => {
  // 保存原始设置
  originalSettings.value = { ...userSettings }
  
  // 加载已保存的设置
  const savedSettings = localStorage.getItem('userSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    Object.assign(userSettings, settings)
  }
})

// 方法
function toggleDarkMode() {
  const isDark = userSettings.darkMode
  document.documentElement.classList.toggle('dark-theme', isDark)
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

function updateFontSize() {
  document.documentElement.style.fontSize = `${userSettings.fontSize}px`
  localStorage.setItem('fontSize', userSettings.fontSize.toString())
}

function saveSettings() {
  // 保存学习目标
  studyStore.setDailyGoal(userSettings.dailyGoal)
  
  // 保存用户设置到本地存储
  localStorage.setItem('userSettings', JSON.stringify(userSettings))
  
  // 更新用户状态
  userStore.setUser({
    ...userStore.user,
    username: userSettings.username
  })
  
  // 显示成功对话框
  showConfirmDialog.value = true
  confirmDialogTitle.value = '设置已保存'
  confirmDialogMessage.value = '您的设置已成功保存'
  confirmDialogAction.value = cancelConfirmDialog
  confirmDialogType.value = 'default'
  
  // 保存当前设置为原始设置
  originalSettings.value = { ...userSettings }
}

function resetSettings() {
  // 恢复为原始设置
  Object.assign(userSettings, originalSettings.value)
  
  // 如果暗黑模式设置发生改变，需要重新同步
  if (userSettings.darkMode !== (localStorage.getItem('theme') === 'dark')) {
    toggleDarkMode()
  }
  
  // 如果字体大小设置发生改变，需要重新同步
  const currentFontSize = parseInt(localStorage.getItem('fontSize') || '16')
  if (userSettings.fontSize !== currentFontSize) {
    updateFontSize()
  }
}

function exportData() {
  // 准备导出数据
  const exportData = {
    decks: deckStore.allDecks,
    cards: cardStore.allCards,
    cardsProgress: cardStore.cardsProgress,
    studyStats: studyStore.studyStats,
    settings: userSettings,
    exportDate: new Date().toISOString()
  }
  
  // 创建Blob并下载
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flashcards-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  // 显示成功对话框
  showConfirmDialog.value = true
  confirmDialogTitle.value = '导出成功'
  confirmDialogMessage.value = '您的数据已成功导出'
  confirmDialogAction.value = cancelConfirmDialog
  confirmDialogType.value = 'default'
}

function triggerFileInput() {
  importFileInput.value.click()
}

function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importData = JSON.parse(e.target.result)
      
      // 验证导入数据格式
      if (!importData.decks || !importData.cards) {
        throw new Error('无效的导入文件格式')
      }
      
      // 显示确认对话框
      showConfirmDialog.value = true
      confirmDialogTitle.value = '确认导入'
      confirmDialogMessage.value = `导入将添加 ${importData.decks.length} 个卡片集和 ${importData.cards.length} 张卡片。继续吗？`
      confirmDialogAction.value = () => confirmImport(importData)
      confirmDialogType.value = 'default'
      
    } catch (error) {
      alert('导入失败: ' + error.message)
    }
    
    // 重置文件输入，允许再次选择同一文件
    importFileInput.value.value = ''
  }
  
  reader.readAsText(file)
}

function confirmImport(importData) {
  try {
    // 导入卡片集
    importData.decks.forEach(deck => {
      // 检查卡片集是否已存在
      const existingDeck = deckStore.getDeckById(deck.id)
      if (existingDeck) {
        // 更新现有卡片集
        deckStore.updateDeck(deck.id, deck)
      } else {
        // 添加新卡片集
        deckStore.addDeck(deck)
      }
    })
    
    // 导入卡片
    importData.cards.forEach(card => {
      // 检查卡片是否已存在
      const existingCard = cardStore.getCardById(card.id)
      if (existingCard) {
        // 更新现有卡片
        cardStore.updateCard(card.id, card)
      } else {
        // 添加新卡片
        cardStore.addCard(card)
      }
    })
    
    // 导入学习进度
    if (importData.cardsProgress) {
      Object.keys(importData.cardsProgress).forEach(cardId => {
        cardStore.updateCardProgress(cardId, importData.cardsProgress[cardId])
      })
    }
    
    // 关闭对话框
    cancelConfirmDialog()
    
    // 显示成功消息
    showConfirmDialog.value = true
    confirmDialogTitle.value = '导入成功'
    confirmDialogMessage.value = '数据已成功导入'
    confirmDialogAction.value = () => {
      cancelConfirmDialog()
      router.go(0) // 刷新页面以显示导入的数据
    }
    confirmDialogType.value = 'default'
    
  } catch (error) {
    alert('导入数据时出错: ' + error.message)
    cancelConfirmDialog()
  }
}

function confirmResetProgress() {
  showConfirmDialog.value = true
  confirmDialogTitle.value = '确认重置学习进度'
  confirmDialogMessage.value = '此操作将清除所有卡片的学习进度和统计数据。此操作不可撤销！'
  confirmDialogAction.value = resetAllProgress
  confirmDialogType.value = 'danger'
}

function resetAllProgress() {
  // 重置所有卡片的学习进度
  const allCards = cardStore.allCards
  allCards.forEach(card => {
    cardStore.resetCardProgress(card.id)
  })
  
  // 重置学习统计
  localStorage.setItem('flashcard-study-stats', JSON.stringify({
    totalReviews: 0,
    correctReviews: 0,
    sessionHistory: []
  }))
  
  // 重载页面以刷新数据
  cancelConfirmDialog()
  router.go(0)
}

function cancelConfirmDialog() {
  showConfirmDialog.value = false
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

.settings-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.settings-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.settings-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  flex: 1;
}

.label-text {
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.setting-description {
  font-size: 0.9rem;
  color: #666;
}

.setting-control {
  margin-left: 2rem;
  display: flex;
  align-items: center;
}

.setting-control input[type="text"],
.setting-control input[type="email"],
.setting-control input[type="number"],
.setting-control input[type="time"] {
  padding: 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--bg-color);
  color: var(--text-color);
  width: 150px;
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height:50px;
}

</style>
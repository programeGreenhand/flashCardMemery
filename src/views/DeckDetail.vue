<template>
  <div class="deck-detail-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!deck" class="not-found">
      <h2>未找到卡片集</h2>
      <p>您请求的卡片集不存在或已被删除</p>
      <router-link to="/decks" class="back-link">返回卡片集列表</router-link>
    </div>
    
    <template v-else>
      <div class="deck-header">
        <div class="back-nav">
          <router-link to="/decks" class="back-link">
            &larr; 返回卡片集列表
          </router-link>
        </div>
        
        <div class="deck-title-section">
          <h1>{{ deck.title }}</h1>
          <div class="deck-actions">
            <button class="edit-btn" @click="editDeck">编辑卡片集</button>
            <router-link :to="`/study/${deckId}`" class="study-btn">
              开始学习
            </router-link>
          </div>
        </div>
        
        <p class="deck-description">{{ deck.description }}</p>
        
        <div class="deck-meta">
          <div class="deck-tags">
            <span v-for="tag in deck.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          
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
        </div>
      </div>
      
      <div class="cards-section">
        <div class="section-header">
          <h2>卡片 ({{ deckCards.length }})</h2>
          <button class="add-card-btn" @click="createNewCard">
            <span class="icon">+</span> 添加卡片
          </button>
        </div>
        
        <div class="card-actions">
          <div class="search-bar">
            <input 
              type="text" 
              v-model="searchTerm" 
              placeholder="搜索卡片..." 
              @input="filterCards"
            />
          </div>
          
          <div class="sort-options">
            <label for="sortBy">排序方式:</label>
            <select id="sortBy" v-model="sortBy" @change="sortCards">
              <option value="created">创建时间</option>
              <option value="updated">更新时间</option>
              <option value="dueDate">到期时间</option>
            </select>
            <button 
              class="sort-direction-btn" 
              @click="toggleSortDirection"
              :title="sortDirection === 'asc' ? '升序' : '降序'"
            >
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>
        
        <div v-if="filteredCards.length === 0" class="no-cards">
          <div class="empty-state">
            <div class="empty-icon">🃏</div>
            <h3>暂无卡片</h3>
            <p v-if="searchTerm">没有符合搜索条件的卡片</p>
            <p v-else>点击"添加卡片"按钮开始创建</p>
            <button class="add-card-btn" @click="createNewCard">添加卡片</button>
          </div>
        </div>
        
        <div v-else class="cards-list">
          <div 
            v-for="(card, index) in filteredCards" 
            :key="card.id"
            class="card-item"
            :class="{ 'expanded': expandedCardIndex === index }"
          >
            <div class="card-header" @click="toggleCardExpand(index)">
              <div class="card-front-preview">{{ truncateText(card.front, 80) }}</div>
              <div class="card-expand-icon">{{ expandedCardIndex === index ? '▼' : '▶' }}</div>
            </div>
            
            <div v-show="expandedCardIndex === index" class="card-details">
              <div class="card-content">
                <div class="card-front">
                  <h4>问题</h4>
                  <div v-html="card.front"></div>
                </div>
                <div class="card-back">
                  <h4>答案</h4>
                  <div v-html="card.back"></div>
                </div>
              </div>
              
              <div class="card-meta">
                <div class="card-tags">
                  <span v-for="tag in card.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
                
                <div class="card-progress" v-if="getCardProgress(card.id).lastReviewed">
                  <div class="progress-info">
                    <div>上次复习: {{ formatDate(getCardProgress(card.id).lastReviewed) }}</div>
                    <div>下次复习: {{ formatDate(getCardProgress(card.id).dueDate) }}</div>
                    <div>复习次数: {{ getCardProgress(card.id).repetitions }}</div>
                  </div>
                  <div class="progress-indicator">
                    <div 
                      class="progress-bar" 
                      :style="{ width: calculateProgressWidth(card.id) + '%' }"
                      :class="getProgressClass(card.id)"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="card-actions-bar">
                <button class="edit-card-btn" @click="editCard(card)">编辑卡片</button>
                <button class="delete-card-btn" @click="confirmDeleteCard(card)">删除卡片</button>
                <button 
                  v-if="getCardProgress(card.id).lastReviewed"
                  class="reset-card-btn" 
                  @click="resetCardProgress(card.id)"
                >
                  重置进度
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 删除确认对话框 -->
      <div class="modal" v-if="showDeleteCardConfirm" @click.self="cancelDeleteCard">
        <div class="modal-content delete-confirm">
          <div class="modal-header">
            <h2>确认删除</h2>
            <button class="close-btn" @click="cancelDeleteCard">&times;</button>
          </div>
          
          <div class="modal-body">
            <p>确定要删除这张卡片吗？</p>
            <p class="warning">此操作不可撤销！</p>
            
            <div class="form-actions">
              <button class="cancel-btn" @click="cancelDeleteCard">取消</button>
              <button class="delete-btn" @click="deleteCard">确认删除</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 编辑卡片集对话框 -->
      <div class="modal" v-if="showDeckModal" @click.self="closeDeckModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>编辑卡片集</h2>
            <button class="close-btn" @click="closeDeckModal">&times;</button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="saveDeck">
              <div class="form-group">
                <label for="deckTitle">标题</label>
                <input 
                  type="text" 
                  id="deckTitle" 
                  v-model="deckForm.title" 
                  required
                  placeholder="输入卡片集标题"
                />
              </div>
              
              <div class="form-group">
                <label for="deckDescription">描述</label>
                <textarea 
                  id="deckDescription" 
                  v-model="deckForm.description" 
                  rows="3"
                  placeholder="简要描述这个卡片集的内容"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="deckTags">标签 (用逗号分隔)</label>
                <input 
                  type="text" 
                  id="deckTags" 
                  v-model="deckTagsInput" 
                  placeholder="例如: 语言,编程,历史"
                />
              </div>
              
              <div class="form-actions">
                <button type="button" class="cancel-btn" @click="closeDeckModal">取消</button>
                <button type="submit" class="save-btn">保存</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeckStore } from '../stores/deck'
import { useCardStore } from '../stores/card'
import { useStudyStore } from '../stores/study'

const route = useRoute()
const router = useRouter()
const deckStore = useDeckStore()
const cardStore = useCardStore()
const studyStore = useStudyStore()

// 状态
const isLoading = ref(true)
const deckId = ref(route.params.id)
const expandedCardIndex = ref(-1)
const searchTerm = ref('')
const sortBy = ref('created')
const sortDirection = ref('desc')
const filteredCards = ref([])

// 模态框状态
const showDeleteCardConfirm = ref(false)
const showDeckModal = ref(false)
const cardToDelete = ref(null)

// 表单状态
const deckForm = ref({
  title: '',
  description: '',
  tags: []
})
const deckTagsInput = ref('')

// 计算属性
const deck = computed(() => {
  return deckStore.getDeckById(deckId.value)
})

const deckCards = computed(() => {
  return cardStore.getCardsByDeck(deckId.value)
})

const stats = computed(() => {
  const now = new Date()
  let dueCount = 0
  let masteredCount = 0
  
  deckCards.value.forEach(card => {
    const progress = cardStore.getCardProgress(card.id)
    
    // 计算到期卡片
    if (progress.dueDate) {
      const dueDate = new Date(progress.dueDate)
      if (dueDate <= now) {
        dueCount++
      }
    } else {
      // 没有学习记录的卡片也算作待复习
      dueCount++
    }
    
    // 计算已掌握卡片 (复习3次以上且难度系数高)
    if (progress.repetitions >= 3 && progress.easeFactor > 2.0) {
      masteredCount++
    }
  })
  
  return {
    total: deckCards.value.length,
    due: dueCount,
    mastered: masteredCount
  }
})

// 生命周期钩子
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
    if (deck.value) {
      filterCards()
    }
  }, 300)
})

// 方法
function toggleCardExpand(index) {
  if (expandedCardIndex.value === index) {
    expandedCardIndex.value = -1
  } else {
    expandedCardIndex.value = index
  }
}

function filterCards() {
  if (!deckCards.value) return
  
  let results = [...deckCards.value]
  
  // 搜索过滤
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    results = results.filter(card => 
      card.front.toLowerCase().includes(term) || 
      card.back.toLowerCase().includes(term) ||
      card.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }
  
  // 排序
  sortCardsArray(results)
  
  filteredCards.value = results
}

function sortCards() {
  sortCardsArray(filteredCards.value)
}

function sortCardsArray(cards) {
  cards.sort((a, b) => {
    let valueA, valueB
    
    if (sortBy.value === 'created') {
      valueA = new Date(a.createdAt).getTime()
      valueB = new Date(b.createdAt).getTime()
    } else if (sortBy.value === 'updated') {
      valueA = new Date(a.updatedAt).getTime()
      valueB = new Date(b.updatedAt).getTime()
    } else if (sortBy.value === 'dueDate') {
      const progressA = cardStore.getCardProgress(a.id)
      const progressB = cardStore.getCardProgress(b.id)
      
      valueA = progressA.dueDate ? new Date(progressA.dueDate).getTime() : 0
      valueB = progressB.dueDate ? new Date(progressB.dueDate).getTime() : 0
    }
    
    return sortDirection.value === 'asc' ? valueA - valueB : valueB - valueA
  })
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  sortCards()
}

function createNewCard() {
  // 跳转到新建卡片页面，并带上当前卡片集ID
  router.push({
    name: 'NewCard',
    query: { deckId: deckId.value }
  })
}

function editCard(card) {
  // 跳转到编辑卡片页面
  router.push({
    name: 'EditCard',
    params: { id: card.id }
  })
}

function confirmDeleteCard(card) {
  cardToDelete.value = card
  showDeleteCardConfirm.value = true
}

function cancelDeleteCard() {
  cardToDelete.value = null
  showDeleteCardConfirm.value = false
}

function deleteCard() {
  if (cardToDelete.value) {
    cardStore.deleteCard(cardToDelete.value.id)
    cancelDeleteCard()
    filterCards()
  }
}

function editDeck() {
  if (!deck.value) return
  
  deckForm.value = {
    title: deck.value.title,
    description: deck.value.description,
    tags: [...deck.value.tags]
  }
  deckTagsInput.value = deck.value.tags.join(', ')
  showDeckModal.value = true
}

function closeDeckModal() {
  showDeckModal.value = false
}

function saveDeck() {
  // 处理标签
  const tags = deckTagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
  
  const deckData = {
    ...deckForm.value,
    tags
  }
  
  deckStore.updateDeck(deckId.value, deckData)
  closeDeckModal()
}

function getCardProgress(cardId) {
  return cardStore.getCardProgress(cardId)
}

function resetCardProgress(cardId) {
  if (confirm('确定要重置这张卡片的学习进度吗？')) {
    cardStore.resetCardProgress(cardId)
    filterCards()
  }
}

function calculateProgressWidth(cardId) {
  const progress = getCardProgress(cardId)
  
  if (!progress.repetitions) return 0
  if (progress.repetitions >= 5) return 100
  
  return progress.repetitions * 20
}

function getProgressClass(cardId) {
  const progress = getCardProgress(cardId)
  
  if (progress.repetitions >= 3) return 'progress-good'
  if (progress.repetitions >= 1) return 'progress-medium'
  return 'progress-poor'
}

function formatDate(dateString) {
  if (!dateString) return '未学习'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

function truncateText(text, maxLength) {
  // 去除HTML标签
  const plainText = text.replace(/<[^>]*>/g, '')
  
  if (plainText.length <= maxLength) return plainText
  return plainText.substring(0, maxLength) + '...'
}
</script>

<style scoped>
/* 样式部分保持不变 */
.deck-detail-container {
  max-width: 1000px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.not-found {
  text-align: center;
  padding: 3rem 1rem;
}

.back-nav {
  margin-bottom: 1.5rem;
}

.back-link {
  color: var(--primary-color);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  text-decoration: underline;
}

.deck-header {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.deck-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.deck-title-section h1 {
  margin: 0;
  color: var(--primary-color);
}

.deck-actions {
  display: flex;
  gap: 1rem;
}

.edit-btn, .study-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-btn {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.study-btn {
  background-color: var(--primary-color);
  border: none;
  color: white;
  text-decoration: none;
}

.edit-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.study-btn:hover {
  background-color: var(--secondary-color);
}

.deck-description {
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.deck-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.deck-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background-color: #f0f0f0;
  color: #555;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.deck-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.cards-section {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

.add-card-btn {
  display: flex;
  align-items: center;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-card-btn:hover {
  background-color: var(--secondary-color);
}

.add-card-btn .icon {
  margin-right: 0.5rem;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-bar {
  flex-grow: 1;
}

.search-bar input {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-options select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.sort-direction-btn {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.no-cards {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-state {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.card-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-item.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background-color: var(--bg-color);
}

.card-front-preview {
  flex-grow: 1;
}

.card-expand-icon {
  margin-left: 1rem;
  color: #999;
}

.card-details {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.card-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.card-front, .card-back {
  padding: 1rem;
  background-color: var(--bg-color);
  border-radius: 6px;
}

.card-front h4, .card-back h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-progress {
  flex-grow: 1;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.3rem;
}

.progress-indicator {
  height: 6px;
  background-color: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-poor {
  background-color: #ff6b6b;
}

.progress-medium {
  background-color: #feca57;
}

.progress-good {
  background-color: #1dd1a1;
}

.card-actions-bar {
  display: flex;
  gap: 0.8rem;
}

.edit-card-btn, .delete-card-btn, .reset-card-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.edit-card-btn {
  background-color: #f0f0f0;
  border: none;
  color: #555;
}

.delete-card-btn {
  background-color: #ffecec;
  border: none;
  color: #ff6b6b;
}

.reset-card-btn {
  background-color: #e7f5ff;
  border: none;
  color: #339af0;
}

.edit-card-btn:hover {
  background-color: #e0e0e0;
}

.delete-card-btn:hover {
  background-color: #ffe0e0;
}

.reset-card-btn:hover {
  background-color: #d0ebff;
}

/* 模态框样式 */
.modal {
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

.modal-content {
  background-color: var(--card-bg);
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn,
.save-btn,
.delete-btn {
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f0f0f0;
  border: none;
  color: #333;
}

.save-btn {
  background-color: var(--primary-color);
  border: none;
  color: white;
}

.delete-btn {
  background-color: #ff4d4d;
  border: none;
  color: white;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.save-btn:hover {
  background-color: var(--secondary-color);
}

.delete-btn:hover {
  background-color: #ff3333;
}

.delete-confirm .warning {
  color: #ff4d4d;
  font-weight: bold;
}

@media (max-width: 768px) {
  .deck-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .deck-actions {
    width: 100%;
  }
  
  .edit-btn, .study-btn {
    flex: 1;
    text-align: center;
  }
  
  .card-content {
    grid-template-columns: 1fr;
  }
  
  .card-actions-bar {
    flex-wrap: wrap;
  }
  
  .edit-card-btn, .delete-card-btn, .reset-card-btn {
    flex: 1;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn, .save-btn, .delete-btn {
    width: 100%;
  }
}
</style>
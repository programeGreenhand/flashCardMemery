<template>
  <div class="deck-list-container">
    <div class="page-header">
      <h1>我的卡片集</h1>
      <button class="add-deck-btn" @click="showAddDeckModal = true">
        <span class="icon">+</span> 新建卡片集
      </button>
    </div>
    
    <div class="search-filter">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索卡片集..." 
          class="search-input"
        />
      </div>
      <div class="tag-filter">
        <span 
          v-for="tag in allTags" 
          :key="tag"
          class="filter-tag"
          :class="{ active: selectedTags.includes(tag) }"
          @click="toggleTagFilter(tag)"
        >
          {{ tag }}
        </span>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="filteredDecks.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>还没有卡片集</h3>
      <p>创建您的第一个卡片集开始学习之旅吧！</p>
      <button class="primary-btn" @click="showAddDeckModal = true">创建卡片集</button>
    </div>
    
    <div v-else class="decks-grid">
      <div 
        v-for="deck in filteredDecks" 
        :key="deck.id"
        class="deck-card"
        :class="{ 'has-due-cards': hasDueCards(deck.id) }"
      >
        <div class="deck-header">
          <router-link :to="`/decks/${deck.id}`" class="deck-title">
            {{ deck.title }}
          </router-link>
          <div class="deck-actions">
            <button class="deck-action-btn" @click="editDeck(deck)">
              ✏️
            </button>
            <button class="deck-action-btn" @click="confirmDeleteDeck(deck)">
              🗑️
            </button>
          </div>
        </div>
        
        <p class="deck-description">{{ deck.description }}</p>
        
        <div class="deck-meta">
          <div class="deck-stats">
            <div class="stat">
              <span class="stat-value">{{ deck.cardsCount }}</span>
              <span class="stat-label">卡片</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getDueCardsCount(deck.id) }}</span>
              <span class="stat-label">待复习</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getMasteryPercentage(deck.id) }}%</span>
              <span class="stat-label">掌握率</span>
            </div>
          </div>
          
          <div class="deck-tags">
            <span 
              v-for="tag in deck.tags" 
              :key="tag" 
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <div class="deck-actions-footer">
          <router-link :to="`/decks/${deck.id}`" class="deck-btn">
            查看
          </router-link>
          <router-link :to="`/study/${deck.id}`" class="deck-btn primary">
            学习
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑卡片集模态框 -->
    <div v-if="showAddDeckModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>{{ editingDeck ? '编辑卡片集' : '创建新卡片集' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="deckTitle">标题</label>
            <input 
              type="text" 
              id="deckTitle" 
              v-model="newDeck.title" 
              class="form-control"
              placeholder="卡片集标题"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="deckDescription">描述</label>
            <textarea 
              id="deckDescription" 
              v-model="newDeck.description" 
              class="form-control"
              placeholder="卡片集描述"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="deckTags">标签</label>
            <div class="tag-input-container">
              <input 
                type="text" 
                id="deckTags" 
                v-model="tagInput" 
                @keydown.enter.prevent="addTag"
                class="form-control tag-input"
                placeholder="输入标签并按回车"
              />
              <button 
                class="add-tag-btn" 
                @click.prevent="addTag"
                :disabled="!tagInput.trim()"
              >
                添加
              </button>
            </div>
            <div class="selected-tags">
              <span 
                v-for="(tag, index) in newDeck.tags" 
                :key="index"
                class="tag"
              >
                {{ tag }}
                <button class="remove-tag-btn" @click="removeTag(index)">×</button>
              </span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-btn" @click="closeModal">取消</button>
          <button 
            class="primary-btn" 
            @click="saveDeck"
            :disabled="!newDeck.title.trim()"
          >
            保存
          </button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-container delete-modal" @click.stop>
        <div class="modal-header">
          <h2>确认删除</h2>
          <button class="close-btn" @click="showDeleteModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <p>确定要删除卡片集 "{{ deckToDelete?.title }}" 吗？</p>
          <p class="warning">此操作无法撤销，包含的所有卡片也将被删除。</p>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-btn" @click="showDeleteModal = false">取消</button>
          <button class="danger-btn" @click="deleteDeck">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDeckStore } from '../stores/deck'
import { useCardStore } from '../stores/card'
import { useGameStore } from '../stores/game'
import { useToast } from '../composables/useToast'

const deckStore = useDeckStore()
const cardStore = useCardStore()
const gameStore = useGameStore()
const { showToast } = useToast()

// 加载状态
const loading = ref(true)

// 搜索和筛选
const searchQuery = ref('')
const selectedTags = ref([])

// 模态框状态
const showAddDeckModal = ref(false)
const showDeleteModal = ref(false)
const editingDeck = ref(false)
const deckToDelete = ref(null)

// 新卡片集表单
const newDeck = ref({
  title: '',
  description: '',
  tags: []
})
const tagInput = ref('')

// 获取卡片集数据
onMounted(async () => {
  try {
    // 模拟API加载延迟
    setTimeout(() => {
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('加载卡片集失败', error)
    loading.value = false
  }
})

// 所有卡片集
const decks = computed(() => deckStore.allDecks)

// 所有标签
const allTags = computed(() => {
  const tagsSet = new Set()
  decks.value.forEach(deck => {
    deck.tags.forEach(tag => tagsSet.add(tag))
  })
  return [...tagsSet]
})

// 过滤后的卡片集
const filteredDecks = computed(() => {
  return decks.value.filter(deck => {
    // 搜索条件过滤
    const matchSearch = deck.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        deck.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    // 标签过滤
    const matchTags = selectedTags.value.length === 0 || 
                      selectedTags.value.every(tag => deck.tags.includes(tag))
    
    return matchSearch && matchTags
  })
})

// 切换标签筛选
function toggleTagFilter(tag) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !newDeck.value.tags.includes(tag)) {
    newDeck.value.tags.push(tag)
    tagInput.value = ''
  }
}

// 移除标签
function removeTag(index) {
  newDeck.value.tags.splice(index, 1)
}

// 编辑卡片集
function editDeck(deck) {
  editingDeck.value = true
  newDeck.value = {
    title: deck.title,
    description: deck.description,
    tags: [...deck.tags]
  }
  showAddDeckModal.value = true
}

// 保存卡片集
function saveDeck() {
  if (!newDeck.value.title.trim()) return
  
  try {
    if (editingDeck.value) {
      deckStore.updateDeck(deckToDelete.value.id, newDeck.value)
      showToast('卡片集已更新', 'success')
      // 游戏奖励：编辑卡片集
      gameStore.addPoints(5, '修改卡片集')
    } else {
      const deckId = deckStore.addDeck(newDeck.value)
      showToast('创建卡片集成功', 'success')
      // 游戏奖励：创建卡片集
      gameStore.addPoints(20, '创建新卡片集')
      gameStore.unlockAchievement('first_deck', '卡片收藏家', '创建第一个卡片集')
    }
    
    closeModal()
  } catch (error) {
    console.error('保存卡片集失败', error)
    showToast('保存失败，请重试', 'error')
  }
}

// 确认删除卡片集
function confirmDeleteDeck(deck) {
  deckToDelete.value = deck
  showDeleteModal.value = true
}

// 删除卡片集
function deleteDeck() {
  try {
    // 首先删除该卡片集下的所有卡片
    const cardsToDelete = cardStore.getCardsByDeck(deckToDelete.value.id)
    cardsToDelete.forEach(card => {
      cardStore.deleteCard(card.id)
    })
    
    // 然后删除卡片集
    deckStore.deleteDeck(deckToDelete.value.id)
    
    showDeleteModal.value = false
    deckToDelete.value = null
    showToast('卡片集已删除', 'success')
  } catch (error) {
    console.error('删除卡片集失败', error)
    showToast('删除失败，请重试', 'error')
  }
}

// 关闭模态框
function closeModal() {
  showAddDeckModal.value = false
  editingDeck.value = false
  newDeck.value = {
    title: '',
    description: '',
    tags: []
  }
  tagInput.value = ''
}

// 计算卡片集是否有待复习的卡片
function hasDueCards(deckId) {
  return getDueCardsCount(deckId) > 0
}

// 计算卡片集的待复习卡片数量
function getDueCardsCount(deckId) {
  const now = new Date()
  const deckCards = cardStore.getCardsByDeck(deckId)
  
  return deckCards.filter(card => {
    const progress = cardStore.getCardProgress(card.id)
    if (!progress.dueDate) return true
    
    const dueDate = new Date(progress.dueDate)
    return dueDate <= now
  }).length
}

// 计算卡片集的掌握率
function getMasteryPercentage(deckId) {
  const deckCards = cardStore.getCardsByDeck(deckId)
  if (deckCards.length === 0) return 0
  
  const masteredCards = deckCards.filter(card => {
    const progress = cardStore.getCardProgress(card.id)
    return progress.repetitions >= 3 && progress.easeFactor > 2.0
  })
  
  return Math.round((masteredCards.length / deckCards.length) * 100)
}
</script>

<style scoped>
.deck-list-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-deck-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-deck-btn:hover {
  background-color: var(--secondary-color);
}

.add-deck-btn .icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.search-filter {
  margin-bottom: 2rem;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
  background-color: var(--card-bg);
  color: var(--text-color);
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  padding: 0.3rem 0.8rem;
  background-color: #f0f0f0;
  color: #555;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.filter-tag.active {
  background-color: var(--primary-color);
  color: white;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  color: var(--text-color);
}

.empty-state p {
  margin-bottom: 2rem;
  color: #666;
}

.decks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.deck-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid var(--border-color);
}

.deck-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.deck-card.has-due-cards {
  border-left: 4px solid #ffc107;
}

.deck-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.deck-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--primary-color);
  text-decoration: none;
}

.deck-actions {
  display: flex;
  gap: 0.5rem;
}

.deck-action-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #888;
  transition: color 0.2s;
}

.deck-action-btn:hover {
  color: var(--primary-color);
}

.deck-description {
  margin-bottom: 1.5rem;
  color: var(--text-color);
  line-height: 1.5;
  height: 3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.deck-meta {
  margin-bottom: 1.5rem;
}

.deck-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.8rem;
  color: #888;
}

.deck-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.2rem 0.6rem;
  background-color: #f0f0f0;
  color: #555;
  border-radius: 20px;
  font-size: 0.8rem;
}

.deck-actions-footer {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.deck-btn {
  flex: 1;
  padding: 0.6rem 0;
  text-align: center;
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.2s;
  font-weight: 500;
}

.deck-btn:not(.primary) {
  background-color: #f0f0f0;
  color: #555;
}

.deck-btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.deck-btn:hover:not(.primary) {
  background-color: #e0e0e0;
}

.deck-btn.primary:hover {
  background-color: var(--secondary-color);
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
  max-width: 500px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
  background-color: var(--card-bg);
  color: var(--text-color);
}

textarea.form-control {
  resize: vertical;
}

.tag-input-container {
  display: flex;
  gap: 0.5rem;
}

.tag-input {
  flex: 1;
}

.add-tag-btn {
  padding: 0.8rem 1.2rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-tag-btn:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.remove-tag-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #888;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.remove-tag-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.primary-btn, .secondary-btn, .danger-btn {
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.primary-btn:hover {
  background-color: var(--secondary-color);
}

.secondary-btn {
  background-color: #f0f0f0;
  color: #555;
}

.secondary-btn:hover {
  background-color: #e0e0e0;
}

.danger-btn {
  background-color: #ff6b6b;
  color: white;
}

.danger-btn:hover {
  background-color: #ff5252;
}

.primary-btn:disabled, .secondary-btn:disabled, .danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-modal {
  max-width: 400px;
}

.warning {
  color: #ff6b6b;
  font-weight: 500;
}

@media (max-width: 768px) {
  .decks-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .add-deck-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
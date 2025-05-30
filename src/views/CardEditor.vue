<template>
  <div class="card-editor-container">
    <div class="page-header">
      <h1>{{ isEditing ? '编辑卡片' : '创建新卡片' }}</h1>
      <div class="header-actions">
        <button class="secondary-btn" @click="goBack">取消</button>
        <button 
          class="primary-btn" 
          @click="saveCard"
          :disabled="!isFormValid || saving"
        >
          {{ saving ? '保存中...' : '保存卡片' }}
        </button>
      </div>
    </div>
    
    <div class="card-form">
      <div class="form-group">
        <label for="deckSelect">选择卡片集</label>
        <select 
          id="deckSelect" 
          v-model="cardData.deckId" 
          class="form-control"
          required
        >
          <option value="" disabled>请选择卡片集</option>
          <option 
            v-for="deck in decks" 
            :key="deck.id" 
            :value="deck.id"
          >
            {{ deck.title }}
          </option>
        </select>
      </div>
      
      <div class="editor-container">
        <div class="editor-side">
          <div class="form-group">
            <label for="cardFront">卡片正面 (问题)</label>
            <div class="editor-toolbar">
              <button @click="applyFormat('bold', 'front')" class="toolbar-btn" title="加粗">B</button>
              <button @click="applyFormat('italic', 'front')" class="toolbar-btn" title="斜体">I</button>
              <button @click="applyFormat('underline', 'front')" class="toolbar-btn" title="下划线">U</button>
              <button @click="applyFormat('code', 'front')" class="toolbar-btn" title="代码">{'}'}</button>
              <button @click="showMediaLibrary('front')" class="toolbar-btn" title="添加图片">🖼️</button>
            </div>
            <textarea 
              id="cardFront" 
              v-model="cardData.front" 
              class="form-control editor-textarea"
              placeholder="输入问题..."
              rows="8"
              required
            ></textarea>
          </div>
          
          <div class="editor-preview">
            <h3>预览</h3>
            <div class="preview-content" v-html="cardData.front"></div>
          </div>
        </div>
        
        <div class="editor-side">
          <div class="form-group">
            <label for="cardBack">卡片背面 (答案)</label>
            <div class="editor-toolbar">
              <button @click="applyFormat('bold', 'back')" class="toolbar-btn" title="加粗">B</button>
              <button @click="applyFormat('italic', 'back')" class="toolbar-btn" title="斜体">I</button>
              <button @click="applyFormat('underline', 'back')" class="toolbar-btn" title="下划线">U</button>
              <button @click="applyFormat('code', 'back')" class="toolbar-btn" title="代码">{'}'}</button>
              <button @click="showMediaLibrary('back')" class="toolbar-btn" title="添加图片">🖼️</button>
            </div>
            <textarea 
              id="cardBack" 
              v-model="cardData.back" 
              class="form-control editor-textarea"
              placeholder="输入答案..."
              rows="8"
              required
            ></textarea>
          </div>
          
          <div class="editor-preview">
            <h3>预览</h3>
            <div class="preview-content" v-html="cardData.back"></div>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label>标签</label>
        <div class="tag-input-container">
          <input 
            type="text" 
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
            v-for="(tag, index) in cardData.tags" 
            :key="index"
            class="tag"
          >
            {{ tag }}
            <button class="remove-tag-btn" @click="removeTag(index)">×</button>
          </span>
        </div>
      </div>
      
      <div class="form-group difficulty-group">
        <label>难度级别</label>
        <div class="difficulty-options">
          <label 
            v-for="level in difficultyLevels" 
            :key="level.value"
            class="difficulty-option"
            :class="{ active: cardData.difficulty === level.value }"
          >
            <input 
              type="radio" 
              :value="level.value" 
              v-model="cardData.difficulty"
              name="difficulty"
              hidden
            />
            <span class="difficulty-icon">{{ level.icon }}</span>
            <span class="difficulty-label">{{ level.label }}</span>
          </label>
        </div>
      </div>
    </div>
    
    <!-- 媒体库模态框 -->
    <div v-if="showMediaModal" class="modal-overlay" @click="showMediaModal = false">
      <div class="modal-container media-modal" @click.stop>
        <div class="modal-header">
          <h2>添加图片</h2>
          <button class="close-btn" @click="showMediaModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="media-upload">
            <label for="mediaUpload" class="upload-label">
              <span class="upload-icon">📷</span>
              <span>选择或拖放图片</span>
            </label>
            <input 
              type="file" 
              id="mediaUpload" 
              @change="handleFileUpload"
              accept="image/*"
              hidden
            />
          </div>
          
          <div v-if="uploadedImage" class="image-preview">
            <img :src="uploadedImage" alt="预览" />
          </div>
          
          <div class="media-library">
            <h3>图片库</h3>
            <div class="media-grid">
              <div 
                v-for="(image, index) in mediaLibrary" 
                :key="index"
                class="media-item"
                @click="selectMedia(image)"
              >
                <img :src="image" alt="图片" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-btn" @click="showMediaModal = false">取消</button>
          <button 
            class="primary-btn" 
            @click="insertMedia"
            :disabled="!selectedMedia && !uploadedImage"
          >
            插入图片
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardStore } from '../stores/card'
import { useDeckStore } from '../stores/deck'
import { useGameStore } from '../stores/game'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const cardStore = useCardStore()
const deckStore = useDeckStore()
const gameStore = useGameStore()
const { showToast } = useToast()

// 获取所有卡片集
const decks = computed(() => deckStore.allDecks)

// 编辑状态
const cardId = route.params.id
const isEditing = computed(() => !!cardId)

// 加载状态
const saving = ref(false)

// 表单数据
const cardData = ref({
  deckId: route.query.deckId || '',
  front: '',
  back: '',
  tags: [],
  difficulty: 'medium',
  mediaAttachments: []
})

// 标签输入
const tagInput = ref('')

// 难度级别
const difficultyLevels = [
  { value: 'easy', label: '简单', icon: '😊' },
  { value: 'medium', label: '中等', icon: '🤔' },
  { value: 'hard', label: '困难', icon: '😰' }
]

// 媒体库
const showMediaModal = ref(false)
const activeEditor = ref('front') // 当前正在编辑哪一面
const uploadedImage = ref('')
const selectedMedia = ref('')
const mediaLibrary = ref([
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U5ZTllOSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiPuWbvueJh+ekuuS+izE8L3RleHQ+PC9zdmc+',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZjJmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiPuWbvueJh+ekuuS+izI8L3RleHQ+PC9zdmc+'
])

// 表单验证
const isFormValid = computed(() => {
  return (
    cardData.value.deckId && 
    cardData.value.front.trim() !== '' && 
    cardData.value.back.trim() !== ''
  )
})

// 初始化表单
onMounted(() => {
  if (isEditing.value) {
    const card = cardStore.getCardById(cardId)
    if (card) {
      cardData.value = {
        deckId: card.deckId,
        front: card.front,
        back: card.back,
        tags: [...card.tags],
        difficulty: card.difficulty || 'medium',
        mediaAttachments: [...(card.mediaAttachments || [])]
      }
    } else {
      router.push('/decks')
    }
  }
})

// 保存卡片
async function saveCard() {
  if (!isFormValid.value) return
  
  saving.value = true
  
  try {
    if (isEditing.value) {
      // 更新卡片
      cardStore.updateCard(cardId, cardData.value)
      showToast('卡片已更新', 'success')
      // 游戏奖励：更新卡片
      gameStore.addPoints(5, '更新卡片')
    } else {
      // 创建新卡片
      const newCardId = cardStore.addCard(cardData.value)
      showToast('卡片创建成功', 'success')
      // 游戏奖励：创建卡片
      gameStore.addPoints(10, '创建新卡片')
      
      // 检查成就
      const userCards = cardStore.allCards.length
      if (userCards === 1) {
        gameStore.unlockAchievement('first_card', '记忆起步', '创建第一张卡片')
      } else if (userCards === 10) {
        gameStore.unlockAchievement('ten_cards', '记忆新手', '创建10张卡片')
      } else if (userCards === 50) {
        gameStore.unlockAchievement('fifty_cards', '记忆达人', '创建50张卡片')
      }
    }
    
    // 返回卡片集详情页
    router.push(`/decks/${cardData.value.deckId}`)
  } catch (error) {
    console.error('保存卡片失败', error)
    showToast('保存失败，请重试', 'error')
  } finally {
    saving.value = false
  }
}

// 返回上一页
function goBack() {
  router.back()
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !cardData.value.tags.includes(tag)) {
    cardData.value.tags.push(tag)
    tagInput.value = ''
  }
}

// 移除标签
function removeTag(index) {
  cardData.value.tags.splice(index, 1)
}

// 文本格式化工具
function applyFormat(format, side) {
  const textarea = document.getElementById(side === 'front' ? 'cardFront' : 'cardBack')
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = cardData.value[side].substring(start, end)
  let formattedText = ''
  
  switch(format) {
    case 'bold':
      formattedText = `<strong>${selectedText}</strong>`
      break
    case 'italic':
      formattedText = `<em>${selectedText}</em>`
      break
    case 'underline':
      formattedText = `<u>${selectedText}</u>`
      break
    case 'code':
      formattedText = `<code>${selectedText}</code>`
      break
    default:
      formattedText = selectedText
  }
  
  cardData.value[side] = 
    cardData.value[side].substring(0, start) + 
    formattedText + 
    cardData.value[side].substring(end)
  
  // 在下一个事件循环中重新聚焦textarea
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
  }, 0)
}

// 显示媒体库
function showMediaLibrary(side) {
  activeEditor.value = side
  showMediaModal.value = true
  uploadedImage.value = ''
  selectedMedia.value = ''
}

// 处理文件上传
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    selectedMedia.value = ''
  }
  reader.readAsDataURL(file)
}

// 选择媒体库中的图片
function selectMedia(image) {
  selectedMedia.value = image
  uploadedImage.value = ''
}

// 插入媒体到编辑器
function insertMedia() {
  const imageUrl = uploadedImage.value || selectedMedia.value
  if (!imageUrl) return
  
  const imgTag = `<img src="${imageUrl}" alt="附件" style="max-width: 100%;" />`
  
  // 添加到相应编辑器
  cardData.value[activeEditor.value] += imgTag
  
  // 将图片URL添加到附件列表
  if (!cardData.value.mediaAttachments.includes(imageUrl)) {
    cardData.value.mediaAttachments.push(imageUrl)
  }
  
  // 关闭模态框
  showMediaModal.value = false
}
</script>

<style scoped>
.card-editor-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.card-form {
  background-color: var(--card-bg);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
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

.editor-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.editor-side {
  flex: 1;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s;
}

.toolbar-btn:hover {
  background-color: #e0e0e0;
}

.editor-textarea {
  font-family: inherit;
  resize: vertical;
}

.editor-preview {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  min-height: 150px;
}

.editor-preview h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: #888;
}

.preview-content {
  min-height: 100px;
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
  padding: 0.2rem 0.6rem;
  background-color: #f0f0f0;
  color: #555;
  border-radius: 20px;
  font-size: 0.9rem;
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

.difficulty-group {
  margin-top: 2rem;
}

.difficulty-options {
  display: flex;
  gap: 1rem;
}

.difficulty-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.difficulty-option.active {
  border-color: var(--primary-color);
  background-color: rgba(74, 107, 175, 0.1);
}

.difficulty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.difficulty-label {
  font-weight: 500;
}

.primary-btn, .secondary-btn {
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

.primary-btn:hover:not(:disabled) {
  background-color: var(--secondary-color);
}

.secondary-btn {
  background-color: #f0f0f0;
  color: #555;
}

.secondary-btn:hover {
  background-color: #e0e0e0;
}

.primary-btn:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

/* 媒体库模态框 */
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

.media-modal {
  max-width: 700px;
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

.media-upload {
  margin-bottom: 1.5rem;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-label:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.image-preview {
  margin-bottom: 1.5rem;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.media-library h3 {
  margin-bottom: 1rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.media-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.media-item:hover {
  border-color: var(--primary-color);
}

.media-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
    gap: 2rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions button {
    flex: 1;
  }
  
  .difficulty-options {
    flex-direction: column;
  }
  
  .media-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
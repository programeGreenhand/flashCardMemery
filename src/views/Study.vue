<template>
    <div class="study-container">
      <div v-if="!currentSession.cards.length && !initialized" class="start-study">
        <h2>开始学习</h2>
        <div class="study-options">
          <div class="study-option" @click="startStudy()">
            <h3>学习所有待复习卡片</h3>
            <p>今日待复习: {{ dueCards.length }} 张卡片</p>
          </div>
          
          <div class="deck-options">
            <h3>选择卡片集学习</h3>
            <div 
              v-for="deck in decks" 
              :key="deck.id" 
              class="deck-option"
              @click="startStudy(deck.id)"
            >
              <h4>{{ deck.title }}</h4>
              <p>{{ deck.description }}</p>
              <div class="deck-stats">
                共 {{ deck.cardsCount }} 张卡片
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="currentSession.completed" class="study-completed">
        <h2>学习完成!</h2>
        <div class="session-summary">
          <p>本次学习了 {{ currentSession.cards.length }} 张卡片</p>
          <div class="progress-bar">
            <div class="progress-bar-inner" :style="{ width: todayProgress + '%' }"></div>
          </div>
          <p>今日进度: {{ todayLearned }} / {{ dailyGoal }}
            ({{ todayProgress }}%)</p>
        </div>
        <button class="primary-button" @click="resetAndStart">继续学习</button>
      </div>
      
      <div v-else-if="currentCard" class="flashcard-study" >
        <div class="progress-indicator">
          {{ currentSession.currentIndex + 1 }} / {{ currentSession.cards.length }}
        </div>
        
        <div class="flashcard" :class="{ 'flipped': currentSession.showAnswer }" >
          <div class="flashcard-inner" >
            <div class="flashcard-front" :style="{ backgroundImage: `url(${imgUrl})` }" >
              <div class="card-content" v-html="currentCard.front"></div>
              <button 
                v-if="!currentSession.showAnswer" 
                class="show-answer-btn"
                @click="showAnswer(),requestImg()"
              >
                显示答案
              </button>
            </div>
            
            <div class="flashcard-back" :style="{ backgroundImage: `url(${imgUrl})` }">
              <div class="card-content" v-html="currentCard.back"></div>
              <div class="rating-buttons">
                <button 
                  v-for="rating in ratings" 
                  :key="rating.value"
                  class="rating-btn"
                  :class="'rating-' + rating.value"
                  @click="answerCard(rating.value)"
                >
                  {{ rating.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- 'https://api.mtyqx.cn/api/random.php' -->
        <div class="card-tags">
          <span 
            v-for="tag in currentCard.tags" 
            :key="tag" 
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>


      <div v-if="showReward" class="reward-popup" :class="{ 'active': showReward }">
      <div class="reward-content">
        <div class="reward-icon">🎉</div>
        <h3>获得奖励！</h3>
        <p>{{ rewardMessage }}</p>
        <div class="reward-xp">+{{ rewardPoints }} XP</div>
        <button class="reward-close-btn" @click="showReward = false">继续学习</button>
      </div>
    </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useStudyStore } from '../stores/study'
  import { useCardStore } from '../stores/card'
  import { useDeckStore } from '../stores/deck'
  import { useGameStore } from '../stores/game'

  
  const route = useRoute()
  const router = useRouter()
  const studyStore = useStudyStore()
  const cardStore = useCardStore()
  const deckStore = useDeckStore()
  
  // 初始化标志
  const initialized = ref(false)
  
  // 从store获取数据
  const currentSession = computed(() => studyStore.currentSession)
  const currentCard = computed(() => studyStore.getCurrentCard())
  const dueCards = computed(() => studyStore.dueCards)
  const decks = computed(() => deckStore.allDecks)
  const todayLearned = computed(() => studyStore.todayLearned)
  const todayProgress = computed(() => studyStore.todayProgress)
  const dailyGoal = computed(() => studyStore.dailyGoal)
  
  // 评分选项
  const ratings = [
    { value: 0, label: '完全不记得' },
    { value: 1, label: '不记得' },
    { value: 2, label: '有点记得' },
    { value: 3, label: '记得但有困难' },
    { value: 4, label: '记得' },
    { value: 5, label: '完全记得' }
  ]

  let imgUrl = ref('')
  
  // 初始化
  onMounted(() => {
    // 检查是否有指定的卡片集
    const deckId = route.params.deckId
    if (deckId) {
      startStudy(deckId)
    }
  })
  
  // 开始学习
  function startStudy(deckId = null) {
    const cardsCount = studyStore.startStudySession(deckId)
    initialized.value = true
    
    if (cardsCount === 0) {
      // 没有待学习的卡片
      currentSession.value.completed = true
    }
  }
  
  // 显示答案
  function showAnswer() {
    studyStore.showAnswer()
  }
  
  // // 回答卡片
  // function answerCard(quality) {
  //   studyStore.answerCard(quality)
  // }
  
  // 重置并开始新的学习
  function resetAndStart() {
    studyStore.resetSession()
    initialized.value = false
    router.push('/study')
  }

  //卡片背景转化
  function requestImg(){
    
    // const response = await fetch('https://api.mtyqx.cn/api/random.php')
  
    imgUrl.value =  `https://api.mtyqx.cn/api/random.php?t=${Date.now()}`;
    console.log(imgUrl)
  }

  const gameStore = useGameStore()

// 学习奖励
const showReward = ref(false)
const rewardMessage = ref('')
const rewardPoints = ref(0)

// 修改 answerCard 函数添加游戏奖励
function answerCard(quality) {
  studyStore.answerCard(quality)
  
  // 添加游戏奖励
  if (quality >= 3) {
    // 正确回答
    gameStore.addPoints(10, '正确回答卡片')
    
    // 更新学习连续天数
    gameStore.updateStreak()
    
    // 检查成就
    const totalReviews = studyStore.studyStats.totalReviews
    if (totalReviews === 1) {
      gameStore.unlockAchievement('first_review', '初次复习', '完成首次卡片复习')
    } else if (totalReviews === 10) {
      gameStore.unlockAchievement('review_10', '复习入门', '复习10张卡片')
      showLearningReward('成就解锁: 复习入门', 50)
    } else if (totalReviews === 100) {
      gameStore.unlockAchievement('review_100', '复习专家', '复习100张卡片')
      showLearningReward('成就解锁: 复习专家', 100)
    } else if (totalReviews === 1000) {
      gameStore.unlockAchievement('review_1000', '复习大师', '复习1000张卡片')
      showLearningReward('成就解锁: 复习大师', 200)
    }
    
    // 随机奖励
    if (Math.random() < 0.2) { // 20%的概率获得额外奖励
      const bonusPoints = Math.floor(Math.random() * 10) + 5; // 5-15点额外奖励
      showLearningReward('连续正确回答，获得额外奖励！', bonusPoints)
    }
  } else {
    // 错误回答也给少量经验值
    gameStore.addPoints(3, '学习尝试')
  }
  
  // 检查是否完成一组学习
  if (currentSession.value.completed) {
    // 学习完成奖励
    gameStore.addPoints(20, '完成学习会话')
  }
}

// 显示学习奖励
function showLearningReward(message, points) {
  rewardMessage.value = message
  rewardPoints.value = points
  showReward.value = true
  
  // 添加经验值
  gameStore.addExperience(points)
  
  // 自动关闭
  setTimeout(() => {
    showReward.value = false
  }, 3000)
}
  </script>
  
  <style scoped>

/* 奖励弹窗样式 */
.reward-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s;
}

.reward-popup.active {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
}

.reward-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 1s infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.reward-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.reward-xp {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 1rem 0;
}

.reward-close-btn {
  padding: 0.8rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reward-close-btn:hover {
  background-color: var(--secondary-color);
}

  .study-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .start-study, .study-completed {
    text-align: center;
    padding: 2rem;
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .study-options {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-top: 2rem;
  }
  
  .study-option {
    padding: 1.5rem;
    background: var(--bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid var(--border-color);
  }
  
  .study-option:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  .deck-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
  }

  
  
  .deck-option {
    padding: 1rem;
    background: var(--bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    text-align: left;
    border: 1px solid var(--border-color);
  
  }
  
  .deck-option:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  .deck-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .flashcard-study {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  
  .progress-indicator {
    font-size: 0.9rem;
    color: #666;
  }
  
  .flashcard {
    width: 100%;
    height: 400px;
    perspective: 1000px;
    /* background-image: url('https://api.mtyqx.cn/api/random.php'); */
  }
  
  .flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border-radius: 12px;
  }
  
  .flashcard.flipped .flashcard-inner {
    transform: rotateY(180deg);
  }
  
  .flashcard-front, .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    border-radius: 12px;
    background-color: var(--card-bg);
    box-sizing: border-box;
  
  }
  
  .flashcard-back {
    transform: rotateY(180deg);
  }
  
  .card-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    line-height: 1.6;
    width: 100%;
    overflow-y: auto;
  }
  
  .show-answer-btn {
    padding: 0.8rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .show-answer-btn:hover {
    background: var(--secondary-color);
  }
  
  .rating-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    margin-top: 1rem;
  }
  
  .rating-btn {
    padding: 0.5rem 0.8rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    flex-grow: 1;
    max-width: 30%;
    transition: transform 0.1s, background-color 0.2s;
  }
  
  .rating-btn:hover {
    transform: translateY(-2px);
  }
  
  .rating-0, .rating-1 {
    background-color: #ff6b6b;
    color: white;
  }
  
  .rating-2, .rating-3 {
    background-color: #feca57;
    color: #333;
  }
  
  .rating-4, .rating-5 {
    background-color: #1dd1a1;
    color: white;
  }
  
  .card-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .tag {
    padding: 0.3rem 0.6rem;
    background-color: #eee;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #666;
  }
  
  .session-summary {
    margin: 2rem 0;
  }
  
  .progress-bar {
    height: 10px;
    background-color: #eee;
    border-radius: 5px;
    margin: 1rem 0;
    overflow: hidden;
  }
  
  .progress-bar-inner {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 5px;
    transition: width 0.3s;
  }
  
  .primary-button {
    padding: 0.8rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .primary-button:hover {
    background: var(--secondary-color);
  }
  
  @media (max-width: 600px) {
    .flashcard {
      height: 300px;
    }
    
    .rating-buttons {
      gap: 0.3rem;
    }
    
    .rating-btn {
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
    }
  }
  </style>
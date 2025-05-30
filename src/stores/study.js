import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useCardStore } from './card'
import { calculateNextReview } from '../utils/sm2'

// 学习状态存储
export const useStudyStore = defineStore('study', () => {
  const cardStore = useCardStore()
  
  // 当前学习会话
  const currentSession = ref({
    deckId: null,
    cards: [],
    currentIndex: 0,    ///卡片id?
    showAnswer: false,
    completed: false
  })
  
  // 学习统计
  const studyStats = useStorage('flashcard-study-stats', {
    totalReviews: 0,
    correctReviews: 0,
    sessionHistory: []    ///
  })
  
  // 每日目标
  const dailyGoal = useStorage('flashcard-daily-goal', 30)
  
  // 当天已学习的卡片数
  const todayLearned = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return Object.values(cardStore.cardsProgress)
      .filter(progress => {
        if (!progress.lastReviewed) return false
        const reviewDate = progress.lastReviewed.split('T')[0]
        return reviewDate === today
      }).length
  })
  
  // 今日进度百分比
  const todayProgress = computed(() => {
    return Math.min(100, Math.round((todayLearned.value / dailyGoal.value) * 100))
  })
  
  // 待学习的卡片
  const dueCards = computed(() => {
    const now = new Date()
    const allCards = cardStore.allCards
    
    return allCards.filter(card => {
      const progress = cardStore.getCardProgress(card.id)
      if (!progress.dueDate) return true
      
      const dueDate = new Date(progress.dueDate)
      return dueDate <= now
    })
  })
  
  // Actions
  function startStudySession(deckId = null) {
    // 过滤出需要学习的卡片
    let cardsToStudy
    
    if (deckId) {
      // 特定卡片集的待复习卡片
      cardsToStudy = cardStore.getCardsByDeck(deckId).filter(card => {
        const progress = cardStore.getCardProgress(card.id)
        if (!progress.dueDate) return true
        
        const dueDate = new Date(progress.dueDate)
        return dueDate <= new Date()
      })
    } else {
      // 所有待复习卡片
      cardsToStudy = [...dueCards.value]
    }
    
    // 随机打乱卡片顺序
    const shuffledCards = cardsToStudy
      .sort(() => Math.random() - 0.5)
      .map(card => card.id)
    
    currentSession.value = {
      deckId,
      cards: shuffledCards,
      currentIndex: 0,
      showAnswer: false,
      completed: shuffledCards.length === 0
    }
    
    return shuffledCards.length
  }
  
  function getCurrentCard() {
    if (currentSession.value.currentIndex >= currentSession.value.cards.length) {
      return null
    }
    
    const cardId = currentSession.value.cards[currentSession.value.currentIndex]
    return cardStore.getCardById(cardId)
  }
  
  function showAnswer() {
    currentSession.value.showAnswer = true
  }
  
  function answerCard(quality) {
    const cardId = currentSession.value.cards[currentSession.value.currentIndex]
    const oldProgress = cardStore.getCardProgress(cardId)
    
    // 使用SM-2算法计算下次复习时间
    const newProgress = calculateNextReview(oldProgress, quality)
    cardStore.updateCardProgress(cardId, newProgress)
    
    // 更新学习统计
    studyStats.value.totalReviews++
    if (quality >= 3) {
      studyStats.value.correctReviews++
    }
    
    // 记录本次会话
    const sessionDate = new Date().toISOString().split('T')[0]
    const existingSession = studyStats.value.sessionHistory.find(
      session => session.date === sessionDate
    )
    
    if (existingSession) {
      existingSession.cards++
      existingSession.correct += (quality >= 3 ? 1 : 0)
    } else {
      studyStats.value.sessionHistory.push({
        date: sessionDate,
        cards: 1,
        correct: quality >= 3 ? 1 : 0
      })
    }
    
    // 移动到下一张卡片
    currentSession.value.currentIndex++
    currentSession.value.showAnswer = false
    
    // 检查是否完成学习
    if (currentSession.value.currentIndex >= currentSession.value.cards.length) {
      currentSession.value.completed = true
    }
    
    return currentSession.value.completed
  }
  
  function resetSession() {
    currentSession.value = {
      deckId: null,
      cards: [],
      currentIndex: 0,
      showAnswer: false,
      completed: false
    }
  }
  
  function setDailyGoal(goal) {
    dailyGoal.value = goal
  }
  
  return {
    currentSession,
    studyStats,
    dailyGoal,
    todayLearned,
    todayProgress,
    dueCards,
    startStudySession,
    getCurrentCard,
    showAnswer,
    answerCard,
    resetSession,
    setDailyGoal
  }
})
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '@vueuse/core'
import { useDeckStore } from './deck'

// 卡片状态存储
export const useCardStore = defineStore('card', () => {
  const deckStore = useDeckStore()
  
  // 使用localStorage持久化存储
  const cards = useStorage('flashcard-cards', [
    {
      id: '1',
      deckId: '1',
      front: '什么是Vue.js?',
      back: 'Vue.js是一个用于构建用户界面的渐进式JavaScript框架，专注于视图层。',
      tags: ['Vue', '前端'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaAttachments: []
    },
    {
      id: '2',
      deckId: '1',
      front: 'Vue 3的组合式API有什么优势?',
      back: '组合式API提供了更好的代码组织方式、逻辑复用能力、类型推导，并且对tree-shaking更友好。',
      tags: ['Vue', '组合式API'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaAttachments: []
    }
  ])
  
  // 卡片学习状态
  const cardsProgress = useStorage('flashcard-cards-progress', {})
  
  // Getters
  const allCards = computed(() => cards.value)
  
  const getCardsByDeck = computed(() => {
    return (deckId) => cards.value.filter(card => card.deckId === deckId)
  })
  
  const getCardById = computed(() => {
    return (cardId) => cards.value.find(card => card.id === cardId)
  })
  
  const getCardsByTag = computed(() => {
    return (tag) => cards.value.filter(card => card.tags.includes(tag))
  })
  
  // Actions
  function addCard(cardData) {
    const newCard = {
      id: uuidv4(),
      ...cardData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaAttachments: cardData.mediaAttachments || []
    }
    cards.value.push(newCard)
    
    // 更新对应卡片集的卡片计数
    const deckCards = getCardsByDeck.value(newCard.deckId)   //////
    deckStore.updateCardCount(newCard.deckId, deckCards.length)
    
    return newCard.id
  }
  
  function updateCard(cardId, cardData) {
    const index = cards.value.findIndex(card => card.id === cardId)
    if (index !== -1) {
      cards.value[index] = {
        ...cards.value[index],
        ...cardData,
        updatedAt: new Date().toISOString()
      }
      return true
    }
    return false
  }
  
  function deleteCard(cardId) {
    const index = cards.value.findIndex(card => card.id === cardId)
    if (index !== -1) {
      const deckId = cards.value[index].deckId
      cards.value.splice(index, 1)
      
      // 更新对应卡片集的卡片计数
      const deckCards = getCardsByDeck.value(deckId)
      deckStore.updateCardCount(deckId, deckCards.length)
      
      return true
    }
    return false
  }
  
  function updateCardProgress(cardId, progressData) {    //这个主要存储什么内容？？？
    cardsProgress.value[cardId] = {
      ...cardsProgress.value[cardId],
      ...progressData,
      lastReviewed: new Date().toISOString()
    }
  }
  
  function getCardProgress(cardId) {
    return cardsProgress.value[cardId] || {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: new Date().toISOString(),
      lastReviewed: null
    }
  }
  
  function resetCardProgress(cardId) {
    if (cardsProgress.value[cardId]) {
      delete cardsProgress.value[cardId]
      return true
    }
    return false
  }
  
  return {
    cards,
    cardsProgress,
    allCards,
    getCardsByDeck,
    getCardById,
    getCardsByTag,
    addCard,
    updateCard,
    deleteCard,
    updateCardProgress,
    getCardProgress,
    resetCardProgress
  }
})
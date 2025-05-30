import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '@vueuse/core'    /////这么好用？？？？？

// 卡片集状态存储
export const useDeckStore = defineStore('deck', () => {
  // 使用localStorage持久化存储
  const decks = useStorage('flashcard-decks', [
    {
      id: '1',
      title: '示例卡片集',
      description: '这是一个示例卡片集，用于展示系统功能',
      tags: ['示例', '入门'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardsCount: 2
    }
  ])
  
  // Getters
  const allDecks = computed(() => decks.value)
  
  const getDeckById = computed(() => {
    return (deckId) => decks.value.find(deck => deck.id === deckId)
  })
  
  const getDecksByTag = computed(() => {
    return (tag) => decks.value.filter(deck => deck.tags.includes(tag))
  })
  
  // Actions
  function addDeck(deckData) {    ///deck 为 卡组
    const newDeck = {
      id: uuidv4(),
      ...deckData,    
      ///这个传入的是什么信息？？？？
      // title: '示例卡片集',
      // description: '这是一个示例卡片集，用于展示系统功能',
      // tags: ['示例', '入门'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardsCount: 0
    }
    decks.value.push(newDeck)
    return newDeck.id
  }
  
  function updateDeck(deckId, deckData) {
    const index = decks.value.findIndex(deck => deck.id === deckId)
    if (index !== -1) {
      decks.value[index] = {
        ...decks.value[index],
        ...deckData,     ///这是做什么，难道不是更新信息吗    这么做可以保留不需要更改的项，同时更新覆盖需要更新的项
        updatedAt: new Date().toISOString()
      }
      return true
    }
    return false
  }
  
  function deleteDeck(deckId) {
    const index = decks.value.findIndex(deck => deck.id === deckId)
    if (index !== -1) {
      decks.value.splice(index, 1)
      return true
    }
    return false
  }
  
  function updateCardCount(deckId, count) {
    const deck = decks.value.find(d => d.id === deckId)
    if (deck) {
      deck.cardsCount = count
      return true
    }
    return false
  }
  
  return {
    decks,
    allDecks,
    getDeckById,
    getDecksByTag,
    addDeck,
    updateDeck,
    deleteDeck,
    updateCardCount
  }
})
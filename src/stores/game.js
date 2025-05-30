import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

// 游戏化激励状态存储
export const useGameStore = defineStore('game', () => {
  // 经验值
  const experience = useStorage('flashcard-experience', 0)
  
  // 等级
  const level = computed(() => {
    return Math.floor(1 + Math.sqrt(experience.value / 100))
  })
  
  // 下一级所需的经验值
  const nextLevelExp = computed(() => {
    const nextLevel = level.value + 1
    return (nextLevel * nextLevel) * 100
  })
  
  // 当前等级进度百分比
  const levelProgress = computed(() => {
    const currentLevelExp = (level.value * level.value) * 100
    const expInCurrentLevel = experience.value - currentLevelExp
    const expNeededForNextLevel = nextLevelExp.value - currentLevelExp
    
    return Math.round((expInCurrentLevel / expNeededForNextLevel) * 100)
  })
  
  // 称号
  const titles = [
    { level: 1, name: '记忆新手' },
    { level: 5, name: '记忆学徒' },
    { level: 10, name: '记忆能手' },
    { level: 15, name: '记忆专家' },
    { level: 20, name: '记忆大师' },
    { level: 30, name: '记忆宗师' },
    { level: 40, name: '记忆传奇' },
    { level: 50, name: '超忆大师' }
  ]
  
  // 当前称号
  const currentTitle = computed(() => {
    // 找到符合当前等级的最高称号
    for (let i = titles.length - 1; i >= 0; i--) {
      if (level.value >= titles[i].level) {
        return titles[i].name
      }
    }
    return '初学者'
  })
  
  // 连续学习天数
  const streak = useStorage('flashcard-streak', {
    current: 0,
    lastStudyDate: null,
    highest: 0
  })
  
  // 成就
  const achievements = useStorage('flashcard-achievements', {
    // 学习相关
    daily_streak_3: { id: 'daily_streak_3', name: '稳步前进', description: '连续学习3天', unlocked: false, date: null },
    daily_streak_7: { id: 'daily_streak_7', name: '一周坚持', description: '连续学习7天', unlocked: false, date: null },
    daily_streak_30: { id: 'daily_streak_30', name: '月度达人', description: '连续学习30天', unlocked: false, date: null },
    first_review: { id: 'first_review', name: '初次复习', description: '完成首次卡片复习', unlocked: false, date: null },
    review_10: { id: 'review_10', name: '复习入门', description: '复习10张卡片', unlocked: false, date: null },
    review_100: { id: 'review_100', name: '复习专家', description: '复习100张卡片', unlocked: false, date: null },
    review_1000: { id: 'review_1000', name: '复习大师', description: '复习1000张卡片', unlocked: false, date: null },
    
    // 卡片相关
    first_card: { id: 'first_card', name: '记忆起步', description: '创建第一张卡片', unlocked: false, date: null },
    ten_cards: { id: 'ten_cards', name: '记忆新手', description: '创建10张卡片', unlocked: false, date: null },
    fifty_cards: { id: 'fifty_cards', name: '记忆达人', description: '创建50张卡片', unlocked: false, date: null },
    
    // 卡片集相关
    first_deck: { id: 'first_deck', name: '卡片收藏家', description: '创建第一个卡片集', unlocked: false, date: null },
    master_deck: { id: 'master_deck', name: '精通领域', description: '一个卡片集内所有卡片达到精通状态', unlocked: false, date: null },
    
    // 其他
    first_login: { id: 'first_login', name: '学习之旅', description: '首次登录应用', unlocked: false, date: null },
    night_owl: { id: 'night_owl', name: '夜猫子', description: '在晚上10点后学习', unlocked: false, date: null },
    early_bird: { id: 'early_bird', name: '早起鸟', description: '在早上6点前学习', unlocked: false, date: null }
  })
  
  // 解锁的成就
  const unlockedAchievements = computed(() => {
    return Object.values(achievements.value).filter(a => a.unlocked)
  })
  
  // 徽章
  const activeBadge = useStorage('flashcard-active-badge', '')
  
  // 历史记录
  const activityHistory = useStorage('flashcard-activity-history', [])
  
  // 添加经验值
  function addExperience(amount) {
    const oldLevel = level.value
    experience.value += amount
    
    // 检查是否升级
    if (level.value > oldLevel) {
      // 记录升级事件
      addActivity('level_up', `恭喜升级到 ${level.value} 级！`, amount)
      
      // 检查是否获得新称号
      const newTitle = titles.find(t => t.level === level.value)
      if (newTitle) {
        addActivity('new_title', `获得新称号: ${newTitle.name}！`, 0)
      }
      
      return true
    }
    
    return false
  }
  
  // 添加点数并记录活动
  function addPoints(points, reason) {
    addExperience(points)
    addActivity('points', reason, points)
  }
  
  // 更新连续学习天数
  function updateStreak() {
    const today = new Date().toISOString().split('T')[0]
    
    if (!streak.value.lastStudyDate) {
      // 首次学习
      streak.value.current = 1
      streak.value.lastStudyDate = today
      streak.value.highest = 1
      
      addActivity('streak', '开始学习连续记录！', 0)
      return 1
    }
    
    const lastDate = new Date(streak.value.lastStudyDate)
    const lastDateStr = lastDate.toISOString().split('T')[0]
    
    if (lastDateStr === today) {
      // 今天已经学习过了
      return streak.value.current
    }
    
    // 计算上次学习和今天的天数差
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (lastDateStr === yesterdayStr) {
      // 连续学习
      streak.value.current += 1
      
      // 更新最高连续天数
      if (streak.value.current > streak.value.highest) {
        streak.value.highest = streak.value.current
      }
      
      // 检查连续学习成就
      checkStreakAchievements()
      
      addActivity('streak', `连续学习 ${streak.value.current} 天！`, streak.value.current)
    } else {
      // 连续中断
      if (streak.value.current > 0) {
        addActivity('streak_broken', `连续学习中断！之前连续 ${streak.value.current} 天`, 0)
      }
      
      streak.value.current = 1
    }
    
    streak.value.lastStudyDate = today
    return streak.value.current
  }
  
  // 检查连续学习相关成就
  function checkStreakAchievements() {
    if (streak.value.current >= 3 && !achievements.value.daily_streak_3.unlocked) {
      unlockAchievement('daily_streak_3', '稳步前进', '连续学习3天')
    }
    
    if (streak.value.current >= 7 && !achievements.value.daily_streak_7.unlocked) {
      unlockAchievement('daily_streak_7', '一周坚持', '连续学习7天')
    }
    
    if (streak.value.current >= 30 && !achievements.value.daily_streak_30.unlocked) {
      unlockAchievement('daily_streak_30', '月度达人', '连续学习30天')
    }
  }
  
  // 解锁成就
  function unlockAchievement(id, name, description) {
    if (achievements.value[id] && !achievements.value[id].unlocked) {
      achievements.value[id].unlocked = true
      achievements.value[id].date = new Date().toISOString()
      
      // 记录成就
      addActivity('achievement', `解锁成就：${name} - ${description}`, 50)
      
      // 给予成就奖励 (50经验值)
      addExperience(50)
      
      return true
    }
    
    return false
  }
  
  // 设置活跃徽章
  function setActiveBadge(achievementId) {
    if (achievements.value[achievementId] && achievements.value[achievementId].unlocked) {
      activeBadge.value = achievementId
      return true
    }
    
    return false
  }
  
  // 添加活动历史记录
  function addActivity(type, description, value) {
    const activity = {
      type,
      description,
      value,
      timestamp: new Date().toISOString()
    }
    
    activityHistory.value.unshift(activity)
    
    // 限制历史记录数量，防止过多
    if (activityHistory.value.length > 100) {
      activityHistory.value = activityHistory.value.slice(0, 100)
    }
    
    return activity
  }
  
  // 检查特定时间相关成就
  function checkTimeBasedAchievements() {
    const now = new Date()
    const hour = now.getHours()
    
    if (hour >= 22 || hour < 5) {
      // 晚上10点到凌晨5点
      unlockAchievement('night_owl', '夜猫子', '在晚上10点后学习')
    }
    
    if (hour < 6) {
      // 凌晨6点前
      unlockAchievement('early_bird', '早起鸟', '在早上6点前学习')
    }
  }
  
  return {
    experience,
    level,
    nextLevelExp,
    levelProgress,
    currentTitle,
    streak,
    achievements,
    unlockedAchievements,
    activeBadge,
    activityHistory,
    addExperience,
    addPoints,
    updateStreak,
    unlockAchievement,
    setActiveBadge,
    addActivity,
    checkTimeBasedAchievements
  }
})
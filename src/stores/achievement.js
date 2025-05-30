// src/stores/achievement.js
import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { useCardStore } from './card';
import { useStudyStore } from './study';

export const useAchievementStore = defineStore('achievement', {
  state: () => ({
    achievements: [
      {
        id: 'first_card',
        title: '初出茅庐',
        description: '创建你的第一张卡片',
        icon: '🎬',
        condition: 'createFirstCard',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 10
      },
      {
        id: 'card_collector',
        title: '卡片收藏家',
        description: '创建10张卡片',
        icon: '📚',
        condition: 'createNCards',
        unlocked: false,
        progress: 0,
        target: 10,
        xp: 50
      },
      {
        id: 'card_master',
        title: '卡片大师',
        description: '创建50张卡片',
        icon: '🏆',
        condition: 'createNCards',
        unlocked: false,
        progress: 0,
        target: 50,
        xp: 200
      },
      {
        id: 'first_deck',
        title: '组织者',
        description: '创建你的第一个卡组',
        icon: '📂',
        condition: 'createFirstDeck',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 20
      },
      {
        id: 'deck_collector',
        title: '分类专家',
        description: '创建5个卡组',
        icon: '🗂️',
        condition: 'createNDecks',
        unlocked: false,
        progress: 0,
        target: 5,
        xp: 100
      },
      {
        id: 'first_study',
        title: '学习尝鲜',
        description: '完成第一次学习会话',
        icon: '🧠',
        condition: 'completeFirstStudy',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 30
      },
      {
        id: 'study_streak_3',
        title: '坚持不懈',
        description: '连续学习3天',
        icon: '🔥',
        condition: 'studyStreak',
        unlocked: false,
        progress: 0,
        target: 3,
        xp: 50
      },
      {
        id: 'study_streak_7',
        title: '一周精进',
        description: '连续学习7天',
        icon: '🌟',
        condition: 'studyStreak',
        unlocked: false,
        progress: 0,
        target: 7,
        xp: 100
      },
      {
        id: 'study_streak_30',
        title: '月度学霸',
        description: '连续学习30天',
        icon: '👑',
        condition: 'studyStreak',
        unlocked: false,
        progress: 0,
        target: 30,
        xp: 500
      },
      {
        id: 'perfect_session',
        title: '完美回答',
        description: '一次学习会话中全部回答正确',
        icon: '✨',
        condition: 'perfectSession',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 80
      },
      {
        id: 'review_master',
        title: '复习达人',
        description: '累计复习100张卡片',
        icon: '🔄',
        condition: 'reviewNCards',
        unlocked: false,
        progress: 0,
        target: 100,
        xp: 150
      },
      {
        id: 'review_champion',
        title: '复习冠军',
        description: '累计复习500张卡片',
        icon: '🏅',
        condition: 'reviewNCards',
        unlocked: false,
        progress: 0,
        target: 500,
        xp: 300
      },
      {
        id: 'night_owl',
        title: '夜猫子',
        description: '在午夜(0:00-4:00)学习',
        icon: '🦉',
        condition: 'studyAtNight',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 50
      },
      {
        id: 'early_bird',
        title: '早起鸟',
        description: '在早晨(5:00-8:00)学习',
        icon: '🌅',
        condition: 'studyInMorning',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 50
      },
      {
        id: 'weekend_warrior',
        title: '周末战士',
        description: '在周末连续学习',
        icon: '⚔️',
        condition: 'studyOnWeekends',
        unlocked: false,
        progress: 0,
        target: 1,
        xp: 40
      }
    ],
    recentlyUnlocked: [],
    totalXP: 0,
    level: 1,
    notificationVisible: false,
    currentNotification: null
  }),

  getters: {
    unlockedAchievements: (state) => state.achievements.filter(a => a.unlocked),
    lockedAchievements: (state) => state.achievements.filter(a => !a.unlocked),
    progressAchievements: (state) => state.achievements.filter(a => !a.unlocked && a.progress > 0),
    completionRate: (state) => {
      return state.achievements.length === 0 
        ? 0 
        : Math.round((state.unlockedAchievements.length / state.achievements.length) * 100);
    },
    xpToNextLevel: (state) => {
      return 100 * state.level; // 简单线性增长，每级增加100经验值需求
    },
    xpProgress: (state) => {
      const currentLevelThreshold = 100 * (state.level - 1);
      const nextLevelThreshold = 100 * state.level;
      const currentLevelXP = state.totalXP - currentLevelThreshold;
      const levelRange = nextLevelThreshold - currentLevelThreshold;
      return Math.round((currentLevelXP / levelRange) * 100);
    }
  },

  actions: {
    initializeAchievements() {
      const savedData = localStorage.getItem('achievements');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.achievements = data.achievements;
        this.totalXP = data.totalXP;
        this.level = data.level;
        this.recentlyUnlocked = data.recentlyUnlocked || [];
      }
    },

    saveAchievements() {
      localStorage.setItem('achievements', JSON.stringify({
        achievements: this.achievements,
        totalXP: this.totalXP,
        level: this.level,
        recentlyUnlocked: this.recentlyUnlocked
      }));
    },

    checkAchievements() {
      const cardStore = useCardStore();
      const studyStore = useStudyStore();
      const userStore = useUserStore();

      let unlockedAny = false;

      // 检查各种成就条件
      this.achievements.forEach(achievement => {
        if (achievement.unlocked) return;

        let newProgress = 0;
        
        switch (achievement.condition) {
          case 'createFirstCard':
            newProgress = cardStore.cards.length > 0 ? 1 : 0;
            break;
          
          case 'createNCards':
            newProgress = cardStore.cards.length;
            break;
          
          case 'createFirstDeck':
            newProgress = cardStore.decks.length > 0 ? 1 : 0;
            break;
          
          case 'createNDecks':
            newProgress = cardStore.decks.length;
            break;
          
          case 'completeFirstStudy':
            newProgress = studyStore.completedSessions > 0 ? 1 : 0;
            break;
          
          case 'studyStreak':
            newProgress = userStore.currentStreak;
            break;
          
          case 'perfectSession':
            newProgress = studyStore.hasPerfectSession ? 1 : 0;
            break;
          
          case 'reviewNCards':
            newProgress = studyStore.totalReviewedCards;
            break;
          
          case 'studyAtNight':
            const currentHour = new Date().getHours();
            newProgress = (currentHour >= 0 && currentHour < 4) && studyStore.isStudying ? 1 : 0;
            break;
          
          case 'studyInMorning':
            const morning = new Date().getHours();
            newProgress = (morning >= 5 && morning < 8) && studyStore.isStudying ? 1 : 0;
            break;
          
          case 'studyOnWeekends':
            const day = new Date().getDay();
            newProgress = (day === 0 || day === 6) && studyStore.isStudying ? 1 : 0;
            break;
        }

        // 更新进度
        if (newProgress !== achievement.progress) {
          achievement.progress = Math.min(newProgress, achievement.target);
          
          // 检查是否解锁
          if (achievement.progress >= achievement.target && !achievement.unlocked) {
            achievement.unlocked = true;
            this.totalXP += achievement.xp;
            this.recentlyUnlocked.push({
              ...achievement,
              timestamp: new Date().getTime()
            });
            unlockedAny = true;
            
            // 显示通知
            this.showNotification(achievement);
            
            // 检查升级
            this.checkLevelUp();
          }
        }
      });

      if (unlockedAny) {
        this.saveAchievements();
      }
    },

    checkLevelUp() {
      const newLevel = Math.floor(this.totalXP / 100) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        // 可以在这里添加升级通知
      }
    },

    showNotification(achievement) {
      this.currentNotification = achievement;
      this.notificationVisible = true;
      
      // 5秒后自动关闭
      setTimeout(() => {
        this.notificationVisible = false;
      }, 5000);
    },

    clearRecentlyUnlocked() {
      this.recentlyUnlocked = [];
      this.saveAchievements();
    },

    resetAchievements() {
      this.achievements.forEach(achievement => {
        achievement.unlocked = false;
        achievement.progress = 0;
      });
      this.totalXP = 0;
      this.level = 1;
      this.recentlyUnlocked = [];
      this.saveAchievements();
    }
  }
});
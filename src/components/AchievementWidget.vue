<!-- src/components/AchievementWidget.vue -->
<template>
    <div class="achievement-widget" @click="navigateToAchievements">
      <div class="level-info">
        <div class="level-circle">{{ achievementStore.level }}</div>
        <div class="level-text">等级</div>
      </div>
      
      <div class="achievements-preview">
        <div class="xp-info">
          <div class="xp-value">{{ achievementStore.totalXP }} XP</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${achievementStore.xpProgress}%` }"></div>
          </div>
        </div>
        
        <div class="recent-badge" v-if="achievementStore.recentlyUnlocked.length > 0">
          <div class="recent-icon">{{ achievementStore.recentlyUnlocked[achievementStore.recentlyUnlocked.length - 1].icon }}</div>
          <div class="recent-text">最近解锁: {{ achievementStore.recentlyUnlocked[achievementStore.recentlyUnlocked.length - 1].title }}</div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useAchievementStore } from '../stores/achievement';
  import { useRouter } from 'vue-router';
  
  const achievementStore = useAchievementStore();
  const router = useRouter();
  
  function navigateToAchievements() {
    router.push('/achievements');
  }
  </script>
  
  <style scoped>
  .achievement-widget {
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 10px;
    padding: 10px 15px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .achievement-widget:hover {
    background-color: #e0e0e0;
  }
  
  .level-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 15px;
  }
  
  .level-circle {
    width: 40px;
    height: 40px;
    background-color: #4CAF50;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2em;
  }
  
  .level-text {
    font-size: 0.8em;
    color: #666;
    margin-top: 5px;
  }
  
  .achievements-preview {
    flex: 1;
  }
  
  .xp-info {
    margin-bottom: 8px;
  }
  
  .xp-value {
    font-weight: bold;
    font-size: 0.9em;
    margin-bottom: 5px;
  }
  
  .progress-bar {
    height: 5px;
    background-color: #ddd;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .recent-badge {
    display: flex;
    align-items: center;
    font-size: 0.85em;
  }
  
  .recent-icon {
    margin-right: 5px;
  }
  
  .recent-text {
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  @media (max-width: 600px) {
    .achievement-widget {
      flex-direction: column;
      padding: 15px;
    }
    
    .level-info {
      margin-right: 0;
      margin-bottom: 15px;
    }
    
    .recent-text {
      white-space: normal;
    }
  }
  </style>
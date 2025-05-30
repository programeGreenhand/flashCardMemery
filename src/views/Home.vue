<template>
    <div class="home-container">
      <section class="hero">
        <h1>超绝至臻闪卡记忆系统</h1>
        <!-- <AchievementWidget /> -->
        <p class="subtitle">高效记忆，科学学习</p>
        
        <div class="stats-summary" v-if="isLoggedIn">
          <div class="stat-item">
            <div class="stat-value">{{ todayLearned }}</div>
            <div class="stat-label">今日已学习</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ dueCards.length }}</div>
            <div class="stat-label">待复习卡片</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ decks.length }}</div>
            <div class="stat-label">卡片集</div>
          </div>
        </div>
        
        <div class="action-buttons">
          <router-link v-if="isLoggedIn" to="/study" class="primary-btn">开始学习</router-link>
          <router-link v-else to="/login" class="primary-btn">登录</router-link>
          <router-link v-if="isLoggedIn" to="/decks" class="secondary-btn">我的卡片集</router-link>
        </div>
      </section>
      
      <section class="today-progress" v-if="isLoggedIn">
        <h2>今日学习进度</h2>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${todayProgress}%` }"></div>
          </div>
          <div class="progress-text">{{ todayLearned }} / {{ dailyGoal }} ({{ todayProgress }}%)</div>
        </div>
      </section>
      
      <section class="features">
        <h2>核心功能</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>科学的记忆算法</h3>
            <p>基于SM-2间隔重复算法，根据遗忘曲线优化复习时间</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>学习数据分析</h3>
            <p>全面记录和分析学习数据，助您了解学习效果</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>个性化学习计划</h3>
            <p>根据学习状态智能制定复习计划</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💾</div>
            <h3>离线学习</h3>
            <p>支持PWA离线使用，随时随地学习</p>
          </div>
        </div>
      </section>
      
      <section class="getting-started" v-if="!isLoggedIn">
        <h2>快速开始</h2>
        <ol class="steps">
          <li>
            <h3>创建账户或登录</h3>
            <p>开始使用前需要先创建账户</p>
          </li>
          <li>
            <h3>创建卡片集</h3>
            <p>创建一个包含相关知识点的卡片集</p>
          </li>
          <li>
            <h3>添加学习卡片</h3>
            <p>在卡片集中添加需要记忆的知识点</p>
          </li>
          <li>
            <h3>开始学习</h3>
            <p>使用科学的间隔重复算法高效记忆</p>
          </li>
        </ol>
      </section>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useUserStore } from '../stores/user'
  import { useDeckStore } from '../stores/deck'
  import { useStudyStore } from '../stores/study'
  import AchievementWidget from '../components/AchievementWidget.vue';
  
  const userStore = useUserStore()
  const deckStore = useDeckStore()
  const studyStore = useStudyStore()
  
  // 登录状态
  const isLoggedIn = computed(() => userStore.isLoggedIn)
  
  // 卡片集
  const decks = computed(() => deckStore.allDecks)
  
  // 学习数据
  const dueCards = computed(() => studyStore.dueCards)
  const todayLearned = computed(() => studyStore.todayLearned)
  const dailyGoal = computed(() => studyStore.dailyGoal)
  const todayProgress = computed(() => studyStore.todayProgress)
  </script>
  
  <style scoped>
  .home-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .hero {
    text-align: center;
    padding: 3rem 1rem;
    margin-bottom: 2rem;
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 2rem;
  }
  
  .stats-summary {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .stat-label {
    color: #666;
    font-size: 0.9rem;
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .primary-btn, .secondary-btn {
    padding: 0.8rem 1.5rem;
    border-radius: 6px;
    font-weight: bold;
    text-decoration: none;
    transition: transform 0.2s, background 0.2s;
  }
  
  .primary-btn {
    background: var(--primary-color);
    color: white;
  }
  
  .secondary-btn {
    background: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
  }
  
  .primary-btn:hover, .secondary-btn:hover {
    transform: translateY(-3px);
  }
  
  .primary-btn:hover {
    background: var(--secondary-color);
  }
  
  .secondary-btn:hover {
    background: rgba(74, 107, 175, 0.1);
  }
  
  .today-progress {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .progress-container {
    margin-top: 1rem;
  }
  
  .progress-bar {
    height: 10px;
    background: #eee;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--primary-color);
    border-radius: 5px;
    transition: width 0.5s;
  }
  
  .progress-text {
    text-align: right;
    font-size: 0.9rem;
    color: #666;
  }
  
  .features {
    margin-bottom: 3rem;
  }
  
  .features h2 {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .feature-card {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
  }
  
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .feature-card h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
  }
  
  .getting-started {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 3rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .getting-started h2 {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .steps {
    counter-reset: step;
    padding-left: 0;
  }
  
  .steps li {
    position: relative;
    padding-left: 3rem;
    margin-bottom: 2rem;
    list-style-type: none;
  }
  
  .steps li::before {
    counter-increment: step;
    content: counter(step);
    position: absolute;
    left: 0;
    top: 0;
    width: 2rem;
    height: 2rem;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .steps h3 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
  }
  
  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2rem;
    }
    
    .stats-summary {
      flex-direction: column;
      gap: 1rem;
    }
    
    .action-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .primary-btn, .secondary-btn {
      width: 100%;
      text-align: center;
    }
  }
  </style>
<template>
  <div class="stats-container">
    <div class="page-header">
      <h1>学习统计</h1>
      <div class="date-filter">
        <button 
          v-for="period in periods" 
          :key="period.value"
          class="period-btn"
          :class="{ active: selectedPeriod === period.value }"   
          @click="selectedPeriod = period.value"
        >   <!--  active可加可不加单引号，就是个类名  -->
          {{ period.label }}
        </button>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-title">总复习次数</div>
        <div class="stat-value">{{ studyStats.totalReviews }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">正确率</div>
        <div class="stat-value">{{ Math.round((studyStats.correctReviews / studyStats.totalReviews) * 100) || 0 }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">平均每日复习</div>
        <div class="stat-value">{{ getAverageDailyReviews() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">最长连续学习</div>
        <div class="stat-value">{{ streak.highest }}天</div>
      </div>
    </div>
    
    <div class="charts-container">
      <div class="chart-wrapper">
        <h2>学习活动</h2>
        <div class="chart" ref="activityChart"></div>
      </div>
      
      <div class="chart-wrapper">
        <h2>复习正确率</h2>
        <div class="chart" ref="accuracyChart"></div>   <!----为什么用ref-->
      </div>
    </div>
    
    <div class="mastery-section">
      <h2>卡片掌握状态</h2>
      <div class="mastery-chart-container">
        <div class="mastery-chart" ref="masteryChart"></div>
        <div class="mastery-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #4caf50;"></div>
            <div class="legend-label">已掌握</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #ffc107;"></div>
            <div class="legend-label">学习中</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f44336;"></div>
            <div class="legend-label">待学习</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="decks-analysis">
      <h2>卡片集进度</h2>
      <div v-if="decks.length === 0" class="empty-state">
        还没有创建任何卡片集
      </div>
      <div v-else class="decks-progress">
        <div 
          v-for="deck in decks" 
          :key="deck.id"
          class="deck-progress-item"
        >
          <div class="deck-info">
            <div class="deck-name">{{ deck.title }}</div>
            <div class="deck-progress-value">{{ getDeckMasteryPercentage(deck.id) }}%</div>
          </div>
          <div class="deck-progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: getDeckMasteryPercentage(deck.id) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="recent-activity">
      <h2>最近活动</h2>
      <div v-if="filteredHistory.length === 0" class="empty-state">
        没有最近的学习记录
      </div>
      <div v-else class="activity-timeline">
        <div 
          v-for="(day, index) in groupedActivity" 
          :key="index"
          class="activity-day"
        >
          <div class="day-header">
            <div class="day-date">{{ formatDate(day.date) }}</div>
            <div class="day-cards">学习了 {{ day.sessions.reduce((sum, s) => sum + s.cards, 0) }} 张卡片</div>
          </div>
          
          <div 
            v-for="(session, sessionIdx) in day.sessions" 
            :key="sessionIdx"
            class="activity-session"
          >
            <div class="session-time">{{ formatTime(session.timestamp) }}</div>
            <div class="session-details">
              <div class="session-cards">{{ session.cards }}张卡片</div>
              <div class="session-accuracy">
                正确率: {{ Math.round((session.correct / session.cards) * 100) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStudyStore } from '../stores/study'
import { useCardStore } from '../stores/card'
import { useDeckStore } from '../stores/deck'
import { useGameStore } from '../stores/game'
import { analyzeProgress } from '../utils/sm2'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册echarts组件
echarts.use([
  LineChart, PieChart, BarChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  CanvasRenderer
])

const studyStore = useStudyStore()
const cardStore = useCardStore()
const deckStore = useDeckStore()
const gameStore = useGameStore()

// 图表DOM引用
const activityChart = ref(null)
const accuracyChart = ref(null)
const masteryChart = ref(null)

// 图表实例
let activityChartInstance = null
let accuracyChartInstance = null
let masteryChartInstance = null

// 筛选周期
const selectedPeriod = ref('week')
const periods = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '本年' },
  { value: 'all', label: '全部' }
]

// 获取数据
const studyStats = computed(() => studyStore.studyStats)
const sessionHistory = computed(() => studyStats.value.sessionHistory || [])
const streak = computed(() => gameStore.streak)
const decks = computed(() => deckStore.allDecks)

// 根据选定的时间段过滤历史记录
const filteredHistory = computed(() => {
  const now = new Date()
  const history = [...sessionHistory.value]
  
  switch (selectedPeriod.value) {
    case 'week': {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())  ///计算本周第一天
      weekStart.setHours(0, 0, 0, 0)
      return history.filter(session => new Date(session.date) >= weekStart)
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return history.filter(session => new Date(session.date) >= monthStart)
    }
    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return history.filter(session => new Date(session.date) >= yearStart)
    }
    default:
      return history
  }
})

// 按日期分组的活动
const groupedActivity = computed(() => {
  const grouped = {}
  
  filteredHistory.value.forEach(session => {
    if (!grouped[session.date]) {
      grouped[session.date] = {
        date: session.date,
        sessions: []
      }
    }
    
    grouped[session.date].sessions.push({
      ...session,
      timestamp: session.date // 在实际应用中，session可能有具体时间戳
    })
  })
  
  // 转换为数组并按日期排序
  return Object.values(grouped).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )
})

// 获取平均每日复习卡片数
function getAverageDailyReviews() {
  if (sessionHistory.value.length === 0) return 0
  
  // 获取有效学习日期
  const studyDays = new Set(sessionHistory.value.map(s => s.date)).size
  
  if (studyDays === 0) return 0
  
  // 计算总复习卡片数
  const totalCards = sessionHistory.value.reduce((sum, session) => sum + session.cards, 0)
  
  return Math.round(totalCards / studyDays)
}

// 获取卡片集掌握百分比
function getDeckMasteryPercentage(deckId) {
  const deckCards = cardStore.getCardsByDeck(deckId)
  if (deckCards.length === 0) return 0
  
  const masteredCards = deckCards.filter(card => {
    const progress = cardStore.getCardProgress(card.id)
    return progress.repetitions >= 3 && progress.easeFactor > 2.0
  })
  
  return Math.round((masteredCards.length / deckCards.length) * 100)   ///这个函数是四舍五入
}

// 渲染学习活动图表
function renderActivityChart() {   //render表示渲染绘制
  if (!activityChart.value) return
  
  // 如果已经存在实例，需要销毁
  if (activityChartInstance) {
    activityChartInstance.dispose()
  }
  
  activityChartInstance = echarts.init(activityChart.value)
  
  // 准备数据
  const dates = []
  const reviewCounts = []
  
  // 根据选定时间段获取日期范围
  const now = new Date()
  let startDate = new Date()
  
  switch (selectedPeriod.value) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setDate(now.getDate() - 30)
      break
    case 'year':
      startDate.setDate(now.getDate() - 365)
      break
    default:
      // 全部数据，找出最早的记录日期
      if (sessionHistory.value.length > 0) {
        const earliest = sessionHistory.value.reduce((min, session) => 
          new Date(session.date) < new Date(min.date) ? session : min
        )
        startDate = new Date(earliest.date)
      } else {
        startDate.setDate(now.getDate() - 7) // 默认显示一周
      }
  }
  
  // 填充日期范围
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    dates.push(dateStr)
    
    // 查找该日期的学习记录
    const dayRecord = sessionHistory.value.find(s => s.date === dateStr)
    reviewCounts.push(dayRecord ? dayRecord.cards : 0)
  }
  
  // 配置图表
  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 张卡片'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.map(d => d.slice(5)), // 只显示月-日
      axisLabel: {
        interval: Math.ceil(dates.length / 10) // 控制显示密度
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} 张'
      }
    },
    series: [
      {
        name: '已学习',
        type: 'line',
        data: reviewCounts,
        smooth: true,
        lineStyle: {
          color: '#4a6baf'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74, 107, 175, 0.3)' },
              { offset: 1, color: 'rgba(74, 107, 175, 0.05)' }
            ]
          }
        },
        itemStyle: {
          color: '#4a6baf'
        }
      }
    ]
  }
  
  activityChartInstance.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    activityChartInstance.resize()
  })
}

// 渲染正确率图表
function renderAccuracyChart() {
  if (!accuracyChart.value) return
  
  // 如果已经存在实例，需要销毁
  if (accuracyChartInstance) {
    accuracyChartInstance.dispose()
  }
  
  accuracyChartInstance = echarts.init(accuracyChart.value)
  
  // 准备数据
  const dates = []
  const accuracyRates = []
  
  // 根据选择的时间段过滤数据
  const filteredData = filteredHistory.value
  
  // 如果没有数据，显示空图表
  if (filteredData.length === 0) {
    accuracyChartInstance.setOption({
      title: {
        text: '暂无数据',
        textStyle: {
          color: '#999',
          fontWeight: 'normal'
        },
        left: 'center',
        top: 'center'
      }
    })
    return
  }
  
  // 按日期排序
  filteredData.sort((a, b) => new Date(a.date) - new Date(b.date))
  
  // 提取日期和正确率
  filteredData.forEach(session => {
    dates.push(session.date.slice(5)) // 只显示月-日
    const accuracy = session.cards > 0 ? Math.round((session.correct / session.cards) * 100) : 0
    accuracyRates.push(accuracy)
  })
  
  // 配置图表
  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        interval: Math.ceil(dates.length / 10) // 控制显示密度
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '正确率',
        type: 'bar',
        data: accuracyRates,
        itemStyle: {
          color: function(params) {
            // 根据正确率变化颜色
            const value = params.value
            if (value >= 80) return '#4caf50'
            if (value >= 60) return '#ffc107'
            return '#f44336'
          }
        }
      }
    ]
  }
  
  accuracyChartInstance.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    accuracyChartInstance.resize()
  })
}

// 渲染掌握状态图表
function renderMasteryChart() {
  if (!masteryChart.value) return
  
  // 如果已经存在实例，需要销毁
  if (masteryChartInstance) {
    masteryChartInstance.dispose()
  }
  
  masteryChartInstance = echarts.init(masteryChart.value)
  
  // 分析所有卡片的掌握状态
  const progress = analyzeProgress(cardStore.cardsProgress)
  
  // 配置图表
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: progress.mastered, 
            name: '已掌握',
            itemStyle: { color: '#4caf50' }
          },
          { 
            value: progress.learning, 
            name: '学习中',
            itemStyle: { color: '#ffc107' }
          },
          { 
            value: progress.new, 
            name: '待学习',
            itemStyle: { color: '#f44336' }
          }
        ]
      }
    ]
  }
  
  masteryChartInstance.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    masteryChartInstance.resize()
  })
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }
}

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 监听时间段变化，重新渲染图表
watch(selectedPeriod, () => {
  renderActivityChart()
  renderAccuracyChart()
})

// 页面加载时初始化图表
onMounted(() => {
  renderActivityChart()
  renderAccuracyChart()
  renderMasteryChart()
})
</script>

<style scoped>
.stats-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
}

.date-filter {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.period-btn:hover {
  background-color: rgba(74, 107, 175, 0.1);
}

.period-btn.active {
  background-color: #4a6baf;
  color: white;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #4a6baf;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 960px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}

.chart-wrapper {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-wrapper h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.chart {
  height: 300px;
  width: 100%;
}

.mastery-section {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.mastery-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.mastery-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mastery-chart {
  height: 280px;
  width: 100%;
  max-width: 400px;
}

.mastery-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-label {
  font-size: 0.9rem;
  color: #606266;
}

.decks-analysis {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.decks-analysis h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.decks-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.deck-progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.deck-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deck-name {
  font-weight: 500;
  color: #303133;
}

.deck-progress-value {
  font-size: 0.9rem;
  color: #606266;
}

.deck-progress-bar {
  height: 8px;
  background-color: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4a6baf;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.recent-activity {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.recent-activity h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.activity-day {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ebeef5;
}

.day-date {
  font-weight: 600;
  color: #303133;
}

.day-cards {
  font-size: 0.9rem;
  color: #606266;
}

.activity-session {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.5rem 0;
}

.session-time {
  min-width: 60px;
  color: #909399;
  font-size: 0.9rem;
}

.session-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #303133;
}

.session-cards {
  font-weight: 500;
}

.session-accuracy {
  font-size: 0.9rem;
  color: #606266;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #909399;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .stats-container {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .session-details {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
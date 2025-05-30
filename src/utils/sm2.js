/**
 * SM-2间隔重复算法实现
 * 基于SuperMemo的间隔重复算法，用于计算记忆卡片的最佳复习时间
 *
 * 参数解释:
 * - quality: 回答质量 (0-5)
 *   0 - 完全不记得
 *   1 - 不记得，但认出来了
 *   2 - 严重错误，但想起一部分
 *   3 - 有错误，但最终想起来了
 *   4 - 正确，但有些困难
 *   5 - 完全正确，毫不费力
 * 
 * - easeFactor: 难易系数，默认值2.5，范围1.3-2.5
 * - interval: 复习间隔(天)
 * - repetitions: 连续正确回答次数
 */

// 计算下次复习时间
export function calculateNextReview(progress, quality) {
    // 获取当前进度或使用默认值
    const { 
      easeFactor = 2.5, 
      interval = 0, 
      repetitions = 0 
    } = progress || {}
    
    let newEaseFactor = easeFactor
    let newInterval = interval
    let newRepetitions = repetitions
    
    // 根据回答质量调整参数
    if (quality < 3) {
      // 回答错误，重置复习计数
      newRepetitions = 0
      newInterval = 1
    } else {
      // 回答正确，增加复习间隔
      newRepetitions += 1
      
      if (newRepetitions === 1) {
        newInterval = 1
      } else if (newRepetitions === 2) {
        newInterval = 6
      } else {
        newInterval = Math.round(newInterval * newEaseFactor)
      }
    }
    
    // 调整难易系数 (基于SuperMemo算法)
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    
    // 保证难易系数在合理范围内
    if (newEaseFactor < 1.3) newEaseFactor = 1.3
    
    // 计算下次复习日期
    const now = new Date()
    const dueDate = new Date()
    dueDate.setDate(now.getDate() + newInterval)
    
    return {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      dueDate: dueDate.toISOString(),
      lastReviewed: now.toISOString()
    }
  }
  
  // 计算复习效率
  export function calculateReviewEfficiency(stats) {
    if (!stats.totalReviews) return 0
    return Math.round((stats.correctReviews / stats.totalReviews) * 100)
  }
  
  // 分析学习进度
  export function analyzeProgress(progressData) {
    // 用于分析学习曲线、遗忘率等
    const totalCards = Object.keys(progressData).length
    if (totalCards === 0) return { retention: 0, mastered: 0, learning: 0, new: 0 }
    
    let mastered = 0
    let learning = 0
    let newCards = 0
    
    for (const cardId in progressData) {
      const progress = progressData[cardId]
      
      if (progress.repetitions >= 3 && progress.easeFactor > 2.0) {
        mastered++
      } else if (progress.repetitions > 0) {
        learning++
      } else {
        newCards++
      }
    }
    
    return {
      retention: Math.round((mastered / totalCards) * 100),
      mastered,
      learning,
      new: newCards
    }
  }
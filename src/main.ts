import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 必需引入样式


// 修改导入方式为按需引入
import * as echarts from 'echarts/core'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

// 注册组件（确保版本一致性）
echarts.use([
  TooltipComponent, 
  LegendComponent, 
  PieChart, 
  CanvasRenderer
])

// 创建Vue应用
const app = createApp(App)

// 注册Pinia状态管理
app.use(createPinia())
// 注册路由
app.use(router)
app.use(ElementPlus)
// 挂载应用
app.mount('#app')

// 注册Service Worker (PWA支持)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration)
    }).catch(error => {
      console.log('SW registration failed: ', error)
    })
  })
}
import { ref, onMounted } from 'vue'

// 创建一个全局状态来存储toast
const toasts = ref([])

export function useToast() {
  // 显示toast
  function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now()
    
    // 添加新toast
    toasts.value.push({
      id,
      message,
      type,
      visible: false // 初始不可见，用于触发动画
    })
    
    // 在下一帧设置为可见，触发入场动画
    setTimeout(() => {
      const index = toasts.value.findIndex(toast => toast.id === id)
      if (index !== -1) {
        toasts.value[index].visible = true
      }
    }, 10)
    
    // 设置自动关闭
    setTimeout(() => {
      closeToast(id)
    }, duration)
    
    return id
  }
  
  // 关闭toast
  function closeToast(id) {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      // 设置为不可见，触发退场动画
      toasts.value[index].visible = false
      
      // 动画结束后从列表中移除
      setTimeout(() => {
        toasts.value = toasts.value.filter(toast => toast.id !== id)
      }, 300)
    }
  }
  
  // 插入全局toast容器
  onMounted(() => {
    if (!document.getElementById('global-toast-container')) {
      const container = document.createElement('div')
      container.id = 'global-toast-container'
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `
      document.body.appendChild(container)
      
      // 添加全局样式
      const style = document.createElement('style')
      style.textContent = `
        .toast {
          padding: 12px 16px;
          border-radius: 6px;
          color: white;
          min-width: 250px;
          max-width: 350px;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 8px;
          transform: translateX(100%);
          opacity: 0;
          transition: transform 0.3s, opacity 0.3s;
        }
        
        .toast.visible {
          transform: translateX(0);
          opacity: 1;
        }
        
        .toast.info {
          background-color: #4a6baf;
        }
        
        .toast.success {
          background-color: #4caf50;
        }
        
        .toast.error {
          background-color: #f44336;
        }
        
        .toast.warning {
          background-color: #ff9800;
        }
        
        .toast-icon {
          font-size: 18px;
        }
        
        .toast-message {
          flex: 1;
        }
        
        .toast-close {
          cursor: pointer;
          font-size: 18px;
          opacity: 0.8;
        }
        
        .toast-close:hover {
          opacity: 1;
        }
        
        @media (max-width: 480px) {
          #global-toast-container {
            left: 20px;
            right: 20px;
            top: auto;
            bottom: 20px;
          }
          
          .toast {
            min-width: 0;
            max-width: none;
            width: 100%;
            transform: translateY(100%);
          }
          
          .toast.visible {
            transform: translateY(0);
          }
        }
      `
      document.head.appendChild(style)
      
      // 设置渲染函数
      function renderToasts() {
        const container = document.getElementById('global-toast-container')
        if (!container) return
        
        // 清空容器
        container.innerHTML = ''
        
        // 渲染所有toast
        toasts.value.forEach(toast => {
          const toastElement = document.createElement('div')
          toastElement.className = `toast ${toast.type} ${toast.visible ? 'visible' : ''}`
          
          // 图标
          let icon = ''
          switch (toast.type) {
            case 'success': icon = '✅'; break;
            case 'error': icon = '❌'; break;
            case 'warning': icon = '⚠️'; break;
            default: icon = 'ℹ️';
          }
          
          toastElement.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${toast.message}</div>
            <div class="toast-close" onclick="document.dispatchEvent(new CustomEvent('close-toast', {detail: {id: ${toast.id}}}))">×</div>
          `
          
          container.appendChild(toastElement)
        })
      }
      
      // 监听关闭事件
      document.addEventListener('close-toast', (e) => {
        closeToast(e.detail.id)
      })
      
      // 监听toasts变化并重新渲染
      setInterval(() => {
        renderToasts()
      }, 100)
    }
  })
  
  return { showToast, closeToast, toasts }
}
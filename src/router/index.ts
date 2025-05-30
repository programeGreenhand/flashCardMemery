import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Achievements from '../views/Achievements.vue'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/decks',
    name: 'DeckList',
    component: () => import('../views/DeckList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/decks/:id',
    name: 'DeckDetail',
    component: () => import('../views/DeckDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cards/new',
    name: 'NewCard',
    component: () => import('../views/CardEditor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cards/:id/edit',
    name: 'EditCard',
    component: () => import('../views/CardEditor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/study',
    name: 'Study',
    component: () => import('../views/Study.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/study/:deckId',
    name: 'StudyDeck',
    component: () => import('../views/Study.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/Stats.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/achievements',
    name: 'achievements',
    component: Achievements
  },
  // {
  //   path: '/CardEditor',
  //   name: 'CardEditor',
  //   component: () => import('../views/CardEditor.vue')
  // },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  // 检查该路由是否需要登录权限
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 未登录时重定向到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
import { createRouter, createWebHashHistory } from 'vue-router'
import RecommendView from '@/views/RecommendView.vue'
import NearbyView from '@/views/NearbyView.vue'
import TideCalendarView from '@/views/TideCalendarView.vue'
import SeafoodGuideView from '@/views/SeafoodGuideView.vue'
import CatchLogView from '@/views/CatchLogView.vue'
import SettingsView from '@/views/SettingsView.vue'

// 用 hash 路由：Capacitor Android 下无服务端，深链接刷新不会 404
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/recommend' },
    { path: '/recommend', name: 'recommend', component: RecommendView },
    { path: '/nearby', name: 'nearby', component: NearbyView },
    { path: '/calendar', name: 'calendar', component: TideCalendarView },
    { path: '/seafood-guide', name: 'seafood-guide', component: SeafoodGuideView },
    { path: '/catch-log', name: 'catch-log', component: CatchLogView },
    { path: '/settings', name: 'settings', component: SettingsView }
  ]
})

export default router

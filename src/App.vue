<template>
  <div class="app-shell">
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
    <nav class="tab-bar">
      <button :class="{ active: route.name === 'recommend' }" @click="go('recommend')">
        <Icon name="compass" /><span>推荐</span>
      </button>
      <button :class="{ active: route.name === 'nearby' }" @click="go('nearby')">
        <Icon name="pin" /><span>附近</span>
      </button>
      <button :class="{ active: route.name === 'calendar' }" @click="go('calendar')">
        <Icon name="calendar" /><span>月历</span>
      </button>
      <button :class="{ active: route.name === 'seafood-guide' }" @click="go('seafood-guide')">
        <Icon name="book" /><span>图鉴</span>
      </button>
      <button :class="{ active: route.name === 'catch-log' || route.name === 'settings' }" @click="go('catch-log')">
        <Icon name="trophy" /><span>我的</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const router = useRouter()

function go(name: string) {
  router.push({ name })
}
</script>

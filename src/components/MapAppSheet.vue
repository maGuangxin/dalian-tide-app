<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="sheet">
      <div class="handle"></div>
      <h3>选择导航 App</h3>
      <p class="sub" v-if="spot">目的地：{{ spot.name }}</p>
      <ul class="apps">
        <li v-for="a in MAP_APPS" :key="a.id" @click="launch(a.id)">
          <span class="name">{{ a.name }}</span>
          <span class="installed">点击即尝试打开</span>
        </li>
      </ul>
      <button class="cancel" @click="$emit('close')">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MAP_APPS } from '@/services/mapLaunch'
import type { Spot } from '@/types'

defineProps<{ spot?: Spot }>()
const emit = defineEmits<{ (e: 'launch', appId: string): void; (e: 'close'): void }>()

function launch(appId: string) {
  emit('launch', appId)
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 50;
}
.sheet {
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 12px 16px 24px;
}
.handle {
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0 auto 12px;
}
.sub {
  color: var(--text-sub);
  font-size: 12px;
  margin-bottom: 10px;
}
.apps {
  list-style: none;
}
.apps li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}
.apps .name {
  font-weight: 700;
}
.apps .installed {
  color: var(--tide-best);
  font-size: 13px;
}
.cancel {
  width: 100%;
  margin-top: 6px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  cursor: pointer;
}
</style>

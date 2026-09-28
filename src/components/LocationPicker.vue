<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="sheet">
      <div class="handle"></div>
      <h3>选择赶海地点（内置 · 数据固定）</h3>
      <p class="sub">内置地点 · 共 {{ spots.length }} 个（距离按定位实时计算）</p>
      <input class="search" v-model="kw" placeholder="搜索地点" />
      <ul class="list">
        <li
          v-for="s in filtered"
          :key="s.id"
          :class="{ active: s.id === current }"
          @click="pick(s.id)"
        >
          <span class="name">{{ s.name }}</span>
          <span class="meta">{{ s.distanceBaseKm }}km · {{ tideText(s.tideType) }}</span>
          <span v-if="s.id === current" class="check">✓</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SPOTS } from '@/data/spots'

defineProps<{ current?: string }>()
const emit = defineEmits<{ (e: 'select', id: string): void; (e: 'close'): void }>()

const kw = ref('')
const spots = SPOTS
const filtered = computed(() => spots.filter((s) => s.name.includes(kw.value)))

function tideText(t: string) {
  return t === 'big' ? '大潮' : t === 'mid' ? '中潮' : '小潮'
}
function pick(id: string) {
  emit('select', id)
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
  max-height: 80vh;
  overflow-y: auto;
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
  margin-bottom: 8px;
}
.search {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  margin-bottom: 10px;
}
.list {
  list-style: none;
}
.list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}
.list li.active {
  border-color: var(--brand-from);
  background: #eef5ff;
}
.list .name {
  font-weight: 700;
  flex: 1;
}
.list .meta {
  color: var(--text-sub);
  font-size: 12px;
}
.list .check {
  color: var(--brand-from);
  font-weight: 700;
}
</style>

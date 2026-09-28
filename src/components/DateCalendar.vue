<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="sheet">
      <div class="handle"></div>
      <div class="cal-head">
        <button @click="prev">‹</button>
        <span>{{ year }}年{{ month + 1 }}月</span>
        <button @click="next">›</button>
      </div>
      <div class="weekdays">
        <span v-for="w in ['日', '一', '二', '三', '四', '五', '六']" :key="w">{{ w }}</span>
      </div>
      <div class="grid">
        <span
          v-for="cell in cells"
          :key="cell.key"
          :class="['cell', cell.cls, { selected: cell.key === selectedKey }]"
          @click="cell.day && cell.cls !== 'disabled' ? pick(cell) : null"
        >
          <template v-if="cell.day">{{ cell.day }}<small>{{ cell.lunar }}</small></template>
        </span>
      </div>
      <div class="legend">
        <span class="big">■ 大潮</span>
        <span class="mid">■ 中潮</span>
        <span class="small">■ 小潮</span>
      </div>
      <button class="btn-primary" @click="$emit('close')">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toLunar } from '@/services/lunar'
import { isTideDateSupported } from '@/services/openMeteo'

const props = defineProps<{ initialDate?: string; selectedKey?: string }>()
const emit = defineEmits<{ (e: 'select', key: string): void; (e: 'close'): void }>()

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
function parseKey(key?: string): { y: number; m: number } {
  if (key) {
    const [y, m] = key.split('-').map(Number)
    if (y && m) return { y, m: m - 1 }
  }
  const now = new Date()
  return { y: now.getFullYear(), m: now.getMonth() }
}

const init = parseKey(props.initialDate)
const year = ref(init.y)
const month = ref(init.m) // 0-based

interface Cell {
  key: string
  day: number
  lunar: string
  cls: string
}

const cells = computed<Cell[]>(() => {
  const first = new Date(year.value, month.value, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const arr: Cell[] = []
  for (let i = 0; i < startDow; i++) arr.push({ key: `e${i}`, day: 0, lunar: '', cls: 'empty' })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year.value, month.value, d)
    const lu = toLunar(date)
    const supported = isTideDateSupported(date)
    arr.push({
      key: `${year.value}-${pad(month.value + 1)}-${pad(d)}`,
      day: d,
      lunar: lu.text,
      cls: !supported ? 'disabled' : lu.isSpringTide ? 'big' : 'mid'
    })
  }
  return arr
})

// 外部选中日期变化时（如日期条），日历自动跳到对应月份
watch(
  () => props.selectedKey,
  (key) => {
    const p = parseKey(key)
    year.value = p.y
    month.value = p.m
  }
)

function prev() {
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else month.value--
}
function next() {
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else month.value++
}
function pick(cell: Cell) {
  emit('select', cell.key)
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
.cal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  margin-bottom: 12px;
}
.cal-head button {
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
}
.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.weekdays span {
  text-align: center;
  font-size: 12px;
  color: var(--text-sub);
  padding: 4px 0;
}
.cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.cell small {
  font-size: 9px;
  color: var(--text-sub);
}
.cell.empty {
  cursor: default;
}
.cell.disabled {
  opacity: 0.32;
  cursor: not-allowed;
  background: transparent;
  color: var(--text-sub);
}
.cell.selected {
  outline: 2px solid var(--brand-from);
  outline-offset: -2px;
}
.cell.big {
  background: rgba(229, 72, 77, 0.16);
  color: var(--tide-forbidden);
}
.cell.mid {
  background: rgba(59, 130, 246, 0.14);
  color: var(--tide-ok);
}
.cell.small {
  background: rgba(95, 102, 117, 0.1);
  color: var(--text-sub);
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  margin: 12px 0;
}
.legend .big {
  color: var(--tide-forbidden);
}
.legend .mid {
  color: var(--tide-ok);
}
.legend .small {
  color: var(--text-sub);
}
</style>

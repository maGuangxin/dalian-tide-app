<template>
  <div class="calendar">
    <header class="hero">
      <div>
        <h1>潮汐月历</h1>
        <p>农历大潮一览 · 点选日期看推荐</p>
      </div>
    </header>

    <section class="card">
      <div class="month-nav">
        <button @click="prevMonth"><Icon name="walk" :size="16" style="transform: rotate(180deg)" /></button>
        <strong>{{ viewYear }}年{{ viewMonth + 1 }}月</strong>
        <button @click="nextMonth"><Icon name="walk" :size="16" /></button>
      </div>

      <div class="week-head">
        <span v-for="w in weekHead" :key="w">{{ w }}</span>
      </div>

      <div class="grid">
        <button
          v-for="cell in cells"
          :key="cell.key"
          class="cell"
          :class="{ dim: cell.dim, today: cell.isToday, forecast: cell.hasForecast }"
          @click="pick(cell)"
        >
          <span class="d">{{ cell.day }}</span>
          <span class="moon">{{ cell.lunarText }}</span>
          <span v-if="cell.hasForecast" class="dot" :style="{ background: cell.scoreColor }"></span>
          <span v-else class="dot spring" :class="{ on: cell.springIndex >= 0.5 }"></span>
          <span v-if="cell.hasForecast" class="score">{{ cell.score }}分</span>
        </button>
      </div>

      <div class="legend">
        <span><i class="sw" style="background: #18a957"></i>≥75 优</span>
        <span><i class="sw" style="background: #3b82f6"></i>50–74 良</span>
        <span><i class="sw" style="background: #f59e0b"></i>&lt;50 一般</span>
        <span><i class="ring"></i>大潮(农历)</span>
      </div>
      <p class="hint">未来 16 天显示真实潮汐适宜分；更早日期按农历大潮估算（无实时预报）。</p>
    </section>

    <!-- 选中日详情 -->
    <section class="card detail" v-if="picked">
      <h2>{{ picked.date.slice(5) }} · 农历{{ picked.lunarText }}</h2>
      <p v-if="picked.hasForecast">
        潮汐适宜 <strong :style="{ color: picked.scoreColor }">{{ picked.score }} 分</strong>
        <span v-if="picked.isSpringTide"> · 大潮活汛</span>
        <span v-if="!picked.daylight"> · 夜潮</span>
      </p>
      <p v-else>农历{{ picked.lunarText }}{{ picked.isSpringTide ? ' · 大潮活汛' : ' · 小潮' }}（超出实时预报，按农历估算）</p>
      <button class="btn-primary" @click="goRecommend(picked.key)">
        <Icon name="compass" :size="16" /> 查看当日推荐
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { toLunar } from '@/services/lunar'
import { useTide } from '@/composables/useTide'
import { useSettings } from '@/composables/useSettings'
import { useSpots } from '@/composables/useSpots'
import { getSpotById } from '@/data/spots'
import { MAX_TIDE_FORECAST_DAYS } from '@/services/openMeteo'

const router = useRouter()
const { rangeDays, loadRange, rangeLoading } = useTide()
const { settings, load: loadSettings } = useSettings()
const { load: loadSpots } = useSpots()

const weekHead = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const picked = ref<null | { key: string; date: string; lunarText: string; isSpringTide: boolean; daylight: boolean; score: number; scoreColor: string; hasForecast: boolean }>(null)

function scoreColor(score: number): string {
  if (score >= 75) return '#18a957'
  if (score >= 50) return '#3b82f6'
  return '#f59e0b'
}

// 把未来 N 天真实预报按日期建索引，便于月历格快速查
const forecastMap = computed(() => {
  const m = new Map<string, { score: number; isSpringTide: boolean; daylight: boolean }>()
  for (const d of rangeDays.value) {
    m.set(d.date, { score: d.score, isSpringTide: d.isSpringTide, daylight: d.bestWindowDaylight })
  }
  return m
})

interface Cell {
  key: string
  day: number
  dim: boolean
  isToday: boolean
  lunarText: string
  springIndex: number
  isSpringTide: boolean
  hasForecast: boolean
  score: number
  scoreColor: string
  daylight: boolean
}

const cells = computed<Cell[]>(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const first = new Date(y, m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const out: Cell[] = []
  for (let i = 0; i < startPad; i++) out.push(blankCell())
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const lunar = toLunar(new Date(y, m, d))
    const fc = forecastMap.value.get(key)
    out.push({
      key,
      day: d,
      dim: false,
      isToday: key === todayKey,
      lunarText: lunar.text.replace(/^.*?([初甘廿卅十].*)$/, '$1'),
      springIndex: lunar.springIndex,
      isSpringTide: lunar.isSpringTide,
      hasForecast: !!fc,
      score: fc?.score ?? 0,
      scoreColor: fc ? scoreColor(fc.score) : '#cbd5e1',
      daylight: fc?.daylight ?? true
    })
  }
  while (out.length % 7 !== 0) out.push(blankCell())
  return out
})

function blankCell(): Cell {
  return {
    key: '',
    day: 0,
    dim: true,
    isToday: false,
    lunarText: '',
    springIndex: 0,
    isSpringTide: false,
    hasForecast: false,
    score: 0,
    scoreColor: '#cbd5e1',
    daylight: true
  }
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else viewMonth.value--
  picked.value = null
}
function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else viewMonth.value++
  picked.value = null
}

function pick(cell: Cell) {
  if (cell.dim || !cell.key) return
  picked.value = {
    key: cell.key,
    date: cell.key,
    lunarText: cell.lunarText,
    isSpringTide: cell.isSpringTide,
    daylight: cell.daylight,
    score: cell.score,
    scoreColor: cell.scoreColor,
    hasForecast: cell.hasForecast
  }
}

function goRecommend(key: string) {
  // 借助全局选中日期，跳到推荐页即加载该日
  import('@/composables/useSelectedDate').then(({ useSelectedDate }) => {
    useSelectedDate().setDate(key)
    router.push({ name: 'recommend' })
  })
}

onMounted(async () => {
  await Promise.all([loadSettings(), loadSpots()])
  const spot = getSpotById(settings.value.defaultSpotId) ?? getSpotById('haixian')
  if (spot) await loadRange(spot.lat, spot.lng, MAX_TIDE_FORECAST_DAYS)
})

// 切月不重拉；数据已含未来 16 天，足够覆盖本月绝大部分日期
watch(rangeLoading, () => {})
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
  color: #fff;
}
.hero h1 {
  font-size: 20px;
}
.hero p {
  font-size: 12px;
  opacity: 0.85;
}
.card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px;
  margin: 6px 14px;
}
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.month-nav button {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
}
.week-head,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.week-head span {
  text-align: center;
  font-size: 12px;
  color: var(--text-sub);
  padding-bottom: 6px;
}
.cell {
  border: none;
  background: none;
  position: relative;
  aspect-ratio: 1 / 1.05;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 8px;
  cursor: pointer;
}
.cell.dim {
  visibility: hidden;
}
.cell.today {
  outline: 2px solid var(--brand-from);
}
.cell.forecast {
  background: #f3f8fd;
}
.cell .d {
  font-size: 14px;
  font-weight: 700;
}
.cell .moon {
  font-size: 10px;
  color: var(--text-sub);
  transform: scale(0.92);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #cbd5e1;
}
.dot.spring {
  border: 1.5px solid #cbd5e1;
  background: transparent;
}
.dot.spring.on {
  background: var(--tide-best);
  border-color: var(--tide-best);
}
.score {
  font-size: 9px;
  color: var(--text-sub);
}
.detail h2 {
  font-size: 16px;
  margin-bottom: 6px;
}
.detail p {
  font-size: 14px;
  margin-bottom: 10px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--text-sub);
}
.legend .sw {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 3px;
  vertical-align: middle;
}
.legend .ring {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid var(--tide-best);
  margin-right: 3px;
  vertical-align: middle;
}
.hint {
  font-size: 11px;
  color: var(--text-sub);
  margin-top: 8px;
}
.btn-primary {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>

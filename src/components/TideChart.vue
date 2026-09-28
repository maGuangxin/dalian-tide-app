<template>
  <div class="tide-chart">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="svg">
      <!-- 四段语义色带（仅在绘图区内） -->
      <rect
        v-for="(b, i) in bands"
        :key="'b' + i"
        :x="b.x"
        :y="plotY0"
        :width="b.w"
        :height="plotH"
        :fill="b.color"
        fill-opacity="0.16"
      />
      <!-- 最佳赶海窗口高亮 -->
      <rect
        v-if="bestBand"
        :x="bestBand.x"
        :y="plotY0"
        :width="bestBand.w"
        :height="plotH"
        fill="#18A957"
        fill-opacity="0.20"
      />
      <line v-if="bestBand" :x1="bestBand.x" :y1="plotY0" :x2="bestBand.x" :y2="plotY1" stroke="#18A957" stroke-width="1" />
      <line v-if="bestBand" :x1="bestBand.x + bestBand.w" :y1="plotY0" :x2="bestBand.x + bestBand.w" :y2="plotY1" stroke="#18A957" stroke-width="1" />
      <text v-if="bestBand" :x="bestBand.x + bestBand.w / 2" :y="plotY0 + 12" text-anchor="middle" class="best-label">最佳</text>
      <!-- 横向网格线（按潮高刻度） -->
      <line
        v-for="(t, i) in yTicks"
        :key="'gy' + i"
        :x1="plotX0"
        :y1="t.y"
        :x2="plotX1"
        :y2="t.y"
        stroke="#E2E8F0"
        stroke-width="1"
      />
      <!-- 平均海平面基准线 -->
      <line :x1="plotX0" :y1="baseY" :x2="plotX1" :y2="baseY" stroke="#94A3B8" stroke-width="1" stroke-dasharray="4 4" />
      <!-- 坐标轴 -->
      <line :x1="ML" :y1="plotY0" :x2="ML" :y2="plotY1" stroke="#64748B" stroke-width="1" />
      <line :x1="plotX0" :y1="plotY1" :x2="plotX1" :y2="plotY1" stroke="#64748B" stroke-width="1" />
      <!-- 潮位曲线 -->
      <path :d="curve" fill="none" stroke="#0F2747" stroke-width="2.5" stroke-linejoin="round" />
      <!-- 高低潮点 -->
      <circle
        v-for="(pt, i) in extrema"
        :key="'e' + i"
        :cx="pt.x"
        :cy="pt.y"
        r="3"
        :fill="pt.high ? '#18A957' : '#3B82F6'"
      />
      <!-- 潮高轴刻度标签 -->
      <text
        v-for="(t, i) in yTicks"
        :key="'yl' + i"
        :x="ML - 6"
        :y="t.y"
        text-anchor="end"
        dominant-baseline="middle"
        class="axis"
      >{{ t.label }}</text>
      <!-- 潮高轴标题（旋转 -90°，居中） -->
      <text :x="11" :y="plotCenterY" text-anchor="middle" class="axis-title" :transform="'rotate(-90 11 ' + plotCenterY + ')'">潮高/m</text>
      <!-- 时间轴标签 -->
      <text
        v-for="(t, i) in xTicks"
        :key="'xl' + i"
        :x="t.x"
        :y="H - 7"
        text-anchor="middle"
        class="axis"
      >{{ t.label }}</text>
    </svg>
    <!-- 图例（SVG 色块，避免 emoji 在窄屏渲染不一致） -->
    <div class="legend">
      <span v-for="(lg, i) in legendItems" :key="i" class="lg">
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <circle cx="5" cy="5" r="5" :fill="lg.color" />
        </svg>
        {{ lg.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TidePoint } from '@/types'

const props = defineProps<{ points: TidePoint[]; height?: number; bestWindow?: { start: string; end: string } }>()

const W = 360 // 贴近 390 容器实际宽度，减少 preserveAspectRatio=none 拉伸带来的刻度变形
const H = props.height ?? 164

// 绘图区边距，给坐标轴留空间（窄屏刻度放大）
const ML = 42 // 左（潮高轴）
const MR = 12 // 右
const MT = 12 // 上
const MB = 28 // 下（时间轴）
const plotX0 = ML
const plotX1 = W - MR
const plotY0 = MT
const plotY1 = H - MB
const plotW = plotX1 - plotX0
const plotH = plotY1 - plotY0

const COLORS: Record<string, string> = {
  forbidden: '#E5484D',
  ok: '#3B82F6',
  best: '#18A957',
  return: '#F59E0B'
}

// 图例项（与四段语义色一致），用于底部 SVG 色块图例
const legendItems = [
  { color: COLORS.forbidden, label: '禁止' },
  { color: COLORS.ok, label: '可赶海' },
  { color: COLORS.best, label: '最佳' },
  { color: COLORS.return, label: '回程' }
]

const bounds = computed(() => {
  const hs = props.points.map((p) => p.height)
  return { min: Math.min(...hs), max: Math.max(...hs) }
})

// 把采样索引映射到绘图区 x
function px(i: number, n: number) {
  return n <= 1 ? plotX0 : plotX0 + (i / (n - 1)) * plotW
}
// 把潮高映射到绘图区 y
function py(h: number) {
  const { min, max } = bounds.value
  return plotY1 - ((h - min) / (max - min || 1)) * plotH
}

const bands = computed(() => {
  const n = props.points.length
  if (n === 0) return []
  const segW = plotW / n
  return props.points.map((p, i) => ({ x: plotX0 + i * segW, w: segW + 0.6, color: COLORS[p.level] }))
})

// 最佳赶海窗口高亮带（覆盖在四段色带之上，标出"退得最远"的区间）
const bestBand = computed(() => {
  const n = props.points.length
  if (n === 0 || !props.bestWindow) return null
  let s = -1
  let e = -1
  for (let i = 0; i < n; i++) {
    const t = props.points[i].time
    if (t >= props.bestWindow.start && s < 0) s = i
    if (t <= props.bestWindow.end) e = i
  }
  if (s < 0 || e < 0 || e < s) return null
  const x = plotX0 + (s / (n - 1)) * plotW
  const w = ((e - s) / (n - 1)) * plotW
  return { x, w }
})

const baseY = computed(() => (plotY0 + plotY1) / 2)
const plotCenterY = computed(() => (plotY0 + plotY1) / 2)

const curve = computed(() => {
  const n = props.points.length
  if (n === 0) return ''
  return props.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i, n).toFixed(1)} ${py(p.height).toFixed(1)}`)
    .join(' ')
})

const extrema = computed(() => {
  const n = props.points.length
  const pts: { x: number; y: number; high: boolean }[] = []
  if (n < 3) return pts
  for (let i = 1; i < n - 1; i++) {
    const h0 = props.points[i - 1].height
    const h1 = props.points[i].height
    const h2 = props.points[i + 1].height
    const isHigh = h1 >= h0 && h1 >= h2
    const isLow = h1 <= h0 && h1 <= h2
    if (isHigh || isLow) {
      pts.push({ x: px(i, n), y: py(h1), high: isHigh })
    }
  }
  return pts
})

// 潮高轴刻度：上/中/下
const yTicks = computed(() => {
  const { min, max } = bounds.value
  return [max, (max + min) / 2, min].map((v) => ({ y: py(v), label: v.toFixed(1) }))
})

// 时间轴刻度：取 0/1/4/2/4/3/4/末 五个位置
const xTicks = computed(() => {
  const n = props.points.length
  if (n < 2) return []
  const idxs = [0, Math.floor((n - 1) / 4), Math.floor((n - 1) / 2), Math.floor((3 * (n - 1)) / 4), n - 1]
  const seen = new Set<number>()
  const out: { x: number; label: string }[] = []
  for (const i of idxs) {
    if (seen.has(i)) continue
    seen.add(i)
    out.push({ x: px(i, n), label: props.points[i].time.slice(11, 16) })
  }
  return out
})
</script>

<style scoped>
.tide-chart {
  margin: 8px 0;
}
.svg {
  width: 100%;
  height: 164px;
  display: block;
  border-radius: 12px;
  background: #f7fafc;
}
.axis {
  font-size: 11px;
  fill: #64748b;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}
.axis-title {
  font-size: 11px;
  fill: #475569;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 8px;
}
.legend .lg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.best-label {
  font-size: 10px;
  fill: #18A957;
  font-weight: 700;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}
</style>

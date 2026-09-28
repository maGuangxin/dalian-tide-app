import { ref } from 'vue'
import {
  fetchMarine,
  fetchSun,
  isTideDateSupported,
  MAX_TIDE_FORECAST_DAYS,
  type SunDaily
} from '@/services/openMeteo'
import { toLunar } from '@/services/lunar'
import { getCache, setCache, tideCacheKey, tideRangeCacheKey } from '@/services/cache'
import { exposureMetric, daylightFraction, tideScore } from '@/utils/tideScore'
import type { TideDay, TideLevel, TidePoint } from '@/types'

// 四段语义（按潮高在当日区间的相对位置 t∈[0,1]，0=最低潮，1=最高潮）：
// 赶海最佳是水退得最远 = 低潮，t 越小越好；高潮浪大危险 = 禁止。
// 注：此分类仅用于潮位图着色（展示当日潮形），推荐判定见 buildDay 的权威低潮窗口算法。
function classify(t: number): TideLevel {
  if (t >= 0.75) return 'forbidden' // 高潮，浪大危险
  if (t >= 0.5) return 'return' // 涨潮中，推荐回程
  if (t >= 0.25) return 'ok' // 中等低潮，可赶海
  return 'best' // 低潮，退得最远，最佳
}

function ymd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 从日出日落日数据里取某日期的白天毫秒区间；缺失则退化为固定近似。 */
function sunForDay(sun: SunDaily | null, dateStr: string): { riseMs: number; setMs: number } | undefined {
  if (!sun) return undefined
  const idx = sun.time.indexOf(dateStr)
  if (idx < 0) return undefined
  return {
    riseMs: new Date(sun.sunrise[idx]).getTime(),
    setMs: new Date(sun.sunset[idx]).getTime()
  }
}

const EXPOSE_FRAC = 0.3 // 仍为"水浅"的阈值：低潮上方 30% 潮差以内视为滩涂暴露
const MAX_WIN_MS = 6 * 3600 * 1000 // 最佳窗口最长 6 小时，避免平台期把窗口撑爆

/** 由逐小时采样点 + 当日日出日落，加工出单日潮汐推荐结构（权威低潮窗口算法）。 */
function buildDay(points: TidePoint[], date: Date, sun?: { riseMs: number; setMs: number }): TideDay {
  const heights = points.map((p) => p.height)
  const min = Math.min(...heights)
  const max = Math.max(...heights)
  const range = max - min || 1
  // 四段着色（相对当日潮高，供潮位图可视化）
  points.forEach((p) => {
    p.level = classify((p.height - min) / range)
  })

  // 低潮极值（局部最小）
  const lows: number[] = []
  for (let i = 1; i < heights.length - 1; i++) {
    if (heights[i] <= heights[i - 1] && heights[i] <= heights[i + 1]) lows.push(i)
  }
  if (lows.length === 0) {
    let mi = 0
    for (let i = 1; i < heights.length; i++) if (heights[i] < heights[mi]) mi = i
    lows.push(mi)
  }

  const ms = points.map((p) => new Date(p.time).getTime())
  const n = points.length
  // 退化白天：无日出日落数据时按 06:30–18:30 近似
  const fallback = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const riseMs = sun?.riseMs ?? new Date(fallback).setHours(6, 30, 0, 0)
  const setMs = sun?.setMs ?? new Date(fallback).setHours(18, 30, 0, 0)

  const lunar = toLunar(date)

  // 对每个低潮：向两侧扩展出"滩涂暴露窗口"，按 曝光度×白天 选最佳
  let best = {
    li: lows[0],
    score: -1,
    win: { start: points[lows[0]].time, end: points[lows[0]].time },
    daylightFrac: 0,
    exposure: 0,
    lowHeight: heights[lows[0]]
  }
  const thr = min + EXPOSE_FRAC * range
  for (const li of lows) {
    let s = li
    let e = li
    while (s > 0 && heights[s - 1] <= thr && ms[s] - ms[s - 1] <= 3600000 && ms[e] - ms[s] <= MAX_WIN_MS) s--
    while (e < n - 1 && heights[e + 1] <= thr && ms[e + 1] - ms[e] <= 3600000 && ms[e] - ms[s] <= MAX_WIN_MS) e++
    const wStart = ms[s]
    const wEnd = ms[e]
    const daylightFrac = daylightFraction(wStart, wEnd, riseMs, setMs)
    const exposure = exposureMetric(range, heights[li])
    // 白天强烈优先：夜间低潮即使更低也不如白天低潮适合普通人
    const lowScore = exposure * (0.35 + 0.65 * daylightFrac)
    if (lowScore > best.score) {
      best = {
        li,
        score: lowScore,
        win: { start: points[s].time, end: points[e].time },
        daylightFrac,
        exposure,
        lowHeight: heights[li]
      }
    }
  }

  // 兼容旧字段：ok/best 连续区间
  const okIdx = points
    .map((p, i) => (p.level === 'ok' || p.level === 'best' ? i : -1))
    .filter((i) => i >= 0)
  const okWindows = okIdx.length
    ? [{ start: points[okIdx[0]].time, end: points[okIdx[okIdx.length - 1]].time }]
    : []

  return {
    date: ymd(date),
    lunarText: lunar.text,
    lunarDay: lunar.day,
    isSpringTide: lunar.isSpringTide,
    springIndex: lunar.springIndex,
    points,
    bestWindow: best.win,
    bestWindowDaylight: best.daylightFrac > 0.2,
    range,
    lowHeight: best.lowHeight,
    exposure: best.exposure,
    daylightFrac: best.daylightFrac,
    score: tideScore(best.exposure, best.daylightFrac, lunar.springIndex),
    okWindows
  }
}

export function useTide() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cached = ref(false) // 当前展示的是否为离线缓存
  const day = ref<TideDay | null>(null)

  // 近 N 天好日子（推荐页用）
  const rangeLoading = ref(false)
  const rangeError = ref<string | null>(null)
  const rangeDays = ref<TideDay[]>([])

  // 请求控制器：切换日期/地点时取消上一个未完成请求，避免竞态与旧响应覆盖
  let tideCtrl: AbortController | null = null
  let rangeCtrl: AbortController | null = null

  async function loadByDate(lat: number, lng: number, date: Date) {
    if (!isTideDateSupported(date)) {
      error.value = `仅支持未来 ${MAX_TIDE_FORECAST_DAYS} 天潮汐预报`
      loading.value = false
      return
    }
    const dateStr = ymd(date)
    const key = tideCacheKey(lat, lng, dateStr)
    // 取消上一个未完成请求，快速切日期时旧响应不再覆盖新日期
    tideCtrl?.abort()
    tideCtrl = new AbortController()
    const sig = tideCtrl.signal
    loading.value = true
    error.value = null
    // 缓存优先：冷启动/弱网先即时展示上次成功的数据，再后台刷新
    const c = await getCache<TideDay>(key)
    if (c) {
      day.value = c
      cached.value = true
    }
    try {
      const [mres, sun] = await Promise.all([
        fetchMarine(lat, lng, { startDate: dateStr, endDate: dateStr, signal: sig }),
        fetchSun(lat, lng, 1, sig).catch(() => null)
      ])
      if (sig.aborted) return
      const points: TidePoint[] = mres.time.map((t, i) => ({
        time: t,
        height: mres.sea_level_height_msl[i],
        level: 'forbidden'
      }))
      day.value = buildDay(points, date, sunForDay(sun, dateStr))
      cached.value = false
      await setCache(key, day.value)
    } catch (e) {
      if (sig.aborted) return
      if (!day.value) error.value = e instanceof Error ? e.message : '潮汐数据获取失败'
    } finally {
      if (!sig.aborted) loading.value = false
    }
  }

  /** 取未来 days 天逐小时预报，按日加工，用于推荐页"好日子" */
  async function loadRange(lat: number, lng: number, days = 16) {
    const key = tideRangeCacheKey(lat, lng, days)
    rangeCtrl?.abort()
    rangeCtrl = new AbortController()
    const sig = rangeCtrl.signal
    rangeLoading.value = true
    rangeError.value = null
    // 缓存优先：先即时展示，后台刷新
    const c = await getCache<TideDay[]>(key)
    if (c) rangeDays.value = c
    try {
      const [mres, sun] = await Promise.all([
        fetchMarine(lat, lng, { days, signal: sig }),
        fetchSun(lat, lng, days, sig).catch(() => null)
      ])
      if (sig.aborted) return
      const byDate = new Map<string, { t: string; h: number }[]>()
      mres.time.forEach((t, i) => {
        const d0 = t.slice(0, 10)
        if (!byDate.has(d0)) byDate.set(d0, [])
        byDate.get(d0)!.push({ t, h: mres.sea_level_height_msl[i] })
      })
      const result: TideDay[] = []
      for (const [dayStr, arr] of byDate) {
        const [yy, mm, dd] = dayStr.split('-').map(Number)
        const points: TidePoint[] = arr.map((a) => ({ time: a.t, height: a.h, level: 'forbidden' }))
        result.push(buildDay(points, new Date(yy, mm - 1, dd), sunForDay(sun, dayStr)))
      }
      rangeDays.value = result
      await setCache(key, result)
    } catch (e) {
      if (sig.aborted) return
      if (!rangeDays.value.length) rangeError.value = e instanceof Error ? e.message : '好日子计算失败'
    } finally {
      if (!sig.aborted) rangeLoading.value = false
    }
  }

  return { loading, error, cached, day, loadByDate, rangeLoading, rangeError, rangeDays, loadRange }
}

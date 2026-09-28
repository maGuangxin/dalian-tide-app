<template>
  <div class="recommend">
    <!-- Hero -->
    <header class="hero">
      <div>
        <h1>赶海助手</h1>
        <p>{{ heroText }}</p>
      </div>
      <div class="hero-badge">
        <span>适宜指数</span>
        <strong>{{ suitScore }} 分</strong>
      </div>
    </header>

    <!-- 离线缓存提示 -->
    <p class="cache-note" v-if="weatherCached || tideCached">（当前为离线缓存数据，联网后自动刷新）</p>

    <!-- 今日赶海建议（天气适宜结论 + 本期最佳潮汐合一，避免同一结论割裂） -->
    <section
      class="card advice"
      v-if="weatherNow || weatherOutOfRange || weatherErr || tideDay || tideErr"
    >
      <div class="advice-head">
        <span class="advice-title">今日赶海建议</span>
        <span class="verdict" :class="weatherSuit.ok ? 'ok' : 'no'" v-if="weatherNow">{{ weatherSuit.label }}</span>
      </div>
      <div class="advice-wx" v-if="weatherNow">
        <Icon name="sun" :size="18" /> {{ weatherNow.text }} {{ weatherNow.temp }}° · 风力 {{ windLevel }}级
      </div>
      <div class="advice-wx" v-else-if="weatherOutOfRange">
        <Icon name="fog" :size="18" /> 该日天气暂无预报（超出 16 天）
      </div>
      <div class="advice-wx" v-else-if="weatherErr">天气获取失败：{{ weatherErr }}</div>

      <div class="advice-best" v-if="tideDay">
        <Icon name="starFill" :size="16" />
        <div>
          <p class="best-name">
            本期最佳 · {{ bestSpot?.name }}（{{ tideDay.date.slice(5) }} 农历{{ tideDay.lunarText
            }}{{ tideDay.isSpringTide ? ' · 大潮活汛' : '' }}）
          </p>
          <p class="big" v-if="tideDay.bestWindow">最佳赶海 {{ fmt(tideDay.bestWindow.start) }}–{{ fmt(tideDay.bestWindow.end) }}</p>
          <p class="big" v-else>今日暂无最佳时段</p>
          <p class="sub" v-if="tideDay.bestWindow && tideDay.bestWindowDaylight">退得最远、贝类最多，建议低潮前 30 分钟到场</p>
          <p class="sub" v-else-if="tideDay.bestWindow">当日最佳低潮在夜间，建议改选白天低潮或带照明前往</p>
        </div>
      </div>
      <div class="advice-best" v-else-if="tideErr">
        <p class="sub">潮汐获取失败：{{ tideErr }}</p>
      </div>
    </section>

    <!-- 未来 N 天好日子（真实潮汐预报计算，窗口与 marine 一致） -->
    <section class="card">
      <h2>推荐好日子 · 按适宜指数排序</h2>
      <ul class="days">
        <li v-for="d in goodDays" :key="d">{{ d }}</li>
      </ul>
      <p class="sub" v-if="rangeLoading">好日子计算中…</p>
      <p class="sub" v-else-if="rangeError">{{ rangeError }}</p>
    </section>

    <!-- 潮位图（真实四段曲线，接 useTide） -->
    <section class="card" v-if="tideDay">
      <h2>潮位图 · {{ bestSpot?.name }} {{ tideDay.date.slice(5) }}</h2>
      <TideChart :points="tideDay.points" :best-window="tideDay.bestWindow" />
    </section>
    <section class="card" v-else-if="tideErr">
      <h2>潮位图</h2>
      <p class="sub">{{ tideErr }}</p>
    </section>

    <button
      class="btn-primary"
      :class="{ 'is-set': remindSet }"
      @click="onRemind"
    >
      <Icon :name="remindSet ? 'bellOff' : 'bell'" :size="16" />
      {{ remindSet ? '取消提醒' : '提醒我最佳时段' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useWeather } from '@/composables/useWeather'
import { useTide } from '@/composables/useTide'
import { useSettings } from '@/composables/useSettings'
import { useSelectedDate } from '@/composables/useSelectedDate'
import { getSpotById } from '@/data/spots'
import { MAX_TIDE_FORECAST_DAYS } from '@/services/openMeteo'
import { beaufortLevel, tideSuitability, type TideSuit } from '@/utils/beaufort'
import type { TideDay } from '@/types'
import TideChart from '@/components/TideChart.vue'
import Icon from '@/components/Icon.vue'

const { now: weatherNow, error: weatherErr, cached: weatherCached, outOfRange: weatherOutOfRange, load: loadWeather } = useWeather()
const { day: tideDay, error: tideErr, cached: tideCached, loadByDate, rangeDays, rangeError, rangeLoading, loadRange } = useTide()
const { settings, load: loadSettings } = useSettings()
const { selectedDate, selectedDateTime } = useSelectedDate()

// 推荐页默认展示用户设置的常用地点，而非写死的固定点
const bestSpot = computed(() => getSpotById(settings.value.defaultSpotId) ?? getSpotById('haixian')!)
// 好日子范围与潮汐预报窗口一致（marine 免费档未来 16 天）
const RANGE_DAYS = MAX_TIDE_FORECAST_DAYS

const weekdayArr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
// 头部日期标题跟随选中日期
const heroText = computed(() => {
  const d = selectedDateTime.value
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdayArr[d.getDay()]} · 大连`
})
// 适宜指数 = 潮汐适宜分(0–100，含潮差/白天/大潮) × 天气因子。
// 天气恶劣 → 0；风力 5 级 → 0.8；<5 级 → 1。无天气数据时仅用潮汐分。
const weatherFactor = computed(() => {
  if (!weatherNow.value) return 1
  if (!weatherSuit.value.ok) return 0
  return windLevel.value >= 5 ? 0.8 : 1
})
const suitScore = computed(() => {
  if (!tideDay.value) return 0
  const wf = weatherNow.value ? weatherFactor.value : 1
  return Math.round(tideDay.value.score * wf)
})

// 蒲福风级（Open-Meteo 风速为 km/h，需换算）
const windLevel = computed(() => (weatherNow.value ? beaufortLevel(weatherNow.value.windSpeed) : 0))
// 赶海天气适宜结论：基于天气码 + 风力，替换原硬编码「宜赶海」
const weatherSuit = computed<TideSuit>(() =>
  weatherNow.value
    ? tideSuitability(weatherNow.value.weatherCode, weatherNow.value.windSpeed)
    : { ok: true, label: '宜赶海' }
)

// 好日子：未来 N 天真实预报按"适宜指数"排序，取前列（>=50 分）Top 8
const goodDays = computed(() => {
  const ranked = [...rangeDays.value]
    .filter((d) => d.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
  return ranked.map((d) => {
    const w = d.bestWindow
    const time = w ? `${w.start.slice(11, 16)}–${w.end.slice(11, 16)}` : '—'
    const springTag = d.isSpringTide ? ' · 大潮' : ''
    const dayTag = d.bestWindowDaylight ? '' : ' · 夜潮'
    return `${d.date.slice(5)} 农历${d.lunarText}${springTag}${dayTag} · 最佳 ${time} · ${d.score}分`
  })
})

function fmt(iso: string) {
  return iso.slice(11, 16)
}

// 通知权限（本地通知，无服务端）；已授权直接返回，否则请求一次
async function ensureNotifyPermission(): Promise<boolean> {
  try {
    const cur = await LocalNotifications.checkPermissions()
    if (cur.display === 'granted') return true
    const req = await LocalNotifications.requestPermissions()
    return req.display === 'granted'
  } catch {
    return false
  }
}

// 大潮活汛预警：按设置开关，对未来窗口内的大潮日本地通知（id 用日期，重复调度幂等）
async function scheduleSpringTideAlerts() {
  if (!settings.value.notifySpringTide) return
  const granted = await ensureNotifyPermission()
  if (!granted) return
  const now = Date.now()
  const notifications = rangeDays.value
    .filter((d: TideDay) => d.isSpringTide)
    .map((d: TideDay) => {
      const [y, m, dd] = d.date.split('-').map(Number)
      const at = new Date(y, m - 1, dd, 7, 0) // 大潮当天早上 7 点提醒
      if (at.getTime() <= now) return null
      const id = Number(d.date.replace(/-/g, '')) // YYYYMMDD，全局唯一
      return {
        id,
        title: '🌊 大潮活汛预警',
        body: `${d.date} 大连大潮活汛，适合赶海`,
        schedule: { at }
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
  if (notifications.length) {
    try {
      await LocalNotifications.schedule({ notifications })
    } catch {
      // 调度失败不影响主流程
    }
  }
}

async function onRemind() {
  if (!tideDay.value?.bestWindow) {
    alert('暂无最佳时段可提醒')
    return
  }
  if (!settings.value.notifyBest) {
    alert('已在设置中关闭「最佳时段前提醒」')
    return
  }
  const granted = await ensureNotifyPermission()
  if (!granted) {
    alert('未授予通知权限，无法设置提醒')
    return
  }
  // 已设置 → 取消（撤销该日最佳时段本地通知）
  if (remindSet.value) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
      remindSet.value = false
      alert('已取消最佳时段提醒')
    } catch (e) {
      alert('取消失败：' + (e instanceof Error ? e.message : '未知错误'))
    }
    return
  }
  // 未设置 → 排程：最佳时段开始前 30 分钟（已过则顺延到次日）
  const at = new Date(tideDay.value.bestWindow.start)
  const remindAt = new Date(at.getTime() - 30 * 60000)
  if (remindAt <= new Date()) remindAt.setDate(remindAt.getDate() + 1)
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: '⏰ 最佳赶海时段提醒',
          body: `${bestSpot.value?.name ?? '当前地点'} 最佳赶海 ${fmt(tideDay.value.bestWindow.start)}–${fmt(tideDay.value.bestWindow.end)}`,
          schedule: { at: remindAt },
          extra: { spot: bestSpot.value?.id }
        }
      ]
    })
    remindSet.value = true
    alert(`已设置本地提醒：${remindAt.getMonth() + 1}月${remindAt.getDate()}日 ${fmt(tideDay.value.bestWindow.start)} 前 30 分钟`)
  } catch (e) {
    alert('设置提醒失败：' + (e instanceof Error ? e.message : '未知错误'))
  }
}

// 与系统真实待发通知同步：切日期/切地点后，按钮状态如实反映是否仍有排程
const remindSet = ref(false)
async function syncRemindState() {
  try {
    const { notifications } = await LocalNotifications.getPending()
    remindSet.value = notifications.some((n) => n.id === 1)
  } catch {
    remindSet.value = false
  }
}

onMounted(async () => {
  await loadSettings()
  const spot = bestSpot.value
  if (spot) {
    loadWeather(spot.lat, spot.lng, selectedDateTime.value)
    loadByDate(spot.lat, spot.lng, selectedDateTime.value)
    await loadRange(spot.lat, spot.lng, RANGE_DAYS)
    await scheduleSpringTideAlerts()
  }
  await syncRemindState()
})

// 全局选中日期变化（如在"附近"切换日期）→ 推荐页全部按日期展示的数据同步刷新
watch(selectedDate, () => {
  const spot = bestSpot.value
  if (!spot) return
  loadByDate(spot.lat, spot.lng, selectedDateTime.value)
  loadWeather(spot.lat, spot.lng, selectedDateTime.value)
})

// 当日最佳时段变化时，重新与系统待发通知同步（按钮如实反映是否仍有排程）
watch(() => tideDay.value?.bestWindow?.start, syncRemindState)

// 用户更改默认常用地点 → 推荐页整页按新地点重算
watch(
  () => settings.value.defaultSpotId,
  async () => {
    const spot = bestSpot.value
    if (!spot) return
    loadWeather(spot.lat, spot.lng, selectedDateTime.value)
    loadByDate(spot.lat, spot.lng, selectedDateTime.value)
    await loadRange(spot.lat, spot.lng, RANGE_DAYS)
    await scheduleSpringTideAlerts()
  }
)
</script>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
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
.hero-badge {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 8px 12px;
  text-align: center;
}
.hero-badge span {
  font-size: 11px;
}
.hero-badge strong {
  font-size: 18px;
  display: block;
}
.cache-note {
  margin: 6px 14px 0;
  color: var(--text-sub);
  font-size: 12px;
}
.card {
  margin: 6px 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 3px 10px rgba(15, 39, 71, 0.08);
}
.advice {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.advice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.advice-title {
  font-size: 15px;
  font-weight: 700;
}
.advice-wx {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
}
.advice-best {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.advice-best .best-name {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}
.verdict {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}
.verdict.ok {
  color: var(--tide-best);
  background: #e7f6ee;
  font-weight: 700;
}
.verdict.no {
  color: #d8493a;
  background: #fdecea;
  font-weight: 700;
}
.big {
  color: var(--tide-best);
  font-size: 20px;
  font-weight: 700;
  margin: 6px 0;
}
.sub {
  color: var(--text-sub);
  font-size: 13px;
}
.days {
  list-style: none;
  margin-top: 8px;
  max-height: 168px;
  overflow-y: auto;
}
.days li {
  color: #1b2330;
  font-size: 13px;
  line-height: 22px;
}
.btn-primary {
  width: calc(100% - 28px);
  margin: 12px 14px;
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
/* 已设置提醒 → 切换为描边"取消"态 */
.btn-primary.is-set {
  color: var(--brand-from);
  background: #fff;
  border: 1px solid var(--brand-from);
}
</style>

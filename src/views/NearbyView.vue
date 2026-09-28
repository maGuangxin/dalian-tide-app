<template>
  <div class="nearby">
    <header class="nb-header">
      <h2>附近</h2>
      <button
        class="refresh-btn"
        :class="{ spinning: locating || tideLoading }"
        :disabled="locating || tideLoading"
        @click="refreshAll"
        aria-label="刷新数据与定位"
      >
        <Icon name="refresh" :size="18" />
      </button>
    </header>

    <!-- 日期选择条（横滑 7 天） -->
    <div class="date-strip">
      <button
        v-for="d in weekDates"
        :key="d.key"
        :class="{ active: d.key === selectedDate }"
        @click="selectedDate = d.key"
      >
        {{ d.label }}<small>{{ d.lunar }}</small>
      </button>
      <button class="more" @click="showCalendar = true"><Icon name="calendar" :size="16" /> 其他日期</button>
    </div>

    <!-- 首次定位引导（仅首次启动且未定位时展示，localStorage 记忆已引导） -->
    <section class="card onboard" v-if="showOnboard">
      <div class="onboard-row">
        <Icon name="location" :size="20" />
        <div>
          <p class="onboard-title">开启定位，体验更佳</p>
          <p class="sub">开启后显示实时位置，并在地图上画出前往的实际行驶路线（驾车/步行）。位置数据仅在本机使用。</p>
        </div>
      </div>
      <div class="onboard-actions">
        <button class="btn-ghost" @click="dismissOnboard">暂不</button>
        <button class="btn-primary sm" :disabled="locating" @click="enableLocation">
          {{ locating ? '定位中…' : '开启定位' }}
        </button>
      </div>
    </section>

    <!-- 地点字段 -->
    <button class="loc-field" @click="showPicker = true">
      <Icon name="location" :size="16" /> {{ currentSpot?.name }} <span class="caret">▾</span>
    </button>

    <!-- 地图（点地图弹 App 抽屉） -->
    <MapView :spot="currentSpot" @tap="showMapApps = true" />

    <!-- 出行方式切换（仅定位后展示）：驾车最短路线 / 步行 -->
    <div class="route-mode" v-if="located">
      <button :class="{ active: routeMode === 'driving' }" @click="setMode('driving')">
        <Icon name="car" :size="14" /> 驾车
      </button>
      <button :class="{ active: routeMode === 'walking' }" @click="setMode('walking')">
        <Icon name="walk" :size="14" /> 步行
      </button>
    </div>

    <!-- 地点详情 -->
    <section class="card" v-if="currentSpot">
      <h3>{{ currentSpot.name }}</h3>
      <p class="sub" v-if="routeLoading">
        <Icon name="navigate" :size="14" /> 路线规划中…
      </p>
      <p class="sub" v-else-if="routeResult">
        {{ routeModeText }}{{ routeResult.distanceKm.toFixed(1) }}km · 约 {{ routeMinutes }} 分钟 ·
        <Icon name="starFill" :size="14" />{{ currentSpot.rating }}
      </p>
      <p class="sub" v-else>
        距离 {{ distanceKm }}km（{{ located ? '实时直线' : '默认估算' }}）·
        <Icon name="starFill" :size="14" />{{ currentSpot.rating }}
      </p>
      <p class="loc-state" v-if="locating">正在获取定位…</p>
      <p class="loc-state" v-else-if="lastError === 'location unavailable'">
        定位服务暂时不可用，建议到开阔地带或检查系统定位/GPS 开关
      </p>
      <p class="loc-state" v-else-if="!located">未获取到定位，已显示默认距离</p>
      <p>{{ currentSpot.facilities.join(' ') }}</p>
      <div class="seafood" v-if="currentSpot.seafood?.length">
        <span class="seafood-label">附近海域常见海鲜</span>
        <div class="seafood-grid">
          <div class="seafood-item" v-for="s in currentSpot.seafood" :key="s">
            <img
              v-if="getSeafoodIcon(s)"
              class="seafood-icon"
              :src="getSeafoodIcon(s)!"
              :alt="extractSeafoodName(s)"
            />
            <span v-else class="seafood-fallback">{{ s }}</span>
            <span class="seafood-name">{{ extractSeafoodName(s) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 潮位卡 -->
    <section class="card" v-if="tideDay">
      <h3>
        详细潮位 · {{ currentSpot?.name }} · {{ tideDay.lunarText }}
        {{ tideDay.isSpringTide ? '· 大潮活汛' : '' }}
      </h3>
      <p v-if="tideDay.bestWindow" class="big">
        最佳 {{ fmt(tideDay.bestWindow.start) }}–{{ fmt(tideDay.bestWindow.end) }}
      </p>
      <p v-else class="sub">今日无最佳时段</p>
      <p v-if="tideDay.bestWindow && !tideDay.bestWindowDaylight" class="sub night-note">
        当日最佳低潮在夜间，建议改选白天低潮或带照明前往
      </p>
      <TideChart :points="tideDay.points" :best-window="tideDay.bestWindow" />
    </section>
    <section class="card" v-else-if="tideErr">
      <h3>详细潮位</h3>
      <p class="sub">{{ tideErr }}</p>
    </section>

    <button class="btn-primary" @click="onPersist"><Icon name="plus" :size="16" /> 设为常用地点</button>

    <!-- 弹层 -->
    <LocationPicker v-if="showPicker" :current="currentSpot?.id" @select="onPick" @close="showPicker = false" />
    <DateCalendar v-if="showCalendar" :initial-date="selectedDate" :selected-key="selectedDate" @select="onDate" @close="showCalendar = false" />
    <MapAppSheet v-if="showMapApps" :spot="currentSpot" @launch="onLaunch" @close="showMapApps = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated, ref, watch, computed } from 'vue'
import { getSpotById } from '@/data/spots'
import { extractSeafoodName, getSeafoodIcon } from '@/data/seafoodIcons'
import { toLunar } from '@/services/lunar'
import { launchMap } from '@/services/mapLaunch'
import { useTide } from '@/composables/useTide'
import { useSettings } from '@/composables/useSettings'
import { useSelectedDate } from '@/composables/useSelectedDate'
import { usePosition } from '@/composables/usePosition'
import { useRoute } from '@/composables/useRoute'
import LocationPicker from '@/components/LocationPicker.vue'
import DateCalendar from '@/components/DateCalendar.vue'
import MapAppSheet from '@/components/MapAppSheet.vue'
import TideChart from '@/components/TideChart.vue'
import MapView from '@/components/MapView.vue'
import Icon from '@/components/Icon.vue'
import type { Spot } from '@/types'

const { day: tideDay, error: tideErr, loading: tideLoading, loadByDate } = useTide()
const { settings, load: loadSettings, toggleFavorite } = useSettings()
const { selectedDate } = useSelectedDate()
const { myPos, locating, lastError, refresh, distanceTo } = usePosition()
const { route: routeResult, loading: routeLoading, mode: routeMode, compute: computeRoute, setMode } = useRoute()

const currentSpot = ref<Spot | undefined>(getSpotById('haixian'))
const showPicker = ref(false)
const showCalendar = ref(false)
const showMapApps = ref(false)
const weekDates = ref<{ key: string; label: string; lunar: string }[]>([])

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function buildWeek() {
  const arr: { key: string; label: string; lunar: string }[] = []
  const base = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 86400000)
    const lu = toLunar(d)
    arr.push({
      // 本地零填充 ymd，与 useSelectedDate/DateCalendar 的本地 key 保持一致，避免 UTC 跨天错位
      key: ymd(d),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      lunar: lu.text
    })
  }
  weekDates.value = arr
}

function fmt(iso: string) {
  return iso.slice(11, 16)
}

// 派生距离：已定位→按当前位置算直线距离；未定位→回退内置默认距离
const distanceKm = computed<number>(() => {
  if (!currentSpot.value) return 0
  const d = distanceTo(currentSpot.value)
  return d != null ? Math.round(d * 10) / 10 : currentSpot.value.distanceBaseKm
})
const located = computed(() => myPos.value != null)

// 路线展示派生：出行方式文案 + 预计分钟（durationSec→分钟，至少 1 分钟）
const routeMinutes = computed(() =>
  routeResult.value ? Math.max(1, Math.round(routeResult.value.durationSec / 60)) : 0
)
const routeModeText = computed(() => (routeMode.value === 'driving' ? '驾车 ' : '步行 '))

// 位置 / 地点变化 → 重新规划「实际道路路线」（出行方式沿用当前选择）
watch([myPos, currentSpot], () => {
  computeRoute(
    myPos.value,
    currentSpot.value ? [currentSpot.value.lat, currentSpot.value.lng] : null,
    routeMode.value
  )
})

// 首次定位引导：未引导过且尚未定位时展示引导卡；用户操作后写入 localStorage，不再打扰
const geoOnboarded = ref(localStorage.getItem('geo_onboarded') === '1')
const showOnboard = computed(() => !geoOnboarded.value && !located.value)
function dismissOnboard() {
  geoOnboarded.value = true
  localStorage.setItem('geo_onboarded', '1')
}
async function enableLocation() {
  geoOnboarded.value = true
  localStorage.setItem('geo_onboarded', '1')
  await refresh()
}

// 刷新按钮：重拉当前位置（地图路线 + 距离随之刷新），并重载该地点潮汐
async function refreshAll() {
  if (!currentSpot.value) return
  await refresh()
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  loadByDate(currentSpot.value.lat, currentSpot.value.lng, new Date(y, m - 1, d))
}

function reloadTide() {
  if (!currentSpot.value) return
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  loadByDate(currentSpot.value.lat, currentSpot.value.lng, new Date(y, m - 1, d))
}

function onPick(id: string) {
  currentSpot.value = getSpotById(id)
  showPicker.value = false
  reloadTide()
}

function onDate(key: string) {
  selectedDate.value = key
  showCalendar.value = false
  // 刷新由 watch(selectedDate) 统一处理
}

function onLaunch(appId: string) {
  showMapApps.value = false
  if (currentSpot.value) {
    launchMap(appId, currentSpot.value.lat, currentSpot.value.lng, currentSpot.value.name)
  }
}

function onPersist() {
  if (currentSpot.value) toggleFavorite(currentSpot.value.id)
}

// 选中日期变化（日期条 / 日历）→ 同步刷新该地点所有潮汐展示
watch(selectedDate, reloadTide)

onMounted(async () => {
  await loadSettings()
  currentSpot.value = getSpotById(settings.value.defaultSpotId) ?? getSpotById('haixian')
  buildWeek()
  reloadTide()
})

// keep-alive：从其它 Tab 切回「附近」时，若已跨天则重建日期条，避免日期条停留在旧的一天
onActivated(() => {
  if (weekDates.value[0]?.key !== ymd(new Date())) buildWeek()
})
</script>

<style scoped>
.nb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  font-size: 18px;
  font-weight: 700;
}
.refresh-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-from);
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.refresh-btn.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loc-state {
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 2px;
}
/* 首次定位引导卡 */
.onboard {
  background: linear-gradient(135deg, #eef5ff, #e7f6f1);
  border-color: var(--brand-from);
}
.onboard-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: var(--brand-from);
}
.onboard-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2px;
}
.onboard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.btn-ghost {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-sub);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary.sm {
  width: auto;
  margin: 0;
  padding: 10px 18px;
  font-size: 14px;
}
.date-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 14px 8px;
}
.date-strip button {
  flex: 0 0 auto;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.date-strip button.active {
  border-color: var(--brand-from);
  background: #eef5ff;
  color: var(--brand-from);
  font-weight: 700;
}
.date-strip button small {
  font-size: 11px;
  color: var(--text-sub);
}
/* "其他日期"按钮：与图标横向排列，区别于日期 MM/DD 竖向布局 */
.date-strip button.more {
  flex-direction: row;
  align-items: center;
  gap: 4px;
  color: var(--brand-from);
  border-color: var(--brand-from);
  font-weight: 700;
}
.loc-field {
  display: block;
  width: calc(100% - 28px);
  margin: 6px 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.caret {
  float: right;
  color: var(--text-sub);
}
.map {
  height: 120px;
  margin: 6px 14px;
  border-radius: 12px;
  background: #dfeaf3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
  font-size: 13px;
  cursor: pointer;
}
/* 出行方式切换（驾车/步行） */
.route-mode {
  display: flex;
  gap: 8px;
  margin: 6px 14px 0;
}
.route-mode button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-sub);
  cursor: pointer;
}
.route-mode button.active {
  border-color: var(--brand-from);
  background: #eef5ff;
  color: var(--brand-from);
}
/* MapView 自带 .map-wrap 样式，这里不再需要 .map 容器 */
.card {
  margin: 6px 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 3px 10px rgba(15, 39, 71, 0.08);
}
.card h3 {
  font-size: 15px;
}
.big {
  color: var(--tide-best);
  font-size: 16px;
  font-weight: 700;
  margin-top: 6px;
}
.sub {
  color: var(--text-sub);
  font-size: 13px;
}
.night-note {
  color: #d8493a;
  font-weight: 600;
}
.seafood {
  margin-top: 10px;
}
.seafood-label {
  font-size: 13px;
  color: var(--text-sub);
}
.seafood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.seafood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 4px;
  text-align: center;
}
.seafood-icon {
  width: 44px;
  height: 44px;
  object-fit: contain;
}
.seafood-fallback {
  font-size: 12px;
  line-height: 44px;
  color: var(--text-sub);
}
.seafood-name {
  font-size: 12px;
  color: var(--text);
  line-height: 1.2;
}
.btn-primary {
  display: block;
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
}
</style>

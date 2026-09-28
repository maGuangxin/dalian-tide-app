<template>
  <div class="map-wrap">
    <div ref="el" class="map-canvas"></div>
    <button class="map-tap" @click="$emit('tap')"><Icon name="navigate" :size="14" /> 点击地图，选择导航 App</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, onActivated, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { usePosition } from '@/composables/usePosition'
import { useRoute } from '@/composables/useRoute'
import { TIANDITU_KEY } from '@/config'
import Icon from '@/components/Icon.vue'
import type { Spot } from '@/types'

const props = defineProps<{ spot?: Spot }>()
defineEmits<{ (e: 'tap'): void }>()

const { myPos, refresh } = usePosition()
const { route } = useRoute()

const el = ref<HTMLElement | null>(null)
const DALIAN: [number, number] = [38.914, 121.616]

let map: L.Map | null = null
let spotMarker: L.CircleMarker | null = null
let meMarker: L.CircleMarker | null = null
let routeLine: L.Polyline | null = null

function drawSpot() {
  if (!map || !props.spot) return
  const sl: [number, number] = [props.spot.lat, props.spot.lng]
  if (spotMarker) spotMarker.remove()
  spotMarker = L.circleMarker(sl, {
    radius: 8,
    color: '#1666C9',
    fillColor: '#1666C9',
    fillOpacity: 1
  })
    .addTo(map)
    .bindPopup(props.spot.name)
}

function drawMe() {
  if (!map) return
  if (meMarker) {
    meMarker.remove()
    meMarker = null
  }
  if (myPos.value) {
    meMarker = L.circleMarker(myPos.value, {
      radius: 6,
      color: '#18A957',
      fillColor: '#18A957',
      fillOpacity: 1
    })
      .addTo(map)
      .bindPopup('我的位置')
  }
}

function drawRoute() {
  if (!map || !props.spot) return
  const sl: [number, number] = [props.spot.lat, props.spot.lng]
  if (routeLine) {
    routeLine.remove()
    routeLine = null
  }
  if (myPos.value && route.value && route.value.points.length >= 2) {
    // 实际道路路线：橙色实线折线
    routeLine = L.polyline(route.value.points, {
      color: '#F59E0B',
      weight: 5,
      opacity: 0.92,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(map)
    map.fitBounds(L.latLngBounds(route.value.points), { padding: [30, 30] })
  } else if (myPos.value) {
    // 无路线（未定位成功前 / API 失败 / 离岛无路网）→ 直线兜底（虚线、灰色），并提示由调用方展示
    routeLine = L.polyline([myPos.value, sl], {
      color: '#9AA7B4',
      weight: 3,
      dashArray: '6 6',
      opacity: 0.8
    }).addTo(map)
    map.fitBounds(L.latLngBounds([myPos.value, sl]), { padding: [30, 30] })
  } else {
    map.setView(sl, 11)
  }
}

// 智图 GeoQ 中国在线社区底图：国内服务器、中文标注、免 key（兜底用）
function addGeoq() {
  if (!map) return
  L.tileLayer(
    'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 18, attribution: '© 智图 GeoQ', crossOrigin: true }
  ).addTo(map)
}

// 天地图（矢量底图 + 中文注记）。浏览器端 key 按引用域名白名单校验，
// 若白名单未含当前源（如未加 localhost），瓦片会返回 403 —— 此时自动回退智图 GeoQ，避免空白地图。
function addTianDiTu() {
  if (!map) return
  const vec = L.tileLayer('https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=' + TIANDITU_KEY, {
    subdomains: '01234567',
    maxZoom: 18,
    attribution: '© 天地图 GS(2023)336号',
    crossOrigin: true
  })
  const cva = L.tileLayer('https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=' + TIANDITU_KEY, {
    subdomains: '01234567',
    maxZoom: 18,
    attribution: '© 天地图',
    crossOrigin: true
  })
  vec.addTo(map)
  cva.addTo(map)
  const fallback = () => {
    map?.off('tileerror', fallback)
    vec.remove()
    cva.remove()
    addGeoq()
    console.warn('[MapView] 天地图瓦片被拒（多为引用域名白名单未含当前源），已回退智图 GeoQ')
  }
  map.on('tileerror', fallback)
}

onMounted(async () => {
  if (!el.value) return
  map = L.map(el.value, { zoomControl: false, attributionControl: true }).setView(DALIAN, 10)

  // 仅使用国内底图：优先天地图（需填入 key），否则用智图 GeoQ（国内、中文、免 key）。
  // 两者均为中文标注、服务器在中国，绝不回退 Esri 等国外源。
  if (TIANDITU_KEY && TIANDITU_KEY !== 'YOUR_TIANDITU_KEY') {
    addTianDiTu()
  } else {
    addGeoq()
  }

  drawSpot()
  drawMe()
  drawRoute()
  // 容器尺寸常在挂载后才稳定，强制刷新一次避免灰块
  setTimeout(() => map && map.invalidateSize(), 200)

  // 首次拉一次当前位置（失败/拒绝则仅显示地点，不画路线）
  await refresh()
  drawMe()
  drawRoute()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// keep-alive：从其它 Tab 切回"附近"时，地图容器被重新插入文档，
// 尺寸可能失效导致灰块/瓦片错位，需重算一次瓦片大小。
onActivated(() => {
  setTimeout(() => map && map.invalidateSize(), 60)
})

watch(
  () => props.spot,
  () => {
    drawSpot()
    drawMe()
    drawRoute()
  }
)

// 共享位置变化（首次定位 / 刷新按钮重拉）→ 实时更新我的位置点；路线由 useRoute 重算后触发下方 watch 重绘
watch(myPos, () => {
  drawMe()
  drawRoute()
})

// 路线计算结果变化（驾车/步行折线、加载完成）→ 重绘地图路线
watch(route, () => {
  drawMe()
  drawRoute()
})
</script>

<style scoped>
.map-wrap {
  position: relative;
  /* 关键：建立独立层叠上下文，把 Leaflet 内部 600~700 的 pane 锁在容器内，
     避免其 z-index 逃逸到父级、盖住日期/地点/导航等 fixed 弹层（z-index:50）。 */
  isolation: isolate;
  height: 200px;
  margin: 6px 14px;
  border-radius: 12px;
  overflow: hidden;
}
.map-canvas {
  height: 100%;
  width: 100%;
  background: #dfeaf3;
}
.map-tap {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: rgba(15, 39, 71, 0.82);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  /* 关键：Leaflet 内部 pane/控制层带 600~1000 的显式 z-index，
     会把默认 z-index:auto 的浮层按钮盖住（以前只有蓝底时看不出，换成真实瓦片后就被遮了）。
     这里抬到 1200，使其稳定浮在地图之上、可被点击。 */
  z-index: 1200;
}
</style>

import { ref } from 'vue'
import { Geolocation } from '@capacitor/geolocation'

// ADR：当前设备位置为全应用共享状态（模块级单例）。
// 地图路线、附近页"距离"都由它派生；刷新按钮统一重拉，避免多处重复定位。
const myPos = ref<[number, number] | null>(null)
const locating = ref(false)
const lastError = ref<string | null>(null)

/** 球面两点直线距离（km），Haversine 公式 */
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** 强制超时包装：避免某些设备上 Geolocation 插件不遵守 timeout 导致 UI 卡住 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    )
  ])
}

/** 浏览器 Web Geolocation API 兜底（不依赖 Google Play 服务） */
function getWebPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('navigator.geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    )
  })
}

export function usePosition() {
  /** 重新获取当前位置（失败则置空，由调用方回退默认距离） */
  async function refresh() {
    locating.value = true
    lastError.value = null
    try {
      // Android 6+ 必须先在运行时申请权限，否则 getCurrentPosition 会直接 reject
      await Geolocation.requestPermissions()

      // 先尝试 Capacitor 插件（走 Google Fused Provider）
      const pos = await withTimeout(
        Geolocation.getCurrentPosition({ timeout: 8000, enableHighAccuracy: false }),
        10_000,
        'Capacitor Geolocation'
      )
      myPos.value = [pos.coords.latitude, pos.coords.longitude]
      return
    } catch (capErr) {
      console.warn('Capacitor geolocation failed, fallback to web geolocation', capErr)
    }

    // 兜底：走系统原生 GPS/网络定位（WebView Geolocation API），不依赖 Google Play
    try {
      const pos = await withTimeout(getWebPosition(), 10_000, 'Web Geolocation')
      myPos.value = [pos.coords.latitude, pos.coords.longitude]
    } catch (webErr) {
      console.warn('Web geolocation failed', webErr)
      lastError.value = 'location unavailable'
      myPos.value = null
    } finally {
      locating.value = false
    }
  }

  /** 当前位置到某地的直线距离（km）；未定位时返回 null */
  function distanceTo(spot: { lat: number; lng: number }): number | null {
    if (!myPos.value) return null
    return haversine(myPos.value, [spot.lat, spot.lng])
  }

  return { myPos, locating, lastError, refresh, distanceTo }
}

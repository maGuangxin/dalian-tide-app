import { ref } from 'vue'
import { fetchWeather, weatherText, type WeatherResult } from '@/services/openMeteo'
import { getCache, setCache, weatherCacheKey } from '@/services/cache'
import type { WeatherNow } from '@/types'

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function useWeather() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cached = ref(false) // 当前展示的是否为离线缓存
  const now = ref<WeatherNow | null>(null)
  const outOfRange = ref(false) // 选中日期超出 16 天预报范围

  // 请求控制器：切换日期/地点时取消上一个未完成请求，避免竞态与旧响应覆盖
  let weatherCtrl: AbortController | null = null

  async function load(lat: number, lng: number, date: Date) {
    const key = weatherCacheKey(lat, lng)
    const dateKey = ymd(date)
    const isToday = dateKey === ymd(new Date())
    weatherCtrl?.abort()
    weatherCtrl = new AbortController()
    const sig = weatherCtrl.signal
    loading.value = true
    error.value = null
    outOfRange.value = false
    // 缓存优先：离线缓存含该日则先即时展示，再后台刷新
    const c = await getCache<WeatherResult>(key)
    if (c) {
      const idx = c.daily.time.indexOf(dateKey)
      if (idx >= 0) {
        const code = isToday && c.current ? c.current.weather_code : c.daily.weather_code[idx]
        now.value = {
          temp: isToday && c.current ? c.current.temperature_2m : c.daily.temperature_2m_max[idx],
          weatherCode: code,
          windSpeed: isToday && c.current ? c.current.wind_speed_10m : c.daily.wind_speed_10m_max[idx],
          text: weatherText(code)
        }
        cached.value = true
      }
    }
    try {
      const w = await fetchWeather(lat, lng, sig)
      if (sig.aborted) return
      const idx = w.daily.time.indexOf(dateKey)
      if (isToday && w.current) {
        now.value = {
          temp: w.current.temperature_2m,
          weatherCode: w.current.weather_code,
          windSpeed: w.current.wind_speed_10m,
          text: weatherText(w.current.weather_code)
        }
      } else if (idx >= 0) {
        now.value = {
          temp: w.daily.temperature_2m_max[idx],
          weatherCode: w.daily.weather_code[idx],
          windSpeed: w.daily.wind_speed_10m_max[idx],
          text: weatherText(w.daily.weather_code[idx])
        }
      } else {
        outOfRange.value = true
        now.value = null
        loading.value = false
        return
      }
      cached.value = false
      await setCache(key, w)
    } catch (e) {
      if (sig.aborted) return
      if (!now.value) error.value = e instanceof Error ? e.message : '天气获取失败'
    } finally {
      if (!sig.aborted) loading.value = false
    }
  }

  return { loading, error, cached, now, outOfRange, load }
}

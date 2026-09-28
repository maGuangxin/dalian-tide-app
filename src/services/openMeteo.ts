// Open-Meteo 开源 API 封装（免费、无需 key、CORS 友好、全球覆盖含大连）
// 对应 ADR-002：无后端，前端直接 fetch 公开 API。

const MARINE = 'https://marine-api.open-meteo.com/v1/marine'
const WEATHER = 'https://api.open-meteo.com/v1/forecast'

export interface MarineHourly {
  time: string[]
  sea_level_height_msl: number[]
}

/** 拉取某点的逐小时潮汐高度（相对平均海平面，单位 m）。
 * 传 startDate/endDate 取历史或未来某天（月历选远日期用）；否则取未来 days 天。 */
export async function fetchMarine(
  lat: number,
  lng: number,
  opts?: { days?: number; startDate?: string; endDate?: string; signal?: AbortSignal }
): Promise<MarineHourly> {
  const p = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: 'Asia/Shanghai',
    hourly: 'sea_level_height_msl'
  })
  if (opts?.startDate && opts?.endDate) {
    p.set('start_date', opts.startDate)
    p.set('end_date', opts.endDate)
  } else {
    p.set('forecast_days', String(opts?.days ?? 1))
  }
  const res = await fetch(`${MARINE}?${p.toString()}`, opts?.signal ? { signal: opts.signal } : undefined)
  if (!res.ok) throw new Error(`Open-Meteo marine ${res.status}`)
  const json = (await res.json()) as { hourly?: MarineHourly }
  if (!json.hourly?.sea_level_height_msl) throw new Error('潮汐数据缺失')
  return {
    time: json.hourly.time,
    sea_level_height_msl: json.hourly.sea_level_height_msl
  }
}

export interface WeatherResult {
  current: { temperature_2m: number; weather_code: number; wind_speed_10m: number }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    wind_speed_10m_max: number[]
  }
}

// Open-Meteo Marine 免费档仅支持从今天起未来 16 天（含今天）的潮汐预报。
// 超过该范围的日期既无数据也会静默报错，需在前端显式拦截。
export const MAX_TIDE_FORECAST_DAYS = 16

/** 该日期是否落在潮汐预报支持窗口内（含今天起 MAX_TIDE_FORECAST_DAYS 天） */
export function isTideDateSupported(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const max = new Date(today)
  max.setDate(max.getDate() + MAX_TIDE_FORECAST_DAYS - 1)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return d.getTime() <= max.getTime()
}

/** 拉取实时天气 + 未来 16 天日预报（按选中日期取对应日展示） */
export async function fetchWeather(lat: number, lng: number, signal?: AbortSignal): Promise<WeatherResult> {
  const url =
    `${WEATHER}?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,wind_speed_10m_max` +
    `&timezone=Asia%2FShanghai&forecast_days=16`
  const res = await fetch(url, signal ? { signal } : undefined)
  if (!res.ok) throw new Error(`Open-Meteo weather ${res.status}`)
  return (await res.json()) as WeatherResult
}

export interface SunDaily {
  time: string[]
  sunrise: string[]
  sunset: string[]
}

/** 拉取未来 N 天日出/日落（本地时间，Asia/Shanghai）。与潮汐同源，免费、CORS 友好。
 * 用于判断低潮是否落在白天——赶海推荐的核心约束。 */
export async function fetchSun(
  lat: number,
  lng: number,
  days = 1,
  signal?: AbortSignal
): Promise<SunDaily> {
  const url =
    `${WEATHER}?latitude=${lat}&longitude=${lng}` +
    `&daily=sunrise,sunset&timezone=Asia%2FShanghai&forecast_days=${days}`
  const res = await fetch(url, signal ? { signal } : undefined)
  if (!res.ok) throw new Error(`Open-Meteo sun ${res.status}`)
  const json = (await res.json()) as { daily?: SunDaily }
  if (!json.daily?.sunrise) throw new Error('日出日落数据缺失')
  return json.daily
}

/** WMO weather_code → 中文简述（精简版，覆盖常见码） */
export function weatherText(code: number): string {
  const map: Record<number, string> = {
    0: '晴',
    1: '多云',
    2: '局部多云',
    3: '阴',
    45: '雾',
    48: '雾凇',
    51: '小毛毛雨',
    53: '毛毛雨',
    55: '大毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    80: '阵雨',
    81: '强阵雨',
    82: '暴雨',
    95: '雷阵雨',
    96: '雷阵雨伴冰雹',
    99: '强雷暴'
  }
  return map[code] ?? '未知'
}

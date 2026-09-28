import { TIANDITU_KEY } from '@/config'

// 国内路线规划：天地图「驾车/步行」Web 服务（https://api.tianditu.gov.cn/drive）
// 选用理由：用户已有天地图 key、服务器在国内、返回中文路网、无国外依赖。
// 坐标体系：天地图路网为 CGCS2000，与内置 spot / 设备 GPS 的 WGS-84 仅差 1~2m，展示可忽略，直接透传。
// 返回格式：XML（非 JSON）。关键字段：
//   routelatlon —— 线路经纬度串，格式 "lng,lat;lng,lat;…"（沿道路的折线点）
//   distance     —— 全长（单位：公里）
//   duration     —— 行驶总时长（单位：秒）
// style 取值：0 最快 / 1 最短 / 2 避开高速 / 3 步行。本应用只用 1(最短路线) 与 3(步行)。

export type RouteMode = 'driving' | 'walking'

export interface RouteResult {
  /** Leaflet 用的点序列 [lat, lng][] */
  points: [number, number][]
  /** 路线总长（公里） */
  distanceKm: number
  /** 预计耗时（秒） */
  durationSec: number
}

const STYLE: Record<RouteMode, string> = {
  driving: '1', // 最短路线
  walking: '3' // 步行
}

// 缓存：相同 起点+终点+出行方式 不再重复请求（路线短时间不变）
const cache = new Map<string, RouteResult | null>()
// 并发去重：同一 key 只发一次请求，其余复用
const inflight = new Map<string, Promise<RouteResult | null>>()

/**
 * 查询 origin→dest 的实际道路路线（驾车/步行）。
 * @param origin [lat, lng] WGS-84
 * @param dest   [lat, lng] WGS-84
 * @returns 路线结果；网络/CORS/解析失败、或无路网（如离岛）时返回 null，由调用方回退直线距离。
 */
export async function fetchRoute(
  origin: [number, number],
  dest: [number, number],
  mode: RouteMode = 'driving'
): Promise<RouteResult | null> {
  const key = `${mode}:${origin[0]},${origin[1]}:${dest[0]},${dest[1]}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const pending = inflight.get(key)
  if (pending) return pending

  const p = doFetch(origin, dest, mode)
    .then((r) => {
      cache.set(key, r)
      inflight.delete(key)
      return r
    })
    .catch((e) => {
      inflight.delete(key)
      console.warn('[route] 路径规划请求失败，回退直线', e)
      return null
    })
  inflight.set(key, p)
  return p
}

async function doFetch(
  origin: [number, number],
  dest: [number, number],
  mode: RouteMode
): Promise<RouteResult | null> {
  // 天地图参数使用 "lng,lat"（x,y）顺序
  const orig = `${origin[1]},${origin[0]}`
  const dst = `${dest[1]},${dest[0]}`
  const postStr = JSON.stringify({ orig, dest: dst, style: STYLE[mode] })
  const url =
    `https://api.tianditu.gov.cn/drive?postStr=${encodeURIComponent(postStr)}` +
    `&type=search&tk=${TIANDITU_KEY}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/xml, text/xml, */*' }
    })
    if (!res.ok) return null
    const text = await res.text()
    // 天地图在非浏览器环境/权限错误时返回 JSON 错误体（如 {"code":301012,...}），直接判失败
    if (text.trim().startsWith('{')) return null
    return parseTdtRoute(text)
  } catch (e) {
    // AbortController 超时或网络错误 → 回退
    console.warn('[route] fetch 异常', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

function parseTdtRoute(xml: string): RouteResult | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const parseErr = doc.querySelector('parsererror')
  if (parseErr) return null

  const routelatlon = doc.querySelector('routelatlon')?.textContent
  if (!routelatlon) return null

  const points: [number, number][] = routelatlon
    .split(';')
    .map((seg) => seg.split(',').map(Number))
    .filter((p) => p.length === 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1]))
    .map(([lng, lat]) => [lat, lng] as [number, number])

  if (points.length < 2) return null

  const distanceKm = Number(doc.querySelector('distance')?.textContent ?? '0') || 0
  const durationSec = Number(doc.querySelector('duration')?.textContent ?? '0') || 0

  return { points, distanceKm, durationSec }
}

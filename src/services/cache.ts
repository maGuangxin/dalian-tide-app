import { Preferences } from '@capacitor/preferences'

// ADR：无后端、无数据库。离线缓存仅用 Preferences key-value。
// 海边信号差，网络失败时回退到上次成功的数据，避免白屏。

export async function getCache<T>(key: string): Promise<T | null> {
  const { value } = await Preferences.get({ key })
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function setCache<T>(key: string, val: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(val) })
}

export function tideCacheKey(lat: number, lng: number, date: string): string {
  return `tide:${lat.toFixed(4)},${lng.toFixed(4)}:${date}`
}

export function tideRangeCacheKey(lat: number, lng: number, days: number): string {
  return `tiderange:${lat.toFixed(4)},${lng.toFixed(4)}:${days}`
}

export function weatherCacheKey(lat: number, lng: number): string {
  return `weather:${lat.toFixed(4)},${lng.toFixed(4)}`
}

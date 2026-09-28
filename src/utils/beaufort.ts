// 蒲福风级（Beaufort scale）换算
// Open-Meteo 的 wind_speed_10m 默认单位为 km/h，需先转为 m/s 再按非线性阈值映射风级，
// 不能直接用 windSpeed/3.6 取整（那是 m/s 取整，并非风级，会明显偏大）。

// 蒲福风级上界（m/s）：index = 风级，阈值 = 该级上限（不含）
// 0:<0.3  1:<1.6  2:<3.4  3:<5.5  4:<8.0  5:<10.8  6:<13.9
// 7:<17.2  8:<20.8  9:<24.5  10:<28.5  11:<32.7  >=12
const MS_THRESHOLDS = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7]

/** 由风速（km/h）换算蒲福风级（0~12） */
export function beaufortLevel(speedKmh: number): number {
  const ms = speedKmh / 3.6
  for (let i = 0; i < MS_THRESHOLDS.length; i++) {
    if (ms < MS_THRESHOLDS[i]) return i
  }
  return 12
}

/** 赶海天气适宜结论，由 WMO 天气码 + 风力综合判定 */
export interface TideSuit {
  ok: boolean
  label: string
}

// 恶劣天气（不宜赶海）
const STORM_CODES = [95, 96, 99] // 雷暴 / 伴冰雹
const HEAVY_RAIN_CODES = [82, 65, 66, 67, 75, 77, 86] // 暴雨 / 大雨 / 大雪 / 强阵雪

export function tideSuitability(code: number, speedKmh: number): TideSuit {
  const lvl = beaufortLevel(speedKmh)
  if (STORM_CODES.includes(code)) return { ok: false, label: '雷暴不宜' }
  if (HEAVY_RAIN_CODES.includes(code)) return { ok: false, label: '暴雨不宜' }
  if (code === 45 || code === 48) return { ok: false, label: '雾天不宜' }
  if (lvl >= 6) return { ok: false, label: `风大不宜(${lvl}级)` }
  if (lvl >= 5) return { ok: true, label: '风稍大' }
  return { ok: true, label: '宜赶海' }
}

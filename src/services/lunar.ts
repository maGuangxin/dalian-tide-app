import { solar2lunar } from 'solarlunar'

// solarlunar 返回字段在不同版本类型声明略有差异，这里收敛成本地接口，避免类型报错
type LunarResult = { lDay: number; monthCn: string; dayCn: string }

export interface LunarInfo {
  text: string // 农历文本，如 "六月廿三"
  day: number // 农历日数字
  isSpringTide: boolean // 大潮活汛：初一~初五 / 十六~二十（潮汐约 15 天周期）
  springIndex: number // 大潮连续指数 0–1：初一/十五附近=1，初八/廿三附近=0
}

/** 公历 → 农历（本地计算，不依赖网络） */
export function toLunar(date: Date): LunarInfo {
  const r = solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate()) as unknown as LunarResult
  const day = r.lDay
  // 大潮（活汛）出现在新月(初一)与满月(十五/十六)附近，约 14.77 天周期，
  // 距最近的"大潮中心"（初一 / 十六 / 次月初一）越近，指数越接近 1；
  // 小潮（死汛，初八/廿三附近）指数趋近 0。
  const ds = Math.min(Math.abs(day - 1), Math.abs(day - 16), Math.abs(day - 30))
  const springIndex = Math.min(1, Math.max(0, 1 - ds / 7.4))
  const isSpringTide = springIndex >= 0.5
  return {
    text: `${r.monthCn}${r.dayCn}`,
    day,
    isSpringTide,
    springIndex
  }
}

// 赶海适宜度评分（纯函数，便于单测与复用）。
//
// 评分依据（权威经验，见新浪/腾讯等实测赶海攻略与潮汐学常识）：
//   1) 潮差越大、低潮越低 → 滩涂裸露越多、货越多（大潮活汛核心）；
//   2) 最佳低潮需落在白天（夜间低潮对普通人无用，需带灯）；
//   3) 农历初一/十五前后为大潮，初八/廿三前后为小潮。
// 三项加权合成 0–100 的"适宜指数"，替代原硬编码魔数。

// 大连及邻近渤/黄海典型参考值（MSL，单位 m）。超出则按 1 封顶。
export const REF_TIDE_RANGE = 3.5 // 大潮典型潮差
export const REF_LOW_HEIGHT = 3.0 // 低潮潮高参考：低于此越多曝光越好

export function clamp(x: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, x))
}

/** 曝光度（0–1）：潮差为主、绝对低潮为辅，越大滩涂露得越多。
 *  用户明确"更看重潮差"，故潮差权重 0.7（低潮 0.3）。 */
export function exposureMetric(range: number, lowHeight: number): number {
  const rangeNorm = clamp(range / REF_TIDE_RANGE)
  const lowNorm = clamp((REF_LOW_HEIGHT - lowHeight) / REF_LOW_HEIGHT)
  return 0.7 * rangeNorm + 0.3 * lowNorm
}

/** 低潮窗口与白天的重叠比例（0–1）。 */
export function daylightFraction(
  winStartMs: number,
  winEndMs: number,
  sunRiseMs: number,
  sunSetMs: number
): number {
  if (winEndMs <= winStartMs) return 0
  const overlap = Math.max(0, Math.min(winEndMs, sunSetMs) - Math.max(winStartMs, sunRiseMs))
  return clamp(overlap / (winEndMs - winStartMs))
}

/**
 * 当日潮汐适宜指数（0–100）。
 * 用户要求"更看重潮差"：曝光(以潮差为主)整体权重 0.5，大潮 0.15，白天 0.35。
 * @param exposure     曝光度 0–1（潮差权重 0.7）
 * @param daylightFrac 最佳窗口与白天重叠比例 0–1
 * @param springIndex  农历大潮指数 0–1（初一/十五附近=1，初八/廿三附近=0）
 */
export function tideScore(exposure: number, daylightFrac: number, springIndex: number): number {
  const s = 0.5 * exposure + 0.15 * springIndex + 0.35 * daylightFrac
  return Math.round(clamp(s) * 100)
}

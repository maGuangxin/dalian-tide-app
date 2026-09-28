/**
 * 海鲜图标映射表
 *
 * 规则：
 * - key 为去掉 emoji 前缀的纯海鲜名称（ spots.ts 中 `🐚 花蛤` → `花蛤`）。
 * - value 为 public/seafood/ 下的静态资源路径（Vite/Capacitor 直接以 /seafood/<file>.png 引用）。
 * - 未命中时 getSeafoodIcon 返回 null，页面回退为纯文字标签，避免缺图导致破图。
 */

export const SEAFOOD_ICON_BASE = '/seafood'

/** 海鲜名 → 图标文件名（不含路径）。 */
const SEAFOOD_ICON_MAP: Record<string, string> = {
  花蛤: 'huagha.png',
  蚬子: 'xianzi.png',
  蛏子: 'chengzi.png',
  文蛤: 'wenge.png',
  海蛎子: 'hailizi.png',
  海螺: 'hailuo.png',
  螃蟹: 'pangxie.png',
  赤甲红蟹: 'pangxie.png', // 同属蟹类，复用螃蟹图标
  海胆: 'haidan.png',
  鲍鱼: 'baoyu.png',
  海参: 'haishen.png'
}

/**
 * 从 `🐚 花蛤` 这类原始标签中提取纯名称。
 * 去掉开头的非中文字符（emoji 与空格）。
 */
export function extractSeafoodName(raw: string): string {
  return raw.replace(/^[^\u4e00-\u9fa5]+/, '').trim()
}

/** 取海鲜图标 URL；无对应图标则返回 null。 */
export function getSeafoodIcon(rawLabel: string): string | null {
  const name = extractSeafoodName(rawLabel)
  const file = SEAFOOD_ICON_MAP[name]
  return file ? `${SEAFOOD_ICON_BASE}/${file}` : null
}

/** 全部可识别的海鲜名称列表（用于调试/校验）。 */
export function knownSeafoodNames(): string[] {
  return Object.keys(SEAFOOD_ICON_MAP)
}

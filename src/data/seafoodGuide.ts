/**
 * 海鲜图鉴（本地科普数据，无网络、无数据库）。
 * 内容为大连海域常见赶海获物的经验归纳，供爱好者参考；非权威鉴定，食用前请自行确认。
 * 名称与 spots.ts / seafoodIcons.ts 的图标映射保持一致（纯中文名）。
 */
export interface SeafoodInfo {
  name: string
  /** 最佳季节（农历/月份经验，如 "春秋" "夏秋"） */
  season: string
  /** 栖息地 / 怎么找 */
  habitat: string
  /** 最佳潮汐条件 */
  tide: string
  /** 食用提示 / 注意 */
  note: string
}

export const SEAFOOD_GUIDE: SeafoodInfo[] = [
  {
    name: '花蛤',
    season: '春秋（水温适宜，最肥）',
    habitat: '泥沙滩涂表层，退潮后沙面有细密小孔冒水，用盐或可诱其自吐',
    tide: '大潮低潮前后最佳，滩涂大面积裸露',
    note: '吐沙后食用；性寒，脾胃虚寒者适量'
  },
  {
    name: '蚬子',
    season: '春末至秋',
    habitat: '淡水入海口附近泥滩，成群埋于浅泥',
    tide: '大潮低潮露滩时最易挖到',
    note: '需充分吐沙；可作汤，鲜美'
  },
  {
    name: '蛏子',
    season: '夏秋',
    habitat: '软泥滩涂，退潮后可见"8"字形双气孔，撒盐后伸出',
    tide: '大潮低潮、滩面湿润时',
    note: '竹签轻夹即可；性寒，勿生食'
  },
  {
    name: '文蛤',
    season: '春秋',
    habitat: '中潮带沙质海底，埋较深，踩踏有"咕咕"感',
    tide: '大潮低潮露滩，随潮水退去越露越多',
    note: '肉质鲜甜，适合爆炒或做汤'
  },
  {
    name: '海蛎子',
    season: '冬至前后最肥（"冷水蛎子"）',
    habitat: '礁石上固着，成片生长',
    tide: '小潮亦可，但大潮低潮礁盘全露时最好撬',
    note: '生食有风险，建议熟食；壳锋利注意手'
  },
  {
    name: '海螺',
    season: '夏秋',
    habitat: '礁石缝隙、潮间带岩池',
    tide: '低潮露礁时翻找石缝',
    note: '尾部内脏宜去；有些螺类有毒性品种，不认识勿食'
  },
  {
    name: '螃蟹',
    season: '夏秋（8–10 月最肥）',
    habitat: '礁石下、泥洞，赤甲红等多栖礁区',
    tide: '大潮低潮翻石捕捉，夜间更佳',
    note: '夹手；死蟹易变质，现做现吃'
  },
  {
    name: '海胆',
    season: '夏秋',
    habitat: '清澈礁岩区，紫海胆常见',
    tide: '低潮露礁、水质好时',
    note: '仅食性腺（黄）；需鲜活，不认识品种勿食'
  },
  {
    name: '鲍鱼',
    season: '夏秋',
    habitat: '岩礁缝隙吸附，需撬下',
    tide: '大潮最低潮、礁盘全露时',
    note: '野生资源少，注意当地禁捕规定'
  },
  {
    name: '海参',
    season: '春末夏初（夏眠前）',
    habitat: '礁底沙泥，退潮后缓慢移动',
    tide: '大潮低潮露滩可寻',
    note: '需及时处理；留意保护区与禁捕期'
  }
]

/** 按名称查图鉴；找不到返回 undefined。 */
export function getSeafoodInfo(name: string): SeafoodInfo | undefined {
  return SEAFOOD_GUIDE.find((s) => s.name === name)
}

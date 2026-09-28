// 领域类型定义

/** 内置赶海地点（静态打包，不可由用户新增） */
export interface Spot {
  id: string
  name: string
  lng: number
  lat: number
  /** 按农历经验的潮汐类型，用于列表着色与排序 */
  tideType: 'big' | 'mid' | 'small'
  /** 距离基准（km），实际可由定位实时计算，这里给排序/展示用初值 */
  distanceBaseKm: number
  rating: number
  facilities: string[]
  /** 该海域常见可赶海获的海鲜种类（静态科普，按地貌/季节归纳） */
  seafood: string[]
  desc?: string
}

/** 用户自定义地点（本地 Preferences 持久化，非内置） */
export interface CustomSpot {
  id: string
  name: string
  lng: number
  lat: number
  desc?: string
}

/** 潮汐四段语义：禁止 / 可赶海 / 最佳 / 推荐回程 */
export type TideLevel = 'forbidden' | 'ok' | 'best' | 'return'

/** 单小时潮汐采样点 */
export interface TidePoint {
  time: string // ISO
  height: number // 相对平均海平面高度 m
  level: TideLevel
}

/** 单日潮汐加工结果 */
export interface TideDay {
  date: string // YYYY-MM-DD
  lunarText: string // 农历文本，如 "六月廿三"
  lunarDay: number // 农历日数字
  isSpringTide: boolean // 大潮活汛
  springIndex: number // 大潮连续指数 0–1
  points: TidePoint[]
  bestWindow?: { start: string; end: string }
  /** 最佳窗口是否落在白天（false=夜间低潮，不建议普通人前往） */
  bestWindowDaylight: boolean
  /** 当日潮差（最高-最低，m） */
  range: number
  /** 当日最低潮潮高（m，MSL） */
  lowHeight: number
  /** 曝光度 0–1：潮差与绝对低潮的综合 */
  exposure: number
  /** 最佳窗口与白天的重叠比例 0–1 */
  daylightFrac: number
  /** 当日潮汐适宜指数 0–100（潮差+白天+大潮，未含天气） */
  score: number
  okWindows: { start: string; end: string }[]
}

/** 实时天气 */
export interface WeatherNow {
  temp: number
  weatherCode: number
  windSpeed: number
  text: string
}

/** 本地持久化的设置项（无数据库，仅 key-value） */
export interface Settings {
  favorites: string[] // 常用地点 id（含自定义地点 id）
  defaultSpotId: string // 首次进入"附近"的默认地点
  notifyBest: boolean // 最佳时段前提醒
  notifySpringTide: boolean // 大潮活汛预警
}

/** 我的收获：本地记录的赶海日志条目（无数据库，Preferences 持久化） */
export interface CatchLogEntry {
  id: string
  date: string // YYYY-MM-DD
  spotId: string
  spotName: string
  species: string[] // 海鲜名（如 "花蛤"）
  weight?: string // 重量/数量备注，如 "2斤" / "一小桶"
  note?: string
  photo?: string // 压缩后的 base64 缩略图（可选，单张）
  createdAt: number
}

/** 地图 App 定义（用于"点地图弹抽屉"） */
export interface MapApp {
  id: string
  name: string
  scheme: (lat: number, lng: number, name: string) => string
}

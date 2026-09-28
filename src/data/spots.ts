import type { Spot } from '@/types'

/**
 * 内置赶海地点（静态数据，打包进 App）。
 * 坐标为大连周边真实点位近似值，用于潮汐/天气 API 查询与地图调起。
 * 对应设计稿"位置数据内置不可修改"——用户不可新增，仅可从列表置为常用。
 * seafood 为该海域常见可赶海获的海鲜（静态科普，按地貌/季节经验归纳）。
 */
export const SPOTS: Spot[] = [
  {
    id: 'haixian',
    name: '哈仙岛',
    lng: 122.52,
    lat: 39.23,
    tideType: 'big',
    distanceBaseKm: 86,
    rating: 4.8,
    facilities: ['🅿️', '🚻', '🦪'],
    desc: '长海县，退得最远，花蛤蚬子最多',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🦪 海蛎子', '🐌 海螺', '🦀 赤甲红蟹']
  },
  {
    id: 'heishijiao',
    name: '黑石礁',
    lng: 121.58,
    lat: 38.87,
    tideType: 'mid',
    distanceBaseKm: 12,
    rating: 4.5,
    facilities: ['🅿️', '🚻'],
    desc: '市区近，礁石区贝类多',
    seafood: ['🦪 海蛎子', '🐌 海螺', '🦀 螃蟹', '🪸 海胆', '🪸 鲍鱼']
  },
  {
    id: 'bangchuidao',
    name: '棒棰岛',
    lng: 121.70,
    lat: 38.88,
    tideType: 'mid',
    distanceBaseKm: 18,
    rating: 4.7,
    facilities: ['🅿️', '🚻', '🍴'],
    desc: '景区幽静，水质好',
    seafood: ['🦪 海蛎子', '🐌 海螺', '🦀 螃蟹', '🪸 海胆']
  },
  {
    id: 'xiajiahezi',
    name: '夏家河子',
    lng: 121.508,
    lat: 39.031,
    tideType: 'mid',
    distanceBaseKm: 25,
    rating: 4.4,
    facilities: ['🅿️', '🚻', '🏖️'],
    desc: '平缓滩涂，适合带娃',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'xiaofujiazhuang',
    name: '小付家庄',
    lng: 121.61,
    lat: 38.868,
    tideType: 'small',
    distanceBaseKm: 14,
    rating: 4.3,
    facilities: ['🅿️', '🚻'],
    desc: '近郊小众滩',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'qixianling',
    name: '七贤岭',
    lng: 121.52,
    lat: 38.88,
    tideType: 'small',
    distanceBaseKm: 16,
    rating: 4.2,
    facilities: ['🅿️'],
    desc: '森林公园旁礁岸',
    seafood: ['🦪 海蛎子', '🐌 海螺', '🦀 螃蟹', '🪸 海胆']
  },
  {
    id: 'jinshitan',
    name: '金石滩',
    lng: 121.85,
    lat: 39.05,
    tideType: 'big',
    distanceBaseKm: 58,
    rating: 4.6,
    facilities: ['🅿️', '🚻', '🍴', '🏨'],
    desc: '地质公园，大潮赶海体验好',
    seafood: ['🦪 海蛎子', '🐌 海螺', '🦀 螃蟹', '🪸 海胆', '🪸 鲍鱼']
  },
  {
    id: 'daheishi',
    name: '大黑石',
    lng: 121.314,
    lat: 38.967,
    tideType: 'mid',
    distanceBaseKm: 32,
    rating: 4.3,
    facilities: ['🅿️', '🚻'],
    desc: '甘井子区西部滩涂',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'lvshunbailanzi',
    name: '旅顺柏岚子',
    lng: 121.25,
    lat: 38.8,
    tideType: 'small',
    distanceBaseKm: 62,
    rating: 4.1,
    facilities: ['🅿️'],
    desc: '旅顺末段，人少',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐌 海螺']
  },
  {
    id: 'poshiwan',
    name: '泊石湾',
    lng: 121.78,
    lat: 39.03,
    tideType: 'mid',
    distanceBaseKm: 15,
    rating: 4.4,
    facilities: ['🅿️', '🚻'],
    desc: '开发区海边，交通方便',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🦪 海蛎子']
  },

  /* ===== 以下为大连周边热门赶海地点补充（静态内置，不可自定义新增） ===== */

  {
    id: 'fujiazhuang',
    name: '傅家庄',
    lng: 121.621,
    lat: 38.864,
    tideType: 'mid',
    distanceBaseKm: 9,
    rating: 4.6,
    facilities: ['🅿️', '🚻', '🏖️'],
    desc: '市区老牌浴场，礁石贝类多',
    seafood: ['🦪 海蛎子', '🐌 海螺', '🦀 螃蟹', '🐚 花蛤']
  },
  {
    id: 'xieziyu',
    name: '蟹子湾',
    lng: 121.658,
    lat: 38.878,
    tideType: 'small',
    distanceBaseKm: 12,
    rating: 4.2,
    facilities: ['🅿️'],
    desc: '海之韵旁小海湾，人少清静',
    seafood: ['🦀 螃蟹', '🐌 海螺', '🦪 海蛎子']
  },
  {
    id: 'qipanmo',
    name: '棋盘磨',
    lng: 121.57,
    lat: 39.045,
    tideType: 'mid',
    distanceBaseKm: 22,
    rating: 4.3,
    facilities: ['🅿️', '🚻'],
    desc: '甘井子北侧滩涂，花蛤不少',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'lashufang',
    name: '拉树房',
    lng: 121.62,
    lat: 39.08,
    tideType: 'big',
    distanceBaseKm: 38,
    rating: 4.4,
    facilities: ['🅿️'],
    desc: '夏家河子旁大潮退得远，蚬子多',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'yingchengzi',
    name: '营城子',
    lng: 121.383,
    lat: 39.053,
    tideType: 'big',
    distanceBaseKm: 33,
    rating: 4.1,
    facilities: ['🅿️'],
    desc: '旅顺北路沿海滩，本地人常去',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'tahewan',
    name: '塔河湾',
    lng: 121.331,
    lat: 38.821,
    tideType: 'mid',
    distanceBaseKm: 50,
    rating: 4.3,
    facilities: ['🅿️', '🚻', '🏖️'],
    desc: '旅顺口海滨浴场，沙细水清',
    seafood: ['🐚 花蛤', '🐚 文蛤', '🐚 蚬子']
  },
  {
    id: 'xianyuwan',
    name: '仙浴湾',
    lng: 121.7,
    lat: 39.45,
    tideType: 'big',
    distanceBaseKm: 110,
    rating: 4.5,
    facilities: ['🅿️', '🚻', '🏨'],
    desc: '瓦房店著名浴场，大潮赶海体验好',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子']
  },
  {
    id: 'changxingdao',
    name: '长兴岛',
    lng: 121.40,
    lat: 39.59,
    tideType: 'big',
    distanceBaseKm: 125,
    rating: 4.4,
    facilities: ['🅿️', '🚻'],
    desc: '瓦房店海岛，滩涂广阔',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子', '🐚 文蛤']
  },
  {
    id: 'xizhongdao',
    name: '西中岛',
    lng: 121.35,
    lat: 39.48,
    tideType: 'big',
    distanceBaseKm: 115,
    rating: 4.3,
    facilities: ['🅿️', '🚻', '🏖️'],
    desc: '瓦房店海岛，渤海大潮退得远',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🐚 蛏子', '🐚 文蛤']
  },
  {
    id: 'guanglu',
    name: '广鹿岛',
    lng: 122.36,
    lat: 39.17,
    tideType: 'big',
    distanceBaseKm: 72,
    rating: 4.6,
    facilities: ['🅿️', '🚻', '🦪'],
    desc: '长海县，退潮蛤蜊蚬子多',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🦪 海蛎子', '🐌 海螺']
  },
  {
    id: 'dachangshan',
    name: '大长山岛',
    lng: 122.59,
    lat: 39.28,
    tideType: 'big',
    distanceBaseKm: 80,
    rating: 4.5,
    facilities: ['🅿️', '🚻', '🍴'],
    desc: '长海县中心岛，设施齐全',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🦪 海蛎子', '🦀 螃蟹', '🐌 海螺']
  },
  {
    id: 'xiaochangshan',
    name: '小长山岛',
    lng: 122.70,
    lat: 39.24,
    tideType: 'big',
    distanceBaseKm: 95,
    rating: 4.4,
    facilities: ['🅿️', '🚻'],
    desc: '长海县东端，原生态滩',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🪸 海胆', '🪸 鲍鱼']
  },
  {
    id: 'zhangzi',
    name: '獐子岛',
    lng: 122.73,
    lat: 39.03,
    tideType: 'big',
    distanceBaseKm: 105,
    rating: 4.7,
    facilities: ['🅿️', '🚻', '🍴', '🏨'],
    desc: '驰名海钓赶海岛，水质极佳',
    seafood: ['🪸 海胆', '🪸 鲍鱼', '🪸 海参', '🐌 海螺', '🦀 螃蟹']
  },
  {
    id: 'shicheng',
    name: '石城岛',
    lng: 122.95,
    lat: 39.52,
    tideType: 'big',
    distanceBaseKm: 150,
    rating: 4.3,
    facilities: ['🅿️', '🚻'],
    desc: '庄河海岛，贝类丰富',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🦪 海蛎子', '🐚 文蛤']
  },
  {
    id: 'wangjia',
    name: '王家岛',
    lng: 123.08,
    lat: 39.50,
    tideType: 'big',
    distanceBaseKm: 165,
    rating: 4.2,
    facilities: ['🅿️', '🚻'],
    desc: '庄河东侧海岛，人少原生态',
    seafood: ['🐚 花蛤', '🐚 蚬子', '🪸 海胆', '🪸 鲍鱼']
  }
]

export function getSpotById(id: string): Spot | undefined {
  return SPOTS.find((s) => s.id === id)
}

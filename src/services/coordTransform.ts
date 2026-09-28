// 坐标系转换（GCJ-02 火星坐标 / BD-09 百度坐标）
// 内置赶海点坐标为 WGS-84(GPS)，而高德/腾讯地图使用 GCJ-02、百度使用 BD-09。
// 不加转换直接喂坐标会在中国大陆产生数百米~1km+ 的偏移（大连实测可达 500m~1km+）。
// Apple / Google 地图使用 WGS-84，无需转换。
// 算法为公开近似实现，精度满足民用导航；大连位于中国境内，均走转换分支。

const PI = Math.PI
const A = 6378245.0 // 克拉索夫斯基椭球长半轴
const EE = 0.00669342162296594323 // 偏心率平方

function outOfChina(lat: number, lng: number): boolean {
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55)
}

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

/** WGS-84(GPS) → GCJ-02（火星坐标），高德/腾讯地图使用 */
export function wgs84ToGcj02(lat: number, lng: number): [number, number] {
  if (outOfChina(lat, lng)) return [lat, lng]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return [lat + dLat, lng + dLng]
}

/** GCJ-02 → BD-09（百度坐标），百度地图使用 */
export function gcj02ToBd09(lat: number, lng: number): [number, number] {
  const x = lng
  const y = lat
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * PI)
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * PI)
  const bdLng = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  return [bdLat, bdLng]
}

/** WGS-84(GPS) → BD-09（百度坐标）一步转换 */
export function wgs84ToBd09(lat: number, lng: number): [number, number] {
  const [gLat, gLng] = wgs84ToGcj02(lat, lng)
  return gcj02ToBd09(gLat, gLng)
}

import { Capacitor } from '@capacitor/core'
import type { MapApp } from '@/types'
import { wgs84ToGcj02, wgs84ToBd09 } from '@/services/coordTransform'

// 各地图 App 的 Android 调起 scheme（对应设计稿"点地图弹抽屉选 App"）
// 列表顺序即抽屉展示顺序。
// 注：Capacitor 6 已移除 App.openUrl，安卓 WebView 内直接改 location.href
// 拉自定义 scheme / geo: 即可触发系统 Intent 解析并拉起外部地图 App；
// 桌面预览用 window.open 在新标签尝试打开。
export const MAP_APPS: MapApp[] = [
  {
    id: 'amap',
    name: '高德地图',
    // 高德导航 scheme（步行）
    scheme: (lat, lng) =>
      `androidamap://navi?sourceApplication=dalian-tide&lat=${lat}&lon=${lng}&dev=0&style=2`
  },
  {
    id: 'baidu',
    name: '百度地图',
    scheme: (lat, lng, name) =>
      `baidumap://map/direction?destination=latlng:${lat},${lng}|name:${encodeURIComponent(
        name
      )}&mode=walking&src=dalian-tide`
  },
  {
    id: 'tencent',
    name: '腾讯地图',
    scheme: (lat, lng, name) =>
      `qqmap://map/routeplan?type=walk&to=${encodeURIComponent(name)}&tocoord=${lat},${lng}&referer=dalian-tide`
  },
  {
    id: 'google',
    name: 'Google 地图',
    scheme: (lat, lng) => `google.navigation:q=${lat},${lng}`
  },
  {
    id: 'apple',
    name: 'Apple 地图',
    scheme: (lat, lng, name) => `maps://?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`
  }
]

/**
 * 调起指定地图 App 导航到目标点。
 * 在 Capacitor Android WebView 内用 location.href 即可触发系统弹窗/直接拉起。
 */
export function launchMap(appId: string, lat: number, lng: number, name: string): void {
  const app = MAP_APPS.find((a) => a.id === appId)
  if (!app) return
  // 内置坐标为 WGS-84(GPS)，按地图 App 要求转换坐标系，避免国内偏移数百米~1km+
  // 高德/腾讯 → GCJ-02；百度 → BD-09；Apple/Google → 原样 WGS-84
  let [tLat, tLng] = [lat, lng]
  if (appId === 'amap' || appId === 'tencent') {
    ;[tLat, tLng] = wgs84ToGcj02(lat, lng)
  } else if (appId === 'baidu') {
    ;[tLat, tLng] = wgs84ToBd09(lat, lng)
  }
  const url = app.scheme(tLat, tLng, name)
  if (Capacitor.isNativePlatform()) {
    // 原生侧：改 location.href 触发系统 Intent 解析，拉起外部地图 App
    window.location.href = url
  } else {
    // Web 预览：新标签打开（部分 scheme 在桌面浏览器会失败，属预期）
    window.open(url, '_blank')
  }
}

import { ref } from 'vue'
import { fetchRoute, type RouteMode, type RouteResult } from '@/services/route'

// ADR：当前选中地点的「实际道路路线」为全应用共享状态（模块级单例）。
// 地图（MapView）负责把路线画成折线，附近页（NearbyView）负责展示距离/耗时并触发计算。
// 二者通过本 composable 共享，避免重复请求路线规划 API。

const route = ref<RouteResult | null>(null)
const loading = ref(false)
const mode = ref<RouteMode>('driving')

// 请求 token：防止快速切换地点/出行方式时的竞态（后到的响应覆盖先到的）
let token = 0
// 记住最近一次请求参数，供切换出行方式时重算
let lastReq: { o: [number, number]; d: [number, number] } | null = null

export function useRoute() {
  /**
   * 计算从 origin 到 dest 的路线。origin/dest 为 null（未定位）时清空路线。
   */
  async function compute(
    origin: [number, number] | null,
    dest: [number, number] | null,
    m: RouteMode = mode.value
  ) {
    if (!origin || !dest) {
      route.value = null
      loading.value = false
      return
    }
    mode.value = m
    lastReq = { o: origin, d: dest }
    const myToken = ++token
    loading.value = true
    route.value = null
    const r = await fetchRoute(origin, dest, m)
    // 仅当仍是最近一次请求才采纳结果（含 null：API 失败则地图回退直线）
    if (myToken === token) {
      route.value = r
      loading.value = false
    }
  }

  /** 切换出行方式（驾车/步行），并重算当前路线 */
  function setMode(m: RouteMode) {
    mode.value = m
    if (lastReq) {
      void compute(lastReq.o, lastReq.d, m)
    }
  }

  return { route, loading, mode, compute, setMode }
}

import { Preferences } from '@capacitor/preferences'
import { computed, ref } from 'vue'
import { SPOTS, getSpotById as getBuiltin } from '@/data/spots'
import type { CustomSpot, Spot } from '@/types'

// ADR-003：地点分两层——内置静态 SPOTS（打包，不可改）+ 用户自定义（Preferences）。
// 全应用通过本 composable 取"合并后"的地点列表，保证自定义地点也能在附近/推荐中作为默认点使用。
const KEY = 'dalian-tide-custom-spots'

const customSpots = ref<CustomSpot[]>([])
let loaded = false

async function load() {
  if (loaded) return
  const { value } = await Preferences.get({ key: KEY })
  if (value) {
    try {
      const arr = JSON.parse(value)
      if (Array.isArray(arr)) customSpots.value = arr
    } catch {
      // 损坏则忽略
    }
  }
  loaded = true
}

async function save() {
  await Preferences.set({ key: KEY, value: JSON.stringify(customSpots.value) })
}

/** 合并列表：内置在前，自定义在后。 */
const allSpots = computed<Spot[]>(() =>
  customSpots.value.length
    ? [
        ...SPOTS,
        ...customSpots.value.map<Spot>((c) => ({
          id: c.id,
          name: c.name,
          lng: c.lng,
          lat: c.lat,
          tideType: 'mid',
          distanceBaseKm: 0,
          rating: 0,
          facilities: [],
          seafood: [],
          desc: c.desc
        }))
      ]
    : SPOTS
)

function getSpot(id: string): Spot | undefined {
  return allSpots.value.find((s) => s.id === id)
}

function addCustom(spot: CustomSpot) {
  if (customSpots.value.some((s) => s.id === spot.id)) return
  customSpots.value.push(spot)
  void save()
}

function removeCustom(id: string) {
  customSpots.value = customSpots.value.filter((s) => s.id !== id)
  void save()
}

// 兼容旧调用：未自定义时回退到内置查找
function getSpotById(id: string): Spot | undefined {
  return getSpot(id) ?? getBuiltin(id)
}

export function useSpots() {
  return { customSpots, allSpots, getSpot, getSpotById, addCustom, removeCustom, load }
}

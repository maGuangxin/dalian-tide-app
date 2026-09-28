import { Preferences } from '@capacitor/preferences'
import { ref } from 'vue'
import type { Settings } from '@/types'

// ADR-003：仅用 key-value 持久化，无数据库。
const KEY = 'dalian-tide-settings'

const defaultSettings: Settings = {
  // 默认常用地点：精选大连周边热门赶海点（近郊滩涂 + 知名海岛）
  favorites: ['xiajiahezi', 'fujiazhuang', 'jinshitan', 'daheishi', 'haixian', 'qipanmo', 'lashufang'],
  defaultSpotId: 'xiajiahezi', // 首次进入"附近"的默认地点（近郊最热门）
  notifyBest: true,
  notifySpringTide: true
}

const settings = ref<Settings>({ ...defaultSettings })
let loaded = false

async function load() {
  if (loaded) return
  const { value } = await Preferences.get({ key: KEY })
  if (value) {
    try {
      settings.value = { ...defaultSettings, ...JSON.parse(value) }
    } catch {
      // 数据损坏则回退默认
    }
  }
  loaded = true
}

async function save() {
  await Preferences.set({ key: KEY, value: JSON.stringify(settings.value) })
}

function setDefault(id: string) {
  settings.value.defaultSpotId = id
  void save()
}

function toggleFavorite(id: string) {
  const i = settings.value.favorites.indexOf(id)
  if (i >= 0) settings.value.favorites.splice(i, 1)
  else if (settings.value.favorites.length < 20) settings.value.favorites.push(id)
  void save()
}

function isFavorite(id: string) {
  return settings.value.favorites.includes(id)
}

export function useSettings() {
  return { settings, load, save, setDefault, toggleFavorite, isFavorite }
}

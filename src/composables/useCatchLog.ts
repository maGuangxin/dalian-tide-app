import { Preferences } from '@capacitor/preferences'
import { computed, ref } from 'vue'
import type { CatchLogEntry } from '@/types'

// ADR-003：我的收获为纯本地日志，无数据库。整段 JSON 存于 Preferences。
// 照片以 base64 存储前先压缩（见 compressImage），单张控制在上百 KB，避免撑爆 Preferences。
const KEY = 'dalian-tide-catchlog'

const entries = ref<CatchLogEntry[]>([])
let loaded = false

async function load() {
  if (loaded) return
  const { value } = await Preferences.get({ key: KEY })
  if (value) {
    try {
      const arr = JSON.parse(value)
      if (Array.isArray(arr)) entries.value = arr
    } catch {
      // 损坏则忽略
    }
  }
  loaded = true
}

async function save() {
  await Preferences.set({ key: KEY, value: JSON.stringify(entries.value) })
}

function genId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function addEntry(e: Omit<CatchLogEntry, 'id' | 'createdAt'>) {
  entries.value.unshift({ ...e, id: genId(), createdAt: Date.now() })
  void save()
}

function removeEntry(id: string) {
  entries.value = entries.value.filter((x) => x.id !== id)
  void save()
}

/** 按日期降序分组，便于列表展示。 */
const grouped = computed<{ date: string; items: CatchLogEntry[] }[]>(() => {
  const map = new Map<string, CatchLogEntry[]>()
  for (const e of entries.value) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }))
})

/**
 * 压缩图片为 base64（JPEG）。用于"我的收获"照片，限制最长边 ≤ maxSize、质量 quality。
 * 返回 dataURL；非图片文件或压缩失败返回 null。
 */
function compressImage(file: File, maxSize = 800, quality = 0.7): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(null)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => resolve(null)
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, w, h)
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch {
          resolve(null)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function useCatchLog() {
  return { entries, grouped, load, addEntry, removeEntry, compressImage }
}

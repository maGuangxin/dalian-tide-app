import { computed, ref } from 'vue'

// ADR：当前选中的展示日期为全应用共享状态（与 useSettings 同模式，模块级单例）。
// 切换 Tab 不丢失；所有按日期展示的数据（潮位图、最佳时段、农历等）都用 watch 监听它统一刷新。
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const selectedDate = ref<string>(todayKey())

const selectedDateTime = computed<Date>(() => {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  return new Date(y, m - 1, d)
})

function setDate(key: string) {
  selectedDate.value = key
}

export function useSelectedDate() {
  return { selectedDate, selectedDateTime, setDate }
}

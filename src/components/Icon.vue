<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="path"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 线性图标库：调用方只传 name 即可，颜色继承 currentColor（随主题/父级色变化）
const ICONS: Record<string, string> = {
  // 底部 Tab
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 11.5 11.5 8.5 15.5 12.5 12.5" fill="currentColor" stroke="none"/>',
  pin: '<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  gear:
    '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  // 底部 Tab（新增）
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5V20.5"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  // 通用操作
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16M8 3v4M16 3v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20.5 12a8.5 8.5 0 1 1-2.46-6M21 4v5h-5"/>',
  // 地点 / 评分
  location: '<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  star: '<path d="M12 3.2l2.6 5.5 6 .85-4.4 4.2 1.06 5.95L12 16.9 6.74 19.7 7.8 13.75 3.4 9.55l6-.85z"/>',
  starFill: '<path d="M12 3.2l2.6 5.5 6 .85-4.4 4.2 1.06 5.95L12 16.9 6.74 19.7 7.8 13.75 3.4 9.55l6-.85z" fill="currentColor" stroke="none"/>',
  // 天气 / 赶海
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.4M12 19.6v2.4M2 12h2.4M19.6 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>',
  fog: '<path d="M7 16.5a3.8 3.8 0 0 1 .6-7.5A5 5 0 0 1 17 8.7 3.4 3.4 0 0 1 17 16.5z"/><path d="M8 19.5h8M9.5 22h5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bellOff:
    '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/><line x1="3" y1="3" x2="21" y2="21"/>',
  wave: '<path d="M3 8.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  navigate: '<path d="M3 11 22 3l-8 19-2.2-8.2z"/>',
  // 出行方式
  car: '<path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4H3z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M11.5 9 9 13l2 2 1.5 5M11.5 9l3 1 1.5 5M9 13l-2.5 1.5"/>',
  // 收获 / 相册
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.5V22"/><path d="M14 14.5V22"/><path d="M8 4H6a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V6a2 2 0 0 0-2-2h-2"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4h8v2"/><path d="M5 6l1 14h12l1-14"/>'
}

const props = withDefaults(defineProps<{ name: string; size?: number | string }>(), {
  size: 22
})

const path = computed(() => ICONS[props.name] ?? '')
</script>

<style scoped>
/* 内联图标：随文本流排布（不独占一行），在 flex 容器内也不被压缩；
   颜色继承 currentColor，垂直居中对齐相邻文字 */
.icon {
  display: inline-block;
  vertical-align: middle;
  flex: none;
}
</style>

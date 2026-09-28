<template>
  <div class="guide">
    <header class="hero">
      <div>
        <h1>海鲜图鉴</h1>
        <p>大连海域赶海科普 · 本地数据，无网可用</p>
      </div>
    </header>

    <!-- 搜索 -->
    <div class="search">
      <input
        v-model="q"
        placeholder="搜名称、栖息地、季节…"
        class="inp"
        inputmode="text"
        autocomplete="off"
      />
      <span v-if="!q" class="hint">试试：花蛤 · 螃蟹 · 蛏子</span>
    </div>

    <!-- 列表 -->
    <section class="card-list">
      <article v-for="s in filtered" :key="s.name" class="card food-card">
        <div class="food-head">
          <div class="icon-wrap"><Icon :name="getSeafoodIcon(s.name) ?? 'pin'" :size="32" /></div>
          <div>
            <strong class="food-name">{{ s.name }}</strong>
            <span class="food-season">{{ s.season }}</span>
          </div>
        </div>
        <dl class="food-dl">
          <div>
            <dt>栖息地</dt>
            <dd>{{ s.habitat }}</dd>
          </div>
          <div>
            <dt>最佳潮汐</dt>
            <dd>{{ s.tide }}</dd>
          </div>
          <div class="full">
            <dt>食用提示</dt>
            <dd class="note">{{ s.note }}</dd>
          </div>
        </dl>
      </article>

      <p v-if="filtered.length === 0" class="empty">未找到「{{ q }}」</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { SEAFOOD_GUIDE, type SeafoodInfo } from '@/data/seafoodGuide'
import { getSeafoodIcon } from '@/data/seafoodIcons'

const q = ref('')

const filtered = computed<SeafoodInfo[]>(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return SEAFOOD_GUIDE
  return SEAFOOD_GUIDE.filter(
    (s) =>
      s.name.includes(k) ||
      s.season.toLowerCase().includes(k) ||
      s.habitat.toLowerCase().includes(k) ||
      s.tide.toLowerCase().includes(k)
  )
})
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
  color: #fff;
}
.hero h1 {
  font-size: 20px;
}
.hero p {
  font-size: 12px;
  opacity: 0.85;
}
.search {
  padding: 12px 14px 6px;
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 10;
}
.inp {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 14px;
  box-sizing: border-box;
  background: #fff;
}
.inp:focus {
  outline: none;
  border-color: var(--brand-from);
}
.hint {
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 4px;
}
.card-list {
  padding: 8px 14px 80px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.food-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.food-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--card-alt);
  display: flex;
  align-items: center;
  justify-content: center;
}
.food-name {
  font-size: 16px;
  font-weight: 700;
}
.food-season {
  font-size: 12px;
  color: var(--tide-best);
  font-weight: 600;
}
.food-dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
  font-size: 13px;
}
.food-dl .full {
  grid-column: 1 / -1;
}
.food-dl dt {
  color: var(--text-sub);
  font-weight: 600;
}
.food-dl dd {
  color: var(--text);
  margin-bottom: 4px;
  line-height: 1.45;
}
.food-dl .note {
  color: #c0392b;
  font-size: 12px;
}
.empty {
  text-align: center;
  color: var(--text-sub);
  font-size: 14px;
  padding: 30px 0;
}
</style>

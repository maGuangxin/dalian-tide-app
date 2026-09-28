<template>
  <div class="catch">
    <header class="hero">
      <div>
        <h1>我的收获</h1>
        <p>本地记录 · 无网可用 · 数据仅存本机</p>
      </div>
    </header>

    <!-- 添加表单 -->
    <section class="card form-card">
      <h3><Icon name="plus" :size="16" /> 添加收获</h3>
      <div class="field">
        <label>日期</label>
        <input v-model="form.date" type="date" class="inp" />
      </div>
      <div class="field">
        <label>地点</label>
        <select v-model="form.spotId" class="inp">
          <option v-for="s in allSpots" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div class="field">
        <label>海鲜种类</label>
        <div class="tags">
          <button
            v-for="tag in speciesOptions"
            :key="tag"
            :class="{ active: form.species.includes(tag) }"
            @click="toggleSpecies(tag)"
          >{{ tag }}</button>
          <button class="custom" @click="showCustom = true">+ 自定义</button>
        </div>
      </div>
      <div class="field">
        <label>数量/重量</label>
        <input v-model="form.weight" placeholder="如：2斤 / 一小桶" class="inp" />
      </div>
      <div class="field">
        <label>备注</label>
        <textarea v-model="form.note" class="ta" rows="2" placeholder="天气、手感、技巧等" />
      </div>
      <div class="field">
        <label>照片（可选，本地压缩存储）</label>
        <input type="file" accept="image/*" @change="onFile" class="file" />
        <img v-if="form.photoThumb" :src="form.photoThumb" class="thumb" />
      </div>
      <button class="btn-primary" :disabled="!form.date || !form.spotId" @click="submit">
        保存记录
      </button>
    </section>

    <!-- 列表 -->
    <section class="card-list" v-if="grouped.length > 0">
      <h3 class="group-title">共 {{ entries.length }} 条记录</h3>
      <div v-for="g in grouped" :key="g.date" class="group">
        <div class="group-date">{{ g.date }}</div>
        <article v-for="e in g.items" :key="e.id" class="card entry">
          <div class="entry-head">
            <Icon name="trophy" :size="18" />
            <strong>{{ e.spotName }}</strong>
            <span class="count">{{ e.weight || '未记录数量' }}</span>
          </div>
          <div class="entry-species">
            <span v-for="sp in e.species" :key="sp" class="tag">{{ sp }}</span>
          </div>
          <p v-if="e.note" class="note">{{ e.note }}</p>
          <img v-if="e.photo" :src="e.photo" class="photo" />
          <div class="entry-footer">
            <button class="del" @click="removeEntry(e.id)">
              <Icon name="trash" :size="14" /> 删除
            </button>
            <span class="ts">{{ formatTime(e.createdAt) }}</span>
          </div>
        </article>
      </div>
    </section>

    <p v-else class="empty">还没有收获记录，点击上方按钮添加吧！</p>

    <!-- 自定义物种弹窗 -->
    <div class="backdrop" v-if="showCustom" @click.self="showCustom = false">
      <div class="sheet">
        <div class="handle"></div>
        <h3>自定义物种名称</h3>
        <input v-model="customSpecies" class="inp" placeholder="输入物种名（如：皮皮虾）" />
        <div class="actions">
          <button class="btn-ghost" @click="showCustom = false">取消</button>
          <button class="btn-primary sm" :disabled="!customSpecies.trim()" @click="addCustomSpecies">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { useCatchLog } from '@/composables/useCatchLog'
import { useSpots } from '@/composables/useSpots'

const { entries, grouped, load, addEntry, removeEntry, compressImage } = useCatchLog()
const { allSpots, load: loadSpots } = useSpots()

const today = new Date()
const dateStr = () => {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const form = ref({
  date: dateStr(),
  spotId: '',
  species: [] as string[],
  weight: '',
  note: '',
  photo: '',
  photoThumb: ''
})

const showCustom = ref(false)
const customSpecies = ref('')
const speciesOptions = ref(['花蛤', '蚬子', '蛏子', '文蛤', '海蛎子', '海螺', '螃蟹', '海胆', '鲍鱼', '海参'])

function toggleSpecies(tag: string) {
  const i = form.value.species.indexOf(tag)
  if (i >= 0) form.value.species.splice(i, 1)
  else form.value.species.push(tag)
}
function addCustomSpecies() {
  const v = customSpecies.value.trim()
  if (!v) return
  if (!speciesOptions.value.includes(v)) speciesOptions.value.push(v)
  form.value.species.push(v)
  showCustom.value = false
  customSpecies.value = ''
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const data = await compressImage(file)
  if (data) {
    form.value.photo = data
    form.value.photoThumb = data
  }
}

function submit() {
  if (!form.value.date || !form.value.spotId || form.value.species.length === 0) return
  const spot = allSpots.value.find((s) => s.id === form.value.spotId)
  addEntry({
    date: form.value.date,
    spotId: form.value.spotId,
    spotName: spot?.name ?? form.value.spotId,
    species: form.value.species,
    weight: form.value.weight,
    note: form.value.note,
    photo: form.value.photo
  })
  // 重置表单但保留日期和地点
  form.value.species = []
  form.value.weight = ''
  form.value.note = ''
  form.value.photo = ''
  form.value.photoThumb = ''
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([load(), loadSpots()])
  if (!form.value.spotId && allSpots.value.length) {
    form.value.spotId = allSpots.value[0].id
  }
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
.hero h1 { font-size: 20px; }
.hero p { font-size: 12px; opacity: 0.85; }
.card-list { padding: 10px 14px 80px; display: flex; flex-direction: column; gap: 8px; }
.group-title { font-size: 14px; color: var(--text-sub); margin: 0 0 4px; }
.group-date { font-size: 13px; color: var(--text-sub); font-weight: 700; margin: 10px 0 4px; }
.form-card { padding: 14px; }
.form-card h3 { font-size: 15px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.field { margin-bottom: 10px; }
.field label { display: block; font-size: 13px; color: var(--text-sub); margin-bottom: 4px; font-weight: 600; }
.inp, .ta, select.inp { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 9px 12px; font-size: 14px; box-sizing: border-box; background: #fff; }
.inp:focus, .ta:focus, select.inp:focus { outline: none; border-color: var(--brand-from); }
.ta { resize: vertical; font-family: inherit; }
.file { font-size: 13px; color: var(--text-sub); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tags button { border: 1px solid var(--border); background: #fff; border-radius: 20px; padding: 4px 10px; font-size: 13px; cursor: pointer; }
.tags button.active { background: var(--brand-from); color: #fff; border-color: var(--brand-from); }
.tags .custom { color: var(--brand-from); font-style: italic; border-style: dashed; }
.thumb { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-top: 6px; border: 1px solid var(--border); }
.btn-primary { width: 100%; border: none; border-radius: 14px; padding: 12px; font-size: 15px; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--brand-from), var(--brand-to)); cursor: pointer; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary.sm { padding: 8px 16px; width: auto; font-size: 14px; }
.btn-ghost { padding: 8px 16px; border: 1px solid var(--border); background: #fff; border-radius: 10px; font-size: 14px; cursor: pointer; }
.entry { padding: 12px; }
.entry-head { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 6px; }
.entry-head .count { margin-left: auto; font-size: 13px; color: var(--text-sub); }
.entry-species { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.tag { background: #eef5ff; color: var(--brand-from); border-radius: 12px; padding: 2px 8px; font-size: 12px; }
.note { font-size: 13px; color: var(--text-sub); margin: 0 0 6px; }
.photo { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 6px; }
.entry-footer { display: flex; align-items: center; justify-content: space-between; }
.del { border: none; background: none; color: #e5484d; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.ts { font-size: 11px; color: var(--text-sub); }
.empty { text-align: center; color: var(--text-sub); padding: 40px 16px; font-size: 14px; }
.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: flex-end; z-index: 50; }
.sheet { width: 100%; max-width: 390px; margin: 0 auto; background: #fff; border-radius: 24px 24px 0 0; padding: 12px 16px 24px; }
.handle { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto 12px; }
.sheet h3 { font-size: 16px; margin-bottom: 10px; }
.actions { display: flex; gap: 8px; margin-top: 10px; }
</style>

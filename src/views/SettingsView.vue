<template>
  <div class="settings">
    <header><h2>设置</h2></header>

    <!-- 常用地点 -->
    <section class="card">
      <h3>常用地点</h3>
      <ul class="fav-list">
        <li v-for="s in favSpots" :key="s.id">
          <span class="name">{{ s.name }}</span>
          <button v-if="settings.defaultSpotId !== s.id" @click="setDefault(s.id)">设为默认</button>
          <span v-else class="default-tag">默认</span>
          <button class="remove" @click="toggleFavorite(s.id)">移除</button>
        </li>
      </ul>
      <button class="add" @click="showPicker = true"><Icon name="plus" :size="16" /> 从内置地点添加常用</button>
    </section>

    <LocationPicker
      v-if="showPicker"
      :current="settings.defaultSpotId"
      @select="onAdd"
      @close="showPicker = false"
    />

    <!-- 自定义地点 -->
    <section class="card">
      <h3>我的地点</h3>
      <p class="sub">自定义地点与内置地点合并，可用于推荐 / 附近 / 收获记录</p>
      <ul class="custom-list">
        <li v-for="c in customSpots" :key="c.id">
          <div class="info">
            <strong>{{ c.name }}</strong>
            <span class="coord">{{ c.lat.toFixed(4) }}, {{ c.lng.toFixed(4) }}</span>
          </div>
          <button class="remove" @click="removeCustom(c.id)"><Icon name="trash" :size="14" /></button>
        </li>
        <li v-if="customSpots.length === 0" class="empty-custom">暂无自定义地点</li>
      </ul>
      <button class="add" @click="showAddCustom = true"><Icon name="plus" :size="16" /> 添加自定义地点</button>
    </section>

    <!-- 添加自定义地点弹窗 -->
    <div class="backdrop" v-if="showAddCustom" @click.self="showAddCustom = false">
      <div class="sheet">
        <div class="handle"></div>
        <h3>添加自定义地点</h3>
        <div class="field">
          <label>地点名称</label>
          <input v-model="customForm.name" class="inp" placeholder="如：我家附近的滩涂" />
        </div>
        <div class="field">
          <label>纬度</label>
          <input v-model="customForm.lat" class="inp" type="number" step="0.00001" placeholder="38.9" />
        </div>
        <div class="field">
          <label>经度</label>
          <input v-model="customForm.lng" class="inp" type="number" step="0.00001" placeholder="121.5" />
        </div>
        <div class="field">
          <label>备注（可选）</label>
          <input v-model="customForm.desc" class="inp" placeholder="潮汐特征、停车等" />
        </div>
        <div class="actions">
          <button class="btn-ghost" @click="showAddCustom = false">取消</button>
          <button class="btn-primary sm" :disabled="!customForm.name || !customForm.lat || !customForm.lng" @click="submitCustom">确定</button>
        </div>
        <p class="hint">坐标可从地图 App 复制，或用高德/百度地图拾取坐标工具</p>
      </div>
    </div>

    <!-- 通知提醒 -->
    <section class="card">
      <h3>通知提醒</h3>
      <label class="switch-row">
        <span>最佳时段前提醒</span>
        <input type="checkbox" v-model="settings.notifyBest" @change="save" />
      </label>
      <label class="switch-row">
        <span>大潮活汛预警</span>
        <input type="checkbox" v-model="settings.notifySpringTide" @change="save" />
      </label>
    </section>

    <!-- 数据来源 -->
    <section class="card about">
      <h3>数据来源</h3>
      <p class="sub">潮汐 / 天气：Open-Meteo 开源 API（免费、无需登录）</p>
      <p class="sub">农历：本地计算（solarlunar 库）</p>
      <p class="sub">地点：内置静态数据 + 用户自定义（Preferences 本地持久化）</p>
      <p class="sub">收获日志：纯本地，无数据库</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { SPOTS } from '@/data/spots'
import { useSettings } from '@/composables/useSettings'
import { useSpots } from '@/composables/useSpots'
import LocationPicker from '@/components/LocationPicker.vue'
import Icon from '@/components/Icon.vue'

const { settings, load, save, setDefault, toggleFavorite } = useSettings()
const { customSpots, addCustom, removeCustom, load: loadSpots } = useSpots()

const favSpots = computed(() => SPOTS.filter((s) => settings.value.favorites.includes(s.id)))
const showPicker = ref(false)
const showAddCustom = ref(false)
const customForm = ref({ name: '', lat: '', lng: '', desc: '' })

function onAdd(id: string) {
  toggleFavorite(id)
  showPicker.value = false
}

function submitCustom() {
  const name = customForm.value.name.trim()
  const lat = parseFloat(customForm.value.lat)
  const lng = parseFloat(customForm.value.lng)
  if (!name || isNaN(lat) || isNaN(lng)) return
  addCustom({
    id: `custom_${Date.now()}`,
    name,
    lat,
    lng,
    desc: customForm.value.desc.trim() || undefined
  })
  showAddCustom.value = false
  customForm.value = { name: '', lat: '', lng: '', desc: '' }
}

onMounted(async () => {
  await Promise.all([load(), loadSpots()])
})
</script>

<style scoped>
header {
  padding: 16px;
  font-size: 18px;
  font-weight: 700;
}
.card h3 {
  font-size: 15px;
  margin-bottom: 8px;
}
.card .sub {
  color: var(--text-sub);
  font-size: 12px;
  margin-bottom: 8px;
  line-height: 1.5;
}
.fav-list {
  list-style: none;
}
.fav-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.fav-list .name {
  font-weight: 700;
  flex: 1;
}
.fav-list button {
  border: 1px solid var(--brand-from);
  color: var(--brand-from);
  background: #fff;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.fav-list .remove {
  border-color: #e5484d;
  color: #e5484d;
}
.default-tag {
  color: var(--tide-best);
  font-size: 12px;
  font-weight: 700;
}
.add {
  margin-top: 10px;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--brand-from);
  color: var(--brand-from);
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}
.hint {
  color: var(--text-sub);
  font-size: 11px;
  margin-top: 6px;
}
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
.sub {
  color: var(--text-sub);
  font-size: 13px;
  line-height: 20px;
}
.custom-list {
  list-style: none;
  margin-bottom: 10px;
}
.custom-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.info {
  display: flex;
  flex-direction: column;
}
.info strong {
  font-size: 14px;
}
.info .coord {
  font-size: 11px;
  color: var(--text-sub);
}
.empty-custom {
  color: var(--text-sub);
  font-size: 13px;
  text-align: center;
  padding: 12px;
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 50;
}
.sheet {
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 12px 16px 24px;
}
.handle {
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0 auto 12px;
}
.sheet h3 {
  font-size: 16px;
  margin-bottom: 12px;
}
.field {
  margin-bottom: 10px;
}
.field label {
  display: block;
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 4px;
  font-weight: 600;
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
.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.btn-ghost {
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary {
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary.sm {
  padding: 8px 16px;
}
.about {
  margin-top: 10px;
}
</style>

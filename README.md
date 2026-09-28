# 大连赶海助手（Dalian Tide App）

无后端、无数据库、无登录的安卓端融合应用。任何人安装即开箱即用，所有设置本地持久化，所有动态数据来自**开源 API**与**内置静态数据**。

> 设计稿来源：Ardot `大连赶海助手 · 移动端原型`（fileId `714725276325847`）。本仓库是其工程化落地骨架。

---

## 1. 架构决策（ADR 摘要）

| ADR | 决策 | 关键权衡 |
|-----|------|----------|
| **001 框架** | Capacitor 6 + Vue 3 + Vite + TS | 放弃纯原生性能，换取零后端、Web 复用、开发快；对"零学习成本"App 足够 |
| **002 数据** | 静态内置 + Open-Meteo 开源 API | 依赖第三方可用性/限流，无 SLA；契合"无服务器、开箱即用" |
| **003 持久化** | `@capacitor/preferences`（key-value） | 放弃复杂查询能力；本 App 设置项简单，足够 |
| **004 导航** | 自定义抽屉 + 地图 App URL Scheme | 放弃系统统一选择器，换取可控的"已装 App"体验 |

**为什么是 Capacitor 而非原生/RN/Flutter**：你要求"安卓端、不完全原生、融合应用、没地方部署服务"。Capacitor 把纯前端 Web 应用包成原生 APK，能调 GPS/存储等原生能力，全程零服务端。Vue 3 延续你既有前端栈。

**为什么 Open-Meteo**：免费、**无需 API Key**、CORS 友好、全球网格覆盖（含大连）。
- 潮汐高度：`https://marine-api.open-meteo.com/v1/marine?hourly=sea_level_height_msl,wave_height,swell_wave_height&...`
- 天气：`https://api.open-meteo.com/v1/forecast?daily=weather_code,temperature_2m_max,wind_speed_10m_max&current=temperature_2m,weather_code,wind_speed_10m&...`

---

## 2. 模块分层（C4 组件级）

```
UI 层      views/* + components/*         ← 6 屏 + 3 弹层（对应设计稿）
  │ 调用
组合层     composables/useTide·useWeather·useSettings
  │ 调用
服务层     services/openMeteo·mapLaunch·lunar
  │ 读
数据层     data/spots.ts（10 个内置地点，静态打包）
  │ 外部依赖                         平台能力
Open-Meteo API              ←→        Capacitor(Preferences / Geolocation / App)
```

**数据流**
- 推荐页：静态地点 + Open-Meteo 潮汐/天气 → 按农历大潮 + 潮汐高度曲线计算"近 1 月最佳时段" → 展示
- 附近页：定位或选内置地点 → 地图路线（静态/GeoJSON）+ 潮汐详情 → 点地图弹抽屉 → 调起地图 App
- 设置页：`useSettings` 读写 Preferences（常用地点、通知开关）

---

## 3. 目录结构

```
dalian-tide-app/
├── capacitor.config.ts        # 安卓原生壳配置（appId / webDir）
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json
├── index.html
├── package.json
└── src/
    ├── main.ts                # 入口，挂载 router
    ├── App.vue                # 根壳：底部 3 Tab + <router-view>
    ├── router/index.ts        # 推荐 / 附近 / 设置 三路由
    ├── types/index.ts         # Spot / TidePoint / Settings 等领域类型
    ├── styles/theme.css       # 海洋主题 token（渐变、四段潮汐色、圆角、投影）
    ├── data/
    │   └── spots.ts            # 10 个内置赶海地点（经纬度/潮汐类型/设施/距离基准）
    ├── services/
    │   ├── openMeteo.ts        # 潮汐 + 天气 API 封装（fetch，无 key）
    │   ├── mapLaunch.ts        # 调起高德/百度/腾讯/Google/Apple 地图 scheme
    │   └── lunar.ts            # 公历→农历/节气（solarlunar 封装）
    ├── composables/
    │   ├── useSettings.ts      # Preferences 读写（常用地点、通知开关）
    │   ├── useTide.ts          # 拉取并加工潮汐数据
    │   └── useWeather.ts       # 拉取并加工天气数据
    ├── views/
    │   ├── RecommendView.vue   # ① 推荐页
    │   ├── NearbyView.vue      # ② 附近主页
    │   └── SettingsView.vue    # ③ 设置页
    └── components/
        ├── LocationPicker.vue  # ②-B 选择地点（弹层）
        ├── DateCalendar.vue    # ②-C 选择日期（月历）
        └── MapAppSheet.vue     # ②-D 地图 App 选择（抽屉）
```

---

## 4. 环境要求

- Node.js ≥ 18
- JDK 17（Android 构建）
- Android Studio（含 Android SDK / Platform 34+）
- Capacitor CLI：`npm i -g @capacitor/cli`

---

## 5. 运行与打包

```bash
# 1. 安装依赖
npm install

# 2. 本地 Web 预览（调试 UI，等同于融合应用的 Web 层）
npm run dev

# 3. 类型检查 + 生产构建（dist/）
npm run build

# 4. 初始化安卓平台（仅首次）
npx cap add android

# 5. 把 Web 构建同步进安卓原生工程
npx cap sync android

# 6. 用 Android Studio 打开并打包 APK / 运行到设备
npx cap open android
# 或直接在 Android Studio 里 Build → Build Bundle(s) / APK(s)
```

> 生成的 `android/` 目录是标准 Android 工程，可用 Android Studio 直接打开、签名、上架。
> 真机调试：`npm run build && npx cap sync android && npx cap run android`（需 USB 调试已开）。

---

## 6. 约束与边界（务必遵守）

- **无服务器**：所有动态数据走 Open-Meteo 等公开 API，前端直接 `fetch`，不经过任何自建后端。
- **无数据库**：仅 `@capacitor/preferences` 做 key-value 持久化（常用地点、通知开关）。
- **无登录**：任何人安装即用，无账号体系。
- **地点内置固定**：10 个赶海点经纬度/设施为静态数据（`data/spots.ts`），不可由用户新增——对应设计稿"位置数据内置不可修改"。
- **开箱即用**：不依赖任何需要申请 Key 的服务（Open-Meteo 免 key）。

---

## 7. 后续可扩展点（非必须）

- 潮汐"最佳时段"算法目前基于农历大潮 + API 潮汐高度阈值，可接更精细的本地经验模型。
- 通知提醒：用 `@capacitor/local-notifications` 在最佳时段前本地弹提醒（仍无服务端）。
- 地图路线：当前用静态/示意路线，可接 OSM 静态瓦片或 Leaflet（仍前端渲染、无后端）。

// 地图底图配置（调用方驱动：需要更精细控制可在此扩展）
//
// 本应用地图【仅使用国内底图】，保证中文标注、服务器在国内、不依赖任何国外源：
//   1) 天地图（国家地理信息公共服务平台）—— 国产、免费、中文标注。
//      申请地址：https://console.tianditu.gov.cn/api/key （类型选「浏览器端」）
//      把 key 填入下方 TIANDITU_KEY 即启用。
//      ⚠️ 浏览器端 key 会按「引用域名白名单」校验 Referer：请在天地图控制台把本 key 的
//         引用域名加上 `localhost`（覆盖 vite 开发服务器与 Capacitor WebView 的 https://localhost 源）。
//         未加白名单时瓦片会返回 403（地图空白），并非 key 无效。上线时再补正式域名。
//      坐标：天地图 Web 墨卡托用 CGCS2000，与 spots 的 WGS-84 仅差 1~2m，展示可忽略。
//   2) 智图 GeoQ（易智瑞中国在线底图）—— 国内服务器、中文标注、免 key 的默认兜底。
//      未填天地图 key 时自动使用，保证开箱即是中国地图，绝不回退 Esri 等国外源。
export const TIANDITU_KEY: string = 'daf9536fd2e646c79382dd82f9a6f5e9'

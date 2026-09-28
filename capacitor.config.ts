import type { CapacitorConfig } from '@capacitor/core'

const config: CapacitorConfig = {
  appId: 'com.daliantide.app',
  appName: '大连赶海助手',
  webDir: 'dist',
  server: {
    // 安卓端用 https scheme，避免混合内容与 CORS 在 WebView 里的坑
    androidScheme: 'https'
  },
  plugins: {}
}

export default config

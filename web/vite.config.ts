import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    hmr: {
      clientPort: 80,                // 프록시가 https(443)일 경우
      protocol: 'ws',                // HTTPS면 wss, HTTP면 ws
      host: 'runtoyou.duckdns.org',   // 실제 접근할 도메인
    },
  },
})

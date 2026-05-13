import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 部署在 https://yangxizhe.com/voting-app/ 子路径下
export default defineConfig({
  base: '/voting-app/',
  plugins: [react()],
})

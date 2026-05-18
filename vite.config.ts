import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',        // 监听所有网卡（之前已配置）
    port: 5174,
    allowedHosts: [         // 🔑 关键：允许外网域名访问
      'f6c5e678.natappfree.cc',
      'localhost',
      '127.0.0.1',
      '::1',                // IPv6 localhost
    ],
  },
})
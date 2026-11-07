import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 엔트리 2개: / (교사 앱), /s/ (학생 페이지). /mnt/c에서는 파일 변경 알림이 오지 않아 polling을 쓴다
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: 'index.html', student: 's/index.html' },
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: { usePolling: true },
    proxy: { '/api': 'http://127.0.0.1:8787', '/health': 'http://127.0.0.1:8787' },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 30000, hookTimeout: 30000 },
} as never);

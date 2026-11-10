import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET lets you point the dev proxy at another API port.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      // Loopback only: the dev server is never reachable from the local network.
      host: '127.0.0.1',
      port: 3000,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          // Split the vendor bundle so a change to app code does not invalidate
          // the cached React/router/axios chunk on every deploy.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            http: ['axios'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  };
});

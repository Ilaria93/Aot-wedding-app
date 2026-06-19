import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  assetsInclude: ['**/*.glb'],
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});

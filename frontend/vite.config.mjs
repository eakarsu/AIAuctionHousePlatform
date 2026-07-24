import process from 'node:process';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = Number(process.env.BACKEND_PORT || 30044);

export default defineConfig({
  plugins: [
    {
      name: 'jsx-in-js',
      enforce: 'pre',
      async transform(code, id) {
        if (id.includes('/src/') && id.endsWith('.js')) return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
        return null;
      },
    },
    react({ include: /\.[jt]sx?$/ }),
  ],
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  server: { proxy: { '/api': { target: `http://127.0.0.1:${backendPort}`, changeOrigin: true } } },
  build: { outDir: 'dist' },
});

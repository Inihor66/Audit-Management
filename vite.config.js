import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    define: { 'process.env': env },
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: { port: 3000, host: '0.0.0.0' },
    build: {
      rollupOptions: { external: ['path', 'fs', 'os', 'net', 'crypto'] }
    }
  };
});

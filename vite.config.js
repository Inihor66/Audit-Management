import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env variables that start with VITE_
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    define: {
      'process.env': env, // makes env variables available in frontend
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      rollupOptions: {
        // Prevent bundling Node-only modules
        external: ['path', 'fs', 'os', 'net', 'crypto'],
      },
    },
  };
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      __APP_ENV__: env,
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // IMPORTANT FIX
      },
    },

    build: {
      rollupOptions: {
        // Remove external — not needed for frontend
      },
    },
  };
});

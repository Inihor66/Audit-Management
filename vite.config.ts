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

    // REMOVE process.env override (it breaks frontend JS)
    define: {
      __APP_ENV__: env,
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // ← FIXED
      },
    },

    build: {
      rollupOptions: {
        // You don't need to externalize node modules for frontend
        external: [],
      },
    },
  };
});

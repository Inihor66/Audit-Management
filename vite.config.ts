import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables that start with VITE_
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Makes env variables available in frontend safely
      'process.env': { ...env },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        // Prevent Node-only modules (including nodemailer) from being bundled
        external: [
          'nodemailer',
          'path',
          'fs',
          'os',
          'net',
          'crypto'
        ],
      },
    },
  };
});

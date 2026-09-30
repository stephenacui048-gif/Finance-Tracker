import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {syncPlugin} from './vite-plugin-sync.ts';

import { fileURLToPath } from 'url';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy API requests to external server when VITE_API_URL is set
      ...(process.env.VITE_API_URL ? {
        proxy: {
          '/api': {
            target: process.env.VITE_API_URL,
            changeOrigin: true,
            secure: false,
          },
        },
      } : {}),
    },
  };
});

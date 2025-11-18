/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const API_PROXY_TARGET = process.env.VITE_API_BASE_URL ?? 'https://api-beatapp.oleandrosantos.me';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use 'sass:color'; @use '${path.resolve(__dirname, './src/styles/_theme.scss')}' as *;`,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1024,
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      storybookTest({
        configDir: '.storybook'
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});
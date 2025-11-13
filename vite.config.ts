/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

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
        target: 'https://api-beatapp.oleandrosantos.me',
        changeOrigin: true,
        secure: false,
      },
      '/response': {
        target: 'https://api-beatapp.oleandrosantos.me',
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
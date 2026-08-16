import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        events: resolve(__dirname, 'events.html'),
        create: resolve(__dirname, 'create.html'),
        edit: resolve(__dirname, 'edit.html')
      }
    }
  },
  assetsInclude: ['**/*.gif']
});

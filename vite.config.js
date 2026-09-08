import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const reactPages = ['/events.html', '/create.html', '/edit.html', '/post.html'];

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-react-html-at-root',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = (req.url || '').split('?')[0];
          if (reactPages.includes(path)) req.url = '/src/html' + req.url;
          next();
        });
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        events: resolve(__dirname, 'src/html/events.html'),
        create: resolve(__dirname, 'src/html/create.html'),
        edit: resolve(__dirname, 'src/html/edit.html'),
        post: resolve(__dirname, 'src/html/post.html')
      }
    }
  },
  assetsInclude: ['**/*.gif']
});

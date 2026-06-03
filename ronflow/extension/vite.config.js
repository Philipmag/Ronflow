import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.js'),
        content: resolve(__dirname, 'src/content.js'),
        popup: resolve(__dirname, 'popup.html')
      },
      output: {
        dir: 'dist',
        entryFileNames: '[name].js'
      }
    },
    copyPublicDir: true
  }
});

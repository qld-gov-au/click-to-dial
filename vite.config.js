import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Specifies the output directory for the production build
  },
  server: {
    open: true, // Automatically opens the browser when the development server starts
  }
});

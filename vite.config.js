import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Specifies the output directory for the production build
  },
  server: {
    open: false, // Prevent the browser from opening automatically during tests
    port: 8080, // Change to a different port
  },
});

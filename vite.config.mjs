/*
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Specifies the output directory for the production build
  },
  server: {
    open: false, // Prevent the browser from opening automatically during tests
    port: 8080, // Change to a different port
  },
  optimizeDeps: {
    include: ['purecloud-platform-client-v2'], // Ensure the library is pre-bundled
  },
});
*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './', // Use relative paths for assets
  root: 'src/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: "Genesys Click-to-Dial",
        short_name: "Click-to-Dial",
        start_url: "/index.html",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/images/phone-icon_144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          }
        ],
        screenshots: [
          {
            src: "/images/ctd_background.png",
            sizes: "1200x600",
            type: "image/png",
            form_factor: "wide",
            label: "pwa background"
          },
          {
            src: "/images/ctd_background.png",
            sizes: "1200x600",
            type: "image/png",
            form_factor: "narrow",
            label: "pwa background"
          }
        ],
        protocol_handlers: [
          {
            protocol: "tel",
            url: "/?num=%s"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'images/**/*', // Source folder
          dest: 'images', // Destination folder in the dist directory
          emptyOutDir: true, // Cleans the output directory before building
        }
      ]
    }),
  ],
  resolve: {
    alias: {
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
    },
  },
  optimizeDeps: {
    include: ['purecloud-platform-client-v2'], // Ensure the library is pre-bundled
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    minify: false,
    outDir: '../dist'
  },
});
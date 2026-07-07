import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    // Three.js core is ~505 kB on its own; the isolated vendor chunk is
    // expected to exceed the 500 kB default, so lift the warning threshold.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js into its own vendor chunk so the main bundle
          // stays small. Behaviour is identical — only file layout changes.
          three: ['three'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

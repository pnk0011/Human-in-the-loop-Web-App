
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [
      react(),
      nodePolyfills({
        // Enable polyfills for specific Node.js modules
        include: ['buffer', 'string_decoder', 'stream'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        'figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png': path.resolve(__dirname, './src/assets/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      minify: 'terser',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio'],
            charts: ['recharts'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', '@kenjiuno/msgreader'],
    },
  };
});
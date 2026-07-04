import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // ─── Plugins ────────────────────────────
    plugins: [
      react({
        // Enable fast refresh for all files
        fastRefresh: true,
        // Babel config for React
        babel: {
          plugins: [],
        },
      }),
    ],

    // ─── Path Aliases ────────────────────────
    // Allows: import Button from '@/components/ui/Button'
    // Instead of: import Button from '../../components/ui/Button'
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@context': path.resolve(__dirname, './src/context'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@layouts': path.resolve(__dirname, './src/components/layout'),
        '@ui': path.resolve(__dirname, './src/components/ui'),
        '@charts': path.resolve(__dirname, './src/components/charts'),
        '@forms': path.resolve(__dirname, './src/components/forms'),
        '@router': path.resolve(__dirname, './src/router'),
      },
    },

    // ─── Development Server ──────────────────
    server: {
      port: 5173,
      host: true,
      open: true,
      cors: true,

      // Proxy API requests to backend
      // All requests to /api/... are forwarded to http://localhost:5000/api/...
      proxy: {
        '/api': {
          target: env.VITE_API_URL ? env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url);
            });
          },
        },
      },

      // Watch for file changes
      watch: {
        usePolling: true,
      },
    },

    // ─── Preview Server (production build) ───
    preview: {
      port: 4173,
      host: true,
    },

    // ─── Build Configuration ─────────────────
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
      chunkSizeWarningLimit: 1600,

      rollupOptions: {
        output: {
          // Split vendor libraries into separate chunks
          // This improves caching and load times
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],

            // UI libraries
            'ui-vendor': ['framer-motion', 'react-hot-toast', 'lucide-react', 'react-icons'],

            // Charts
            'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],

            // Forms
            'form-vendor': ['react-hook-form', 'react-select', 'react-datepicker'],

            // Data fetching
            'query-vendor': ['@tanstack/react-query'],

            // Utilities
            'utils-vendor': ['axios', 'date-fns', 'clsx', 'tailwind-merge'],

            // PDF/Export
            'export-vendor': ['jspdf', 'html2canvas'],
          },
        },
      },
    },

    // ─── CSS Configuration ───────────────────
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: '',
        },
      },
    },

    // ─── Environment Variables ───────────────
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },

    // ─── Optimizations ───────────────────────
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'date-fns',
        '@tanstack/react-query',
        'react-hook-form',
        'react-hot-toast',
        'framer-motion',
        'chart.js',
        'react-chartjs-2',
        'recharts',
        'lucide-react',
        'clsx',
        'tailwind-merge',
      ],
      exclude: [],
    },

    // ─── Log Level ───────────────────────────
    logLevel: mode === 'development' ? 'info' : 'warn',
  };
});

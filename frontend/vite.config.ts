import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    envPrefix: "VITE_",
    server: {
      host: "::",
      port: 5173,
      hmr: {
        clientPort: 5173,
      },
      proxy: {
        '/api': {
          target: mode === 'production' ? env.VITE_API_URL_PROD : env.VITE_API_URL_DEV,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries
            'react-core': ['react', 'react-dom', 'react/jsx-runtime'],
            // Routing
            'react-router': ['react-router-dom'],
            // State management and queries
            'react-query': ['@tanstack/react-query'],
            // Radix UI components (large library)
            'radix-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-avatar',
              '@radix-ui/react-separator',
              '@radix-ui/react-label',
              '@radix-ui/react-slot',
            ],
            // Socket.io (if used)
            'socket': ['socket.io-client'],
            // Icons - split lucide separately as it's large
            'icons': ['lucide-react'],
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 600,
      // CSS optimization
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
      },
    },
  }
});
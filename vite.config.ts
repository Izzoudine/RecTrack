import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": process.env,
    "process.browser": true,
    "process.version": JSON.stringify(process.version),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all addresses
    port: 5173,
    strictPort: false, // Allow fallback to another port if 5173 is in use
    open: true, // Open browser on start
    allowedHosts: [
      '8b2a540b3ad7b2723acdf5605475993b.serveo.net', // Allow Serveo subdomain
      '*.serveo.net', // Allow all Serveo subdomains (optional, for flexibility)
      'localhost',
      '192.168.0.0/16', // Allow local network IPs (adjust to your subnet, e.g., 192.168.1.x)
    ],
  },
})

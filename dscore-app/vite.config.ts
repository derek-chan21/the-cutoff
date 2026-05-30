import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-bundle these so lucide-react & motion share React with the app
    include: ['react', 'react-dom', 'react-router-dom', 'motion/react'],
  },
});

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Base raíz: el sitio se sirve en el dominio propio (arbolito.schiavoni.dev).
  base: '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              debugName: 'dependencies',
              name: (id: string) => {
                if (!id.includes('node_modules')) return null;
                if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
                if (/[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id)) return 'radix';
                return 'vendor';
              },
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
})

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
              debugName: 'react',
              name: (id: string) => {
                if (!id.includes('node_modules')) return null;
                return /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id) ? 'react' : null;
              },
              test: /node_modules/,
            },
            {
              debugName: 'radix',
              name: (id: string) => {
                if (!id.includes('node_modules')) return null;
                return /[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id) ? 'radix' : null;
              },
              test: /node_modules/,
            },
            {
              // El motor de markdown solo lo carga la ruta /docs. Sin este
              // grupo, sus dependencias quedan en el vendor que precarga la
              // landing y aumentan el bundle inicial.
              debugName: 'markdown',
              name: (id: string) => {
                if (!id.includes('node_modules')) return null;
                const markdown =
                  /[\\/]node_modules[\\/](react-markdown|remark[^\\/]*|rehype[^\\/]*|unified|micromark[^\\/]*|mdast[^\\/]*|hast[^\\/]*|unist[^\\/]*|vfile[^\\/]*|lowlight|highlight\.js|devlop|property-information|space-separated-tokens|comma-separated-tokens|html-url-attributes|style-to-object|inline-style-parser|trim-lines|bail|trough|is-plain-obj|zwitch|longest-streak|ccount|markdown-table|escape-string-regexp|character-entities[^\\/]*|decode-named-character-reference|html-void-elements|web-namespaces|parse5|hastscript)[\\/]/;
                return markdown.test(id) ? 'markdown' : null;
              },
              test: /node_modules/,
            },
            {
              debugName: 'vendor',
              name: (id: string) => (id.includes('node_modules') ? 'vendor' : null),
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
})

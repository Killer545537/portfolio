import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import { tomlPlugin } from './vite-plugin-toml.ts';

const config = defineConfig({
    envDir: '../../',
    define: {
        // The prerendered HTML and the client bundle must agree on the footer
        // year for hydration to match; see ProfileFooter.
        __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
    },
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        port: Number(process.env.PORT) || 3000,
        host: '0.0.0.0',
    },
    plugins: [
        devtools(),
        tomlPlugin(),
        nitro({
            vercel: {
                functions: {
                    runtime: 'bun1.x',
                },
            },
            routeRules: {
                // Everything on `/` comes from me.toml at build time, so the
                // page is prerendered to full HTML; only the GitHub heatmap
                // fetches at runtime. Nitro's prerenderer rather than Start's
                // `prerender` option: Start's runs after Nitro has written its
                // public-asset manifest, so the server never served its HTML
                // and rendered `/` on every request instead.
                '/': { prerender: true },
                '/profile-photo.jpg': {
                    headers: {
                        'cache-control': 'public, max-age=86400',
                    },
                },
                '/profile-photo.webp': {
                    headers: {
                        'cache-control': 'public, max-age=86400',
                    },
                },
            },
        }),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
    ],
});

export default config;

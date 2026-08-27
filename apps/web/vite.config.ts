import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import { tomlPlugin } from './vite-plugin-toml.ts';

const config = defineConfig({
    envDir: '../../',
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
                '/profile-photo.jpg': {
                    headers: {
                        'cache-control': 'public, max-age=86400',
                    },
                },
            },
        }),
        tailwindcss(),
        tanstackStart({
            spa: {
                enabled: true,
            },
        }),
        viteReact(),
    ],
});

export default config;

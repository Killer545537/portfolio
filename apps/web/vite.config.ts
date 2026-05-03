import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { tomlPlugin } from './vite-plugin-toml';

const config = defineConfig({
    envDir: '../../',
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
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
        }),
        // this is the plugin that enables path aliases
        viteTsConfigPaths({
            projects: ['./tsconfig.json'],
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

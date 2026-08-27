import fs from 'node:fs';
import { parse } from 'smol-toml';
import type { Plugin } from 'vite';

export function tomlPlugin(): Plugin {
    return {
        name: 'vite-plugin-toml',
        transform(_code, id) {
            if (!id.endsWith('.toml')) {
                return null;
            }

            const content = fs.readFileSync(id, 'utf-8');
            const parsed = parse(content);

            return {
                code: `export default ${JSON.stringify(parsed, null, 2)};`,
                map: null,
                // Vite 8 (Rolldown) requires plugins that convert a non-JS
                // module type to JavaScript to say so explicitly.
                moduleType: 'js',
            };
        },
    };
}

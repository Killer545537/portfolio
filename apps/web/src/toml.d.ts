declare module '*.toml' {
    const value: import('./lib/types').AppData;
    export default value;
}

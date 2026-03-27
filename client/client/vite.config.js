import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var rootDir = path.resolve(__dirname, '..');
    var env = loadEnv(mode, rootDir, '');
    var apiPort = env.PORT || '5000';
    var apiTarget = "http://localhost:".concat(apiPort);
    return {
        plugins: [react()],
        envDir: rootDir,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 3005,
            strictPort: false,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/uploads': {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});

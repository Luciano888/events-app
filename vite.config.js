import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(function (_a) {
    var _b, _c, _d, _e;
    var mode = _a.mode;
    var env = loadEnv(mode, __dirname, '');
    var fallbackError;
    // Fallback: read .env from config dir when loadEnv omits Cloudinary (e.g. prefix/parse quirks)
    var cloudName = (_b = env.VITE_CLOUDINARY_CLOUD_NAME) !== null && _b !== void 0 ? _b : '';
    var uploadPreset = (_c = env.VITE_CLOUDINARY_UPLOAD_PRESET) !== null && _c !== void 0 ? _c : '';
    if (!cloudName || !uploadPreset) {
        var dirsToTry = [__dirname, process.cwd()];
        for (var _i = 0, dirsToTry_1 = dirsToTry; _i < dirsToTry_1.length; _i++) {
            var dir = dirsToTry_1[_i];
            try {
                var envPath = path.join(dir, '.env');
                var content = fs.readFileSync(envPath, 'utf-8');
                for (var _f = 0, _g = content.split(/\r?\n/); _f < _g.length; _f++) {
                    var line = _g[_f];
                    var m1 = line.match(/^VITE_CLOUDINARY_CLOUD_NAME=(.*)$/);
                    if (m1)
                        cloudName = ((_d = m1[1]) !== null && _d !== void 0 ? _d : '').trim();
                    var m2 = line.match(/^VITE_CLOUDINARY_UPLOAD_PRESET=(.*)$/);
                    if (m2)
                        uploadPreset = ((_e = m2[1]) !== null && _e !== void 0 ? _e : '').trim();
                }
                if (cloudName && uploadPreset)
                    break;
            }
            catch (e) {
                fallbackError = e instanceof Error ? e.message : String(e);
            }
        }
    }
    // #region agent log
    try {
        var logPath = path.join(__dirname, 'debug-101628.log');
        var payload = {
            id: "vite_".concat(Date.now()),
            timestamp: Date.now(),
            location: 'vite.config.ts',
            message: 'loadEnv result',
            data: {
                mode: mode,
                envDir: __dirname,
                cwd: process.cwd(),
                envPath: path.join(__dirname, '.env'),
                envExists: fs.existsSync(path.join(__dirname, '.env')),
                cwdEnvExists: fs.existsSync(path.join(process.cwd(), '.env')),
                hasViteCloudName: Object.prototype.hasOwnProperty.call(env, 'VITE_CLOUDINARY_CLOUD_NAME'),
                cloudNameLen: cloudName.length,
                presetLen: uploadPreset.length,
                fallbackError: fallbackError !== null && fallbackError !== void 0 ? fallbackError : null,
                viteKeys: Object.keys(env).filter(function (k) { return k.startsWith('VITE_'); }),
            },
            hypothesisId: 'H1',
        };
        fs.appendFileSync(logPath, JSON.stringify(payload) + '\n');
    }
    catch (_) { }
    // #endregion
    return {
        root: __dirname,
        envDir: __dirname,
        plugins: [react()],
        resolve: {
            alias: {
                '@': '/src',
            },
        },
        define: {
            __CLOUDINARY_CLOUD_NAME__: JSON.stringify(cloudName),
            __CLOUDINARY_UPLOAD_PRESET__: JSON.stringify(uploadPreset),
        },
    };
});

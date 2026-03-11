import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  let fallbackError: string | undefined;
  // Fallback: read .env from config dir when loadEnv omits Cloudinary (e.g. prefix/parse quirks)
  let cloudName = env.VITE_CLOUDINARY_CLOUD_NAME ?? '';
  let uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '';
  if (!cloudName || !uploadPreset) {
    const dirsToTry = [__dirname, process.cwd()];
    for (const dir of dirsToTry) {
      try {
        const envPath = path.join(dir, '.env');
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const m1 = line.match(/^VITE_CLOUDINARY_CLOUD_NAME=(.*)$/);
          if (m1) cloudName = (m1[1] ?? '').trim();
          const m2 = line.match(/^VITE_CLOUDINARY_UPLOAD_PRESET=(.*)$/);
          if (m2) uploadPreset = (m2[1] ?? '').trim();
        }
        if (cloudName && uploadPreset) break;
      } catch (e) {
        fallbackError = e instanceof Error ? e.message : String(e);
      }
    }
  }
  // #region agent log
  try {
    const logPath = path.join(__dirname, 'debug-101628.log');
    const payload = {
      id: `vite_${Date.now()}`,
      timestamp: Date.now(),
      location: 'vite.config.ts',
      message: 'loadEnv result',
      data: {
        mode,
        envDir: __dirname,
        cwd: process.cwd(),
        envPath: path.join(__dirname, '.env'),
        envExists: fs.existsSync(path.join(__dirname, '.env')),
        cwdEnvExists: fs.existsSync(path.join(process.cwd(), '.env')),
        hasViteCloudName: Object.prototype.hasOwnProperty.call(env, 'VITE_CLOUDINARY_CLOUD_NAME'),
        cloudNameLen: cloudName.length,
        presetLen: uploadPreset.length,
        fallbackError: fallbackError ?? null,
        viteKeys: Object.keys(env).filter((k) => k.startsWith('VITE_')),
      },
      hypothesisId: 'H1',
    };
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n');
  } catch (_) {}
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

/**
 * Cloudinary config from env. Only cloud name is exposed to client (for unsigned upload + URL building).
 * Uses Vite define globals so values are reliable when env is loaded from config dir (not cwd).
 */
declare const __CLOUDINARY_CLOUD_NAME__: string | undefined;
declare const __CLOUDINARY_UPLOAD_PRESET__: string | undefined;
const cloudName = (typeof __CLOUDINARY_CLOUD_NAME__ !== 'undefined' ? __CLOUDINARY_CLOUD_NAME__ : import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '').trim();
const uploadPreset = (typeof __CLOUDINARY_UPLOAD_PRESET__ !== 'undefined' ? __CLOUDINARY_UPLOAD_PRESET__ : import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '').trim();

export const isCloudinaryConfigured = cloudName.length > 0 && uploadPreset.length > 0;

// #region agent log
if (typeof fetch !== 'undefined') {
  fetch('http://127.0.0.1:7715/ingest/463a809c-bfb0-40e4-ab4f-5a909f0a47c9', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '101628' },
    body: JSON.stringify({
      sessionId: '101628',
      id: `client_${Date.now()}`,
      timestamp: Date.now(),
      location: 'cloudinary.ts',
      message: 'client env',
      data: {
        cloudNameLen: cloudName.length,
        presetLen: uploadPreset.length,
        globalDefined: typeof __CLOUDINARY_CLOUD_NAME__ !== 'undefined',
        globalCloudNameLen: typeof __CLOUDINARY_CLOUD_NAME__ !== 'undefined' ? String(__CLOUDINARY_CLOUD_NAME__).length : -1,
        isConfigured: cloudName.length > 0 && uploadPreset.length > 0,
        hasMetaEnv: typeof import.meta.env !== 'undefined',
        viteEnvKeys: typeof import.meta.env !== 'undefined' ? Object.keys(import.meta.env).filter((k) => k.startsWith('VITE_')) : [],
      },
      hypothesisId: 'H2',
    }),
  }).catch(() => {});
}
// #endregion

if (import.meta.env.DEV && !isCloudinaryConfigured) {
  console.debug('[Cloudinary] Not configured: VITE_CLOUDINARY_CLOUD_NAME and/or VITE_CLOUDINARY_UPLOAD_PRESET missing or empty. Add them to .env in the project root and restart npm run dev.');
}

export function getCloudinaryCloudName(): string {
  return cloudName;
}

export function getCloudinaryUploadPreset(): string {
  return uploadPreset;
}

/** Build thumbnail URL for an image (w_400, crop fill). */
export function buildImageThumbnailUrl(publicId: string): string {
  if (!cloudName) return '';
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill/f_auto,q_auto/${publicId}`;
}

/** Build full-size image URL. */
export function buildImageUrl(publicId: string, options?: { width?: number; height?: number }): string {
  if (!cloudName) return '';
  const tr = options?.width || options?.height
    ? `w_${options.width ?? 'auto'},h_${options.height ?? 'auto'},c_limit/`
    : '';
  return `https://res.cloudinary.com/${cloudName}/image/upload/${tr}f_auto,q_auto/${publicId}`;
}

/** Build thumbnail URL for a video (first frame or auto). */
export function buildVideoThumbnailUrl(publicId: string): string {
  if (!cloudName) return '';
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_400,h_400,c_fill/so_0/${publicId}.jpg`;
}

/** Build video URL for playback. */
export function buildVideoUrl(publicId: string): string {
  if (!cloudName) return '';
  return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${publicId}`;
}

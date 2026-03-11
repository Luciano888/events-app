import {
  isCloudinaryConfigured,
  getCloudinaryCloudName,
  getCloudinaryUploadPreset,
  buildImageThumbnailUrl,
  buildVideoThumbnailUrl,
} from '../lib/cloudinary';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video';
}

const MAX_PHOTOS_PER_POST = 20;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;

export function isUploadConfigured(): boolean {
  return isCloudinaryConfigured;
}

export function getMaxPhotosPerPost(): number {
  return MAX_PHOTOS_PER_POST;
}

/** Upload image to Cloudinary (unsigned). Returns public_id and URL. */
export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) throw new Error('Cloudinary is not configured');
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_IMAGE_SIZE_MB} MB`);
  }
  const cloudName = getCloudinaryCloudName();
  const preset = getCloudinaryUploadPreset();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText || 'Upload failed');
  }
  const data = await res.json();
  return { public_id: data.public_id, secure_url: data.secure_url, resource_type: 'image' };
}

/** Upload video to Cloudinary (unsigned). */
export async function uploadVideo(file: File): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) throw new Error('Cloudinary is not configured');
  if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    throw new Error(`Video must be under ${MAX_VIDEO_SIZE_MB} MB`);
  }
  const cloudName = getCloudinaryCloudName();
  const preset = getCloudinaryUploadPreset();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText || 'Upload failed');
  }
  const data = await res.json();
  return { public_id: data.public_id, secure_url: data.secure_url, resource_type: 'video' };
}

/** Get thumbnail URL for display (image or video). */
export function getThumbnailUrl(publicId: string, type: 'image' | 'video'): string {
  return type === 'image' ? buildImageThumbnailUrl(publicId) : buildVideoThumbnailUrl(publicId);
}

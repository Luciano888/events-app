import type { Profile } from '../models/Profile';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function getAvatarObjectPosition(profile?: Pick<Profile, 'avatar_position_x' | 'avatar_position_y'> | null): string {
  const x = clamp(profile?.avatar_position_x ?? 50, 0, 100);
  const y = clamp(profile?.avatar_position_y ?? 50, 0, 100);
  return `${x}% ${y}%`;
}

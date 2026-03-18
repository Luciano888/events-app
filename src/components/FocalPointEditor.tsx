import { useRef, useCallback } from 'react';
import { Box } from '@mui/material';

export interface FocalPoint {
  x: number;
  y: number;
}

/** Aspect ratio for cover crop (Instagram-style). */
export type CoverAspectRatio = '1:1' | '4:5' | '3:4';

const DEFAULT_POSITION: FocalPoint = { x: 50, y: 50 };

function getAspectRatioCss(ratio: CoverAspectRatio): string {
  switch (ratio) {
    case '1:1': return '1';
    case '4:5': return '4 / 5';
    case '3:4': return '3 / 4';
    default: return '1';
  }
}

interface FocalPointEditorProps {
  /** Image URL (e.g. object URL or Cloudinary URL). */
  src: string;
  /** Focal point in percent (0–100). Defaults to center. */
  position?: FocalPoint;
  /** Called when user drags to adjust position. */
  onChange?: (position: FocalPoint) => void;
  /** Aspect ratio of the container (overrides containerHeight when set). */
  aspectRatio?: CoverAspectRatio;
  /** Height of the preview container in px (used when aspectRatio is not set). */
  containerHeight?: number;
  /** Whether dragging is enabled (e.g. false when position is not persisted). */
  draggable?: boolean;
  /** Optional MUI sx for the wrapper. */
  sx?: object;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function FocalPointEditor({
  src,
  position = DEFAULT_POSITION,
  onChange,
  aspectRatio,
  containerHeight = 240,
  draggable = true,
  sx,
}: FocalPointEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);

  const useAspectRatio = aspectRatio != null;
  const containerSx = useAspectRatio
    ? { aspectRatio: getAspectRatioCss(aspectRatio), width: '100%' }
    : { width: '100%', height: containerHeight };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!draggable || !onChange) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      startRef.current = { clientX: e.clientX, clientY: e.clientY, x: position.x, y: position.y };
    },
    [draggable, onChange, position.x, position.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start || !containerRef.current || !onChange) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - start.clientX;
      const dy = e.clientY - start.clientY;
      const percentX = (dx / rect.width) * 100;
      const percentY = (dy / rect.height) * 100;
      onChange({
        x: clamp(start.x - percentX, 0, 100),
        y: clamp(start.y - percentY, 0, 100),
      });
    },
    [onChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    startRef.current = null;
  }, []);

  const x = position?.x ?? DEFAULT_POSITION.x;
  const y = position?.y ?? DEFAULT_POSITION.y;

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      sx={{
        position: 'relative',
        maxWidth: '100%',
        overflow: 'hidden',
        borderRadius: 1,
        cursor: draggable && onChange ? 'grab' : 'default',
        '&:active': draggable && onChange ? { cursor: 'grabbing' } : {},
        ...containerSx,
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        draggable={false}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${x}% ${y}%`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </Box>
  );
}

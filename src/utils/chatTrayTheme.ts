import type { SxProps, Theme } from '@mui/material/styles';

/** Shared surface for event chat message list + composer (WhatsApp-like tray). */
export const chatTraySurfaceSx: SxProps<Theme> = {
  bgcolor: (theme) =>
    theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
  borderRadius: 2,
  overflow: 'hidden',
};

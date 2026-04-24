import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    layout: { contentMaxWidth: number; messagesMaxWidth: number };
  }
  interface ThemeOptions {
    layout?: { contentMaxWidth: number; messagesMaxWidth?: number };
  }
}

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  shape: { borderRadius: 8 },
  layout: { contentMaxWidth: 720, messagesMaxWidth: 1180 },
});

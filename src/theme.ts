import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    layout: { contentMaxWidth: number };
  }
  interface ThemeOptions {
    layout?: { contentMaxWidth: number };
  }
}

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  shape: { borderRadius: 8 },
  layout: { contentMaxWidth: 720 },
});

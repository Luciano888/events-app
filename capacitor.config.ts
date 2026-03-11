import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eventsapp.mvp',
  appName: 'Events App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

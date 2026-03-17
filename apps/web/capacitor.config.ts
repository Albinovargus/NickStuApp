import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myapp.starter',
  appName: 'MyApp',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
    },
    // If Android WebView < 140 returns incorrect safe-area-inset-* values,
    // set insetsHandling: 'disable' and let @capacitor-community/safe-area handle it
  },
};

export default config;

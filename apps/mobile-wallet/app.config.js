// Dynamic Expo config — replaces app.json
// Reads API_URL from .env so you never need to hardcode an IP again.
// Just set API_URL=http://<your-ip>:3001 in the root .env file.

const { execSync } = require('child_process');

// Auto-detect local IP as a fallback if API_URL is not set
function getLocalIP() {
  try {
    const ip = execSync(
      "ip route get 1.1.1.1 | grep -oP 'src \\K[\\d.]+'",
      { encoding: 'utf8' }
    ).trim();
    return ip || '192.168.1.1';
  } catch {
    return '192.168.1.1';
  }
}

const apiUrl = process.env.API_URL || `http://${getLocalIP()}:3001`;

console.log(`[app.config.js] Using API URL: ${apiUrl}`);

module.exports = {
  expo: {
    name: 'MobileWallet',
    slug: 'mobile-wallet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobile-wallet',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.angayarkanni.mobilewallet',
    },
    web: {
      bundler: 'metro',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    extra: {
      apiUrl,
      eas: {
        projectId: '9395f8e0-70c8-48f2-ac68-4dc204b6d174',
      },
    },
  },
};

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens'; // 🛑 THE "PERMANENT FIX" for experimental native casting bugs

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

import { registerRootComponent } from 'expo';
import { App } from './src/app/App';
enableScreens(false);

// Safely set global.Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
} else {
  // Buffer already exists, check if it's the correct implementation
  if (global.Buffer !== Buffer) {
    console.warn(
      'Global Buffer already defined and differs from buffer package',
    );
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';

export const App = () => {
  const [currentScreen, setCurrentScreen] = useState<'Splash' | 'Home' | 'Scanner' | 'Result' | 'History'>('Splash');
  const [resultParams, setResultParams] = useState<any>(null);

  const navigation = {
    navigate: (screen: any, params?: any) => {
      if (params) {
        setResultParams(params);
      }
      setCurrentScreen(screen);
    },
    goBack: () => setCurrentScreen('Home'),
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      {currentScreen === 'Splash'   && <SplashScreen onFinish={() => setCurrentScreen('Home')} />}
      {currentScreen === 'Home'     && <HomeScreen navigation={navigation} />}
      {currentScreen === 'Scanner'  && <ScannerScreen navigation={navigation} />}
      {currentScreen === 'Result'   && <ResultScreen route={{ params: resultParams }} navigation={navigation} />}
      {currentScreen === 'History'  && <HistoryScreen navigation={navigation} />}
    </SafeAreaProvider>
  );
};

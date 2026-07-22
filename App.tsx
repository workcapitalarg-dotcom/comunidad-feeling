import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { deactivateKeepAwake } from 'expo-keep-awake';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import MainTabs from './src/navigation/MainTabs';
import { 
  useFonts,
  PlayfairDisplay_400Regular_Italic, 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { PublicSans_400Regular, PublicSans_600SemiBold } from '@expo-google-fonts/public-sans';
import { Montserrat_700Bold, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { Archivo_400Regular } from '@expo-google-fonts/archivo';
import { SpaceGrotesk_300Light, SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk';
import { Syne_700Bold, Syne_600SemiBold } from '@expo-google-fonts/syne';
import { Fraunces_400Regular_Italic, Fraunces_700Bold, Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

import { PwaInstallBanner } from './src/components/PwaInstallBanner';

// ============================================================
// APP ROOT — Proveedores → Splash → Main
// ============================================================

function AppContent() {
  const [ready, setReady] = useState(false);
  const { colorTheme } = useTheme();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
    Archivo_400Regular,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    Syne_700Bold,
    Syne_600SemiBold,
    Fraunces_400Regular_Italic,
    Fraunces_700Bold,
    Fraunces_600SemiBold_Italic,
    DMSans_400Regular,
    DMSans_700Bold,
  });

  useEffect(() => {
    // Forzamos la desactivación de cualquier bloqueo de pantalla al iniciar la app.
    // Solo los componentes VideoPlayer activarán el bloqueo cuando sea necesario.
    const resetKeepAwake = async () => {
      try {
        await deactivateKeepAwake();
        console.log('[App] Protector de pantalla habilitado por defecto.');
      } catch (e) {
        console.warn('[App] No se pudo resetear KeepAwake:', e);
      }
    };
    resetKeepAwake();
  }, []);

  if (!fontsLoaded) return null;

  const content = (
    <SafeAreaProvider>
      <StatusBar style={colorTheme.statusBarStyle} backgroundColor={colorTheme.background} />
      <NavigationContainer>
        {!ready ? (
          <SplashScreen onReady={() => setReady(true)} />
        ) : (
          <MainTabs />
        )}
      </NavigationContainer>
      <PwaInstallBanner />
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={[styles.webPhoneFrame, { backgroundColor: colorTheme.background }]}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#0c0f1d', // Ultra oscuro futurista a tono con la app
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webPhoneFrame: {
    width: '100%',
    maxWidth: 430, // Ancho de un iPhone 15 Pro Max aprox
    height: '100%',
    maxHeight: 900,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#1e293b', 
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    alignSelf: 'center',
  },
});

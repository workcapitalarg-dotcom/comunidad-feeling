import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Verificar si ya se está ejecutando como PWA instalada
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Ya está instalada, no mostrar banner
    }

    // Detección de dispositivos iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIosDevice) {
      setIsIos(true);
      const iosDismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!iosDismissed) {
        setShowBanner(true);
      }
      return;
    }

    // Interceptador para Android / Chrome / Edge / Firefox
    const handleBeforeInstallPrompt = (e: Event) => {
      // PREVENIR EL COMPORTAMIENTO NATIVO (evita que Chrome ponga timeout o el cartel nativo efímero)
      e.preventDefault();
      // Guardar el evento para dispararlo cuando el usuario presione "Instalar"
      setDeferredPrompt(e);
      
      const wasDismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!wasDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      // Disparar el prompt nativo guardado
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        console.log('[PWA] El usuario aceptó instalar la App');
      } else {
        console.log('[PWA] El usuario rechazó instalar la App');
      }
    } catch (err) {
      console.warn('[PWA] Error al disparar instalador:', err);
    } finally {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    try {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    } catch (e) {}
  };

  if (!showBanner || dismissed) return null;

  return (
    <View style={styles.bannerOverlay}>
      <View style={styles.bannerCard}>
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>Instalar Comunidad Feeling</Text>
            <Text style={styles.subtitleText}>
              {isIos
                ? 'Para instalar en tu iPhone: Toca "Compartir" ⎘ en Safari y elige "Agregar al inicio" ➕'
                : 'Instala esta aplicación en tu pantalla de inicio para un acceso directo y fluido.'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {!isIos && deferredPrompt && (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleInstallClick} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>Instalar App</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btnSecondary} onPress={handleDismiss} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>{isIos ? 'Entendido' : 'Ahora no'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  bannerCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconText: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnSecondaryText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 13,
  },
});

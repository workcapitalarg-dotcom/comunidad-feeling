import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { useApp, AppUser } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getDeviceId } from '../utils/deviceId';
import { startSessionTimer } from '../utils/SessionTimer';
import {
  URL_SIGNUP,
  V_NAME,
  V_CODE,
  USE_MOCKS,
  MSG_BIENVENIDA
} from '../config/app_config';
import { MOCK_HANDSHAKE } from '../data/mockData';
import { debugFetch } from '../utils/debugFetch';
import { getPushToken } from '../utils/pushToken';

// ============================================================
// SPLASH SCREEN — Primera pantalla: Handshake + lógica de inicio
// ============================================================

interface SplashScreenProps {
  onReady: () => void;  // Callback para navegar a MainTabs
}

export default function SplashScreen({ onReady }: SplashScreenProps) {
  const { setUser, updateActivo } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const deviceId = await getDeviceId();
      let data: any;

      // Obtener FCM token antes del handshake (atómico, no bloquea si falla)
      const fcmToken = await getPushToken();

      if (USE_MOCKS) {
        // Simular delay de red
        await new Promise(r => setTimeout(r, 1200));
        data = MOCK_HANDSHAKE;
      } else {
        data = await debugFetch(URL_SIGNUP, {
          device_id: deviceId,
          v_name: V_NAME,
          v_code: V_CODE,
          fcm_token: fcmToken,
        });
      }

      // --- auth false: error de conexión/bloqueo ---
      const isAuthTrue = (data.auth === true || data.auth === 'true');
      if (!isAuthTrue) {
        setError(data.mensaje || 'No se pudo conectar con el servidor. Intentá más tarde.');
        return;
      }

      // --- Forzar actualización ---
      const isUpdateTrue = (data.actualizar_version === true || data.actualizar_version === 'true');
      if (isUpdateTrue) {
        setShowUpdate(true);
        return;
      }

      // Helper para convertir strings 'true'/'false' a boolean
      const toBool = (v: any) => v === true || v === 'true';

      // --- Guardar usuario en contexto ---
      const user: AppUser = {
        u_id: Number(data.usuario_id),
        u_nombre: String(data.nombre || 'Usuario'),
        u_status: String(data.status || 'nuevo'),
        u_nivel: Number(data.nivel || 1),
        u_registrado: toBool(data.registrado),
        u_activo: toBool(data.activo),
        isAuthenticated: true,
      };
      setUser(user);

      // --- Iniciar cronómetro silencioso ---
      startSessionTimer(data.usuario_id, updateActivo);

      // --- Nuevo vs recurrente ---
      console.log(`[Handshake] status="${data.status}" | nombre="${data.nombre}"`);
      if (data.status === 'nuevo' || data.status === 'nuevo registro' || data.status === 'nuevo_registro') {
        setWelcomeName(data.nombre || 'Amigo');
        setShowWelcome(true);
      } else {
        onReady();
      }
    } catch (e) {
      setError('Error de conexión. Verificá tu internet.');
    }
  }

  // --- Pantalla de error ---
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colorTheme.background }]}>
        <Text style={[styles.errorIcon]}>⚠️</Text>
        <Text style={[styles.errorTitle, { color: colorTheme.textPrimary }]}>Sin conexión</Text>
        <Text style={[styles.errorMsg, { color: colorTheme.textSecondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colorTheme.accent }]}
          onPress={() => { setError(null); init(); }}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.center, { backgroundColor: colorTheme.background }]}>
      {/* Logo / Branding */}
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { borderColor: colorTheme.accent }]}>
          <Text style={[styles.logoText, { color: colorTheme.accent }]}>CF</Text>
        </View>
        <Text style={[styles.appName, { color: colorTheme.textPrimary }]}>Comunidad Feeling</Text>
        <Text style={[styles.tagline, { color: colorTheme.textSecondary }]}>Conectando desde el corazón</Text>
      </View>

      <ActivityIndicator size="large" color={colorTheme.accent} style={{ marginTop: 48 }} />

      {/* Modal: Actualización Obligatoria */}
      <Modal visible={showUpdate} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colorTheme.surface, borderColor: colorTheme.border }]}>
            <Text style={[styles.modalTitle, { color: colorTheme.textPrimary }]}>Actualización Requerida</Text>
            <Text style={[styles.modalMsg, { color: colorTheme.textSecondary }]}>
              Hay una nueva versión disponible. Debés actualizar la app para continuar.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colorTheme.accent }]}
              onPress={() => Linking.openURL('https://play.google.com/store')}
            >
              <Text style={styles.modalBtnText}>Actualizar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Bienvenida (usuario nuevo) */}
      <Modal visible={showWelcome} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.welcomeBox, { backgroundColor: colorTheme.surface, borderColor: colorTheme.border }]}>
            <View style={styles.welcomeContent}>
              <Text style={{ fontSize: 30, textAlign: 'center', marginBottom: 8 }}>🌿</Text>
              
              <Text style={[styles.welcomeTitle, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos }]}>
                ¡Hola!
              </Text>
              
              <ScrollView style={{ marginVertical: 10, flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.welcomeMsg, { color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo }]}>
                  {MSG_BIENVENIDA}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colorTheme.accent }]}
                onPress={() => { setShowWelcome(false); onReady(); }}
              >
                <Text style={[styles.modalBtnText, { fontFamily: fontCombo.labelsNav }]}>COMENZAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logoContainer: { alignItems: 'center' },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoText: { fontSize: 32, fontWeight: '900' },
  appName: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  tagline: { fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  errorMsg: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  retryBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center' }, // Updated for update modal
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' }, // Updated for update modal
  modalMsg: { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 }, // Updated for update modal
  modalBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }, // Updated for update modal
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 }, // Updated for update modal
  welcomeBox: { 
    width: '88%', 
    aspectRatio: 3/4,       // Más espacio vertical que 4/5
    borderRadius: 30, 
    borderWidth: 1, 
    overflow: 'hidden'
  },
  welcomeContent: { flex: 1, padding: 22, alignItems: 'center' },
  welcomeTitle: { fontSize: 22, textAlign: 'center', marginBottom: 4 },
  welcomeMsg: { fontSize: 15, textAlign: 'center', lineHeight: 23 },
});

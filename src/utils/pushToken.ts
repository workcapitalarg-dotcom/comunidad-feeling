import * as Notifications from 'expo-notifications';
import * as Constants from 'expo-constants';
import { Platform, LogBox } from 'react-native';

// Ignorar advertencias específicas que molestan en el dispositivo físico
LogBox.ignoreLogs([
  'expo-notifications',
  'KeepAwake',
]);

// ============================================================
// PUSH TOKEN HELPER
// Obtiene el token FCM nativo para uso con Firebase/n8n.
//
// IMPORTANTE: expo-notifications no soporta push nativo en
// Expo Go desde SDK 53. Funciona correctamente en Dev Build
// y en producción. En Expo Go retorna null silenciosamente.
//
// Reglas de oro:
//   - Expo Go         → devuelve null (sin error)
//   - granted         → devuelve token (silencioso)
//   - undetermined    → pide permiso al SO una sola vez
//   - denied          → devuelve null sin molestar al usuario
// ============================================================

const isExpoGo = Constants.default?.appOwnership === 'expo';

export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  // En Expo Go no hay soporte de push nativo desde SDK 53
  if (isExpoGo) {
    console.log('[PushToken] Expo Go detectado → fcm_token=null (normal en desarrollo)');
    return null;
  }

  try {
    // 1. Verificar estado del permiso
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Si todavía no preguntamos (primera vez), pedimos permiso
    if (existingStatus === 'undetermined') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 3. Si el usuario dijo "No", respetamos su decisión
    if (finalStatus !== 'granted') {
      return null;
    }

    // 4. Permiso concedido → obtener token FCM nativo
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      return tokenData.data;
    }

    return null;
    } catch (e) {
    // Silencio absoluto para que no aparezca ni en consola si así se desea, 
    // pero lo dejamos como log simple para el desarrollador.
    // console.log('[PushToken] No se pudo obtener el token:', e);
    return null;
  }
}

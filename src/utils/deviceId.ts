import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { DEVICE_ID_LENGTH, DEVICE_ID_SUFFIX } from '../config/app_config';
import { Platform } from 'react-native';

// ============================================================
// DEVICE ID — Persistencia doble para sobrevivir reinstalaciones (Android)
// Estrategia: SecureStore (primario) + archivo oculto (fallback Android)
// ============================================================

const SECURE_STORE_KEY = 'cf_device_id';
const HIDDEN_FILE_PATH = ((FileSystem as any).documentDirectory || '') + '.cf_device_cfg';

function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < DEVICE_ID_LENGTH; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomPart + DEVICE_ID_SUFFIX;
}

async function readFromFile(): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(HIDDEN_FILE_PATH);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(HIDDEN_FILE_PATH);
      const data = JSON.parse(content);
      if (data?.device_id) return data.device_id;
    }
  } catch (_) {}
  return null;
}

async function writeToFile(deviceId: string): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(
      HIDDEN_FILE_PATH,
      JSON.stringify({ device_id: deviceId }),
    );
  } catch (_) {}
}

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const fromLocal = localStorage.getItem(SECURE_STORE_KEY);
      if (fromLocal) return fromLocal;
      const newId = generateDeviceId();
      localStorage.setItem(SECURE_STORE_KEY, newId);
      return newId;
    } catch (_) {
      return generateDeviceId();
    }
  }

  // 1. Intentar desde SecureStore
  try {
    const fromSecure = await SecureStore.getItemAsync(SECURE_STORE_KEY);

    if (fromSecure) return fromSecure;
  } catch (_) {}

  // 2. Intentar desde archivo oculto (fallback Android tras reinstalación)
  const fromFile = await readFromFile();
  if (fromFile) {
    // Restaurar en SecureStore si faltaba
    try { await SecureStore.setItemAsync(SECURE_STORE_KEY, fromFile); } catch (_) {}
    return fromFile;
  }

  // 3. Generar nuevo ID y guardar en ambos lugares
  const newId = generateDeviceId();
  try { await SecureStore.setItemAsync(SECURE_STORE_KEY, newId); } catch (_) {}
  await writeToFile(newId);

  return newId;
}

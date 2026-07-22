import { AppState, AppStateStatus } from 'react-native';
import { URL_CRONOMETRO, USE_MOCKS } from '../config/app_config';
import { MOCK_CRONOMETRO } from '../data/mockData';

// ============================================================
// CRONÓMETRO DE SESIÓN — Completamente silencioso para el usuario
// Acumula segundos en primer plano y envía al pasar a background/cierre
// ============================================================

type OnActivoChange = (nuevoActivo: boolean) => void;

let sessionStartTime: number | null = null;
let currentUserId: number | null = null;
let onActivoChangeCallback: OnActivoChange | null = null;
let subscription: any = null;

async function sendSessionTime(segundos: number): Promise<void> {
  if (segundos <= 1 || !currentUserId) return;

  console.log(`[Cronómetro] Enviando ${segundos}s para u_id=${currentUserId}`);

  if (USE_MOCKS) {
    // Simular respuesta del servidor
    const resp = MOCK_CRONOMETRO;
    if (resp.nuevo_u_activo && onActivoChangeCallback) {
      onActivoChangeCallback(true);
    }
    return;
  }

  try {
    const response = await fetch(URL_CRONOMETRO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ u_id: currentUserId, segundos }),
    });
    const data = await response.json();
    if (data?.nuevo_u_activo && onActivoChangeCallback) {
      onActivoChangeCallback(true);
    }
  } catch (error) {
    console.log('[Cronómetro] Error al enviar:', error);
  }
}

function handleAppStateChange(nextState: AppStateStatus): void {
  if (nextState === 'active') {
    // App vuelve a primer plano: iniciar contador
    if (sessionStartTime === null) {
      sessionStartTime = Date.now();
    }
  } else if (nextState === 'background' || nextState === 'inactive') {
    // App va a segundo plano o se cierra: calcular y enviar
    if (sessionStartTime !== null) {
      const delta = Math.floor((Date.now() - sessionStartTime) / 1000);
      sessionStartTime = null; // Resetear acumulación inmediatamente por seguridad
      
      // Enviar de golpe (sin Timeout) antes de que el SO congele el Thread de JS
      sendSessionTime(delta);
    }
  }
}

export function startSessionTimer(
  userId: number,
  onActivoChange: OnActivoChange,
): void {
  currentUserId = userId;
  onActivoChangeCallback = onActivoChange;
  sessionStartTime = Date.now(); // La app ya está activa al iniciar

  // [HOT RELOAD FIX] Matar fantasmas de AppState previos anclados a memoria
  if ((global as any).__sessionTimerSub) {
    (global as any).__sessionTimerSub.remove();
  }

  // Suscribir al cambio de estado de la app
  subscription = AppState.addEventListener('change', handleAppStateChange);
  (global as any).__sessionTimerSub = subscription;
}

export function stopSessionTimer(): void {
  // Enviar tiempo acumulado al cerrar
  if (sessionStartTime !== null) {
    const delta = Math.floor((Date.now() - sessionStartTime) / 1000);
    sessionStartTime = null;
    sendSessionTime(delta);
  }

  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  if ((global as any).__sessionTimerSub) {
    (global as any).__sessionTimerSub.remove();
    (global as any).__sessionTimerSub = null;
  }

  currentUserId = null;
  onActivoChangeCallback = null;
}

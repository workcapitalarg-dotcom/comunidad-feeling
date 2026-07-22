import { URL_REGISTRO_AVANCE_VIDEO, USE_MOCKS } from '../config/app_config';
import { debugFetch } from './debugFetch';

// ============================================================
// TRACKING UNIVERSAL DE VIDEO
// Se usa en TODOS los reproductores de video de la app:
// FeedCard, VideoPlayer, Empresas, Galería, Novedades, Agenda
// ============================================================

type EstadoVideo = 'iniciado' | 'completado';

export async function registrarVideo(
  user_id: number | null,
  video_id: string,
  estado: EstadoVideo,
): Promise<void> {
  console.log(`[VideoTracking] user_id=${user_id} video_id=${video_id} estado=${estado}`);

  if (USE_MOCKS) return; // En modo mock solo loguea

  if (!user_id) return;

  try {
    await debugFetch(URL_REGISTRO_AVANCE_VIDEO, { user_id, video_id, estado });
  } catch (error) {
    console.log('[VideoTracking] Error al registrar:', error);
  }
}

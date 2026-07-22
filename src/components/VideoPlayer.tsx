import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { registrarVideo } from '../utils/videoTracking';
import { useTheme } from '../context/ThemeContext';
import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused } from '@react-navigation/native';



// ============================================================
// VIDEO PLAYER UNIVERSAL
// Maneja portada (url_foto_video), fallback, ícono play,
// y tracking automático de inicio/fin para todos los videos de la app
// ============================================================

interface VideoPlayerProps {
  videoId: string;
  url_archivo: string;
  url_foto_video?: string | null;
  style?: object;
  autoPlay?: boolean;
  shouldPlay?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
  disableTracking?: boolean;
}

const PLACEHOLDER = require('../../assets/placeholder-video.png');

export default function VideoPlayer({
  videoId,
  url_archivo,
  url_foto_video,
  style,
  autoPlay = false,
  shouldPlay: propShouldPlay,
  onPlaybackStatusUpdate,
  disableTracking = false,
}: VideoPlayerProps) {
  const { user, activeMediaId, setActiveMediaId, setAnyVideoCompleted } = useApp();
  const { colorTheme } = useTheme();
  const videoRef = useRef<Video>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const justStarted = useRef(false); // Seguro de arranque contra interrupciones rápidas
  const hasTrackedStart = useRef(false);
  const hasLogged30s = useRef(false);


  const isFocused = useIsFocused(); // React Navigation Focus (Tabs)

  // Auto-pausa al perder el foco de la pantalla (Cambio de Tabs)
  React.useEffect(() => {
    if (!isFocused && isPlaying) {
      setIsPlaying(false);
      videoRef.current?.pauseAsync();
    }
  }, [isFocused]);

  // EFECTO DE INTERRUPCIÓN Y ARRANQUE EXTERNO
  React.useEffect(() => {
    // 1. ARRANQUE EXTERNO (desde Inicio u otro lugar)
    if (activeMediaId === videoId && !isPlaying) {
      // Aplicamos el seguro también aquí
      justStarted.current = true;
      setTimeout(() => { justStarted.current = false; }, 500);
      setIsPlaying(true);
      setIsLoading(true);
      if (!hasTrackedStart.current && !disableTracking) {
        registrarVideo(user.u_id, videoId, 'iniciado').catch(() => {});
        hasTrackedStart.current = true;
      }
      return;
    }

    // 2. Me detengo si no soy el activo
    // (Sin seguros, la parada debe ser inmediata ante el cambio de activeMediaId)
    if (activeMediaId !== videoId && isPlaying) {
      setIsPlaying(false);
    }
  }, [activeMediaId, isPlaying, videoId]);

  // Limpieza: SOLO al desmontar el componente físicamente de la pantalla
  React.useEffect(() => {
    return () => {
      // Usamos una referencia o lógica simple para no limpiar si solo cambia el ID
    };
  }, []);

  const posterSource =
    url_foto_video && !posterError
      ? { uri: url_foto_video }
      : PLACEHOLDER;

  const handlePlay = async () => {
    // 1. ACTIVAMOS EL SEGURO (Impide que el global lo pare justo al nacer)
    justStarted.current = true;
    setTimeout(() => { justStarted.current = false; }, 500);

    // 2. ARRANCAMOS LOCALMENTE
    setIsPlaying(true);
    setIsLoading(true);
    
    // 3. NOTIFICAMOS AL GLOBAL
    setActiveMediaId(videoId);

    // Tracking unica vez
    if (!hasTrackedStart.current && !disableTracking) {
      registrarVideo(user.u_id, videoId, 'iniciado').catch(() => {});
      hasTrackedStart.current = true;
    }
  };

  const handlePlaybackStatus = async (status: AVPlaybackStatus) => {
    onPlaybackStatusUpdate?.(status);
    if (!status.isLoaded) return;

    if (status.isLoaded && isLoading) setIsLoading(false);

    // Registro de Playback a los 30 segundos (URL_REGISTRAR_PLAY)
    if (status.positionMillis >= 30000 && !hasLogged30s.current) {
       hasLogged30s.current = true;
       console.log(`[VideoPlayer] 30s superados en video id: ${videoId}. Registrando play...`);
       
       const attemptRegister = async () => {
         try {
           const { URL_REGISTRAR_PLAY } = require('../config/app_config');
           const { debugFetch } = require('../utils/debugFetch');
           await debugFetch(URL_REGISTRAR_PLAY, { user_id: user.u_id, contenido_id: videoId, tipo: 'video' });
           console.log(`[VideoPlayer] Play (30s) registrado con éxito para id: ${videoId}`);
         } catch (e) {
           console.error(`[VideoPlayer] Error al registrar play (30s) para id: ${videoId}, reintentando...`);
           setTimeout(attemptRegister, 10000);
         }
       };
       attemptRegister();
    }

    // Si termina solo, liberamos el slot global y el candado
    if (status.didJustFinish) {
      setActiveMediaId(null);
      const { deactivateKeepAwake } = require('expo-keep-awake');
      deactivateKeepAwake();

      if (!disableTracking) {
        setAnyVideoCompleted(true);
        registrarVideo(user.u_id, videoId, 'completado').catch(() => {});
      }
    }
  };

  if (!isPlaying) {
    // Toda la zona es clicable para iniciar ("One-Click")
    return (
      <TouchableOpacity
        style={[styles.container, style, { zIndex: 10 }]}
        onPress={handlePlay}
        activeOpacity={0.9}
      >
        <Image
          source={posterSource}
          style={styles.poster}
          resizeMode="cover"
          onError={() => setPosterError(true)}
        />
        {/* Overlay oscuro */}
        <View style={styles.overlay} />
        <View style={styles.playButtonContainer} pointerEvents="none">
          <View style={[styles.playCircle, { backgroundColor: '#facc15' }]}>
            <MaterialIcons name="play-arrow" size={32} color="#000" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Reproduciendo
  return (
    <View style={[styles.container, style]}>
      {/* Candado dinámico: Solo activo mientras el video está en pantalla y reproduciendo */}
      <ScreenWakeLock isPlaying={isPlaying} />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colorTheme.accent} />
        </View>
      )}
      <Video
        ref={videoRef}
        source={{ uri: url_archivo }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isMuted={false}
        onPlaybackStatusUpdate={handlePlaybackStatus}
        useNativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButtonContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
    zIndex: 100,
  },
  playCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playIcon: {
    fontSize: 22,
    color: '#fff',
    marginLeft: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});

// Componente helper para manejar el candado de forma atómica
function ScreenWakeLock({ isPlaying }: { isPlaying: boolean }) {
  const { activateKeepAwake, deactivateKeepAwake } = require('expo-keep-awake');
  
  React.useEffect(() => {
    if (isPlaying) {
      activateKeepAwake();
      console.log('[WakeLock] Pantalla BLOQUEADA (Video en curso)');
    } else {
      deactivateKeepAwake();
      console.log('[WakeLock] Pantalla LIBERADA (Video pausado/detenido)');
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [isPlaying]);

  return null;
}

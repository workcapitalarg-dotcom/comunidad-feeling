import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { URL_TOGGLE_FAVORITO, URL_REGISTRAR_PLAY } from '../config/app_config';
import { debugFetch } from '../utils/debugFetch';

interface AudioPlayerProps {
  id: string;
  titulo: string;
  url_archivo: string;
  caratula?: string | null;
  es_favorito?: boolean;
  onFavoritoToggleSuccess?: () => void;
  onFinish?: () => void;
  duracion_ms?: number;
  showFavorite?: boolean;
}

const PLACEHOLDER = require('../../assets/placeholder-video.png');

export default function AudioPlayer({ id, titulo, url_archivo, caratula, es_favorito = false, onFavoritoToggleSuccess, onFinish, duracion_ms, showFavorite = true }: AudioPlayerProps) {
  const { user, activeMediaId, setActiveMediaId, toggleFavoritoId } = useApp();
  const { colorTheme, fontCombo } = useTheme();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(duracion_ms || 1);
  const [isFavorito, setIsFavorito] = useState(es_favorito);
  const [posterError, setPosterError] = useState(false);

  const hasTrackedPlay = useRef(false);
  const isComponentMounted = useRef(true);

  const initialActiveIdRef = useRef<string | null>(activeMediaId);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Auto-Stop: si el global focus se mueve a otro ID, detenemos este audio
  useEffect(() => {
    isComponentMounted.current = true;
    
    // Configurar para permitir reproducción en Background / Pantalla de Bloqueo
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      isComponentMounted.current = false;
      if (soundRef.current) {
        soundRef.current.pauseAsync().then(() => {
          soundRef.current?.unloadAsync();
        });
      }
    };
  }, []);

  useEffect(() => {
    if (activeMediaId !== id && sound) {
      stopAudio();
    } else if (activeMediaId === id && !isPlaying && !isLoading) {
      // SOLO REPRODUCIR SI:
      // El ID activo actual NO es el mismo que estaba al momento de montar la pantalla (evita el play al entrar)
      // O si el ID activo cambió expresamente por una acción posterior
      if (initialActiveIdRef.current !== id) {
        console.log(`[AudioPlayer] Iniciando Auto-Play para ID: ${id}`);
        loadAndPlayAudio();
      }
    }
  }, [activeMediaId]);

  const validateUrl = (url: string | null | undefined) => {
    return !!(url && typeof url === 'string' && url !== 'null' && url !== 'undefined' && url.trim() !== '');
  };

  const loadAndPlayAudio = async () => {
    console.log(`[AudioPlayer] Intentando reproducir ID: ${id} | Título: "${titulo}"`);
    console.log(`[AudioPlayer] URL recíbida: "${url_archivo}"`);
    try {
      if (!validateUrl(url_archivo)) {
        console.log(`[AudioPlayer] Validación fallida. URL detectada como inválida.`);
        alert('Este archivo de audio no cuenta con un link válido ("' + url_archivo + '")');
        return;
      }

      setIsLoading(true);
      setActiveMediaId(id);

      if (sound) {
        console.log(`[AudioPlayer] Reanudando audio preexistente en memoria...`);
        await sound.playAsync();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }

      console.log(`[AudioPlayer] Cargando desde red mediante expo-av...`);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url_archivo },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      if (isComponentMounted.current) {
        setSound(newSound);
        soundRef.current = newSound;
        setIsPlaying(true);
        setIsLoading(false);
      } else {
        console.log(`[AudioPlayer] Componente desmontado rápido. Descargando audio.`);
        newSound.unloadAsync(); // Evitar fuga de memoria si se desmontó rápido
      }
    } catch (error: any) {
      console.error(`[AudioPlayer] FALLO CRÍTICO al cargar audio (ID: ${id}):`, error);
      alert(`Fallo reproduciendo el audio.\n\nMotivo interno: ${error.message || error}\nPista: ${url_archivo}`);
      setIsLoading(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (e) {
      console.log('Error deteniendo audio', e);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      loadAndPlayAudio();
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (isComponentMounted.current) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 1);
      setIsPlaying(status.isPlaying);
    }

    // Registrar Playback si pasa de los 30s
    if (status.positionMillis >= 30000 && !hasTrackedPlay.current) {
      hasTrackedPlay.current = true;
      console.log(`[AudioPlayer] 30s superados, iniciando registro Playback silencioso de id: ${id}`);
      
      const attemptRegisterPlay = async () => {
        try {
          await debugFetch(URL_REGISTRAR_PLAY, { user_id: user.u_id, contenido_id: id, tipo: 'audio' });
          console.log(`[AudioPlayer] Play (30s) registrado exitosamente para id: ${id}`);
        } catch (e) {
          console.error(`[AudioPlayer] CRÍTICO: Falló el registro de play para id: ${id}. Reintentando en 10 segundos...`);
          setTimeout(attemptRegisterPlay, 10000);
        }
      };

      attemptRegisterPlay();
    }

    if (status.didJustFinish) {
      console.log(`[AudioPlayer] Finalizó track id: ${id}. Disparando onFinish...`);
      // IMPORTANTE: Limpiar el estado interno para que el botón de Play vuelva a funcionar
      setIsPlaying(false);
      setPosition(0);
      setSound(null);
      soundRef.current = null;
      
      // SOLO resetear el ID global si NO hay un onFinish (el flujo autoplay se encargará del nuevo ID)
      if (!onFinish) {
        setActiveMediaId(null);
      }
      
      if (onFinish) onFinish();
    }
  };

  // Cambio de Favorito Optimista
  const handleToggleFavorito = () => {
    const newState = !isFavorito;
    setIsFavorito(newState); // UI changes fast
    console.log(`[AudioPlayer] Enviando toggle Fav para id: ${id} a estado: ${newState}`);
    debugFetch(URL_TOGGLE_FAVORITO, { user_id: user.u_id, contenido_id: id })
      .then((res: any) => {
        // DETECCIÓN ROBUSTA: n8n puede mandar el objeto directo o dentro de un array [{...}]
        const data = Array.isArray(res) ? res[0] : res;
        
        const isSuccess = (data && (typeof data.es_favorito !== 'undefined' || data.status === 'added' || data.status === 'removed'));
        
        if (isSuccess) {
          const finalState = typeof data.es_favorito !== 'undefined' ? data.es_favorito : (data.status === 'added');
          console.log(`[AudioPlayer] Toggle Fav confirmado server para id: ${id}, server_status: ${finalState}`);
          
          setIsFavorito(finalState); // Actualizamos estado visual local
          toggleFavoritoId(id, finalState); // Actualizamos Almacén Global
          
          // FORZAR REFRESH de la lista completa Mis Favoritos en el servidor
          if (onFavoritoToggleSuccess) {
             console.log(`[AudioPlayer] Notificando éxito al padre para refrescar listas_especiales...`);
             onFavoritoToggleSuccess();
          }
        } else {
          console.log(`[AudioPlayer] El servidor respondió pero el formato no es reconocido como éxito:`, res);
        }
      })
      .catch((e) => {
         console.error(`[AudioPlayer] Error disparando Toggle Fav para id: ${id}`, e);
         setIsFavorito(!newState); // Rollback en error
      });
  };

  // Cálculo de progreso (barrita)
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  
  // Formato ms a mm:ss
  const formatTime = (ms: number, isDuration?: boolean) => {
    // Si es la duración y aún no cargó el audio real (ms < 100), mostramos --:-- 
    if (isDuration && ms <= 1) return "--:--";
    if (!ms || ms <= 0) return "0:00";
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };




  return (
    <TouchableOpacity 
       style={[
         styles.playerContainer, 
         { backgroundColor: colorTheme.card, borderColor: colorTheme.border, opacity: validateUrl(url_archivo) ? 1 : 0.6 }
       ]}
       activeOpacity={validateUrl(url_archivo) ? 0.7 : 1}
       onPress={() => { 
         console.log(`[AudioPlayer] Tarjeta Clickeada (ID: ${id}). validateUrl='${validateUrl(url_archivo)}'`);
         if(validateUrl(url_archivo)) {
           togglePlayPause();
         } else {
           alert('La URL provista por el servidor no existe o viene vacía.');
         }
       }}
    >
      
      {/* Carátula */}
      <Image 
        source={caratula && !posterError ? { uri: caratula } : PLACEHOLDER} 
        style={styles.coverImage} 
        onError={() => setPosterError(true)}
      />

      <View style={styles.controlsInfoWrapper}>
        {/* Título y Fav */}
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos }]} numberOfLines={1}>
            {titulo}
          </Text>
          {showFavorite && (
            <TouchableOpacity onPress={handleToggleFavorito} style={styles.iconBtn}>
              <MaterialIcons 
                name={isFavorito ? "favorite" : "favorite-border"} 
                size={24} 
                color={isFavorito ? "#ef4444" : colorTheme.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Bar & Timers */}
        <View style={styles.progressRow}>
          <Text style={[styles.timeText, { color: colorTheme.textSecondary }]}>{formatTime(position)}</Text>
          <View style={[styles.progressBarBg, { backgroundColor: colorTheme.border }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colorTheme.accent }]} />
          </View>
          <Text style={[styles.timeText, { color: colorTheme.textSecondary }]}>{formatTime(duration, true)}</Text>
        </View>

        {/* Play/Pause Btn (Visual) */}
        <View style={styles.mainControls}>
          <View 
            style={[styles.playBtn, { backgroundColor: validateUrl(url_archivo) ? colorTheme.primary : colorTheme.border }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={28} color={validateUrl(url_archivo) ? "#fff" : colorTheme.textSecondary} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    paddingRight: 12,
  },
  coverImage: {
    width: 90,
    height: '100%',
    minHeight: 90,
  },
  controlsInfoWrapper: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  iconBtn: {
    padding: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 10,
    minWidth: 30,
    textAlign: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  mainControls: {
    alignItems: 'center',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

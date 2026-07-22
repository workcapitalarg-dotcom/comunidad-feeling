import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, FlatList, Dimensions, Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import VideoPlayer from '../components/VideoPlayer';
import AudioPlayer from '../components/AudioPlayer';
import {
  URL_FAQ, URL_EJERCICIOS, USE_MOCKS, URL_BIOGRAFIA, URL_BIBLIOTECA_AUDIO, URL_LISTAS_ESPECIALES
} from '../config/app_config';
import { MOCK_MENTOR, MOCK_FAQ, MOCK_MUSICA, MOCK_EJERCICIOS } from '../data/mockData';
import { debugFetch } from '../utils/debugFetch';

// ============================================================
// MENÚ SCREEN — Estructura completa, contenido expandible
// Bio Mentor | FAQ | Biblioteca Musical | Ejercicios (si u_activo)
// ============================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W - 40; // padding: 20 a cada lado de la seccion

export default function MenuScreen() {
  const { 
    user, 
    setActiveMediaId, 
    isHeaderLoaded, 
    favoritosIds, 
    setFavoritosIds, 
    toggleFavoritoId 
  } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const subcategoryScrollRef = useRef<any>(null);

  const sections = [
    { key: 'biografia', label: '👤 Biografía del Inspirador', Component: BiografiaSection },
    { key: 'perfil',    label: '👤 Perfil', Component: PerfilSection },
    { key: 'faq',       label: '❓ Preguntas Frecuentes', Component: FAQSection },
    { key: 'musica',    label: '🎵 Música', Component: MusicaSection },
    { key: 'podcast',   label: '🎙️ Podcast', Component: PodcastSection },
    ...(user.u_activo ? [{ key: 'ejercicios', label: '🏋️ Ejercicios', Component: EjerciciosSection }] : []),
  ];

  const [openSection, setOpenSection] = useState<string | null>(null);

  // Estados de datos pre-cargados
  const [bioData, setBioData] = useState<any>(null);
  const [bioError, setBioError] = useState(false);
  const [faqData, setFaqData] = useState<any[]>([]);
  const [musicaData, setMusicaData] = useState<any[]>([]);
  const [podcastData, setPodcastData] = useState<any[]>([]);
  const [favoritosData, setFavoritosData] = useState<any[]>([]);
  const [top10Data, setTop10Data] = useState<any[]>([]);
  const [ejerciciosData, setEjerciciosData] = useState<any[]>([]);

  // ── CARGA EXCLUSIVA BIOGRAFÍA (Con Reintentos y Logs) ──
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const loadBio = async () => {
      try {
        console.log('[MenuScreen] Iniciando llamada al webhook de Biografía:', URL_BIOGRAFIA);
        if (USE_MOCKS) { 
          await delay(200); 
          setBioData(MOCK_MENTOR); 
          setBioError(false); 
          console.log('[MenuScreen] Biografía (Mock) cargada correctamente.');
        } else {
          console.log('[MenuScreen] Llamando webhook Biografía...');
          const json = await debugFetch(URL_BIOGRAFIA, { u_id: user.u_id });
          setBioData(Array.isArray(json) ? json : (json.id || json.nombre ? json : [])); 
          setBioError(false);
          console.log('[MenuScreen] Biografía cargada EXITOSAMENTE desde servidor.');
        }
      } catch (e) { 
        console.error(`[MenuScreen] CRÍTICO: Error al cargar Biografía. Se reintentará.`, e);
        setBioError(true);
      }
    };

    if (isHeaderLoaded) {
      if (!bioData && !bioError) {
        loadBio();
      } else if (bioError) {
        interval = setInterval(() => {
          console.log('[MenuScreen] Reintentando llamada al webhook de Biografía (10s)...');
          loadBio();
        }, 10000);
      }
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isHeaderLoaded, user.u_id, bioError, bioData]);

  // ── CARGA SIMULTÁNEA DE RESTO DE SUBMENÚS (Con Reintentos) ──
  useEffect(() => {
    if (!isHeaderLoaded) return; 

    // Almacén de basural para matar timers al salir de la pantalla
    let activeIntervals: NodeJS.Timeout[] = [];

    const loadAllRest = async () => {
      const fetchSectionWithRetry = async (url: string, bodyJson: any, mock: any, setter: Function) => {
        const attempt = async () => {
          try {
            if (USE_MOCKS) { await delay(200); setter(mock); return true; }
            
            let sectionName = '';
            if (url === URL_BIBLIOTECA_AUDIO) sectionName = bodyJson.tipo?.toUpperCase() || 'AUDIO';
            else if (url === URL_FAQ) sectionName = 'FAQ';
            else if (url === URL_EJERCICIOS) sectionName = 'EJERCICIOS';
            else if (url === URL_LISTAS_ESPECIALES) sectionName = 'LISTA ESPECIAL (' + bodyJson.tipo + ')';
            
            console.log(`[MenuScreen] Iniciando llamada a Webhook: ${sectionName} (${url})`);
            const json = await debugFetch(url, bodyJson);

            // Blindaje de Extracción de Arrays Crudos vs Objetos Anidados
            const parsedArray = Array.isArray(json) 
                ? json 
                : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.listas) ? json.listas : (json || [])));
            
            console.log(`[MenuScreen] Extracción parseada para ${sectionName}: Detectados ${Array.isArray(parsedArray) ? parsedArray.length : 'Falla(no es listado)'} elementos.`);
            
            // Si es la carga inicial de Favoritos o Música, sincronizamos el set global de IDs para el corazón rojo
            if (url === URL_LISTAS_ESPECIALES && bodyJson.tipo === 'favoritos') {
               setFavoritosIds(parsedArray.map((i: any) => String(i.id)));
            } else if (url === URL_BIBLIOTECA_AUDIO) {
               // Alimentación parcial de IDs favoritos desde la biblioteca general
               // Filtramos solo los que son favoritos y actualizamos el Set global de una sola vez
               const favs = parsedArray
                 .flatMap((c: any) => c.grupos || [])
                 .flatMap((g: any) => g.canciones || [])
                 .filter((i: any) => i.es_favorito)
                 .map((i: any) => String(i.id));
               
               if (favs.length > 0) {
                 setFavoritosIds(favs);
               }
            }

            setter(parsedArray); 
            console.log(`[MenuScreen] Webhook exitoso para: ${sectionName}`);
            return true; // Exito
          } catch (e) {
            console.error(`[MenuScreen] CRÍTICO: Error en llamada a Webhook de ${url}:`, e);
            return false; // Fallo
          }
        };

        // Primer intento inmediato
        const success = await attempt();
        
        // Si falla, entra en el bucle eterno de 10 segundos
        if (!success && !USE_MOCKS) {
          const intervalId = setInterval(async () => {
             console.log(`[MenuScreen] Reintentando llamada a Webhook de ${bodyJson.tipo || url} (10s)...`);
             const ok = await attempt();
             if (ok) {
               clearInterval(intervalId); // Si funciona, se suicida el timer
             }
          }, 10000);
          activeIntervals.push(intervalId);
        }
      };

      Promise.all([
        fetchSectionWithRetry(URL_FAQ, { u_id: user.u_id }, MOCK_FAQ, setFaqData),
        fetchSectionWithRetry(URL_BIBLIOTECA_AUDIO, { user_id: user.u_id, tipo: 'musica' }, MOCK_MUSICA, setMusicaData),
        fetchSectionWithRetry(URL_BIBLIOTECA_AUDIO, { user_id: user.u_id, tipo: 'podcast' }, [], setPodcastData),
        fetchSectionWithRetry(URL_LISTAS_ESPECIALES, { user_id: user.u_id, tipo: 'favoritos' }, [], setFavoritosData),
        fetchSectionWithRetry(URL_LISTAS_ESPECIALES, { user_id: user.u_id, tipo: 'top10' }, [], setTop10Data),
        ...(user.u_activo ? [fetchSectionWithRetry(URL_EJERCICIOS, { u_id: user.u_id }, MOCK_EJERCICIOS, setEjerciciosData)] : [])
      ]);
    };

    loadAllRest();

    return () => {
      activeIntervals.forEach(clearInterval);
    };
  }, [user.u_id, user.u_activo, isHeaderLoaded]);

  const refreshFavoritosTracker = async () => {
    try {
      console.log('[MenuScreen] Refrescando Webhook de MIS FAVORITOS (listas_especiales)...');
      const json = await debugFetch(URL_LISTAS_ESPECIALES, { user_id: user.u_id, tipo: 'favoritos' });
      const parsedArray = Array.isArray(json) 
            ? json 
            : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.listas) ? json.listas : (json || [])));
      
      // Actualizamos el set de IDs global para que el corazón se pinte en toda la App
      setFavoritosIds(parsedArray.map((i: any) => String(i.id)));
      
      setFavoritosData(parsedArray);
      console.log(`[MenuScreen] MIS FAVORITOS Refrescado con éxito: ${parsedArray.length} tracks.`);
    } catch (e) {
      console.log('[MenuScreen] Error al refrescar Favoritos:', e);
    }
  };

  // DETENER AUDIO AL SALIR DEL MENÚ
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Al salir de la pantalla, reseteamos el ID global
        // Esto activará los efectos de pausa en las sub-secciones
        setActiveMediaId(null);
      };
    }, [])
  );

  return (
    <View style={[{ flex: 1, backgroundColor: colorTheme.background }]}>
      {/* ScrollView principal para el menú de botones o contenido si no hay header fijo */}
      <ScrollView 
        ref={subcategoryScrollRef}
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colorTheme.primary }]}>
        {/* Sin título de cabecera — solo espacio y badge de miembro activo */}
        {user.u_activo && (
          <View style={[styles.activeBadge, { backgroundColor: colorTheme.accent + '33', borderColor: colorTheme.accent }]}>
            <Text style={[styles.activeBadgeText, { color: colorTheme.accent, fontFamily: fontCombo.labelsNav }]}>
              ✓ MIEMBRO ACTIVO
            </Text>
          </View>
        )}
      </View>

      {/* ─── VISTA DINÁMICA: DRILL-DOWN ─── */}
      {!openSection ? (
        // MENÚ PRINCIPAL
        <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 12 }}>
          {sections.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: colorTheme.card,
                padding: 18,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colorTheme.border,
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 5,
              }}
              activeOpacity={0.8}
              onPress={() => setOpenSection(key)}
            >
              <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 18 }}>
                {label}
              </Text>
              <MaterialIcons name="chevron-right" size={26} color={colorTheme.accent} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        // INTERIOR DEL SUBMENÚ (Este bloque se manejará afuera para fijar el header)
        null
      )}
      </ScrollView>

      {/* RENDERIZADO DEL SUBMENÚ CON HEADER FIJO */}
      {openSection && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colorTheme.background, paddingTop: 40 }]}>
          {/* Header del Submenú FIJO */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colorTheme.border, gap: 16 }}>
             <TouchableOpacity 
                onPress={() => {
                  setOpenSection(null);
                  setActiveMediaId(null);
                }} 
                activeOpacity={0.7}
                style={{ backgroundColor: colorTheme.card, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colorTheme.border }}
             >
                <MaterialIcons name="arrow-back" size={26} color={colorTheme.textPrimary} />
             </TouchableOpacity>
             <Text style={{ flex: 1, fontSize: 24, color: colorTheme.textPrimary, fontFamily: fontCombo.titulos }}>
               {sections.find(s => s.key === openSection)?.label?.replace(/👤 |❓ |🎵 |🎙️ |🏋️ /g, '')}
             </Text>
          </View>

          {/* Área de SCROLL para el contenido */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
            showsVerticalScrollIndicator={true}
          >
            {sections.map(({ key, Component }) => {
              if (openSection !== key) return null;
              
              const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];
              const buildSpecialCat = (titulo: string, dataArr: any[]) => {
                const arr = safeArray(dataArr).filter((item: any) => item && item.id && item.url_archivo);
                let premiumCover = 'https://placehold.co/400x400/18181b/ffffff/png?text=' + titulo.replace(' ', '+');
                if (titulo.includes('Favorito')) premiumCover = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop';
                if (titulo.includes('Top')) premiumCover = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop';
                return [{
                  subcategoria: titulo,
                  grupos: [{
                    nombre_grupo: titulo,
                    caratula: premiumCover,
                    es_favoritos_especial: titulo.includes('Favorito'),
                    canciones: arr
                  }]
                }];
              };

              return (
                <Component 
                  key={key}
                  data={
                    key === 'biografia' ? bioData :
                    key === 'faq' ? faqData :
                    key === 'musica' ? [
                      ...safeArray(musicaData),
                      ...buildSpecialCat('Mis Favoritos', favoritosData), 
                      ...buildSpecialCat('Top 10', top10Data)
                    ] :
                    key === 'podcast' ? [
                      ...safeArray(podcastData)
                    ] :
                    key === 'ejercicios' ? ejerciciosData :
                    null
                  }
                  onRefreshFavoritos={refreshFavoritosTracker}
                  favoritosIds={favoritosIds}
                  subcategoryScrollRef={subcategoryScrollRef}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Perfil ──────────────────────────────────────────────────
function PerfilSection() {
  const { colorTheme, fontCombo } = useTheme();
  return (
    <View>
      <Text style={[{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, fontSize: fontCombo.sizeCuerpo }]}>
        Próximamente podrás gestionar tus datos y preferencias desde aquí.
      </Text>
    </View>
  );
}

// ─── Biografía del Inspirador (Carrusel Multimedia 4:5) ──────────────
function BiografiaSection({ data }: { data: any }) {
  const { colorTheme, fontCombo } = useTheme();
  const { activeMediaId, setActiveMediaId } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tempPaused, setTempPaused] = useState(false);
  const isPaused = tempPaused || activeMediaId !== null;

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);
  const pauseTimeoutRef = useRef<any>(null);

  // Normalizar los datos: permitir diccionarios de n8n, singles o arrays puros
  let items: any[] = [];
  if (Array.isArray(data)) {
    items = data.flat(Infinity);
  } else if (data && typeof data === 'object') {
    if (data.data && Array.isArray(data.data)) items = data.data.flat(Infinity);
    else if (data.id || data.nombre || data.titulo) items = [data];
    else items = Object.values(data);
  }

  // Mapear objetos al formato multimedia (como en Galería)
  items = items
    .filter(src => src && (src.id || src.titulo || src.nombre))
    .map(src => {
      const rawUrlArchivo = src.url_archivo || src.url_video || src.tarjeta1_url || '';
      const tipo = src.tipo_formato || src.tipo || (rawUrlArchivo && rawUrlArchivo.startsWith('http') ? (rawUrlArchivo.includes('mp3') || rawUrlArchivo.includes('soundcloud') ? 'audio' : 'video') : 'foto');
      
      return {
        id: String(src.id || Math.random()),
        titulo: src.titulo || src.nombre || '',
        url_foto_video: (src.url_foto_video || src.imagen || src.url_foto || '').replace(/[\r\n\s]+/g, '') || null,
        url_archivo: tipo === 'texto' ? rawUrlArchivo : rawUrlArchivo.replace(/[\r\n\s]+/g, '') || null,
        tipo_formato: tipo,
        texto_bio: src.bio || src.texto_bio || '',
        url_texto: src.url_texto || src.texto_largo || (tipo === 'texto' ? rawUrlArchivo : ''),
        orden: Number(src.orden) || 999
      };
    })
    .sort((a, b) => a.orden - b.orden);

  useEffect(() => {
    if (isPaused || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
        setCurrentIndex(0);
      } else {
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentIndex(nextIndex);
      }
    }, 5000); // 5 segundos como en Galeria
    return () => clearInterval(timerRef.current);
  }, [items, isPaused, currentIndex]);

  const handleTouchStart = () => {
    setTempPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setActiveMediaId(null);
  };

  const handleTouchEnd = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => { setTempPaused(false); }, 5000);
  };

  if (!items.length) return <Spinner />;

  return (
    <View>
      <FlatList
        ref={flatListRef as any}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        onScrollBeginDrag={handleTouchStart}
        onScrollEndDrag={handleTouchEnd}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
          setCurrentIndex(index);
          handleTouchEnd();
        }}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH, alignItems: 'center' }}>
            <MenuCarouselItem 
              item={item} 
              fontCombo={fontCombo} 
              colorTheme={colorTheme} 
              isActiveMedia={activeMediaId === item.id}
              setActiveMediaId={setActiveMediaId}
            />
          </View>
        )}
      />

      {/* Puntos Indicadores */}
      <View style={[styles.dots, { justifyContent: 'center', marginTop: 12 }]}>
        {items.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === currentIndex ? colorTheme.accent : colorTheme.border }]} />
        ))}
      </View>

      {/* Modal Video / Texto FullScreen */}
      <Modal 
        visible={!!(activeMediaId && items.find(it => it.id === activeMediaId && (it.tipo_formato === 'video' || it.tipo_formato === 'texto')))} 
        transparent 
        animationType="fade"
      >
        <View style={styles.videoOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setActiveMediaId(null)} 
          />
          <View style={[styles.modalContent, items.find(it => it.id === activeMediaId)?.tipo_formato === 'texto' ? { backgroundColor: colorTheme.surface, padding: 24 } : {}]}>
             <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveMediaId(null)}>
                <MaterialIcons name="close" size={24} color={items.find(it => it.id === activeMediaId)?.tipo_formato === 'texto' ? colorTheme.textPrimary : '#fff'} />
             </TouchableOpacity>
             <View style={styles.videoContainer}>
                {activeMediaId && items.find(it => it.id === activeMediaId)?.tipo_formato === 'video' && (
                  <VideoPlayer 
                    videoId={activeMediaId}
                    url_archivo={items.find(it => it.id === activeMediaId)?.url_archivo || ''}
                    url_foto_video={items.find(it => it.id === activeMediaId)?.url_foto_video}
                    style={{ flex: 1 }}
                  />
                )}
                {activeMediaId && items.find(it => it.id === activeMediaId)?.tipo_formato === 'texto' && (
                  <ScrollView style={{ flex: 1, marginTop: 24 }} showsVerticalScrollIndicator={true}>
                    <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 32, marginBottom: 20 }}>
                      {items.find(it => it.id === activeMediaId)?.titulo}
                    </Text>
                    <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, fontSize: 20, lineHeight: 32 }}>
                      {items.find(it => it.id === activeMediaId)?.url_texto || items.find(it => it.id === activeMediaId)?.texto_bio}
                    </Text>
                  </ScrollView>
                )}
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const MenuCarouselItem = React.memo(({ item, fontCombo, colorTheme, isActiveMedia, setActiveMediaId }: { item: any, fontCombo: any, colorTheme: any, isActiveMedia: boolean, setActiveMediaId: (id: string | null) => void }) => {
  const [playingAudio, setPlayingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasLogged30s = useRef(false);
  const { user } = useApp();

  const containerStyle: any = { width: '100%', aspectRatio: 4/5, borderRadius: 16, overflow: 'hidden', backgroundColor: '#333' };

  useEffect(() => {
    if (!isActiveMedia && playingAudio) {
      soundRef.current?.pauseAsync();
      setPlayingAudio(false);
    }
  }, [isActiveMedia, playingAudio]);

  const toggleAudio = async () => {
    // Configurar audio para background en esta sección
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    
    setActiveMediaId(item.id); 
    if (playingAudio) {
      await soundRef.current?.pauseAsync();
      setPlayingAudio(false);
    } else {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: item.url_archivo });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.positionMillis >= 30000 && !hasLogged30s.current) {
            hasLogged30s.current = true;
            console.log(`[BioAudio] 30s superados en ID: ${item.id}. Registrando play...`);
            const { URL_REGISTRAR_PLAY } = require('../config/app_config');
            const { debugFetch } = require('../utils/debugFetch');
            debugFetch(URL_REGISTRAR_PLAY, { user_id: user.u_id, contenido_id: item.id, tipo: 'audio' })
              .then(() => console.log(`[BioAudio] Registro 30s exitoso para ${item.id}`))
              .catch(e => console.error(`[BioAudio] Error registro 30s:`, e));
          }
          if (status.didJustFinish) {
            setPlayingAudio(false);
            setActiveMediaId(null);
          }
        });
      }
      await soundRef.current?.playAsync();
      setPlayingAudio(true);
    }
  };

  if (item.tipo_formato === 'audio') {
    return (
      <View style={[containerStyle, { backgroundColor: colorTheme.card, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🎵</Text>
        <Text style={[{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 18, textAlign: 'center', paddingHorizontal: 20, marginBottom: 20 }]}>
          {item.titulo}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: colorTheme.accent, padding: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={toggleAudio}
        >
          <MaterialIcons name={playingAudio ? "pause" : "play-arrow"} size={32} color={colorTheme.primary} />
          <Text style={{ color: colorTheme.primary, fontWeight: '700' }}>{playingAudio ? 'PAUSA' : 'REPRODUCIR'}</Text>
        </TouchableOpacity>
        {item.texto_bio ? <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, padding: 16, textAlign: 'center' }}>{item.texto_bio}</Text> : null}
      </View>
    );
  }

  if (item.tipo_formato === 'texto') {
    return (
      <View style={[containerStyle, { backgroundColor: colorTheme.card, overflow: 'hidden', padding: 20, justifyContent: 'space-between' }]}>
        {/* Texto diminuto "de fondo" ilegible */}
        <View style={StyleSheet.absoluteFill}>
          <Text style={{ color: colorTheme.textSecondary, opacity: 0.15, fontSize: 8, lineHeight: 10, textAlign: 'justify' }} numberOfLines={100}>
            {item.url_texto ? item.url_texto.repeat(20) : (item.texto_bio || '').repeat(20)}
          </Text>
        </View>

        {/* Titulo en grande */}
        <Text style={{ color: colorTheme.accent, fontFamily: fontCombo.titulos, fontSize: 40, textAlign: 'center', marginTop: 20, zIndex: 10 }}>
          {item.titulo}
        </Text>

        {/* Botón LEER */}
        <TouchableOpacity 
          style={{ backgroundColor: colorTheme.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, elevation: 4, alignSelf: 'center', marginBottom: 20, zIndex: 10 }}
          onPress={() => setActiveMediaId(item.id)}
        >
          <Text style={{ color: '#fff', fontFamily: fontCombo.labelsNav, fontSize: 18, fontWeight: 'bold' }}>LEER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (item.tipo_formato === 'video') {
    return (
      <TouchableOpacity 
        style={containerStyle} 
        activeOpacity={0.9} 
        onPress={() => setActiveMediaId(item.id)}
      >
        {item.url_foto_video || item.url_archivo ? (
          <Image 
            source={{ uri: item.url_foto_video || item.url_archivo }} 
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
            resizeMethod="resize"
          />
        ) : null}
        <View style={styles.playIconOverlay}>
          <MaterialIcons name="play-arrow" size={32} color="#000" />
        </View>
        {(item.titulo || item.texto_bio) && (
           <View style={styles.carouselCaption}>
             {item.titulo ? <Text style={[styles.captionText, { color: '#fff', fontFamily: fontCombo.titulos }]}>{item.titulo}</Text> : null}
             {item.texto_bio ? <Text style={[{ color: '#fff', fontFamily: fontCombo.cuerpo, marginTop: 4 }]} numberOfLines={3}>{item.texto_bio}</Text> : null}
           </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
       {item.url_archivo || item.url_foto_video ? (
         <Image 
           source={{ uri: item.url_foto_video || item.url_archivo }} 
           style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
           resizeMethod="resize"
         />
       ) : null}
       {(item.titulo || item.texto_bio) && (
          <View style={styles.carouselCaption}>
            {item.titulo ? <Text style={[styles.captionText, { color: '#fff', fontFamily: fontCombo.titulos }]}>{item.titulo}</Text> : null}
            {item.texto_bio ? <Text style={[{ color: '#fff', fontFamily: fontCombo.cuerpo, marginTop: 4 }]} numberOfLines={3}>{item.texto_bio}</Text> : null}
          </View>
       )}
    </View>
  );
});

// ─── FAQ ──────────────────────────────────────────────────────
function FAQSection({ data: faqs }: { data: any[] }) {
  const { colorTheme, fontCombo } = useTheme();
  // Usar objeto para permitir múltiples abiertos y evitar el "salto de caracol" del ScrollView
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggleOpen = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!faqs || !faqs.length) return <Spinner />;
  return (
    <View>
      {faqs.map(faq => {
        const isOpen = !!openIds[faq.id];
        return (
          <View key={faq.id} style={[styles.faqItem, { borderColor: colorTheme.border }]}>
            <TouchableOpacity style={styles.faqQ} onPress={() => toggleOpen(faq.id)}>
              <Text style={[styles.faqQText, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: fontCombo.sizeCuerpo }]}>{faq.pregunta}</Text>
              <Text style={{ color: colorTheme.accent }}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isOpen && (
              <Text style={[styles.faqA, { color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, fontSize: fontCombo.sizeCuerpo }]}>{faq.respuesta}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Música (Carruseles Horizontales por Mood) ────────────────
function MusicaSection({ data, onRefreshFavoritos, favoritosIds, subcategoryScrollRef }: { data: any[], onRefreshFavoritos?: () => void, favoritosIds: Set<string>, subcategoryScrollRef: React.RefObject<ScrollView | null> }) {
  const { colorTheme, fontCombo } = useTheme();
  const { setActiveMediaId } = useApp();
  const [selectedGrupo, setSelectedGrupo] = useState<any>(null); 
  const [isRandom, setIsRandom] = useState(false);

  if (!data || !data.length) return <Spinner />;

  const playNext = (currentIndex: number) => {
    if (!selectedGrupo || !selectedGrupo.canciones) return;
    const songs = selectedGrupo.canciones;
    let nextIndex = -1;

    if (isRandom) {
      // SHUFFLE INFINITO: Mientras haya canciones en el grupo, siempre elige una
      if (songs.length > 1) {
        let rand = currentIndex;
        while (rand === currentIndex) {
          rand = Math.floor(Math.random() * songs.length);
        }
        nextIndex = rand;
      } else {
        nextIndex = 0; // Solo hay una
      }
    } else {
      // SECUENCIAL: Se detiene al final
      if (currentIndex < songs.length - 1) {
        nextIndex = currentIndex + 1;
      }
    }

    if (nextIndex !== -1) {
      console.log(`[MusicaSection] Autoplay -> Siguiente track indice: ${nextIndex}`);
      setActiveMediaId(String(songs[nextIndex].id));
    } else {
      console.log(`[MusicaSection] Fin de la lista. No hay más reproducción.`);
    }
  };

  return (
    <View>
      {selectedGrupo ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setSelectedGrupo(null)} style={{ flexDirection: 'row', alignItems: 'center' }}>
               <MaterialIcons name="arrow-back" size={24} color={colorTheme.textPrimary} />
               <Text style={{ marginLeft: 8, color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 20 }}>{selectedGrupo.nombre_grupo}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setIsRandom(!isRandom)}
              style={{ backgroundColor: isRandom ? colorTheme.accent : colorTheme.card, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: colorTheme.border }}
            >
              <MaterialIcons name="shuffle" size={20} color={isRandom ? '#fff' : colorTheme.textSecondary} />
            </TouchableOpacity>
          </View>
          {(!selectedGrupo.canciones || selectedGrupo.canciones.length === 0) ? (
            <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
               <MaterialIcons name="library-music" size={64} color={colorTheme.border} />
               <Text style={{ marginTop: 16, color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 20 }}>Lista Vacía</Text>
               <Text style={{ marginTop: 8, color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, textAlign: 'center' }}>
                 Aún no hay audios guardados en esta lista.
               </Text>
            </View>
          ) : (
            selectedGrupo.canciones.map((cancion: any, i: number) => (
               <AudioPlayer 
                 key={cancion.id || i}
                 id={String(cancion.id)}
                 titulo={cancion.titulo}
                 url_archivo={cancion.url_archivo}
                 caratula={cancion.url_foto_video || selectedGrupo.caratula}
                 es_favorito={favoritosIds.has(String(cancion.id))}
                 onFavoritoToggleSuccess={onRefreshFavoritos}
                 onFinish={() => playNext(i)}
                 duracion_ms={cancion.duracion || 0}
               />
            ))
          )}
        </View>
      ) : (
        data.map((cat, i) => (
          <View key={i} style={{ marginBottom: 30 }}>
            {/* Nivel 1: Subcategoría (Mood) */}
            <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 22, marginBottom: 16 }}>{cat.subcategoria}</Text>
            
            {/* Nivel 2: Subgrupo (Carrusel Horizontal) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {cat.grupos?.map((grupo: any, j: number) => (
                 <TouchableOpacity 
                   key={j} 
                   onPress={() => {
                     setSelectedGrupo(grupo);
                     // Scroll al top para ver desde la primera canción / episodio
                     subcategoryScrollRef.current?.scrollTo({ y: 0, animated: true });
                   }} 
                   style={{ width: 150 }} 
                   activeOpacity={0.8}
                 >
                  <View style={{ width: 150, height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: grupo.es_favoritos_especial ? colorTheme.primary : colorTheme.border, justifyContent: 'center', alignItems: 'center' }}>
                    {!grupo.es_favoritos_especial ? (
                      <Image 
                        source={{ uri: grupo.caratula || 'https://placehold.co/400x400/png?text=Audio' }} 
                        style={{ width: '100%', height: '100%' }} 
                      />
                    ) : (
                      <MaterialIcons name="favorite" size={100} color="#fff" />
                    )}
                  </View>
                  <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, marginTop: 10, fontSize: 14, textAlign: 'center' }} numberOfLines={2}>
                    {grupo.nombre_grupo}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))
      )}
    </View>
  );
}

// ─── Podcast (Listas Verticales Descendentes) ─────────────────
function PodcastSection({ data, onRefreshFavoritos, favoritosIds, subcategoryScrollRef }: { data: any[], onRefreshFavoritos?: () => void, favoritosIds: Set<string>, subcategoryScrollRef: React.RefObject<ScrollView> }) {
  const { colorTheme, fontCombo } = useTheme();
  const { setActiveMediaId } = useApp();
  const [selectedGrupo, setSelectedGrupo] = useState<any>(null);
  const [isRandom, setIsRandom] = useState(false);

  if (!data || !data.length) return <Spinner />;

  const playNext = (currentIndex: number) => {
    if (!selectedGrupo || !selectedGrupo.canciones) return;
    const episodes = [...selectedGrupo.canciones].sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    let nextIndex = -1;

    if (isRandom) {
      if (episodes.length > 1) {
        let rand = currentIndex;
        while (rand === currentIndex) {
          rand = Math.floor(Math.random() * episodes.length);
        }
        nextIndex = rand;
      } else {
        nextIndex = 0;
      }
    } else {
      if (currentIndex < episodes.length - 1) {
        nextIndex = currentIndex + 1;
      }
    }

    if (nextIndex !== -1) {
      console.log(`[PodcastSection] Autoplay -> Siguiente episodio indice: ${nextIndex}`);
      setActiveMediaId(String(episodes[nextIndex].id));
    }
  };

  return (
    <View>
      {selectedGrupo ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setSelectedGrupo(null)} style={{ flexDirection: 'row', alignItems: 'center' }}>
               <MaterialIcons name="arrow-back" size={24} color={colorTheme.textPrimary} />
               <Text style={{ marginLeft: 8, color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 20 }}>{selectedGrupo.nombre_grupo}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsRandom(!isRandom)}
              style={{ backgroundColor: isRandom ? colorTheme.accent : colorTheme.card, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: colorTheme.border }}
            >
              <MaterialIcons name="shuffle" size={20} color={isRandom ? '#fff' : colorTheme.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Nivel 3: Episodios (Ordenados por id descendente, el más nuevo primero) */}
          {(!selectedGrupo.canciones || selectedGrupo.canciones.length === 0) ? (
            <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
               <MaterialIcons name="podcasts" size={64} color={colorTheme.border} />
               <Text style={{ marginTop: 16, color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 20 }}>Lista Vacía</Text>
               <Text style={{ marginTop: 8, color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, textAlign: 'center' }}>
                 Aún no hay episodios guardados en esta lista.
               </Text>
            </View>
          ) : (
            [...selectedGrupo.canciones]
              .sort((a: any, b: any) => (b.id || b.orden || 0) - (a.id || a.orden || 0))
              .map((episodio: any, i: number) => (
               <AudioPlayer 
                 key={episodio.id || i}
                 id={String(episodio.id)}
                 titulo={episodio.titulo}
                 url_archivo={episodio.url_archivo}
                 caratula={episodio.url_foto_video || selectedGrupo.caratula}
                 onFinish={() => playNext(i)}
                 duracion_ms={episodio.duracion || 0}
                 showFavorite={false}
               />
            ))
          )}
        </View>
      ) : (
        data.map((cat, i) => (
          <View key={i} style={{ marginBottom: 30 }}>
            {/* Nivel 1: Subcategoría (Temática) */}
            <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 22, marginBottom: 16 }}>{cat.subcategoria}</Text>
            
            {/* Nivel 2: Subgrupo (Lista Vertical) */}
            <View style={{ gap: 12 }}>
              {cat.grupos?.map((grupo: any, j: number) => (
                <TouchableOpacity 
                  key={j} 
                  onPress={() => {
                    setSelectedGrupo(grupo);
                    subcategoryScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }} 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colorTheme.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colorTheme.border }}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ uri: grupo.caratula || 'https://placehold.co/400x400/png?text=Podcast' }} 
                    style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: colorTheme.border }} 
                  />
                  <Text style={{ flex: 1, marginLeft: 16, color: colorTheme.textPrimary, fontFamily: fontCombo.cuerpo, fontSize: 16 }} numberOfLines={2}>
                    {grupo.nombre_grupo}
                  </Text>
                  <MaterialIcons name="chevron-right" size={28} color={colorTheme.accent} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ─── Ejercicios (solo si u_activo) ──────────────────────────
function EjerciciosSection({ data: ejercicios }: { data: any[] }) {
  const { colorTheme, fontCombo } = useTheme();
  const { activeMediaId, setActiveMediaId } = useApp();
  const [playing, setPlaying] = useState<string | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  // Sincronizar con estado global
  useEffect(() => {
    if (activeMediaId !== playing && playing) {
      soundRef.current?.pauseAsync();
      setPlaying(null);
    }
  }, [activeMediaId]);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const togglePlay = async (ej: any) => {
    if (playing === ej.id) {
      await soundRef.current?.pauseAsync();
      setPlaying(null);
      setActiveMediaId(null);
      return;
    }
    setActiveMediaId(ej.id); // Notifica a otros contenidos
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    const { sound } = await Audio.Sound.createAsync({ uri: ej.url_archivo });
    soundRef.current = sound;
    await sound.playAsync();
    setPlaying(ej.id);
  };

  if (!ejercicios || !ejercicios.length) return <Spinner />;
  return (
    <View style={{ gap: 8 }}>
      {ejercicios.map(ej => (
        <TouchableOpacity
          key={ej.id}
          style={[styles.musicTrack, { backgroundColor: colorTheme.card, borderColor: colorTheme.border }]}
          onPress={() => togglePlay(ej)}
        >
          <Text style={{ fontSize: 24 }}>{playing === ej.id ? '⏸' : '🎙️'}</Text>
          <Text style={[{ flex: 1, color: colorTheme.textPrimary, fontFamily: fontCombo.cuerpo, fontSize: fontCombo.sizeCuerpo }]}>{ej.titulo}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const Spinner = () => { const { colorTheme } = useTheme(); return <ActivityIndicator color={colorTheme.accent} style={{ margin: 20 }} />; };

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  headerTitle: { },
  activeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  activeBadgeText: { fontSize: 11, letterSpacing: 1.5 },
  section: { borderBottomWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  sectionLabel: { },
  chevron: { fontSize: 14 },
  sectionContent: { padding: 20 },
  mentorImg: { width: '100%', height: 200, borderRadius: 12 },
  mentorNombre: { },
  faqItem: { borderBottomWidth: 1, paddingVertical: 12 },
  faqQ: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  faqQText: { flex: 1 },
  faqA: { marginTop: 10, lineHeight: 22 },
  musicTrack: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 14, marginBottom: 8 },
  playBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  carouselCaption: { 
    position: 'absolute', 
    bottom: 0, 
    alignSelf: 'center', 
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    alignItems: 'center'
  },
  captionText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  playIconOverlay: {
    position: 'absolute',
    bottom: '45%',
    right: '45%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    height: '95%',
    aspectRatio: 9 / 16,
    borderRadius: 20,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
  },
  videoContainer: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
});

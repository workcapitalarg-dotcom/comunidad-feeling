import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  FlatList, Modal, Pressable, Dimensions, ActivityIndicator,
} from 'react-native';
import { Audio, Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { URL_MENU_EMPRESAS, URL_MENU_GALERIA, URL_MENU_NOVEDADES, CAROUSEL_INTERVAL_MS, USE_MOCKS } from '../config/app_config';
import { MOCK_EMPRESAS, MOCK_GALERIA, MOCK_NOVEDADES } from '../data/mockData';
import VideoPlayer from '../components/VideoPlayer';
import { debugFetch } from '../utils/debugFetch';
import { registrarVideo } from '../utils/videoTracking';

// ============================================================
// FEELING SCREEN — Sub-tabs: Empresas | Galería | Novedades
// ============================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
type SubTab = 'Empresas' | 'Galería' | 'Novedades';

export default function FeelingScreen() {
  const { colorTheme, fontCombo } = useTheme();
  const { setActiveMediaId } = useApp();
  const [activeTab, setActiveTab] = useState<SubTab>('Empresas');

  // DETENER MULTIMEDIA AL SALIR DE LA PANTALLA
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setActiveMediaId(null);
      };
    }, [])
  );

  const tabs: SubTab[] = ['Empresas', 'Galería', 'Novedades'];

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      {/* Sub-navegación */}
      <View style={[styles.subNav, { backgroundColor: colorTheme.primary, paddingTop: 52 }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subTab, 
              activeTab === tab && { backgroundColor: colorTheme.accent, borderRadius: 20 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.subTabText,
              { 
                color: '#FFFFFF',
                opacity: activeTab === tab ? 1 : 0.6,
                fontFamily: fontCombo.labelsNav 
              },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido del sub-tab activo (Renderizado en oculto para Background Fetching real) */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: activeTab === 'Empresas' ? 'flex' : 'none' }}>
          <EmpresasTab isActive={activeTab === 'Empresas'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Galería' ? 'flex' : 'none' }}>
          <CarouselTab tipo="galeria" isActive={activeTab === 'Galería'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Novedades' ? 'flex' : 'none' }}>
          <CarouselTab tipo="novedades" isActive={activeTab === 'Novedades'} />
        </View>
      </View>
    </View>
  );
}

// ─── Sub-pantalla: Empresas ───────────────────────────────────
function EmpresasTab({ isActive }: { isActive: boolean }) {
  const { user, activeMediaId, setActiveMediaId, isHeaderLoaded, setEmpresasLoaded } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isHeaderLoaded && user.u_id !== null && user.u_id !== undefined) {
      loadData();
    }
  }, [isHeaderLoaded, user.u_id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadError && user.u_id) {
      interval = setInterval(() => {
        console.log('[FeelingScreen - Empresas] Intentando reconectar con URL_MENU_EMPRESAS...');
        loadData();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadError, user.u_id]);

  async function loadData() {
    try {
      if (USE_MOCKS) {
        await delay(400);
        setItems(MOCK_EMPRESAS);
        setLoadError(false);
      } else {
        console.log('[FeelingScreen - Empresas] Llamando URL_MENU_EMPRESAS con u_id=', user.u_id);
        const resData = await debugFetch(URL_MENU_EMPRESAS, { u_id: user.u_id });
        
        // N8N puede devolver un Array, un Array anidado, un Single Object, o un Diccionario.
        // Lo aplanamos y normalizamos a un simple Array de objetos.
        let rawItems: any[] = [];
        if (Array.isArray(resData)) {
          rawItems = resData.flat(Infinity);
        } else if (resData && typeof resData === 'object') {
          // Si llegó un solo item directo (Ej: { id: "1", titulo: "A" })
          if (resData.id || resData.titulo || resData.tarjeta1_titulo || resData.url_video || resData.url_archivo || resData.tarjeta1_url) {
            rawItems = [resData];
          } 
          // Si vino n8n-wrapped (Ej: { data: [...] })
          else if (resData.data && Array.isArray(resData.data)) {
            rawItems = resData.data.flat(Infinity);
          } 
          // Si n8n mandó formato de keys iterables (Ej: { "0": {...}, "1": {...} })
          else {
            rawItems = Object.values(resData);
          }
        }
        
        const mappedItems: any[] = [];
        
        rawItems.forEach((srcItem: any) => {
          if (srcItem && (srcItem.id || srcItem.titulo || srcItem.tarjeta1_titulo)) {
            mappedItems.push({
              id: String(srcItem.id || Math.random()),
              titulo: srcItem.titulo || srcItem.tarjeta1_titulo || 'Sin Título',
              url_foto_video: srcItem.url_foto_video || srcItem.url_foto || srcItem.imagen || null,
              url_archivo: srcItem.url_video || srcItem.url_archivo || srcItem.tarjeta1_url,
              tipo_formato: srcItem.tipo || srcItem.tipo_formato || srcItem.tarjeta1_tipo || 'video'
            });
          }
        });

        // Asegurarnos de usar los items que tengan archivo de video o link
        setItems(mappedItems.filter(i => i.url_archivo));
        setLoadError(false);
        setEmpresasLoaded(true);
      }
    } catch (e) {
      console.error('[FeelingScreen - Empresas] Error en loadData, reintentará en 10s:', e);
      setLoadError(true);
    }
    setLoading(false);
  }

  if (loading) return <Spinner />;

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ fontSize: 40 }}>✅</Text>
        <Text style={[styles.emptyText, { color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo }]}>
          Estás al día con todo el contenido de Empresas
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.sectionTitle, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos }]}>
          Contenidos de Empresas
        </Text>
        {items.map((item, index) => (
          <TouchableOpacity 
            key={item.id || `emp-${index}`} 
            style={[styles.empresaCard, { backgroundColor: colorTheme.card, borderColor: colorTheme.border, borderRadius: colorTheme.borderRadius }]}
            activeOpacity={0.9}
            onPress={() => setActiveMediaId(item.id)}
          >
            <View style={{ height: 160, position: 'relative' }}>
              {(item.url_foto_video || item.url_foto) ? (
                <Image 
                  source={{ uri: item.url_foto_video || item.url_foto }} 
                  style={{ width: '100%', height: '100%', borderTopLeftRadius: colorTheme.borderRadius, borderTopRightRadius: colorTheme.borderRadius }} 
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.playIconOverlay}>
                <MaterialIcons name="play-arrow" size={32} color="#000" />
              </View>
            </View>
            <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[{ flex: 1, color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 16, fontWeight: '700' }]}>
                {item.titulo}
              </Text>
              <MaterialIcons name="chevron-right" size={24} color={colorTheme.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ═══ MODAL PARA VIDEO CENTRAL 9:16 (Empresas) ═══ */}
      <Modal 
        visible={!!(isFocused && activeMediaId && items.find(it => it.id === activeMediaId && it.tipo_formato === 'video'))} 
        transparent 
        animationType="fade"
      >
        <View style={styles.videoOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setActiveMediaId(null)} 
          />
          <View style={styles.modalContent}>
             <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveMediaId(null)}>
                <MaterialIcons name="close" size={24} color="#fff" />
             </TouchableOpacity>
             <View style={styles.videoContainer}>
                {activeMediaId && items.find(it => it.id === activeMediaId) && (
                  <VideoPlayer 
                    videoId={activeMediaId}
                    url_archivo={items.find(it => it.id === activeMediaId)?.url_archivo || ''}
                    url_foto_video={items.find(it => it.id === activeMediaId)?.url_foto_video}
                    style={{ flex: 1 }}
                  />
                )}
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-pantalla: Carrusel (Galería / Novedades) — Scroll Manual & Auto ──────
function CarouselTab({ tipo, isActive }: { tipo: 'galeria' | 'novedades', isActive: boolean }) {
  const { user, activeMediaId, setActiveMediaId } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const { isEmpresasLoaded } = useApp();

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);
  const pauseTimeoutRef = useRef<any>(null);

  const url = tipo === 'galeria' ? URL_MENU_GALERIA : URL_MENU_NOVEDADES;
  const mockData = tipo === 'galeria' ? MOCK_GALERIA : MOCK_NOVEDADES;

  useEffect(() => {
    // Tanto Galería como Novedades esperan a que termine Empresas
    if (isEmpresasLoaded) {
      loadData();
    }
  }, [isEmpresasLoaded, tipo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadError) {
      interval = setInterval(() => {
        console.log(`[FeelingScreen - ${tipo}] Reintentando carga...`);
        loadData();
      }, 10000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [loadError, tipo]);

  async function loadData() {
    try {
      let rawData: any;
      if (USE_MOCKS) {
        await delay(300);
        rawData = mockData;
      } else {
        console.log(`[FeelingScreen - ${tipo}] Llamando webhook: ${url}`);
        // Ninguno lleva parámetros
        const bodyValue = {};
        rawData = await debugFetch(url, bodyValue);
      }

      // Normalización flexible (igual que en Empresas)
      let itemsArray: any[] = [];
      if (Array.isArray(rawData)) {
        itemsArray = rawData.flat(Infinity);
      } else if (rawData && typeof rawData === 'object') {
        if (rawData.data && Array.isArray(rawData.data)) {
          itemsArray = rawData.data.flat(Infinity);
        } else if (rawData.id || rawData.titulo) {
          itemsArray = [rawData];
        } else {
          itemsArray = Object.values(rawData);
        }
      }

      // Mapeo y Ordenamiento Riguroso
      const mapped = itemsArray
        .filter(src => src && (src.id || src.titulo))
        .map(src => {
          const mappedObj = {
            id: String(src.id || Math.random()),
            titulo: src.titulo || src.tarjeta1_titulo || 'Sin Título',
            url_foto_video: (src.url_foto_video || src.url_foto || src.imagen || '').replace(/[\r\n\s]+/g, '') || null,
            url_archivo: (src.url_video || src.url_archivo || src.tarjeta1_url || '').replace(/[\r\n\s]+/g, ''),
            tipo_formato: src.tipo || src.tipo_formato || src.tarjeta1_tipo || 'foto',
            // Guardamos el orden para el sort
            orden: Number(src.orden) || 999
          };
          
          return mappedObj;
        })
        .filter(i => i.url_archivo)
        // Ordenamiento ascendente
        .sort((a, b) => a.orden - b.orden);

      setItems(mapped);
      setLoadError(false);
      setLoading(false);
    } catch (e) {
      console.error(`[FeelingScreen - ${tipo}] Error cargando datos:`, e);
      setLoadError(true);
      setLoading(false);
    }
  }

  const [tempPaused, setTempPaused] = useState(false);
  const isPaused = tempPaused || activeMediaId !== null || !isActive;

  useEffect(() => {
    if (isPaused || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % items.length;
      const targetOffset = nextIndex * SCREEN_W;
      
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToOffset({
            offset: targetOffset,
            animated: nextIndex !== 0,
          });
        } catch (e) {
          flatListRef.current.scrollToIndex({ index: nextIndex, animated: nextIndex !== 0 });
        }
      }
      setCurrentIndex(nextIndex);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [items, isPaused, currentIndex]);

  const handleTouchStart = () => {
    setTempPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    // Al empezar scroll manual, liberamos cualquier multimedia para que 
    // el carrusel sepa que puede reanudar tras los 5s de rigor.
    setActiveMediaId(null);
  };

  const handleTouchEnd = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    // Reanudamos el auto-scroll tras 5 segundos de inactividad táctil
    pauseTimeoutRef.current = setTimeout(() => {
      setTempPaused(false);
    }, 5000);
  };

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyMsg text="Sin contenido por ahora" />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef as any}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        initialNumToRender={items.length || 5}
        maxToRenderPerBatch={items.length || 5}
        windowSize={5}
        removeClippedSubviews={false} // Evita que libere la imagen de la memoria al salir de pantalla
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.index * SCREEN_W, animated: false });
        }}
        onScrollBeginDrag={handleTouchStart}
        onScrollEndDrag={handleTouchEnd}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setCurrentIndex(index);
          handleTouchEnd();
        }}
        renderItem={({ item }) => (
          <View 
            style={{ width: SCREEN_W, height: '100%', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <CarouselItem 
              item={item} 
              fontCombo={fontCombo} 
              colorTheme={colorTheme} 
              isActiveMedia={activeMediaId === item.id}
              setActiveMediaId={setActiveMediaId}
            />
          </View>
        )}
      />
      
      {/* Indicadores */}
      <View style={[styles.dots, { position: 'absolute', bottom: 40, width: '100%', justifyContent: 'center' }]}>
        {items.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === currentIndex ? colorTheme.accent : colorTheme.border }]} />
        ))}
      </View>

      {/* ═══ MODAL PARA VIDEO 9:16 (Carrusel) ═══ */}
      <Modal 
        visible={!!(isActive && activeMediaId && items.find(it => it.id === activeMediaId && it.tipo_formato === 'video'))} 
        transparent 
        animationType="fade"
      >
        <View style={styles.videoOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setActiveMediaId(null)} 
          />
          <View style={styles.modalContent}>
             <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveMediaId(null)}>
                <MaterialIcons name="close" size={24} color="#fff" />
             </TouchableOpacity>
             <View style={styles.videoContainer}>
                {activeMediaId && items.find(it => it.id === activeMediaId) && (
                  <VideoPlayer 
                    videoId={activeMediaId}
                    url_archivo={items.find(it => it.id === activeMediaId)?.url_archivo || ''}
                    url_foto_video={items.find(it => it.id === activeMediaId)?.url_foto_video}
                    style={{ flex: 1 }}
                    disableTracking={true}
                  />
                )}
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CarouselItem = React.memo(({ item, fontCombo, colorTheme, isActiveMedia, setActiveMediaId }: { item: any, fontCombo: any, colorTheme: any, isActiveMedia: boolean, setActiveMediaId: (id: string | null) => void }) => {
  const [playingAudio, setPlayingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Background color #333 para asegurar que la caja se vea aunque la foto falle
  const containerStyle: any = { width: '100%', aspectRatio: 4/5, borderRadius: 16, overflow: 'hidden', backgroundColor: '#333' };

  // Control exclusivo de audio
  useEffect(() => {
    if (!isActiveMedia && playingAudio) {
      soundRef.current?.pauseAsync();
      setPlayingAudio(false);
    }
  }, [isActiveMedia, playingAudio]);

  const toggleAudio = async () => {
    setActiveMediaId(item.id); // Notifica a todos (detiene otros audios/videos)
    if (playingAudio) {
      await soundRef.current?.pauseAsync();
      setPlayingAudio(false);
    } else {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: item.url_archivo });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: any) => {
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
      <View style={[containerStyle, styles.audioCard, { backgroundColor: colorTheme.card }]}>
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
      </View>
    );
  }

  if (item.tipo_formato === 'video') {
    const videoImgUri = item.url_foto_video || item.url_archivo;
    return (
      <TouchableOpacity 
        style={containerStyle} 
        activeOpacity={0.9} 
        onPress={() => setActiveMediaId(item.id)}
      >
        {videoImgUri ? (
          <Image 
            source={{ uri: videoImgUri }} 
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
            resizeMethod="resize"
          />
        ) : null}
        <View style={[styles.playIconOverlay, { bottom: '45%', right: '45%' }]}>
          <MaterialIcons name="play-arrow" size={32} color="#000" />
        </View>
        {item.titulo && (
           <View style={styles.carouselCaption}>
             <Text style={[styles.captionText, { color: '#fff', fontFamily: fontCombo.cuerpo }]}>{item.titulo}</Text>
           </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
       {item.url_archivo ? (
         <Image 
           source={{ uri: item.url_archivo }} 
           style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
           resizeMethod="resize"
         />
       ) : null}
       {item.titulo && (
          <View style={styles.carouselCaption}>
            <Text style={[styles.captionText, { color: '#fff', fontFamily: fontCombo.cuerpo }]}>{item.titulo}</Text>
          </View>
       )}
    </View>
  );
});

// --- Helpers ---
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const Spinner = () => { const { colorTheme } = useTheme(); return <View style={styles.center}><ActivityIndicator color={colorTheme.accent} size="large" /></View>; };
const EmptyMsg = ({ text }: { text: string }) => { const { colorTheme, fontCombo } = useTheme(); return <View style={styles.center}><Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo }}>{text}</Text></View>; };

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subNav: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  subTab: { flex: 1, alignItems: 'center', paddingVertical: 10, justifyContent: 'center' },
  subTabText: { fontSize: 13 },
  sectionTitle: { fontSize: 20, marginBottom: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  empresasBtn: { padding: 16, alignItems: 'center' },
  empresasBtnText: { color: '#fff', fontSize: 16 },
  popupBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  popupBox: { maxHeight: SCREEN_H * 0.7, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20 },
  popupTitle: { fontSize: 18, marginBottom: 16 },
  popupItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  popupThumb: { width: 56, height: 40, borderRadius: 6, resizeMode: 'cover' },
  popupItemText: { flex: 1, fontSize: 15 },
  carouselContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  carouselCaption: { 
    position: 'absolute', 
    bottom: 0, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12 
  },
  captionText: { fontSize: 16, fontWeight: 'bold' },
  fullscreenBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fsClose: { position: 'absolute', top: 48, right: 20, zIndex: 10 },
  fullscreenContent: { width: '95%', aspectRatio: 4/5 },
  audioCard: { justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  empresaCard: { 
    borderWidth: 1, 
    marginBottom: 12,
    overflow: 'hidden'
  },
  playIconOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Estilos Modal Video (igual que en Inicio)
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

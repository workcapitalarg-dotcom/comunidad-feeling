import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Modal
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { URL_HEADER_FEED, USE_MOCKS } from '../config/app_config';
import { MOCK_HEADER_FEED } from '../data/mockData';
import VideoPlayer from '../components/VideoPlayer';
import RegistroGlobal from '../components/RegistroGlobal';
import { debugFetchGet } from '../utils/debugFetch';
import { getDeviceId } from '../utils/deviceId';
import { LinearGradient } from 'expo-linear-gradient';
import { deactivateKeepAwake } from 'expo-keep-awake';
import ContrastChecker from '../components/ContrastChecker';



// ============================================================
// HOME SCREEN — Tab Inicio (Stitch Layout - Split Cards)
// ============================================================

const { height: SCREEN_H } = Dimensions.get('window');
// Calculamos un alto por tarjeta para que entren bien sin mucho scroll
const CARD_HEIGHT = Math.max(110, SCREEN_H * 0.145);

interface FeedItem {
  id: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  tipo_formato: string;
  color_acento: string;
  url_archivo?: string;
  url_foto_video?: string | null;
}

interface HeaderData {
  frase_dia: string;
  frase_autor: string;
  saludo: string;
  frase_foto_url?: string;
  feed: FeedItem[];
}

export default function HomeScreen() {
  const { user, activeMediaId, setActiveMediaId, setHeaderLoaded, any_video_completed, setAnyVideoCompleted } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const [data, setData] = useState<HeaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showFraseModal, setShowFraseModal] = useState(false);
  const [requiereRegistro, setRequiereRegistro] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'A' | 'B'>('A');
  const [autoplayIndex, setAutoplayIndex] = useState<number>(0);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // EFECTO DE AUTO-REPRODUCCIÓN SECUENCIAL SILENCIOSA (15 segundos por tarjeta)
  useEffect(() => {
    if (!isFocused || activeMediaId !== null) {
      return;
    }

    const interval = setInterval(() => {
      setAutoplayIndex(prev => (prev + 1) % 3);
    }, 15000);

    return () => clearInterval(interval);
  }, [isFocused, activeMediaId]);

  // PRE-CARGA: SI HAY VIDEOS COMPLETADOS, REFRESCAMOS AL SALIR DE INICIO
  useFocusEffect(
    React.useCallback(() => {
      // Al ganar el foco, no hacemos nada especial aquí (el blur anterior ya precargó)
      return () => {
        // Al perder el foco (navegar a otra sección), si se completó algún video, 
        // llamamos a loadData() para que cuando vuelva ya esté listo.
        // Usamos una referencia o acceso directo al estado
        setActiveMediaId(null);
      };
    }, [])
  );

  // EFECTO DE PRE-CARGA POR SALIDA (BLUR)
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (any_video_completed) {
        console.log('[HomeScreen] Saliendo de Inicio con video completado -> Precargando feed...');
        loadData();
        setAnyVideoCompleted(false);
      }
    });
    return unsubscribe;
  }, [navigation, any_video_completed]);

  // REFRESCAR AL TOCAR EL BOTÓN DE INICIO (AUNQUE YA ESTEMOS AHÍ)
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      // Si el usuario toca el botón de Inicio y hay un video completado, refrescamos.
      // Nota: React Navigation dispara tabPress antes de focus.
      if (any_video_completed) {
        console.log('[HomeScreen] Tab Inicio presionada, refrescando feed por video completado...');
        loadData();
        setAnyVideoCompleted(false);
      }
    });
    return unsubscribe;
  }, [navigation, any_video_completed]);

  useEffect(() => {
    if (user.u_id !== null && user.u_id !== undefined) {
      loadData();
    }
  }, [user.u_id]);

  // Si hay un error, intentamos reconectar automáticamente cada 10 segundos.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadError && user.u_id) {
      interval = setInterval(() => {
        console.log('[HomeScreen] Intentando reconectar con URL_HEADER_FEED...');
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
        await new Promise(r => setTimeout(r, 500));
        setData(MOCK_HEADER_FEED as HeaderData);
        setLoadError(false);
        setHeaderLoaded(true);
      } else {
        const d_id = await getDeviceId();
        console.log('[HomeScreen] Llamando URL_HEADER_FEED (GET) con device_id=', d_id);
        const resData = await debugFetchGet(URL_HEADER_FEED, { device_id: d_id });
        
        // Mapear JSON desde n8n al formato que usa la app
        const mappedData: HeaderData = {
          frase_dia: resData.header?.frase || '',
          frase_foto_url: resData.header?.foto_url || '',
          frase_autor: '',
          saludo: '',
          feed: []
        };

        const mapFeedItem = (srcItem: any, catValue: string) => {
          if (!srcItem) return null;
          return {
            id: String(srcItem.id || Math.random()),
            categoria: catValue,
            titulo: srcItem.tarjeta1_titulo || 'Sin Título',
            descripcion: '',
            // Si la foto/miniatura es nula, por ahora no mostramos nada (se verá el color de fondo).
            // En un futuro se puede enchufar un generador de thumbnails de video.
            imagen: srcItem.url_foto_video || '',
            url_foto_video: srcItem.url_foto_video,
            url_archivo: srcItem.tarjeta1_url,
            tipo_formato: srcItem.tarjeta1_tipo || 'video',
            color_acento: ''
          };
        };

        const f1 = mapFeedItem(resData.tarjeta_empresa, 'empresas');
        if (f1) mappedData.feed.push(f1);

        const f2 = mapFeedItem(resData.tarjeta_lugares, 'lugar');
        if (f2) mappedData.feed.push(f2);
        
        const cat3 = resData.tarjeta_feed3?.from?.toLowerCase() === 'servicio' ? 'servicio' : 'testimo';
        const f3 = mapFeedItem(resData.tarjeta_feed3, cat3);
        if (f3) mappedData.feed.push(f3);

        setData(mappedData);
        setLoadError(false);
        setHeaderLoaded(true);
      }
    } catch (e) {
      console.error('[HomeScreen] Error en loadData, reintentará en 10s:', e);
      setLoadError(true);
    }
    setLoading(false);
    // Refuerzo: Una vez que salimos del loading inicial, nos aseguramos de que el protector esté libre.
    deactivateKeepAwake();
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colorTheme.background }]}>
        <ActivityIndicator size="large" color={colorTheme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      
      {/* ═══ 1. HEADER (20% DE LA PANTALLA) ═══ */}
      <View style={styles.headerArea}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={[styles.saludo, { fontFamily: fontCombo.titulos, flex: 1, marginBottom: 0 }]} numberOfLines={1} adjustsFontSizeToFit>
            Hola, {user.u_nombre ? user.u_nombre.split(' ')[0] : 'Invitado'}
          </Text>
          
          {/* Botón On-Off selector Modo A/B */}
          <TouchableOpacity 
            style={{ 
              paddingVertical: 5, 
              paddingHorizontal: 10, 
              backgroundColor: layoutMode === 'B' ? colorTheme.accent : colorTheme.card, 
              borderColor: colorTheme.border,
              borderWidth: 1,
              borderRadius: 20, 
              marginLeft: 10,
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={() => setLayoutMode(prev => prev === 'A' ? 'B' : 'A')}
          >
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: layoutMode === 'B' ? '#fff' : colorTheme.textSecondary,
              marginRight: 6
            }} />
            <Text style={{ 
              color: layoutMode === 'B' ? '#fff' : colorTheme.textPrimary, 
              fontSize: 11, 
              fontFamily: fontCombo.titulos 
            }}>
              {layoutMode === 'A' ? 'Modo A' : 'Modo B'}
            </Text>
          </TouchableOpacity>

          {(!user.u_registrado || user.u_nombre?.toLowerCase() === 'invitado') && (
            <TouchableOpacity 
              style={{ padding: 6, paddingHorizontal: 12, backgroundColor: colorTheme.accent, borderRadius: 20, marginLeft: 10 }}
              onPress={() => setRequiereRegistro(true)}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: fontCombo.titulos }}>Registrarse</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tarjeta 1: Siempre visible — la frase solo aparece si llega del webhook */}
        {data && (
          <TouchableOpacity 
            style={[styles.cardContainer, { flex: 1, marginTop: 10 }]}
            activeOpacity={0.9}
            onPress={() => setShowFraseModal(true)}
          >
            {/* Izquierda: títulos de sección */}
            <View style={[styles.cardLeft, { width: '35%', backgroundColor: colorTheme.cardBgFrase, padding: 6, justifyContent: 'center' }]}>
              <Text style={[styles.fraseLabel, { color: (colorTheme.cardBgFrase === '#facc15') ? colorTheme.textOnCardLeftDark : colorTheme.textOnCardLeftLight, fontFamily: fontCombo.labelsNav, fontSize: 13, textAlign: 'center', marginBottom: 8 }]}>
                FRASE DEL DÍA
              </Text>
              <Text style={[styles.cardLeftTitle, { color: (colorTheme.cardBgFrase === '#facc15') ? colorTheme.textOnCardLeftDark : colorTheme.textOnCardLeftLight, fontFamily: fontCombo.titulos, fontSize: 9 }]}>
                DEL LIBRO{'\n'}'NUESTRA{'\n'}HERENCIA'
              </Text>
            </View>

            {/* Derecha: foto limpia */}
            <View style={[styles.cardRight, { flex: 1, position: 'relative', overflow: 'hidden' }]}>
              {data?.frase_foto_url ? (
                <Image source={{ uri: data.frase_foto_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ═══ 2. FEED - 3 TARJETAS FIJAS + contenido dinámico ═══ */}
      {layoutMode === 'B' ? (
        <ScrollView 
          style={{ flex: 0.75 }} 
          contentContainerStyle={[styles.feedArea, { flex: undefined, paddingBottom: 24 }]}
        >
          <FeedCard layoutMode="B" shouldAutoplay={autoplayIndex === 0} categoria="empresas" item={data?.feed?.find(i => i.categoria?.toLowerCase().includes('empresa')) ?? null} fontCombo={fontCombo} colorTheme={colorTheme} setActiveMediaId={setActiveMediaId} />
          <FeedCard layoutMode="B" shouldAutoplay={autoplayIndex === 1} categoria="lugar"    item={data?.feed?.find(i => i.categoria?.toLowerCase().includes('lugar'))   ?? null} fontCombo={fontCombo} colorTheme={colorTheme} setActiveMediaId={setActiveMediaId} />
          <FeedCard 
            layoutMode="B"
            shouldAutoplay={autoplayIndex === 2}
            categoria={data?.feed?.find(i => i.categoria?.toLowerCase().includes('servicio')) ? 'servicio' : 'testimo'} 
            item={data?.feed?.find(i => i.categoria?.toLowerCase().includes('testimo') || i.categoria?.toLowerCase().includes('servicio')) ?? null} 
            fontCombo={fontCombo} colorTheme={colorTheme} setActiveMediaId={setActiveMediaId} />
        </ScrollView>
      ) : (
        <View style={styles.feedArea}>
          <FeedCard layoutMode="A" shouldAutoplay={autoplayIndex === 0} categoria="empresas" item={data?.feed?.find(i => i.categoria?.toLowerCase().includes('empresa')) ?? null} fontCombo={fontCombo} colorTheme={colorTheme} setActiveMediaId={setActiveMediaId} />
          <FeedCard layoutMode="A" shouldAutoplay={autoplayIndex === 1} categoria="lugar"    item={data?.feed?.find(i => i.categoria?.toLowerCase().includes('lugar'))   ?? null} fontCombo={fontCombo} colorTheme={colorTheme} setActiveMediaId={setActiveMediaId} />
          <FeedCard 
            layoutMode="A"
            shouldAutoplay={autoplayIndex === 2}
            categoria={data?.feed?.find(i => i.categoria?.toLowerCase().includes('servicio')) ? 'servicio' : 'testimo'} 
            item={data?.feed?.find(i => i.categoria?.toLowerCase().includes('testimo') || i.categoria?.toLowerCase().includes('servicio')) ?? null} 
            fontCombo={fontCombo} colorTheme={colorTheme} setActiveMediaId={setActiveMediaId} />
        </View>
      )}

      {/* ═══ MODAL PARA VIDEO CENTRAL 9:16 ═══ */}
      <Modal 
        visible={!!(isFocused && activeMediaId && (data?.feed || []).find(it => it.id === activeMediaId && it.tipo_formato === 'video'))} 
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
                {activeMediaId && data?.feed && data.feed.find(it => it.id === activeMediaId) && (
                  <VideoPlayer 
                    videoId={activeMediaId}
                    url_archivo={data.feed.find(it => it.id === activeMediaId)?.url_archivo || ''}
                    url_foto_video={data.feed.find(it => it.id === activeMediaId)?.url_foto_video}
                    style={{ flex: 1 }}
                  />
                )}
             </View>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL FRASE DEL DÍA 4:5 ═══ */}
      <Modal visible={isFocused && showFraseModal} transparent animationType="fade">
        <View style={styles.videoOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowFraseModal(false)} />
          <View style={[styles.modalContent, { height: undefined, width: '85%', aspectRatio: 4/5, backgroundColor: colorTheme.surface, padding: 30 }]}>
             <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFraseModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
             </TouchableOpacity>
             
             <Text style={[styles.fraseLabel, { color: colorTheme.accent, fontFamily: fontCombo.labelsNav, fontSize: 18, textAlign: 'center', marginBottom: 24, marginTop: 10 }]}>
               FRASE DEL DÍA
             </Text>
             
             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
               <Text 
                 style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.fraseDia, textAlign: 'center', fontSize: 36 }}
                 adjustsFontSizeToFit
                 minimumFontScale={0.3}
                 numberOfLines={15}
               >
                 {data?.frase_dia}
               </Text>
             </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE REGISTRO GLOBAL INTEGRADO */}
      <Modal visible={requiereRegistro} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: colorTheme.background }}>
           <View style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: colorTheme.primary, flexDirection: 'row', alignItems: 'center' }}>
             <TouchableOpacity 
               onPress={() => setRequiereRegistro(false)} 
               style={{ padding: 8 }}
             >
               <MaterialIcons name="close" size={24} color="#fff" />
             </TouchableOpacity>
             <Text style={{ color: '#fff', marginLeft: 16, fontSize: 18, fontFamily: fontCombo.titulos }}>Finalizá tu Registro</Text>
           </View>
           <RegistroGlobal 
             onRegistrado={() => setRequiereRegistro(false)} 
             onCancel={() => setRequiereRegistro(false)} 
           />
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// COMPONENTE FEEDCARD - Tarjeta individual del feed principal
// ============================================================

// Helper para mapear colores/íconos a la categoría como en el diseño (ahora dinámico).
function getCategoryStyle(cat: string, theme: any) {
  const c = cat.toLowerCase();
  const isLightBg = (theme.cardBgEmpresa === '#facc15' || theme.cardBgLugar === '#facc15' || theme.background.includes('fff'));
  
  if (c.includes('empresa')) return { bg: theme.cardBgEmpresa, icon: 'business', text: theme.cardBgEmpresa === '#facc15' ? theme.textOnCardLeftDark : theme.textOnCardLeftLight };
  if (c.includes('lugar'))   return { bg: theme.cardBgLugar, icon: 'map', text: theme.cardBgLugar === '#facc15' ? theme.textOnCardLeftDark : theme.textOnCardLeftLight };
  if (c.includes('testimo') || c.includes('servicio')) return { bg: theme.cardBgTestimonio, icon: 'chat-bubble', text: theme.cardBgTestimonio === '#facc15' ? theme.textOnCardLeftDark : theme.textOnCardLeftLight };
  return { bg: theme.primary, icon: 'campaign', text: theme.textOnCardLeftLight };
}

// Las categorías fijas del feed (con soporte para servicio que reemplaza a testimo dinámicamente)
const FEED_LABELS = [
  { key: 'empresas', label: 'EMPRESAS', icon: 'business'    },
  { key: 'lugar',    label: 'LUGARES',  icon: 'map'         },
  { key: 'testimo',  label: 'TESTIMONIOS', icon: 'chat-bubble' },
  { key: 'servicio', label: 'SERVICIO', icon: 'handshake' },
];

function FeedCard({ categoria, item, fontCombo, colorTheme, setActiveMediaId, layoutMode, shouldAutoplay }: {
  categoria: string;
  item: FeedItem | null;  // null cuando no hay dato del webhook aun
  fontCombo: any;
  colorTheme: any;
  setActiveMediaId: (id: string | null) => void;
  layoutMode: 'A' | 'B';
  shouldAutoplay: boolean;
}) {
  const fixed = FEED_LABELS.find(l => l.key === categoria)!;
  const cStyle = getCategoryStyle(categoria, colorTheme);
  const { activeMediaId } = useApp();
  const [isBrightBackground, setIsBrightBackground] = useState(false);
  const [contrastLoaded, setContrastLoaded] = useState(false);

  const handlePlayMedia = () => {
    if (item) {
      setActiveMediaId(item.id);
    }
  };

  const uri_imagen = item?.url_foto_video || item?.imagen;

  return (
    <View style={[
      styles.cardContainer, 
      layoutMode === 'B' ? { height: CARD_HEIGHT * 2, flex: 0 } : { flex: 1 }
    ]}>
      {/* ── Motor de Contraste (Web/Nativo) ── */}
      {uri_imagen && !contrastLoaded && !activeMediaId && (
        <ContrastChecker 
          uri_imagen={uri_imagen}
          onLuminanceCalculated={(lum) => {
            if (lum > 0.5) setIsBrightBackground(true);
            setContrastLoaded(true);
          }}
        />
      )}

      {/* Mitad Izquierda: Categoría — SIEMPRE visible */}
      <View style={[styles.cardLeft, { backgroundColor: cStyle.bg }]}>
        <MaterialIcons name={fixed.icon as any} size={28} color={cStyle.text} style={{ marginBottom: 8 }} />
        <Text style={[styles.cardLeftText, { color: cStyle.text, fontFamily: fontCombo.labelsNav }]}>
          {fixed.label}
        </Text>
      </View>

      {/* Mitad Derecha: vacía si no hay item, con contenido si vino del webhook */}
      <View style={[styles.cardRight, { backgroundColor: colorTheme.surface }]}>
        {item ? (
          // Con datos: imagen de fondo + título + botón play
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handlePlayMedia}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.url_foto_video || item.imagen }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            {shouldAutoplay && item.tipo_formato === 'video' && item.url_archivo && (
              <Video
                source={{ uri: item.url_archivo }}
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderTopRightRadius: colorTheme.borderRadius,
                    borderBottomRightRadius: colorTheme.borderRadius,
                    overflow: 'hidden',
                  }
                ]}
                resizeMode={ResizeMode.COVER}
                shouldPlay={true}
                isLooping={true}
                isMuted={true}
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={[StyleSheet.absoluteFill, { borderRadius: colorTheme.borderRadius }]}
            />
            
            {/* Contenido posicionado pegado al piso extremo */}
            <View style={{ position: 'absolute', bottom: 4, left: 8, right: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'stretch' }}>
                  <View style={{ 
                    backgroundColor: isBrightBackground ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.3)', 
                    paddingHorizontal: 12, 
                    paddingVertical: 2, 
                    borderRadius: 20,
                    maxWidth: '100%'
                  }}>
                  <Text 
                    style={[styles.cardTitle, { 
                      color: colorTheme.textOnCardRight, 
                      fontFamily: fontCombo.titulos,
                      textShadowColor: '#000',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 3,
                    }]}
                    numberOfLines={1} 
                    adjustsFontSizeToFit 
                    minimumFontScale={0.7}
                  >
                    {item.titulo}
                  </Text>
                </View>
              </View>
              
              <View style={{ marginBottom: 4 }}>
                <View style={[styles.playIconContainer, { backgroundColor: colorTheme.accent }]}>
                  {item.tipo_formato === 'audio' ? (
                    <Ionicons name="volume-medium" size={18} color="#000" />
                  ) : (
                    <MaterialIcons name="play-arrow" size={22} color="#000" />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          // Sin datos: placeholder con color del tema
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.2 }}>
            <MaterialIcons name="image" size={32} color={colorTheme.textSecondary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerArea: {
    flex: 0.25, 
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  saludo: {
    fontSize: 14,
    color: '#facc15',
    textTransform: 'none',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  feedArea: {
    flex: 0.75,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },

  // ── Contenedor Base Celdas Divididas (Split Card) ──
  cardContainer: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#112240',
  },
  
  // ── Izquierda 35% ──
  cardLeft: {
    width: '35%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardLeftTitle: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardLeftText: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

   // ── Derecha 65% ──
  cardRight: {
    width: '65%',
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardRightOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Estructura especial frase
  fraseContent: {
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fraseLabel: {
    fontSize: 10,
    marginBottom: 6,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fraseTexto: {
    color: '#fff',
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Contenido de la derecha (Feed común)
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // oscurece imagen para resaltar texto titulo amarillo
  },
  rightContentBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rightTitle: {
    flex: 1,
    color: '#facc15',
    fontSize: 14,
    marginRight: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
  },
  playIconContainer: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  
  // Estilos Modal Video
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

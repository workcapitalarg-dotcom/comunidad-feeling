import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  Modal, Pressable, FlatList, Dimensions, ActivityIndicator, TextInput, Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { URL_MENU_AGENDA, URL_REGISTRAR_USUARIO_ACTIVIDAD, URL_REGISTRO, URL_CONFIRMAR_REGISTRO, MAX_INTENTOS_CODIGO, USE_MOCKS } from '../config/app_config';
import { MOCK_AGENDA, MOCK_REGISTRO_ACTIVIDAD, MOCK_CONFIRMAR_REGISTRO } from '../data/mockData';
import VideoPlayer from '../components/VideoPlayer';
import RegistroGlobal from '../components/RegistroGlobal';
import { debugFetch } from '../utils/debugFetch';

// ============================================================
// AGENDA SCREEN — Lista de eventos, inscripción con validación
// ============================================================

const { height: SCREEN_H } = Dimensions.get('window');

interface Evento {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  lugar: string;
  tipo_formato: string;
  url_archivo: string;
  url_foto_video?: string | null;
  descripcion?: string;
  cupos_totales: number;
  cupos_disponibles: number;
}

export default function AgendaScreen() {
  const { user, isHeaderLoaded, activeMediaId, setActiveMediaId } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Evento | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [requiereRegistro, setRequiereRegistro] = useState(false);
  const [modalAvisoRegistro, setModalAvisoRegistro] = useState(false);
  const [modalInscripcionRespuesta, setModalInscripcionRespuesta] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isHeaderLoaded && user.u_id) {
      loadData();
    }
  }, [isHeaderLoaded, user.u_id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadError) {
      interval = setInterval(() => {
        console.log('[AgendaScreen] Reintentando carga...');
        loadData();
      }, 10000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [loadError]);

  function parseFecha(fechaStrRaw: string) {
    const f = fechaStrRaw.trim();
    if (!f) return '';
    try {
      let isoStr = f.includes('T') ? f.split('T')[0] : f.split(' ')[0];
      if (isoStr.includes('/')) {
        const parts = isoStr.split('/');
        if (parts[2] && parts[2].length === 4) isoStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else if (isoStr.includes('-')) {
        const parts = isoStr.split('-');
        if (parts[2] && parts[2].length === 4) isoStr = `${parts[2]}-${parts[1]}-${parts[0]}`; 
      }
      const d = new Date(isoStr + 'T12:00:00Z');
      if (isNaN(d.getTime())) return f;
      const formatted = new Intl.DateTimeFormat('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return f;
    }
  }

  async function loadData() {
    try {
      let rawData: any;
      if (USE_MOCKS) {
        await delay(300);
        rawData = MOCK_AGENDA;
      } else {
        console.log('[AgendaScreen] Llamando webhook:', URL_MENU_AGENDA);
        rawData = await debugFetch(URL_MENU_AGENDA, {});
      }

      // Normalización flexible
      let itemsArray: any[] = [];
      if (Array.isArray(rawData)) itemsArray = rawData.flat(Infinity);
      else if (rawData && typeof rawData === 'object') {
        if (rawData.data && Array.isArray(rawData.data)) itemsArray = rawData.data.flat(Infinity);
        else if (rawData.id || rawData.titulo) itemsArray = [rawData];
        else itemsArray = Object.values(rawData);
      }

      // Mapeo riguroso (eliminamos saltos de línea y falsos nulls)
      const mapped = itemsArray
        .filter(src => src && (src.id || src.titulo))
        .map(src => {
          const cupos_totales = Number(src.cupos_totales) || 0;
          const cupos_disponibles = Number(src.cupos_disponibles) || 0;

          return {
            id: String(src.id || Math.random()),
            titulo: src.titulo || src.tarjeta1_titulo || 'Sin Título',
            tipo: src.tipo || 'Evento',
            url_foto_video: (src.url_foto_video || src.url_foto || src.imagen || '').replace(/[\r\n\s]+/g, '') || null,
            url_archivo: (src.url_archivo || src.url_video || src.tarjeta1_url || '').replace(/[\r\n\s]+/g, ''),
            tipo_formato: src.tipo_archivo || src.tipo_formato || src.tarjeta1_tipo || 'foto',
            fecha: parseFecha(src.fecha || src.fecha_referencia || ''),
            lugar: src.lugar || src.ubicacion || '',
            descripcion: src.descripcion || src.detalle || '',
            cupos_totales,
            cupos_disponibles
          };
        })
        .filter(i => {
          if (!i.url_archivo) return false;
          // Si tiene cupo definido y no hay disponibles, ocultar.
          if (i.cupos_totales > 0 && i.cupos_disponibles <= 0) return false;
          return true;
        });

      setEventos(mapped);
      setLoadError(false);
      setLoading(false);
    } catch (e) {
      console.error('[AgendaScreen] Error cargando datos:', e);
      setLoadError(true);
      setLoading(false);
    }
  }

  const showToast = (msg: string, tipo: 'success' | 'error' | 'info') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAnotarse = async (evento: Evento) => {
    // 1. Apagar multimedia y cerrar la vista modal si estuviese abierta
    setActiveMediaId(null); 
    setSelected(null);
    
    // 2. Esperar un instante a que colapse el Modal de video
    setTimeout(async () => {
      if (!user.u_registrado) {
        setModalAvisoRegistro(true); // Abre modal personalizado en lugar del Alert de Android
        return;
      }
      await inscribirWebhook(evento);
    }, 400);
  };

  const inscribirWebhook = async (evento: Evento) => {
    setInscribiendo(true);
    try {
      let data: any;
      if (USE_MOCKS) { await delay(600); data = MOCK_REGISTRO_ACTIVIDAD; }
      else {
        console.log(`[AgendaScreen] 🌐 POST URL_REGISTRAR_USUARIO_ACTIVIDAD -> { usuario_id: ${user.u_id}, evento_id: ${evento.id} }`);
        data = await debugFetch(URL_REGISTRAR_USUARIO_ACTIVIDAD, {
          usuario_id: user.u_id,
          evento_id: evento.id
        });
      }
      const payload = Array.isArray(data) && data.length > 0 ? data[0] : data;
      const isSuccess = payload?.status === 'success' || payload?.estado === 'success';
      
      if (isSuccess) {
        setModalInscripcionRespuesta({ texto: payload?.mensaje || payload?.message || 'Inscripción confirmada.', tipo: 'success' });
      } else {
        setModalInscripcionRespuesta({ texto: payload?.mensaje || payload?.message || 'No se pudo completar la inscripción.', tipo: 'error' });
      }
      setSelected(null);
    } catch {
      setModalInscripcionRespuesta({ texto: 'Error al procesar la inscripción. Intentá más tarde.', tipo: 'error' });
    }
    setInscribiendo(false);
  };

  if (loading) return <View style={[styles.center, { backgroundColor: colorTheme.background }]}><ActivityIndicator color={colorTheme.accent} size="large" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colorTheme.primary }]}>
        <Text style={[styles.headerTitle, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: fontCombo.sizeTitulo + 4 }]}>
          📅 Agenda
        </Text>
        <Text style={[styles.headerSub, { color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo }]}>
          {eventos.length} evento{eventos.length !== 1 ? 's' : ''} próximo{eventos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={eventos}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colorTheme.card, borderColor: colorTheme.border, borderRadius: colorTheme.borderRadius }]}
            onPress={() => {
              if (item.tipo_formato !== 'foto') {
                setSelected(item);
                setActiveMediaId(item.id);
              }
            }}
            activeOpacity={item.tipo_formato === 'foto' ? 1 : 0.7}
          >
            {item.tipo_formato === 'audio' ? (
              <View style={[styles.cardImg, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: colorTheme.borderRadius, borderTopRightRadius: colorTheme.borderRadius }]}>
                <Text style={{ fontSize: 60 }}>🎵</Text>
              </View>
            ) : item.tipo_formato === 'video' ? (
              <View style={{ position: 'relative', width: '100%' }}>
                {(item.url_foto_video || item.url_archivo) ? (
                  <Image 
                    source={{ uri: item.url_foto_video || item.url_archivo }} 
                    style={[styles.cardImg, { borderTopLeftRadius: colorTheme.borderRadius, borderTopRightRadius: colorTheme.borderRadius }]} 
                    resizeMode="cover" resizeMethod="resize" 
                  />
                ) : (
                  <View style={[styles.cardImg, { backgroundColor: '#333', borderTopLeftRadius: colorTheme.borderRadius, borderTopRightRadius: colorTheme.borderRadius }]} />
                )}
                <View style={[styles.playIconOverlay, { bottom: '40%', right: '45%' }]}>
                  <MaterialIcons name="play-arrow" size={32} color="#000" />
                </View>
              </View>
            ) : (
              <View style={{ position: 'relative', width: '100%' }}>
                {item.url_archivo ? (
                  <Image 
                    source={{ uri: item.url_archivo }} 
                    style={[styles.cardImg, { height: 300, borderTopLeftRadius: colorTheme.borderRadius, borderTopRightRadius: colorTheme.borderRadius }]} 
                    resizeMode="cover" resizeMethod="resize" 
                  />
                ) : (
                  <View style={[styles.cardImg, { height: 300, backgroundColor: '#333', borderTopLeftRadius: colorTheme.borderRadius, borderTopRightRadius: colorTheme.borderRadius }]} />
                )}
              </View>
            )}
            <View style={styles.cardInfo}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text 
                    style={[styles.eventoTitulo, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: fontCombo.sizeTitulo, flexShrink: 1 }]}
                    textBreakStrategy="highQuality"
                  >
                    {item.titulo}
                  </Text>
                </View>
                <View style={[styles.badgeTipo, { backgroundColor: colorTheme.primary, flexShrink: 1, maxWidth: '45%' }]}>
                  <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.cuerpo, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
                    {item.tipo}
                  </Text>
                </View>
              </View>
              {item.fecha && item.fecha.length > 0 && (
                <View style={[styles.fechaBox, { backgroundColor: colorTheme.accent + '20', borderColor: colorTheme.accent }]}>
                  <Text style={[styles.eventoFecha, { color: colorTheme.accent, fontFamily: fontCombo.titulos }]}>
                    📅 {item.fecha}
                  </Text>
                </View>
              )}
              {item.lugar && item.lugar.length > 0 && (
                <Text style={[styles.eventoLugar, { color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo }]}>📍 {item.lugar}</Text>
              )}
              {item.tipo_formato === 'foto' && (
                <TouchableOpacity
                  style={[styles.anotarseBtnFoto, { backgroundColor: colorTheme.accent, marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'flex-start' }]}
                  onPress={() => handleAnotarse(item)}
                  disabled={inscribiendo}
                >
                  <Text style={{ color: '#fff', fontFamily: fontCombo.titulos, fontSize: 13 }}>
                    {inscribiendo ? 'Procesando...' : '🎟️  Anotarme'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, {
          backgroundColor: toast.tipo === 'success' ? colorTheme.success : toast.tipo === 'error' ? colorTheme.error : colorTheme.accent,
        }]}>
          <Text style={{ color: '#fff', fontFamily: fontCombo.cuerpo, fontSize: 14 }}>{toast.msg}</Text>
        </View>
      )}

      {/* Modal fullscreen + Anotarse (solo para AUDIO y VIDEO) */}
      <Modal visible={!!selected && selected.tipo_formato !== 'foto'} transparent animationType="slide" onRequestClose={() => { setSelected(null); setActiveMediaId(null); }}>
        <View style={styles.fsBackdrop}>
          {selected && selected.tipo_formato === 'video' && (
            <View style={styles.fsContent}>
              <VideoPlayer 
                videoId={selected.id} 
                url_archivo={selected.url_archivo} 
                url_foto_video={selected.url_foto_video} 
                style={{ width: '100%', height: '100%' }} 
                autoPlay={true}
                disableTracking={true}
              />
              
              <View style={styles.overlayBottom}>
                <TouchableOpacity
                  style={[styles.anotarseBtnModal, { backgroundColor: colorTheme.accent, marginTop: 12, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, alignSelf: 'center' }, inscribiendo && { opacity: 0.6 }]}
                  onPress={() => handleAnotarse(selected)}
                  disabled={inscribiendo}
                >
                  <Text style={{ color: '#fff', fontFamily: fontCombo.titulos, fontSize: 15 }}>
                    {inscribiendo ? 'Procesando...' : '🎟️  Anotarme'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.fsClose} onPress={() => { setSelected(null); setActiveMediaId(null); }}>
                <Text style={{ color: '#fff', fontSize: 28 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {selected && selected.tipo_formato === 'audio' && (
            <View style={[styles.fsContentAudio, { backgroundColor: colorTheme.card }]}>
              <TouchableOpacity style={[styles.fsClose, { top: 10, right: 10, backgroundColor: 'transparent' }]} onPress={() => { setSelected(null); setActiveMediaId(null); }}>
                <Text style={{ color: colorTheme.textPrimary, fontSize: 28 }}>✕</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingTop: 40 }}>
                <Text style={{ fontSize: 60, marginBottom: 10 }}>🎶</Text>
                <VideoPlayer 
                  videoId={selected.id} 
                  url_archivo={selected.url_archivo} 
                  style={{ width: '100%', height: 70, backgroundColor: 'transparent' }} 
                  autoPlay={true}
                  disableTracking={true}
                />
              </View>

              <View style={{ padding: 20, width: '100%' }}>
                <Text style={[{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: fontCombo.sizeTitulo }]} textBreakStrategy="highQuality">
                  {selected.titulo}
                </Text>
                {selected.descripcion && (
                  <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, marginTop: 6, lineHeight: 22 }} numberOfLines={3}>{selected.descripcion}</Text>
                )}
                <TouchableOpacity
                  style={[styles.anotarseBtnModal, { backgroundColor: colorTheme.accent, marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, alignSelf: 'center' }, inscribiendo && { opacity: 0.6 }]}
                  onPress={() => handleAnotarse(selected)}
                  disabled={inscribiendo}
                >
                  <Text style={{ color: '#fff', fontFamily: fontCombo.titulos, fontSize: 15 }}>
                    {inscribiendo ? 'Procesando...' : '🎟️  Anotarme'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal Aviso Interceptado: Estilo Personalizado en reemplazo de Alerta Nativa */}
      <Modal visible={modalAvisoRegistro} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colorTheme.surface, padding: 24, borderRadius: 16, width: '90%', maxWidth: 350, borderColor: colorTheme.border, borderWidth: 1 }}>
            <Ionicons name="information-circle-outline" size={48} color={colorTheme.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: 20, textAlign: 'center', marginBottom: 12 }}>
              Aviso Importante
            </Text>
            <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Para anotarte a los eventos debes tener tu perfil registrado en la comunidad.
            </Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: colorTheme.accent, paddingVertical: 14, borderRadius: 25, width: '100%', marginBottom: 12 }}
              onPress={() => {
                setModalAvisoRegistro(false);
                setTimeout(() => setRequiereRegistro(true), 300);
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontFamily: fontCombo.titulos, fontSize: 16 }}>Registrarme</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ paddingVertical: 14, borderRadius: 25, width: '100%' }}
              onPress={() => setModalAvisoRegistro(false)}
            >
              <Text style={{ color: colorTheme.textSecondary, textAlign: 'center', fontFamily: fontCombo.labelsNav, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Aviso Interceptado: Inscripción Respuesta (Éxito / Error) */}
      <Modal visible={!!modalInscripcionRespuesta} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colorTheme.surface, padding: 24, borderRadius: 16, width: '90%', maxWidth: 350, borderColor: colorTheme.border, borderWidth: 1 }}>
            <Ionicons 
              name={modalInscripcionRespuesta?.tipo === 'success' ? "checkmark-circle" : "close-circle"} 
              size={54} 
              color={modalInscripcionRespuesta?.tipo === 'success' ? "#10b981" : "#ef4444"} 
              style={{ alignSelf: 'center', marginBottom: 12 }} 
            />
            <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {modalInscripcionRespuesta?.texto}
            </Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: colorTheme.accent, paddingVertical: 14, borderRadius: 25, width: '100%' }}
              onPress={() => setModalInscripcionRespuesta(null)}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontFamily: fontCombo.titulos, fontSize: 16 }}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Registro Interceptado Seguro Dinámico (Global) */}
      <Modal visible={requiereRegistro} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: colorTheme.background }}>
           <View style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: colorTheme.primary, flexDirection: 'row', alignItems: 'center' }}>
             <TouchableOpacity 
               onPress={() => {
                 setRequiereRegistro(false);
                 showToast('No se puede registrar a la actividad hasta que no se registre en la app.', 'info');
               }} 
               style={{ padding: 8 }}
             >
               <MaterialIcons name="arrow-back" size={24} color="#fff" />
             </TouchableOpacity>
             <Text style={{ color: '#fff', marginLeft: 16, fontSize: 18, fontFamily: fontCombo.titulos }}>Registro Requerido</Text>
           </View>
           <RegistroGlobal 
             onRegistrado={() => {
               setRequiereRegistro(false);
               showToast('¡Registro exitoso! Ya estás inscripto al evento.', 'success');
               if (selected) inscribirWebhook(selected);
             }} 
           />
        </View>
      </Modal>
    </View>
  );
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { },
  headerSub: { marginTop: 4, fontSize: 14 },
  card: { borderWidth: 1, overflow: 'hidden' },
  cardImg: { width: '100%', height: 200 },
  cardInfo: { padding: 16, gap: 6 },
  eventoTitulo: { },
  eventoMeta: { fontSize: 13 },
  toast: { position: 'absolute', bottom: 100, left: 20, right: 20, padding: 16, borderRadius: 12, zIndex: 100 },
  fsBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fsClose: { position: 'absolute', top: 48, right: 20, zIndex: 999, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
  fsContent: { width: '100%', height: '100%', position: 'relative' },
  fsContentAudio: { width: '85%', aspectRatio: 4/5, position: 'relative', borderRadius: 16, overflow: 'hidden' },
  fsTitle: { marginTop: 0 },
  anotarseBtn: { marginTop: 12, padding: 16, borderRadius: 50, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 },
  anotarseBtnFoto: {},
  anotarseBtnModal: {},
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingTop: 60, paddingBottom: 40, zIndex: 100 },
  badgeTipo: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  fechaBox: { padding: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, marginTop: 4, alignSelf: 'flex-start' },
  eventoFecha: { fontSize: 12, fontWeight: 'bold' },
  eventoLugar: { fontSize: 13, marginTop: 4 },
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
});

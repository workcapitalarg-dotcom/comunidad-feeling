import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  URL_REGISTRO, URL_CONFIRMAR_REGISTRO, URL_CONTACTO,
  MAX_INTENTOS_CODIGO, USE_MOCKS,
} from '../config/app_config';
import { MOCK_CONFIRMAR_REGISTRO } from '../data/mockData';
import { debugFetch } from '../utils/debugFetch';
import { Ionicons } from '@expo/vector-icons';

// ============================================================
// CONTACTO SCREEN
// Rama A (u_registrado=false): Formulario de registro + Modal WhatsApp
// Rama B (u_registrado=true): Formulario "Dejar Inquietud"
// ============================================================

import RegistroGlobal from '../components/RegistroGlobal';

export default function ContactoScreen() {
  const { user, updateRegistrado } = useApp();
  const { colorTheme, fontCombo } = useTheme();

  if (!user.u_registrado) return <RegistroGlobal onRegistrado={() => updateRegistrado(true)} />;
  return <InquietudForm />;
}

// ─── Rama B: Formulario Inquietud (Ya Registrado) ────────────
function InquietudForm() {
  const { user } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  const navigation = useNavigation<any>();
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalRespuesta, setModalRespuesta] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  const handleEnviar = async () => {
    if (!mensaje.trim()) return;
    setLoading(true);
    try {
      let data: any;
      if (!USE_MOCKS) {
        data = await debugFetch(URL_CONTACTO, { u_id: user.u_id, mensaje });
      } else {
        await new Promise(r => setTimeout(r, 600));
        data = { success: true, mensaje: 'Tu mensaje fue recibido. Nos pondremos en contacto pronto.' };
      }
      
      const payload = Array.isArray(data) && data.length > 0 ? data[0] : data;
      const isSuccess = payload?.status === 'success' || payload?.estado === 'success' || payload?.success === true || (payload && !payload.error && payload.success !== false);
      
      if (isSuccess) {
        setModalRespuesta({ texto: payload?.mensaje || payload?.message || 'Inquietud enviada exitosamente.', tipo: 'success' });
        setMensaje(''); // limpia el campo solo si fue exitoso
      } else {
        setModalRespuesta({ texto: payload?.mensaje || payload?.message || 'Mmm... no se pudo enviar el mensaje.', tipo: 'error' });
      }
    } catch { 
      setModalRespuesta({ texto: 'No se pudo conectar. Intentá más tarde.', tipo: 'error' });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView 
        keyboardShouldPersistTaps="handled" 
        style={[styles.container, { backgroundColor: colorTheme.background }]} 
        contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 100 }}
      >
        <Text style={[styles.title, { color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: fontCombo.sizeTitulo + 4 }]}>
          Dejar una Inquietud
        </Text>
        <Text style={[styles.subtitle, { color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo }]}>
          ¡Hola, {user.u_nombre ? user.u_nombre.split(' ')[0] : 'Invitado'}! ¿En qué podemos ayudarte?
        </Text>

        <TextInput
          style={[styles.textarea, { backgroundColor: colorTheme.card, color: colorTheme.textPrimary, borderColor: colorTheme.border, fontFamily: fontCombo.cuerpo, borderRadius: colorTheme.borderRadius }]}
          placeholder="Escribí tu mensaje aquí..."
          placeholderTextColor={colorTheme.textSecondary + '80'}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={mensaje}
          onChangeText={setMensaje}
          returnKeyType="done"
          blurOnSubmit={true}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: mensaje.trim() ? colorTheme.accent : colorTheme.border }, loading && { opacity: 0.6 }]}
          disabled={!mensaje.trim() || loading}
          onPress={handleEnviar}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={[styles.btnText, { fontFamily: fontCombo.titulos }]}>Enviar mensaje</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Respuesta Contacto */}
      <Modal visible={!!modalRespuesta} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colorTheme.surface, padding: 24, borderRadius: 16, width: '90%', maxWidth: 350, borderColor: colorTheme.border, borderWidth: 1 }}>
            <Ionicons 
              name={modalRespuesta?.tipo === 'success' ? "checkmark-circle" : "close-circle"} 
              size={54} 
              color={modalRespuesta?.tipo === 'success' ? "#10b981" : "#ef4444"} 
              style={{ alignSelf: 'center', marginBottom: 12 }} 
            />
            <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {modalRespuesta?.texto}
            </Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: colorTheme.accent, paddingVertical: 14, borderRadius: 25, width: '100%' }}
              onPress={() => {
                const isSuccess = modalRespuesta?.tipo === 'success';
                setModalRespuesta(null);
                if (isSuccess) {
                  navigation.navigate('Inicio');
                }
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontFamily: fontCombo.titulos, fontSize: 16 }}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  input: { height: 52, paddingHorizontal: 16, borderWidth: 1, fontSize: 15 },
  textarea: { minHeight: 140, padding: 16, borderWidth: 1, fontSize: 15, marginBottom: 20 },
  btn: { height: 56, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  modalMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  codigoInput: { width: 180, height: 64, fontSize: 32, fontWeight: '700', borderWidth: 2, borderRadius: 12, letterSpacing: 8 },
  cancelBtn: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 50, borderWidth: 1 },
});

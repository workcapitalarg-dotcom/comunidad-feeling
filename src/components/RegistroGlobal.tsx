import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  URL_REGISTRO, URL_CONFIRMAR_REGISTRO,
  MAX_INTENTOS_CODIGO, USE_MOCKS,
} from '../config/app_config';
import { MOCK_CONFIRMAR_REGISTRO } from '../data/mockData';
import { debugFetch } from '../utils/debugFetch';

// ============================================================
// REGISTRO GLOBAL COMPONENT
// Formulario universal de registro con validación de código WS
// ============================================================

interface RegistroGlobalProps {
  onRegistrado: () => void;
  onCancel?: () => void;
}

export default function RegistroGlobal({ onRegistrado, onCancel }: RegistroGlobalProps) {
  const { user, updateRegistrado } = useApp();
  const { colorTheme, fontCombo } = useTheme();
  
  const [form, setForm] = useState({ nombre: '', email: '', prefijo: '54', telefono: '', referente: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [intentos, setIntentos] = useState(0);
  const [codigoError, setCodigoError] = useState('');
  const [validandoCodigo, setValidandoCodigo] = useState(false);

  const isValid = form.nombre.length > 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    && form.telefono.length >= 8;

  const handleRegistrar = async () => {
    setLoading(true);
    try {
      if (!USE_MOCKS) {
        console.log(`[RegistroGlobal] Llamando URL_REGISTRO -> u_id=${user.u_id}`);
        const data = await debugFetch(URL_REGISTRO, {
          u_id: user.u_id,
          nombre: form.nombre,
          email: form.email,
          telefono: `+${form.prefijo} ${form.telefono}`,
          referente: form.referente
        });
        if (data && (data.success === false || data.error)) { 
          Alert.alert('Error', data.mensaje || 'No se pudo procesar el registro.'); 
          setLoading(false); 
          return; 
        }
      } else {
        await new Promise(r => setTimeout(r, 800));
      }
      setShowModal(true);
    } catch { Alert.alert('Error', 'No se pudo conectar. Intentá más tarde.'); }
    setLoading(false);
  };

  const handleConfirmarCodigo = async (cod: string) => {
    setCodigo(cod);
    if (cod.length < 6) return;
    setValidandoCodigo(true);
    setCodigoError('');
    try {
      let success = false;
      if (USE_MOCKS) {
        await new Promise(r => setTimeout(r, 800));
        success = MOCK_CONFIRMAR_REGISTRO.success;
      } else {
        console.log(`[RegistroGlobal] Llamando URL_CONFIRMAR_REGISTRO -> u_id=${user.u_id}, codigo=${cod}`);
        const data = await debugFetch(URL_CONFIRMAR_REGISTRO, { codigo: cod, u_id: user.u_id });
        success = data && data.success !== false && !data.error;
      }

      if (success) {
        setShowModal(false);
        updateRegistrado(true);
        Alert.alert('¡Excelente!', 'El registro ha sido exitoso.');
        onRegistrado();
      } else {
        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);
        if (nuevosIntentos >= MAX_INTENTOS_CODIGO) {
          setShowModal(false);
          setCodigo('');
          setIntentos(0);
          Alert.alert('Registro cancelado', 'Ha superado los intentos de validación. Intente nuevamente más tarde.');
          setForm({ nombre: '', email: '', prefijo: '54', telefono: '', referente: '' });
          if (onCancel) onCancel();
        } else {
          setCodigo('');
          setCodigoError(`Código incorrecto. Intentos restantes: ${MAX_INTENTOS_CODIGO - nuevosIntentos}`);
        }
      }
    } catch { setCodigoError('Error de conexión. Intentá de nuevo.'); setCodigo(''); }
    setValidandoCodigo(false);
  };

  const refEmail = React.useRef<TextInput>(null);
  const refPrefijo = React.useRef<TextInput>(null);
  const refTelefono = React.useRef<TextInput>(null);
  const refReferente = React.useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView 
        keyboardShouldPersistTaps="handled" 
        style={[{ backgroundColor: colorTheme.background, flex: 1 }]} 
        contentContainerStyle={{ padding: 24, paddingTop: 40, paddingBottom: 100 }}
      >
        <Text style={{ color: colorTheme.textPrimary, fontFamily: fontCombo.titulos, fontSize: fontCombo.sizeTitulo + 4, marginBottom: 8 }}>
          Registrate
        </Text>
        <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, marginBottom: 24 }}>
          Completá tus datos para acceder a todos los beneficios
        </Text>

        {/* Nombre */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.labelsNav, marginBottom: 8 }}>Nombre completo</Text>
          <TextInput
            style={{ backgroundColor: colorTheme.card, color: colorTheme.textPrimary, borderColor: colorTheme.border, borderWidth: 1, padding: 12, fontFamily: fontCombo.cuerpo, borderRadius: colorTheme.borderRadius }}
            placeholder="Tu nombre y apellido" placeholderTextColor={colorTheme.textSecondary + '80'}
            autoCapitalize="words" value={form.nombre} onChangeText={v => setForm(p => ({ ...p, nombre: v }))}
            returnKeyType="next" onSubmitEditing={() => refEmail.current?.focus()} blurOnSubmit={false}
          />
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.labelsNav, marginBottom: 8 }}>Email</Text>
          <TextInput
            ref={refEmail}
            style={{ backgroundColor: colorTheme.card, color: colorTheme.textPrimary, borderColor: colorTheme.border, borderWidth: 1, padding: 12, fontFamily: fontCombo.cuerpo, borderRadius: colorTheme.borderRadius }}
            placeholder="tu@email.com" placeholderTextColor={colorTheme.textSecondary + '80'} keyboardType="email-address"
            autoCapitalize="none" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))}
            returnKeyType="next" onSubmitEditing={() => refTelefono.current?.focus()} blurOnSubmit={false}
          />
        </View>

        {/* Teléfono Combinado */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.labelsNav, marginBottom: 8 }}>Teléfono</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 0.35, flexDirection: 'row', alignItems: 'center', backgroundColor: colorTheme.card, borderWidth: 1, borderColor: colorTheme.border, borderRadius: colorTheme.borderRadius, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 18, marginRight: 4 }}>{form.prefijo === '54' ? '🇦🇷' : '🌎'}</Text>
              <Text style={{ color: colorTheme.textSecondary }}>+</Text>
              <TextInput
                ref={refPrefijo}
                style={{ flex: 1, color: colorTheme.textPrimary, fontFamily: fontCombo.cuerpo, paddingVertical: 12 }}
                keyboardType="number-pad" maxLength={4}
                value={form.prefijo} onChangeText={v => setForm(p => ({ ...p, prefijo: v }))}
                returnKeyType="next" onSubmitEditing={() => refTelefono.current?.focus()} blurOnSubmit={false}
              />
            </View>
            <TextInput
              ref={refTelefono}
              style={{ flex: 0.65, backgroundColor: colorTheme.card, color: colorTheme.textPrimary, borderColor: colorTheme.border, borderWidth: 1, padding: 12, fontFamily: fontCombo.cuerpo, borderRadius: colorTheme.borderRadius }}
              placeholder="11 1234-5678" placeholderTextColor={colorTheme.textSecondary + '80'} keyboardType="phone-pad"
              value={form.telefono} onChangeText={v => setForm(p => ({ ...p, telefono: v }))}
              returnKeyType="next" onSubmitEditing={() => refReferente.current?.focus()} blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Referente */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.labelsNav, marginBottom: 8 }}>Referente</Text>
          <TextInput
            ref={refReferente}
            style={{ backgroundColor: colorTheme.card, color: colorTheme.textPrimary, borderColor: colorTheme.border, borderWidth: 1, padding: 12, fontFamily: fontCombo.cuerpo, borderRadius: colorTheme.borderRadius }}
            placeholder="¿Quién te recomendó?" placeholderTextColor={colorTheme.textSecondary + '80'}
            autoCapitalize="words" value={form.referente} onChangeText={v => setForm(p => ({ ...p, referente: v }))}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={[{ backgroundColor: isValid ? colorTheme.accent : colorTheme.border, padding: 16, borderRadius: 50, alignItems: 'center', marginTop: 10 }, loading && { opacity: 0.6 }]}
          disabled={!isValid || loading}
          onPress={handleRegistrar}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontFamily: fontCombo.titulos, fontSize: 16 }}>
              Registrarme
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CÓDIGO WA */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colorTheme.background, padding: 24, borderRadius: 16, width: '100%', maxWidth: 400 }}>
            <Text style={{ color: colorTheme.textPrimary, fontSize: 20, fontFamily: fontCombo.titulos, marginBottom: 8 }}>
              Código de WhatsApp
            </Text>
            <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.cuerpo, marginBottom: 16 }}>
              Te enviamos un código de 6 dígitos.
            </Text>
            <TextInput
              style={{ backgroundColor: colorTheme.card, color: colorTheme.textPrimary, fontSize: 28, textAlign: 'center', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colorTheme.border, letterSpacing: 8 }}
              keyboardType="number-pad"
              maxLength={6}
              value={codigo}
              onChangeText={handleConfirmarCodigo}
              readOnly={validandoCodigo}
              autoFocus={true}
            />
            {validandoCodigo && <ActivityIndicator style={{ marginTop: 16 }} color={colorTheme.accent} />}
            {codigoError ? <Text style={{ color: '#ef4444', marginTop: 12, textAlign: 'center', fontFamily: fontCombo.cuerpo }}>{codigoError}</Text> : null}
            
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 24, alignSelf: 'center', padding: 10 }}>
              <Text style={{ color: colorTheme.textSecondary, fontFamily: fontCombo.labelsNav }}>Cerrar y corregir datos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

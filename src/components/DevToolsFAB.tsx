import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  COLOR_THEMES,
  FONT_COMBOS,
  COLOR_THEME_ORDER,
  FONT_COMBO_ORDER,
  ColorThemeId,
  FontComboId,
} from '../config/app_config';

// ============================================================
// DEV TOOLS FAB — Solo en fase de desarrollo
// Dos botones flotantes: selector de tema de color y tipografía
// Se eliminarán cuando el usuario lo indique
// ============================================================

export default function DevToolsFAB() {
  const { colorThemeId, fontComboId, colorTheme, setColorTheme, setFontCombo } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);

  return (
    <>
      {/* FABs flotantes */}
      <View style={styles.fabContainer}>
        {/* FAB Tipografía */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colorTheme.card, borderColor: colorTheme.accent }]}
          onPress={() => setShowFontPicker(true)}
        >
          <Text style={[styles.fabIcon, { color: colorTheme.accent }]}>🔤</Text>
        </TouchableOpacity>

        {/* FAB Tema */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colorTheme.card, borderColor: colorTheme.accent }]}
          onPress={() => setShowColorPicker(true)}
        >
          <Text style={[styles.fabIcon, { color: colorTheme.accent }]}>🎨</Text>
        </TouchableOpacity>
      </View>

      {/* ---- Modal Selector de Tema de Color ---- */}
      <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowColorPicker(false)}>
          <View style={[styles.picker, { backgroundColor: colorTheme.surface, borderColor: colorTheme.border }]}>
            <Text style={[styles.pickerTitle, { color: colorTheme.textPrimary }]}>🎨 Seleccionar Tema</Text>
            <FlatList
              data={COLOR_THEME_ORDER}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const t = COLOR_THEMES[item as ColorThemeId];
                const isActive = item === colorThemeId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      { borderColor: colorTheme.border },
                      isActive && { backgroundColor: colorTheme.accent + '33' },
                    ]}
                    onPress={() => { setColorTheme(item as ColorThemeId); setShowColorPicker(false); }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: t.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: colorTheme.textPrimary }]}>
                        {isActive ? '✓ ' : ''}{t.nombre}
                      </Text>
                      <Text style={[styles.optionDesc, { color: colorTheme.textSecondary }]}>{t.descripcion}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* ---- Modal Selector de Tipografía ---- */}
      <Modal visible={showFontPicker} transparent animationType="fade" onRequestClose={() => setShowFontPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowFontPicker(false)}>
          <View style={[styles.picker, { backgroundColor: colorTheme.surface, borderColor: colorTheme.border }]}>
            <Text style={[styles.pickerTitle, { color: colorTheme.textPrimary }]}>🔤 Seleccionar Tipografía</Text>
            <FlatList
              data={FONT_COMBO_ORDER}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const f = FONT_COMBOS[item as FontComboId];
                const isActive = item === fontComboId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      { borderColor: colorTheme.border },
                      isActive && { backgroundColor: colorTheme.accent + '33' },
                    ]}
                    onPress={() => { setFontCombo(item as FontComboId); setShowFontPicker(false); }}
                  >
                    <Text style={[styles.optionTitle, { color: colorTheme.textPrimary }]}>
                      {isActive ? '✓ ' : ''}{f.nombre}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colorTheme.textSecondary }]}>{f.descripcion}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    top: 25,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 999,
  },
  fab: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  fabIcon: { fontSize: 13 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  picker: {
    width: '100%',
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});

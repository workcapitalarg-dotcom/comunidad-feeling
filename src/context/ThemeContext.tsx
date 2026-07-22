import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ColorTheme,
  ColorThemeId,
  FontCombo,
  FontComboId,
  COLOR_THEMES,
  FONT_COMBOS,
  DEFAULT_COLOR_THEME,
  DEFAULT_FONT_COMBO,
} from '../config/app_config';

// ============================================================
// CONTEXTO DE TEMA — Color + Tipografía dinámicos
// ============================================================

interface ThemeContextType {
  colorTheme: ColorTheme;
  fontCombo: FontCombo;
  colorThemeId: ColorThemeId;
  fontComboId: FontComboId;
  setColorTheme: (id: ColorThemeId) => void;
  setFontCombo: (id: FontComboId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorTheme: COLOR_THEMES[DEFAULT_COLOR_THEME],
  fontCombo: FONT_COMBOS[DEFAULT_FONT_COMBO],
  colorThemeId: DEFAULT_COLOR_THEME,
  fontComboId: DEFAULT_FONT_COMBO,
  setColorTheme: () => {},
  setFontCombo: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorThemeId, setColorThemeId] = useState<ColorThemeId>(DEFAULT_COLOR_THEME);
  const [fontComboId, setFontComboId] = useState<FontComboId>(DEFAULT_FONT_COMBO);

  const setColorTheme = (id: ColorThemeId) => setColorThemeId(id);
  const setFontCombo = (id: FontComboId) => setFontComboId(id);

  return (
    <ThemeContext.Provider
      value={{
        colorTheme: COLOR_THEMES[colorThemeId] || COLOR_THEMES[DEFAULT_COLOR_THEME],
        fontCombo: FONT_COMBOS[fontComboId] || FONT_COMBOS[DEFAULT_FONT_COMBO],
        colorThemeId,
        fontComboId,
        setColorTheme,
        setFontCombo,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import FeelingScreen from '../screens/FeelingScreen';
import AgendaScreen from '../screens/AgendaScreen';
import ContactoScreen from '../screens/ContactoScreen';
import MenuScreen from '../screens/MenuScreen';
import DevToolsFAB from '../components/DevToolsFAB';

// ============================================================
// NAVEGADOR PRINCIPAL — Bottom Tabs con 5 pestañas
// ============================================================

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const { colorTheme } = useTheme();
  const isDark = colorTheme.statusBarStyle === 'light';

  if (name === 'Menú') {
    const iconColor = focused 
      ? colorTheme.accent 
      : (isDark ? '#FFFFFF' : colorTheme.textPrimary);

    return (
      <View
        style={{
          backgroundColor: isDark
            ? (focused ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)')
            : (focused ? colorTheme.accent + '22' : 'rgba(0, 0, 0, 0.05)'),
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDark
            ? (focused ? colorTheme.accent : 'rgba(255, 255, 255, 0.35)')
            : (focused ? colorTheme.accent : 'rgba(0, 0, 0, 0.1)'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={focused ? "menu" : "menu-outline"}
          size={focused ? 20 : 18}
          color={iconColor}
        />
      </View>
    );
  }

  const icons: Record<string, string> = {
    Inicio: '🏠', Feeling: '✨', Agenda: '📅', Contacto: '👤',
  };

  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '●'}
    </Text>
  );
}



export default function MainTabs() {
  const { colorTheme, fontCombo } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          lazy: false,
          tabBarStyle: {
            backgroundColor: colorTheme.navBackground,
            borderTopWidth: 0,
            paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 16 : 8),
            paddingTop: 8,
            height: (Platform.OS === 'ios' ? 52 : 56) + (insets.bottom > 0 ? insets.bottom : 0),
          },
          tabBarActiveTintColor: colorTheme.accent,
          tabBarInactiveTintColor: colorTheme.textSecondary,
          tabBarLabelStyle: {
            fontSize: fontCombo.sizeLabel,
            fontFamily: fontCombo.labelsNav,
            marginBottom: 4,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={route.name} focused={focused} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Inicio"   component={HomeScreen}    />
        <Tab.Screen name="Feeling"  component={FeelingScreen} />
        <Tab.Screen name="Agenda"   component={AgendaScreen}  />
        <Tab.Screen name="Contacto" component={ContactoScreen}/>
        <Tab.Screen name="Menú"     component={MenuScreen}    />
      </Tab.Navigator>

      {/* Renderizar ToolFAB globalmente sobre cualquier pestaña seleccionada */}
      <DevToolsFAB />
    </View>
  );
}

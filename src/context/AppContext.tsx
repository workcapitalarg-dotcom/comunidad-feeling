import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// CONTEXTO GLOBAL DE LA APP — Estado del usuario
// ============================================================

export interface AppUser {
  u_id: number | null;
  u_nombre: string;
  u_status: string;   // 'nuevo' | 'recurrente'
  u_nivel: number;
  u_registrado: boolean;
  u_activo: boolean;
  isAuthenticated: boolean;
}

interface AppContextType {
  user: AppUser;
  setUser: (user: AppUser) => void;
  updateActivo: (activo: boolean) => void;
  updateRegistrado: (registrado: boolean) => void;
  activeMediaId: string | null;
  setActiveMediaId: (id: string | null) => void;
  isHeaderLoaded: boolean;
  setHeaderLoaded: (val: boolean) => void;
  isEmpresasLoaded: boolean;
  setEmpresasLoaded: (val: boolean) => void;
  any_video_completed: boolean;
  setAnyVideoCompleted: (val: boolean) => void;
  favoritosIds: Set<string>;
  setFavoritosIds: (ids: string[]) => void;
  toggleFavoritoId: (id: string, isFav: boolean) => void;
}

const defaultUser: AppUser = {
  u_id: null,
  u_nombre: 'Invitado',
  u_status: '',
  u_nivel: 0,
  u_registrado: false,
  u_activo: false,
  isAuthenticated: false,
};

const AppContext = createContext<AppContextType>({
  user: defaultUser,
  setUser: () => {},
  updateActivo: () => {},
  updateRegistrado: () => {},
  activeMediaId: null,
  setActiveMediaId: () => {},
  isHeaderLoaded: false,
  setHeaderLoaded: () => {},
  isEmpresasLoaded: false,
  setEmpresasLoaded: () => {},
  any_video_completed: false,
  setAnyVideoCompleted: () => {},
  favoritosIds: new Set(),
  setFavoritosIds: () => {},
  toggleFavoritoId: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser>(defaultUser);

  const setUser = (newUser: AppUser) => setUserState(newUser);

  // Actualiza u_activo en caliente (desde cronómetro) sin reiniciar la app
  const updateActivo = (activo: boolean) => {
    setUserState(prev => ({ ...prev, u_activo: activo }));
  };

  // Actualiza u_registrado tras el registro exitoso
  const updateRegistrado = (registrado: boolean) => {
    setUserState(prev => ({ ...prev, u_registrado: registrado }));
  };

  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [isHeaderLoaded, setHeaderLoaded] = useState(false);
  const [isEmpresasLoaded, setEmpresasLoaded] = useState(false);
  const [anyVideoCompleted, setAnyVideoCompleted] = useState(false);
  const [favoritosIds, setFavoritosIdsState] = useState<Set<string>>(new Set());

  const setFavoritosIds = (ids: string[]) => {
    setFavoritosIdsState(new Set(ids.map(String)));
  };

  const toggleFavoritoId = (id: string, isFav: boolean) => {
    setFavoritosIdsState(prev => {
      const next = new Set(prev);
      if (isFav) next.add(String(id));
      else next.delete(String(id));
      return next;
    });
  };

  // La configuración personalizada de audio fue removida para dejar que
  // el sistema operativo (y Expo) maneje los defaults y permita el Screen Lock.

  const contextValue = {
    user,
    setUser,
    updateActivo,
    updateRegistrado,
    activeMediaId,
    setActiveMediaId,
    isHeaderLoaded,
    setHeaderLoaded,
    isEmpresasLoaded,
    setEmpresasLoaded,
    any_video_completed: anyVideoCompleted,
    setAnyVideoCompleted,
    favoritosIds,
    setFavoritosIds,
    toggleFavoritoId,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

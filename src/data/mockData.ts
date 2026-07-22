// ============================================================
// DATOS MOCK — Para desarrollo sin n8n
// Simula las respuestas de todos los webhooks
// USE_MOCKS=true en app_config.ts activa este módulo
// ============================================================

// --- Respuesta del Handshake (URL_SIGNUP) ---
export const MOCK_HANDSHAKE = {
  auth: true,
  usuario_id: 1,
  status: 'recurrente', // Cambiar a 'nuevo' para testear bienvenida
  actualizar_version: false,
  nombre: 'Vidya',
  nivel: 1,
  registrado: false,
  activo: false,
};

// --- Respuesta del Header/Feed (URL_HEADER_FEED) ---
export const MOCK_HEADER_FEED = {
  frase_dia: '"El sentimiento es el lenguaje universal del alma humana."',
  frase_autor: 'Maestro Amor',
  saludo: '¡Hola',
  feed: [
    {
      id: 'h1',
      categoria: 'Empresas',
      titulo: 'Innovación Local 2024',
      descripcion: 'Cómo las empresas locales están transformando su comunidad.',
      imagen: 'https://picsum.photos/seed/empresas/800/450',
      tipo_formato: 'video',
      url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4',
      url_foto_video: 'https://picsum.photos/seed/empresas/800/450',
      color_acento: '#ec5b13',
    },
    {
      id: 'h2',
      categoria: 'Lugares',
      titulo: 'Rutas del Sentimiento',
      descripcion: 'Descubrí los espacios que inspiran la conexión humana.',
      imagen: 'https://picsum.photos/seed/lugares/800/450',
      tipo_formato: 'video',
      url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4',
      url_foto_video: 'https://picsum.photos/seed/lugares/800/450',
      color_acento: '#facc15',
    },
    {
      id: 'h3',
      categoria: 'Testimonios',
      titulo: 'Historias que Inspiran',
      descripcion: 'Voces reales de personas que transformaron su vida.',
      imagen: 'https://picsum.photos/seed/testimonios/800/450',
      tipo_formato: 'video',
      url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4',
      url_foto_video: 'https://picsum.photos/seed/testimonios/800/450',
      color_acento: '#4a0404',
    },
  ],
};

// --- Empresas (URL_MENU_EMPRESAS) ---
export const MOCK_EMPRESAS = [
  { id: 'v1', tipo_formato: 'video', titulo: 'Liderazgo Consciente en PyMEs', url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/vid1/800/450' },
  { id: 'v2', tipo_formato: 'video', titulo: 'Marketing desde el Propósito', url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/vid2/800/450' },
  { id: 'v3', tipo_formato: 'video', titulo: 'Equipos que Sienten y Producen', url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/vid3/800/450' },
  { id: 'v4', tipo_formato: 'video', titulo: 'Innovación desde Adentro', url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/vid4/800/450' },
  { id: 'v5', tipo_formato: 'video', titulo: 'Comunicación sin Ruido', url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/vid5/800/450' },
];

// Para testear estado vacío, cambiar a []:
// export const MOCK_EMPRESAS = [];

// --- Galería (URL_MENU_GALERIA) ---
export const MOCK_GALERIA = [
  { id: 'g1', tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/gal1/800/1000' },
  { id: 'g2', tipo_formato: 'video',  url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/gal2/800/1000' },
  { id: 'g3', tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/gal3/800/1000' },
  { id: 'g4', tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/gal4/800/1000' },
];

// --- Novedades (URL_MENU_NOVEDADES) ---
export const MOCK_NOVEDADES = [
  { id: 'n1', tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/nov1/800/1000', titulo: 'Encuentro de Comunidad' },
  { id: 'n2', tipo_formato: 'video',  url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/nov2/800/1000', titulo: 'Charla: Inteligencia Emocional' },
  { id: 'n3', tipo_formato: 'audio',  url_archivo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', titulo: 'Meditación Guiada: Inicio de Semana' },
  { id: 'n4', tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/nov4/800/1000', titulo: 'Galería: Retiro de Verano' },
];

// --- Agenda (URL_MENU_AGENDA) ---
export const MOCK_AGENDA = [
  { id: 'e1', titulo: 'Retiro de Conexión', fecha: '28 Mar 2026', lugar: 'San Isidro',  tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/evt1/800/500', descripcion: 'Un día de reconexión contigo mismo y la comunidad.' },
  { id: 'e2', titulo: 'Taller de Liderazgo Empático', fecha: '5 Abr 2026', lugar: 'Online', tipo_formato: 'imagen', url_archivo: 'https://picsum.photos/seed/evt2/800/500', descripcion: 'Herramientas prácticas para liderar desde el corazón.' },
  { id: 'e3', titulo: 'Encuentro Mensual Feeling', fecha: '12 Abr 2026', lugar: 'Buenos Aires', tipo_formato: 'video',  url_archivo: 'https://www.w3schools.com/html/mov_bbb.mp4', url_foto_video: 'https://picsum.photos/seed/evt3/800/500', descripcion: 'El encuentro presencial que no podés perderte.' },
];

// --- Cronómetro (URL_CRONOMETRO) ---
export const MOCK_CRONOMETRO = {
  nuevo_u_activo: false, // Cambiar a true para testear desbloqueo de secciones
};

// --- Confirmar Registro (URL_CONFIRMAR_REGISTRO) ---
export const MOCK_CONFIRMAR_REGISTRO = {
  success: true, // Cambiar a false para testear códigos incorrectos
  mensaje: 'Registro confirmado exitosamente.',
};

// --- Registro Actividad (URL_REGISTRAR_USUARIO_ACTIVIDAD) ---
export const MOCK_REGISTRO_ACTIVIDAD = {
  estado: 'success', // 'success' | 'full' | 'error'
  mensaje: '¡Te anotaste al evento! Te esperamos.',
};

// --- Mentor (URL_MENTOR) ---
export const MOCK_MENTOR = {
  nombre: 'Maestro Amor',
  bio: 'Filósofo, maestro espiritual y fundador de la Comunidad Feeling. Con más de 20 años acompañando procesos de transformación personal y colectiva.',
  imagen: 'https://picsum.photos/seed/mentor/400/400',
};

// --- FAQ (URL_FAQ) ---
export const MOCK_FAQ = [
  { id: 'f1', pregunta: '¿Qué es la Comunidad Feeling?', respuesta: 'Es un espacio de conexión humana, aprendizaje y crecimiento personal liderado por el Maestro Amor.' },
  { id: 'f2', pregunta: '¿Cómo accedo a los contenidos exclusivos?', respuesta: 'Al acumular el tiempo de uso necesario, se desbloquean automáticamente los contenidos de nivel avanzado.' },
  { id: 'f3', pregunta: '¿Cómo me registro?', respuesta: 'Desde el tab Contacto podés completar tus datos y verificar tu número de WhatsApp.' },
];

// --- Música (URL_MUSICA) ---
export const MOCK_MUSICA = [
  { id: 'mu1', titulo: 'Om — Sonido de Inicio', artista: 'Comunidad Feeling', url_archivo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'mu2', titulo: 'Respiración Consciente', artista: 'Maestro Amor', url_archivo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'mu3', titulo: 'Frecuencias del Alma', artista: 'Comunidad Feeling', url_archivo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

// --- Ejercicios (URL_EJERCICIOS) ---
export const MOCK_EJERCICIOS = [
  { id: 'ej1', titulo: 'Ejercicio 1: Presencia Total', url_archivo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'ej2', titulo: 'Ejercicio 2: Apertura del Corazón', url_archivo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

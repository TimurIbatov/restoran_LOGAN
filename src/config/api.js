// Конфигурация API
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// Базовые URL для разных окружений
export const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8000/api',
    mediaURL: 'http://localhost:8000/media',
    staticURL: 'http://localhost:8000/static'
  },
  production: {
    baseURL: '/api',
    mediaURL: '/media', 
    staticURL: '/static'
  }
}

// Текущая конфигурация
export const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production

// Эндпоинты API
export const API_ENDPOINTS = {
  // Аутентификация
  auth: {
    login: '/auth/jwt/create/',
    refresh: '/auth/jwt/refresh/',
    register: '/auth/users/',
    logout: '/auth/logout/',
    verify: '/auth/jwt/verify/'
  },
  
  // Аккаунты
  accounts: {
    profile: '/accounts/profile/',
    current: '/accounts/current/',
    changePassword: '/accounts/change-password/',
    users: '/accounts/users/'
  },
  
  // Ресторан
  restaurant: {
    zones: '/restaurant/zones/',
    tables: '/restaurant/tables/',
    menuCategories: '/restaurant/menu/categories/',
    menuItems: '/restaurant/menu/items/',
    settings: '/restaurant/settings/',
    floorPlan: '/restaurant/floor-plan/',
    dashboardStats: '/restaurant/dashboard-stats/'
  },
  
  // Бронирования
  bookings: {
    list: '/bookings/',
    create: '/bookings/',
    detail: (id) => `/bookings/${id}/`,
    availableSlots: '/bookings/available-slots/',
    cancel: (id) => `/bookings/${id}/cancel/`,
    confirm: (id) => `/bookings/${id}/confirm/`,
    statistics: '/bookings/statistics/'
  },
  
  // Отзывы
  reviews: {
    list: '/reviews/',
    create: '/reviews/',
    detail: (id) => `/reviews/${id}/`
  }
}

// Заголовки по умолчанию
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Настройки запросов
export const REQUEST_CONFIG = {
  timeout: 10000, // 10 секунд
  retries: 3,
  retryDelay: 1000 // 1 секунда
}
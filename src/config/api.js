// Конфигурация API
export const API_CONFIG = {
  development: {
    baseURL: "http://localhost:8000",
  },
  production: {
    baseURL: "https://your-production-domain.com",
  },
}

// Текущая конфигурация
export const currentConfig = API_CONFIG[import.meta.env.MODE] || API_CONFIG.development

// Эндпоинты API
export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/jwt/create/",
    refresh: "/api/auth/jwt/refresh/",
    register: "/api/auth/users/",
    verify: "/api/auth/jwt/verify/",
  },
  accounts: {
    current: "/api/auth/users/me/",
    profile: "/api/accounts/profile/",
    changePassword: "/api/accounts/change-password/",
    users: "/api/accounts/users/",
    verifyEmail: "/api/accounts/verify-email/",
    resendEmailVerification: "/api/accounts/resend-email-verification/",
  },
  restaurant: {
    zones: "/api/restaurant/zones/",
    tables: "/api/restaurant/tables/",
    menuCategories: "/api/restaurant/menu/categories/",
    menuItems: "/api/restaurant/menu/items/",
    settings: "/api/restaurant/settings/",
    floorPlan: "/api/restaurant/floor-plan/",
    dashboardStats: "/api/restaurant/dashboard-stats/",
  },
  bookings: {
    list: "/api/bookings/",
    create: "/api/bookings/",
    detail: (id) => `/api/bookings/${id}/`,
    availableSlots: "/api/bookings/available-slots/",
    cancel: (id) => `/api/bookings/${id}/cancel/`,
    confirm: (id) => `/api/bookings/${id}/confirm/`,
    statistics: "/api/bookings/statistics/",
    confirmEmail: "/api/bookings/confirm-email/",
    createPayment: (bookingId) => `/api/bookings/${bookingId}/payment/`,
  },
  reviews: {
    list: "/api/reviews/",
    create: "/api/reviews/",
    detail: (id) => `/api/reviews/${id}/`,
  },
}

// Заголовки по умолчанию
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

// Конфигурация запросов
export const REQUEST_CONFIG = {
  timeout: 30000, // 30 секунд
  retries: 1, // Количество повторных попыток
}

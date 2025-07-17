// Константы приложения

// Статусы бронирований
export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
}

// Текстовые представления статусов
export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUSES.PENDING]: 'Ожидает подтверждения',
  [BOOKING_STATUSES.CONFIRMED]: 'Подтверждено',
  [BOOKING_STATUSES.ACTIVE]: 'Активно',
  [BOOKING_STATUSES.COMPLETED]: 'Завершено',
  [BOOKING_STATUSES.CANCELLED]: 'Отменено',
  [BOOKING_STATUSES.NO_SHOW]: 'Не явился'
}

// CSS классы для статусов
export const BOOKING_STATUS_CLASSES = {
  [BOOKING_STATUSES.PENDING]: 'warning',
  [BOOKING_STATUSES.CONFIRMED]: 'success',
  [BOOKING_STATUSES.ACTIVE]: 'info',
  [BOOKING_STATUSES.COMPLETED]: 'secondary',
  [BOOKING_STATUSES.CANCELLED]: 'danger',
  [BOOKING_STATUSES.NO_SHOW]: 'dark'
}

// Статусы столиков
export const TABLE_STATUSES = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
}

// Текстовые представления статусов столиков
export const TABLE_STATUS_LABELS = {
  [TABLE_STATUSES.AVAILABLE]: 'Свободен',
  [TABLE_STATUSES.OCCUPIED]: 'Занят',
  [TABLE_STATUSES.RESERVED]: 'Забронирован',
  [TABLE_STATUSES.MAINTENANCE]: 'На обслуживании'
}

// CSS классы для статусов столиков
export const TABLE_STATUS_CLASSES = {
  [TABLE_STATUSES.AVAILABLE]: 'status-available',
  [TABLE_STATUSES.OCCUPIED]: 'status-occupied',
  [TABLE_STATUSES.RESERVED]: 'status-reserved',
  [TABLE_STATUSES.MAINTENANCE]: 'status-maintenance'
}

// Роли пользователей
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  STAFF: 'staff'
}

// Типы уведомлений
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Настройки пагинации
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

// Форматы дат
export const DATE_FORMATS = {
  DATE_ONLY: 'DD.MM.YYYY',
  TIME_ONLY: 'HH:mm',
  DATETIME: 'DD.MM.YYYY HH:mm',
  DATETIME_FULL: 'DD.MM.YYYY HH:mm:ss'
}

// Валидация
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_COMMENT_LENGTH: 1000,
  MIN_BOOKING_DURATION: 60, // минуты
  MAX_BOOKING_DURATION: 240, // минуты
  MAX_GUESTS_COUNT: 20
}

// Локальное хранилище ключи
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  SELECTED_TABLE_ID: 'selectedTableId'
}

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  UNAUTHORIZED: 'Необходимо войти в систему.',
  FORBIDDEN: 'У вас нет прав для выполнения этого действия.',
  NOT_FOUND: 'Запрашиваемый ресурс не найден.',
  SERVER_ERROR: 'Внутренняя ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Проверьте правильность заполнения полей.',
  TOKEN_EXPIRED: 'Сессия истекла. Необходимо войти заново.'
}

// Успешные сообщения
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Вы успешно вошли в систему',
  LOGOUT_SUCCESS: 'Вы вышли из системы',
  REGISTER_SUCCESS: 'Регистрация прошла успешно',
  PROFILE_UPDATED: 'Профиль успешно обновлен',
  PASSWORD_CHANGED: 'Пароль успешно изменен',
  BOOKING_CREATED: 'Бронирование успешно создано',
  BOOKING_CANCELLED: 'Бронирование отменено',
  BOOKING_CONFIRMED: 'Бронирование подтверждено'
}

// Настройки по умолчанию
export const DEFAULT_SETTINGS = {
  LANGUAGE: 'ru',
  TIMEZONE: 'Asia/Tashkent',
  CURRENCY: 'UZS',
  DATE_FORMAT: DATE_FORMATS.DATETIME,
  ITEMS_PER_PAGE: PAGINATION.DEFAULT_PAGE_SIZE
}

// Регулярные выражения
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
}

// URL маршруты
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MENU: '/menu',
  TABLES: '/tables',
  BOOKING: '/booking',
  PERSONAL_CABINET: '/personal-cabinet',
  ADMIN: '/admin'
}
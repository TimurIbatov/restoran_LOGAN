import { 
  BOOKING_STATUS_LABELS, 
  BOOKING_STATUS_CLASSES,
  TABLE_STATUS_LABELS,
  TABLE_STATUS_CLASSES,
  DATE_FORMATS 
} from './constants'

// Форматирование даты
export const formatDate = (date, format = DATE_FORMATS.DATETIME) => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  
  switch (format) {
    case DATE_FORMATS.DATE_ONLY:
      return `${day}.${month}.${year}`
    case DATE_FORMATS.TIME_ONLY:
      return `${hours}:${minutes}`
    case DATE_FORMATS.DATETIME:
      return `${day}.${month}.${year} ${hours}:${minutes}`
    case DATE_FORMATS.DATETIME_FULL:
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
    default:
      return d.toLocaleString('ru-RU')
  }
}

// Форматирование цены
export const formatPrice = (price, currency = 'сум') => {
  if (typeof price !== 'number') return '0 ' + currency
  return price.toLocaleString('ru-RU') + ' ' + currency
}

// Получение текста статуса бронирования
export const getBookingStatusText = (status) => {
  return BOOKING_STATUS_LABELS[status] || status
}

// Получение CSS класса статуса бронирования
export const getBookingStatusClass = (status) => {
  return BOOKING_STATUS_CLASSES[status] || 'secondary'
}

// Получение текста статуса столика
export const getTableStatusText = (status) => {
  return TABLE_STATUS_LABELS[status] || status
}

// Получение CSS класса статуса столика
export const getTableStatusClass = (status) => {
  return TABLE_STATUS_CLASSES[status] || 'status-available'
}

// Валидация email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Валидация телефона
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Валидация пароля
export const isValidPassword = (password) => {
  return password && password.length >= 8
}

// Проверка силы пароля
export const getPasswordStrength = (password) => {
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[a-z]/.test(password)) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/[0-9]/.test(password)) strength += 25
  
  return strength
}

// Получение CSS класса для силы пароля
export const getPasswordStrengthClass = (strength) => {
  if (strength <= 25) return 'bg-danger'
  if (strength <= 50) return 'bg-warning'
  if (strength <= 75) return 'bg-info'
  return 'bg-success'
}

// Дебаунс функция
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Троттлинг функция
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Генерация случайного ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Копирование в буфер обмена
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch (err) {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// Проверка, является ли устройство мобильным
export const isMobile = () => {
  return window.innerWidth <= 768
}

// Проверка, является ли устройство планшетом
export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024
}

// Проверка, является ли устройство десктопом
export const isDesktop = () => {
  return window.innerWidth > 1024
}

// Получение размера экрана
export const getScreenSize = () => {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

// Скролл к элементу
export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId)
  if (element) {
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// Проверка видимости элемента
export const isElementInViewport = (element) => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// Получение параметров URL
export const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// Установка параметра URL
export const setUrlParam = (key, value) => {
  const url = new URL(window.location)
  url.searchParams.set(key, value)
  window.history.pushState({}, '', url)
}

// Удаление параметра URL
export const removeUrlParam = (key) => {
  const url = new URL(window.location)
  url.searchParams.delete(key)
  window.history.pushState({}, '', url)
}

// Форматирование времени продолжительности
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}ч ${mins}м`
  }
  return `${mins}м`
}

// Проверка, можно ли отменить бронирование
export const canCancelBooking = (booking, cancellationHours = 2) => {
  if (!booking || !booking.start_time) return false
  
  const startTime = new Date(booking.start_time)
  const now = new Date()
  const cancellationDeadline = new Date(startTime.getTime() - cancellationHours * 60 * 60 * 1000)
  
  return now < cancellationDeadline && !['cancelled', 'completed', 'no_show'].includes(booking.status)
}

// Получение доступных временных слотов
export const generateTimeSlots = (startTime, endTime, interval = 30) => {
  const slots = []
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  
  let current = new Date(start)
  
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5)
    slots.push(timeString)
    current.setMinutes(current.getMinutes() + interval)
  }
  
  return slots
}

// Проверка пересечения временных интервалов
export const isTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)
  
  return s1 < e2 && s2 < e1
}

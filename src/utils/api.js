import { currentConfig, API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_CONFIG } from '../config/api'

// Класс для работы с API
class ApiClient {
  constructor() {
    this.baseURL = currentConfig.baseURL
    this.defaultHeaders = DEFAULT_HEADERS
  }

  // Получение токена авторизации
  getAuthToken() {
    return localStorage.getItem('access_token')
  }

  // Установка токена авторизации
  setAuthToken(token) {
    localStorage.setItem('access_token', token)
  }

  // Удаление токена авторизации
  removeAuthToken() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // Получение заголовков с авторизацией
  getHeaders(includeAuth = true) {
    const headers = { ...this.defaultHeaders }
    
    if (includeAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }
    
    return headers
  }

  // Обновление токена
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ refresh: refreshToken })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      this.setAuthToken(data.access)
      
      // Обновляем refresh token если он пришел
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh)
      }
      
      return data.access
    } catch (error) {
      this.removeAuthToken()
      throw error
    }
  }

  // Основной метод для выполнения запросов
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      includeAuth = true,
      retries = REQUEST_CONFIG.retries
    } = options

    const url = `${this.baseURL}${endpoint}`
    const headers = this.getHeaders(includeAuth)

    const config = {
      method,
      headers,
      ...(data && (method === 'POST' || method === 'PUT' || method === 'PATCH') && {
        body: JSON.stringify(data)
      })
    }

    try {
      const response = await fetch(url, config)

      // Если токен истек, пробуем обновить
      if (response.status === 401 && includeAuth && retries > 0) {
        try {
          await this.refreshToken()
          // Повторяем запрос с новым токеном
          return this.request(endpoint, { ...options, retries: retries - 1 })
        } catch (refreshError) {
          // Если обновление не удалось, перенаправляем на логин
          this.removeAuthToken()
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          throw new Error('Authentication required')
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Если ответ пустой (например, 204 No Content)
      if (response.status === 204) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error)
      throw error
    }
  }

  // Методы для разных типов запросов
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', data })
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', data })
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', data })
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

// Создаем экземпляр API клиента
const apiClient = new ApiClient()

// Функции для аутентификации
export const login = async (email, password) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, { email, password }, { includeAuth: false })
    
    apiClient.setAuthToken(response.access)
    localStorage.setItem('refresh_token', response.refresh)
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Ошибка входа в систему')
  }
}

export const register = async (userData) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.register, userData, { includeAuth: false })
    return response
  } catch (error) {
    throw new Error(error.message || 'Ошибка регистрации')
  }
}

export const getCurrentUser = async () => {
  try {
    return await apiClient.get(API_ENDPOINTS.accounts.current)
  } catch (error) {
    return null
  }
}

export const logout = () => {
  apiClient.removeAuthToken()
  window.location.href = '/'
}

// API для ресторана
export const restaurantAPI = {
  getZones: () => apiClient.get(API_ENDPOINTS.restaurant.zones, { includeAuth: false }),
  getTables: () => apiClient.get(API_ENDPOINTS.restaurant.tables, { includeAuth: false }),
  getMenuCategories: () => apiClient.get(API_ENDPOINTS.restaurant.menuCategories, { includeAuth: false }),
  getMenuItems: () => apiClient.get(API_ENDPOINTS.restaurant.menuItems, { includeAuth: false }),
  getSettings: () => apiClient.get(API_ENDPOINTS.restaurant.settings, { includeAuth: false }),
  getFloorPlan: () => apiClient.get(API_ENDPOINTS.restaurant.floorPlan, { includeAuth: false }),
  getDashboardStats: () => apiClient.get(API_ENDPOINTS.restaurant.dashboardStats)
}

// API для бронирований
export const bookingAPI = {
  getUserBookings: () => apiClient.get(API_ENDPOINTS.bookings.list),
  createBooking: (data) => apiClient.post(API_ENDPOINTS.bookings.create, data),
  getBookingDetail: (id) => apiClient.get(API_ENDPOINTS.bookings.detail(id)),
  getAvailableSlots: (params) => {
    const queryString = new URLSearchParams(params).toString()
    return apiClient.get(`${API_ENDPOINTS.bookings.availableSlots}?${queryString}`, { includeAuth: false })
  },
  cancelBooking: (id, reason) => apiClient.post(API_ENDPOINTS.bookings.cancel(id), { reason }),
  confirmBooking: (id) => apiClient.post(API_ENDPOINTS.bookings.confirm(id)),
  getStatistics: () => apiClient.get(API_ENDPOINTS.bookings.statistics)
}

// API для аккаунтов
export const accountAPI = {
  getProfile: () => apiClient.get(API_ENDPOINTS.accounts.profile),
  updateProfile: (data) => apiClient.put(API_ENDPOINTS.accounts.profile, data),
  changePassword: (data) => apiClient.post(API_ENDPOINTS.accounts.changePassword, data),
  getUsers: () => apiClient.get(API_ENDPOINTS.accounts.users)
}

// API для отзывов
export const reviewsAPI = {
  getReviews: () => apiClient.get(API_ENDPOINTS.reviews.list, { includeAuth: false }),
  createReview: (data) => apiClient.post(API_ENDPOINTS.reviews.create, data),
  getReviewDetail: (id) => apiClient.get(API_ENDPOINTS.reviews.detail(id))
}

// Экспортируем основной API клиент
export default apiClient
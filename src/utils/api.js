const API_BASE_URL = 'http://localhost:8000/api'

export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('access_token')
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      if (response.status === 401) {
        // Токен истек, пробуем обновить
        const refreshed = await refreshToken()
        if (refreshed) {
          // Повторяем запрос с новым токеном
          config.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config)
          if (retryResponse.ok) {
            return await retryResponse.json()
          }
        }
        // Если обновление не удалось, перенаправляем на логин
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Функция для обновления токена
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE_URL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken })
    })

    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      return true
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
  }
  
  return false
}

// Функция для логина
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/jwt/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Неверные данные для входа')
    }

    const data = await response.json()
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    
    return data
  } catch (error) {
    throw error
  }
}

// Функция для регистрации
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Ошибка при регистрации')
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
}

// Функция для получения текущего пользователя
export const getCurrentUser = async () => {
  try {
    return await apiRequest('/accounts/current/')
  } catch (error) {
    return null
  }
}

// Функция для выхода
export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/'
}

// API функции для ресторана
export const restaurantAPI = {
  // Зоны
  getZones: () => apiRequest('/restaurant/zones/'),
  
  // Столики
  getTables: () => apiRequest('/restaurant/tables/'),
  getFloorPlan: () => apiRequest('/restaurant/floor-plan/'),
  
  // Меню
  getMenuCategories: () => apiRequest('/restaurant/menu/categories/'),
  getMenuItems: () => apiRequest('/restaurant/menu/items/'),
  
  // Настройки ресторана
  getSettings: () => apiRequest('/restaurant/settings/'),
}

// API функции для бронирований
export const bookingAPI = {
  // Получить бронирования пользователя
  getUserBookings: () => apiRequest('/bookings/'),
  
  // Создать бронирование
  createBooking: (data) => apiRequest('/bookings/', 'POST', data),
  
  // Получить доступные слоты
  getAvailableSlots: (params) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/bookings/available-slots/?${queryString}`)
  },
  
  // Отменить бронирование
  cancelBooking: (id, reason) => apiRequest(`/bookings/${id}/cancel/`, 'POST', { reason }),
  
  // Подтвердить бронирование (админ)
  confirmBooking: (id) => apiRequest(`/bookings/${id}/confirm/`, 'POST'),
  
  // Статистика бронирований (админ)
  getStatistics: () => apiRequest('/bookings/statistics/'),
}

// API функции для аккаунтов
export const accountAPI = {
  // Получить профиль
  getProfile: () => apiRequest('/accounts/profile/'),
  
  // Обновить профиль
  updateProfile: (data) => apiRequest('/accounts/profile/', 'PUT', data),
  
  // Изменить пароль
  changePassword: (data) => apiRequest('/accounts/change-password/', 'POST', data),
  
  // Получить список пользователей (админ)
  getUsers: () => apiRequest('/accounts/users/'),
}
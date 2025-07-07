import { currentConfig, API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_CONFIG } from "../config/api"

// Класс для работы с API
class ApiClient {
  constructor() {
    this.baseURL = currentConfig.baseURL
    this.defaultHeaders = DEFAULT_HEADERS
    this.isOnline = true
  }

  // Получение токена авторизации
  getAuthToken() {
    return localStorage.getItem("access_token")
  }

  // Установка токена авторизации
  setAuthToken(token) {
    localStorage.setItem("access_token", token)
  }

  // Удаление токена авторизации
  removeAuthToken() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
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
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.auth.refresh}`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        throw new Error("Token refresh failed")
      }

      const data = await response.json()
      this.setAuthToken(data.access)

      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh)
      }

      return data.access
    } catch (error) {
      this.removeAuthToken()
      throw error
    }
  }

  // Основной метод для выполнения запросов
  async request(endpoint, options = {}) {
    const { method = "GET", data = null, includeAuth = true, retries = REQUEST_CONFIG.retries } = options
    const url = `${this.baseURL}${endpoint}`
    const headers = this.getHeaders(includeAuth)

    // Удаляем Content-Type для FormData, чтобы браузер установил multipart/form-data
    if (data instanceof FormData) {
      delete headers["Content-Type"]
    }

    const config = {
      method,
      headers,
      ...(data &&
        (method === "POST" || method === "PUT" || method === "PATCH") && {
          body: data instanceof FormData ? data : JSON.stringify(data),
        }),
    }

    try {
      const response = await fetch(url, config)

      // Если токен истек, пробуем обновить
      if (response.status === 401 && includeAuth && retries > 0) {
        try {
          await this.refreshToken()
          return this.request(endpoint, { ...options, retries: retries - 1 })
        } catch (refreshError) {
          this.removeAuthToken()
          throw refreshError
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)

        let errorMessage = "Произошла ошибка"

        // Обработка различных типов ошибок
        if (errorData.username && Array.isArray(errorData.username)) {
          errorMessage = `Ошибка username: ${errorData.username.join(", ")}`
        } else if (errorData.email && Array.isArray(errorData.email)) {
          errorMessage = `Ошибка email: ${errorData.email.join(", ")}`
        } else if (errorData.password && Array.isArray(errorData.password)) {
          errorMessage = `Ошибка пароля: ${errorData.password.join(", ")}`
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(", ")
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else {
          errorMessage = `HTTP error! status: ${response.status}`
        }

        // Специальная обработка для разных типов ошибок
        if (response.status === 404) {
          throw new Error("Ресурс не найден")
        } else if (response.status === 403) {
          throw new Error("Недостаточно прав доступа")
        } else if (response.status >= 500) {
          throw new Error("Ошибка сервера. Попробуйте позже.")
        }

        throw new Error(errorMessage)
      }

      if (response.status === 204) {
        return null
      }

      this.isOnline = true
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error)

      // Проверяем, доступен ли сервер
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        this.isOnline = false
        throw new Error("Сервер недоступен. Проверьте подключение к интернету.")
      }

      throw error
    }
  }

  // Методы для разных типов запросов
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" })
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: "POST", data })
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: "PUT", data })
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: "PATCH", data })
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" })
  }
}

// Создаем экземпляр API клиента
const apiClient = new ApiClient()

// Функции для аутентификации
export const login = async (email, password) => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.auth.login,
      {
        email,
        password,
      },
      { includeAuth: false },
    )

    if (response && response.access) {
      apiClient.setAuthToken(response.access)
      localStorage.setItem("refresh_token", response.refresh)
      return response
    }

    throw new Error("Неверный формат ответа сервера")
  } catch (error) {
    console.error("Login error:", error)
    throw new Error(error.message || "Ошибка входа в систему")
  }
}

export const register = async (userData) => {
  try {
    // Подготавливаем данные в правильном формате для djoser
    const registrationData = {
      username: userData.email, // Используем email как username
      email: userData.email,
      first_name: userData.name?.split(" ")[0] || "",
      last_name: userData.name?.split(" ").slice(1).join(" ") || "",
      phone: userData.phone || "",
      password: userData.password,
      re_password: userData.password, // Подтверждение пароля для djoser
    }

    console.log("Отправляем данные регистрации:", registrationData)

    const response = await apiClient.post(API_ENDPOINTS.auth.register, registrationData, { includeAuth: false })

    // Если регистрация успешна, возвращаем успех без автоматического входа
    if (response) {
      return {
        success: true,
        message: "Регистрация прошла успешно! Проверьте email для подтверждения аккаунта.",
      }
    }

    return response
  } catch (error) {
    console.error("Registration error:", error)

    // Улучшенная обработка ошибок регистрации
    let errorMessage = "Ошибка регистрации"

    if (error.message.includes("username")) {
      errorMessage = "Пользователь с таким email уже существует"
    } else if (error.message.includes("email")) {
      errorMessage = "Пользователь с таким email уже существует"
    } else if (error.message.includes("password")) {
      errorMessage = "Пароль не соответствует требованиям"
    } else if (error.message.includes("This field may not be blank")) {
      errorMessage = "Заполните все обязательные поля"
    } else if (error.message) {
      errorMessage = error.message
    }

    throw new Error(errorMessage)
  }
}

export const getCurrentUser = async () => {
  try {
    return await apiClient.get(API_ENDPOINTS.accounts.current)
  } catch (error) {
    console.error("Ошибка получения текущего пользователя:", error)
    return null
  }
}

export const logout = () => {
  apiClient.removeAuthToken()
}

// API для ресторана с fallback данными
export const restaurantAPI = {
  getZones: async () => {
    try {
      return await apiClient.get(API_ENDPOINTS.restaurant.zones, { includeAuth: false })
    } catch (error) {
      console.error("Error fetching zones:", error)
      return []
    }
  },

  getTables: async () => {
    try {
      return await apiClient.get(API_ENDPOINTS.restaurant.tables, { includeAuth: false })
    } catch (error) {
      console.error("Error fetching tables:", error)
      return []
    }
  },

  getMenuCategories: async () => {
    try {
      return await apiClient.get(API_ENDPOINTS.restaurant.menuCategories, { includeAuth: false })
    } catch (error) {
      console.error("Error fetching menu categories:", error)
      return []
    }
  },

  getMenuItems: async () => {
    try {
      return await apiClient.get(API_ENDPOINTS.restaurant.menuItems, { includeAuth: false })
    } catch (error) {
      console.error("Error fetching menu items:", error)
      return []
    }
  },

  getSettings: () => apiClient.get(API_ENDPOINTS.restaurant.settings, { includeAuth: false }),
  getFloorPlan: () => apiClient.get(API_ENDPOINTS.restaurant.floorPlan, { includeAuth: false }),
  getDashboardStats: () => apiClient.get(API_ENDPOINTS.restaurant.dashboardStats),

  // Методы для управления столиками
  createTable: (data) => apiClient.post(API_ENDPOINTS.restaurant.tables, data),
  updateTable: (id, data) => {
    console.log("Updating table:", { id, data })
    return apiClient.put(`${API_ENDPOINTS.restaurant.tables}${id}/`, data)
  },
  deleteTable: (id) => apiClient.delete(`${API_ENDPOINTS.restaurant.tables}${id}/`),

  // Методы для управления меню
  createMenuItem: (data) => apiClient.post(API_ENDPOINTS.restaurant.menuItems, data),
  updateMenuItem: (id, data) => apiClient.put(`${API_ENDPOINTS.restaurant.menuItems}${id}/`, data),
  deleteMenuItem: (id) => apiClient.delete(`${API_ENDPOINTS.restaurant.menuItems}${id}/`),
}

// API для бронирований
export const bookingAPI = {
  getUserBookings: () => apiClient.get(API_ENDPOINTS.bookings.list),
  getAllBookings: () => apiClient.get(`${API_ENDPOINTS.bookings.list}?all=true`),
  createBooking: (data) => apiClient.post(API_ENDPOINTS.bookings.create, data),
  getBookingDetail: (id) => apiClient.get(API_ENDPOINTS.bookings.detail(id)),
  getAvailableSlots: (params) => {
    const queryString = new URLSearchParams(params).toString()
    return apiClient.get(`${API_ENDPOINTS.bookings.availableSlots}?${queryString}`, { includeAuth: false })
  },
  cancelBooking: (id, reason) => apiClient.post(API_ENDPOINTS.bookings.cancel(id), { reason }),
  confirmBooking: (id) => apiClient.post(API_ENDPOINTS.bookings.confirm(id)),
  getStatistics: () => apiClient.get(API_ENDPOINTS.bookings.statistics),
  confirmEmail: (token) => apiClient.post(API_ENDPOINTS.bookings.confirmEmail, { token }, { includeAuth: false }),
  createPayment: (bookingId, data) => apiClient.post(API_ENDPOINTS.bookings.createPayment(bookingId), data),
}

// API для аккаунтов
export const accountAPI = {
  getProfile: () => apiClient.get(API_ENDPOINTS.accounts.profile),
  updateProfile: (data) => apiClient.put(API_ENDPOINTS.accounts.profile, data),
  changePassword: (data) => apiClient.post(API_ENDPOINTS.accounts.changePassword, data),
  getUsers: () => apiClient.get(API_ENDPOINTS.accounts.users),
  verifyEmail: (token) => apiClient.post(API_ENDPOINTS.accounts.verifyEmail, { token }, { includeAuth: false }),
  resendEmailVerification: () => apiClient.post(API_ENDPOINTS.accounts.resendEmailVerification),
}

// API для отзывов
export const reviewsAPI = {
  getReviews: () => apiClient.get(API_ENDPOINTS.reviews.list, { includeAuth: false }),
  createReview: (data) => apiClient.post(API_ENDPOINTS.reviews.create, data),
  getReviewDetail: (id) => apiClient.get(API_ENDPOINTS.reviews.detail(id)),
}

// Экспортируем основной API клиент
export default apiClient

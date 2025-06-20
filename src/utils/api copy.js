/**
 * Модуль для работы с API ресторана
 * Предоставляет функции для взаимодействия с различными эндпоинтами API
 */

import { apiRequest } from "./auth.js"

/**
 * Получение списка категорий меню
 * @returns {Promise<Array>} Массив категорий меню
 */
async function getMenuCategories() {
  try {
    const response = await apiRequest("/menu/categories.php")
    return response.categories || []
  } catch (error) {
    console.error("Ошибка при получении категорий меню:", error)
    throw error
  }
}

/**
 * Получение списка блюд по категории
 * @param {number} categoryId - ID категории
 * @returns {Promise<Array>} Массив блюд
 */
async function getMenuItems(categoryId = null) {
  try {
    const endpoint = categoryId ? `/menu/items.php?category_id=${categoryId}` : "/menu/items.php"

    const response = await apiRequest(endpoint)
    return response.items || []
  } catch (error) {
    console.error("Ошибка при получении блюд:", error)
    throw error
  }
}

/**
 * Добавление блюда в избранное
 * @param {number} itemId - ID блюда
 * @returns {Promise<Object>} Результат операции
 */
async function addToFavorites(itemId) {
  try {
    return await apiRequest("/favorites/add.php", "POST", { item_id: itemId })
  } catch (error) {
    console.error("Ошибка при добавлении в избранное:", error)
    throw error
  }
}

/**
 * Удаление блюда из избранного
 * @param {number} itemId - ID блюда
 * @returns {Promise<Object>} Результат операции
 */
async function removeFromFavorites(itemId) {
  try {
    return await apiRequest("/favorites/remove.php", "POST", { item_id: itemId })
  } catch (error) {
    console.error("Ошибка при удалении из избранного:", error)
    throw error
  }
}

/**
 * Получение списка избранных блюд
 * @returns {Promise<Array>} Массив избранных блюд
 */
async function getFavorites() {
  try {
    const response = await apiRequest("/favorites/list.php")
    return response.items || []
  } catch (error) {
    console.error("Ошибка при получении избранных блюд:", error)
    throw error
  }
}

/**
 * Получение списка доступных столиков
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {string} time - Время в формате HH:MM
 * @param {number} guests - Количество гостей
 * @returns {Promise<Array>} Массив доступных столиков
 */
async function getAvailableTables(date, time, guests) {
  try {
    const endpoint = `/tables/availability.php?date=${date}&time=${time}&guests=${guests}`
    const response = await apiRequest(endpoint)
    return response.tables || []
  } catch (error) {
    console.error("Ошибка при получении доступных столиков:", error)
    throw error
  }
}

/**
 * Создание бронирования
 * @param {Object} bookingData - Данные бронирования
 * @returns {Promise<Object>} Результат операции
 */
async function createBooking(bookingData) {
  try {
    return await apiRequest("/bookings/create.php", "POST", bookingData)
  } catch (error) {
    console.error("Ошибка при создании бронирования:", error)
    throw error
  }
}

/**
 * Отмена бронирования
 * @param {number} bookingId - ID бронирования
 * @returns {Promise<Object>} Результат операции
 */
async function cancelBooking(bookingId) {
  try {
    return await apiRequest("/bookings/cancel.php", "POST", { booking_id: bookingId })
  } catch (error) {
    console.error("Ошибка при отмене бронирования:", error)
    throw error
  }
}

/**
 * Получение истории бронирований пользователя
 * @returns {Promise<Array>} Массив бронирований
 */
async function getUserBookings() {
  try {
    const response = await apiRequest("/bookings/user.php")
    return response.bookings || []
  } catch (error) {
    console.error("Ошибка при получении истории бронирований:", error)
    throw error
  }
}

/**
 * Добавление отзыва
 * @param {Object} reviewData - Данные отзыва
 * @returns {Promise<Object>} Результат операции
 */
async function addReview(reviewData) {
  try {
    return await apiRequest("/reviews/add.php", "POST", reviewData)
  } catch (error) {
    console.error("Ошибка при добавлении отзыва:", error)
    throw error
  }
}

/**
 * Получение списка отзывов
 * @param {number} limit - Ограничение количества отзывов
 * @returns {Promise<Array>} Массив отзывов
 */
async function getReviews(limit = null) {
  try {
    const endpoint = limit ? `/reviews/list.php?limit=${limit}` : "/reviews/list.php"
    const response = await apiRequest(endpoint)
    return response.reviews || []
  } catch (error) {
    console.error("Ошибка при получении отзывов:", error)
    throw error
  }
}

// Функции для администраторов

/**
 * Получение статистики ресторана (только для администраторов)
 * @returns {Promise<Object>} Статистика ресторана
 */
async function getStatistics() {
  try {
    const response = await apiRequest("/admin/statistics.php")
    return response.statistics || {}
  } catch (error) {
    console.error("Ошибка при получении статистики:", error)
    throw error
  }
}

/**
 * Получение списка последних бронирований (только для администраторов)
 * @param {number} limit - Ограничение количества бронирований
 * @returns {Promise<Array>} Массив бронирований
 */
async function getRecentBookings(limit = 10) {
  try {
    const response = await apiRequest(`/admin/bookings/recent.php?limit=${limit}`)
    return response.bookings || []
  } catch (error) {
    console.error("Ошибка при получении последних бронирований:", error)
    throw error
  }
}

/**
 * Обновление статуса бронирования (только для администраторов)
 * @param {number} bookingId - ID бронирования
 * @param {string} status - Новый статус (confirmed, cancelled, completed)
 * @returns {Promise<Object>} Результат операции
 */
async function updateBookingStatus(bookingId, status) {
  try {
    return await apiRequest("/admin/bookings/update-status.php", "POST", {
      booking_id: bookingId,
      status: status,
    })
  } catch (error) {
    console.error("Ошибка при обновлении статуса бронирования:", error)
    throw error
  }
}

/**
 * Получение списка пользователей (только для администраторов)
 * @returns {Promise<Array>} Массив пользователей
 */
async function getUsers() {
  try {
    const response = await apiRequest("/admin/users/list.php")
    return response.users || []
  } catch (error) {
    console.error("Ошибка при получении списка пользователей:", error)
    throw error
  }
}

/**
 * Обновление роли пользователя (только для администраторов)
 * @param {number} userId - ID пользователя
 * @param {string} role - Новая роль (user, admin)
 * @returns {Promise<Object>} Результат операции
 */
async function updateUserRole(userId, role) {
  try {
    return await apiRequest("/admin/users/update-role.php", "POST", {
      user_id: userId,
      role: role,
    })
  } catch (error) {
    console.error("Ошибка при обновлении роли пользователя:", error)
    throw error
  }
}

/**
 * Обновление статуса отзыва (только для администраторов)
 * @param {number} reviewId - ID отзыва
 * @param {string} status - Новый статус (approved, rejected)
 * @returns {Promise<Object>} Результат операции
 */
async function updateReviewStatus(reviewId, status) {
  try {
    return await apiRequest("/admin/reviews/update-status.php", "POST", {
      review_id: reviewId,
      status: status,
    })
  } catch (error) {
    console.error("Ошибка при обновлении статуса отзыва:", error)
    throw error
  }
}

/**
 * Добавление категории меню (только для администраторов)
 * @param {Object} categoryData - Данные категории
 * @returns {Promise<Object>} Результат операции
 */
async function addMenuCategory(categoryData) {
  try {
    return await apiRequest("/menu/add_category.php", "POST", categoryData)
  } catch (error) {
    console.error("Ошибка при добавлении категории меню:", error)
    throw error
  }
}

/**
 * Обновление категории меню (только для администраторов)
 * @param {Object} categoryData - Данные категории
 * @returns {Promise<Object>} Результат операции
 */
async function updateMenuCategory(categoryData) {
  try {
    return await apiRequest("/menu/update_category.php", "PUT", categoryData)
  } catch (error) {
    console.error("Ошибка при обновлении категории меню:", error)
    throw error
  }
}

/**
 * Удаление категории меню (только для администраторов)
 * @param {number} categoryId - ID категории
 * @returns {Promise<Object>} Результат операции
 */
async function deleteMenuCategory(categoryId) {
  try {
    return await apiRequest("/menu/delete_category.php", "POST", { category_id: categoryId })
  } catch (error) {
    console.error("Ошибка при удалении категории меню:", error)
    throw error
  }
}

/**
 * Добавление блюда в меню (только для администраторов)
 * @param {Object} itemData - Данные блюда
 * @returns {Promise<Object>} Результат операции
 */
async function addMenuItem(itemData) {
  try {
    return await apiRequest("/menu/add_item.php", "POST", itemData)
  } catch (error) {
    console.error("Ошибка при добавлении блюда в меню:", error)
    throw error
  }
}

/**
 * Обновление блюда в меню (только для администраторов)
 * @param {Object} itemData - Данные блюда
 * @returns {Promise<Object>} Результат операции
 */
async function updateMenuItem(itemData) {
  try {
    return await apiRequest("/menu/update_item.php", "PUT", itemData)
  } catch (error) {
    console.error("Ошибка при обновлении блюда в меню:", error)
    throw error
  }
}

/**
 * Удаление блюда из меню (только для администраторов)
 * @param {number} itemId - ID блюда
 * @returns {Promise<Object>} Результат операции
 */
async function deleteMenuItem(itemId) {
  try {
    return await apiRequest("/menu/delete_item.php", "POST", { item_id: itemId })
  } catch (error) {
    console.error("Ошибка при удалении блюда из меню:", error)
    throw error
  }
}

// Экспорт функций
export {
  // Общие функции
  getMenuCategories,
  getMenuItems,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getAvailableTables,
  createBooking,
  cancelBooking,
  getUserBookings,
  addReview,
  getReviews,
  // Функции для администраторов
  getStatistics,
  getRecentBookings,
  updateBookingStatus,
  getUsers,
  updateUserRole,
  updateReviewStatus,
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
}

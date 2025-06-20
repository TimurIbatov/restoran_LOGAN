/**
 * Функции для работы с аутентификацией через API
 */

// API URL
const API_URL = "http://localhost/api"
// Кэш данных пользователя
let userCache = null
let userCacheExpiry = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

/**
 * Проверка авторизации пользователя
 * @returns {Promise<boolean>} Авторизован ли пользователь
 */
async function isAuthenticated() {
  try {
    console.log("Проверка авторизации...")

    // Если данные есть в кэше и они не устарели, используем их
    if (userCache && userCacheExpiry > Date.now()) {
      console.log("Используем кэшированные данные")
      return true
    }

    const response = await fetch(`${API_URL}/users/current.php`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Важно для передачи cookie
    })

    console.log("Ответ сервера:", response.status)

    // Если ответ успешный, пользователь авторизован
    if (response.ok) {
      const data = await response.json()
      console.log("Пользователь авторизован")

      // Сохраняем данные пользователя в кэше
      userCache = data.user
      userCacheExpiry = Date.now() + CACHE_DURATION

      return true
    }

    // Очищаем кэш, если пользователь не авторизован
    userCache = null
    userCacheExpiry = null

    console.log("Пользователь не авторизован")
    return false
  } catch (error) {
    console.error("Ошибка при проверке авторизации:", error)
    return false
  }
}

/**
 * Получение данных текущего пользователя
 * @param {boolean} forceRefresh Принудительно обновить данные
 * @returns {Promise<Object|null>} Данные пользователя или null
 */
async function getCurrentUser(forceRefresh = false) {
  try {
    console.log("Получение данных пользователя...")

    // Если данные есть в кэше и они не устарели, используем их
    if (!forceRefresh && userCache && userCacheExpiry > Date.now()) {
      console.log("Используем кэшированные данные пользователя")
      return userCache
    }

    const response = await fetch(`${API_URL}/users/current.php`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Важно для передачи cookie
    })

    if (!response.ok) {
      console.error("Не удалось получить данные пользователя:", response.status)

      // Очищаем кэш при ошибке
      userCache = null
      userCacheExpiry = null

      return null
    }

    const data = await response.json()
    console.log("Данные пользователя получены:", data)

    // Сохраняем данные пользователя в кэше
    userCache = data.user
    userCacheExpiry = Date.now() + CACHE_DURATION

    return data.user
  } catch (error) {
    console.error("Ошибка при получении данных пользователя:", error)
    return null
  }
}

/**
 * Проверка, является ли пользователь администратором
 * @returns {Promise<boolean>} Является ли пользователь администратором
 */
async function isAdmin() {
  try {
    const user = await getCurrentUser()
    return user && user.role === "admin"
  } catch (error) {
    console.error("Ошибка при проверке прав администратора:", error)
    return false
  }
}

/**
 * Вход пользователя
 * @param {string} email Email пользователя
 * @param {string} password Пароль пользователя
 * @returns {Promise<Object>} Результат входа
 */
async function login(email, password) {
  try {
    console.log("Попытка входа для:", email)
    const response = await fetch(`${API_URL}/auth/login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Важно для передачи cookie
    })

    console.log("Статус ответа:", response.status)
    const data = await response.json()
    console.log("Ответ сервера:", data)

    if (!response.ok) {
      throw new Error(data.message || "Ошибка авторизации")
    }

    // Сохраняем данные пользователя в кэше
    userCache = data.user
    userCacheExpiry = Date.now() + CACHE_DURATION

    return data.user
  } catch (error) {
    console.error("Ошибка при авторизации:", error)
    throw error
  }
}

/**
 * Регистрация пользователя
 * @param {Object} userData Данные пользователя
 * @returns {Promise<Object>} Результат регистрации
 */
async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include", // Важно для передачи cookie
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Ошибка регистрации")
    }

    // Сохраняем данные пользователя в кэше
    userCache = data.user
    userCacheExpiry = Date.now() + CACHE_DURATION

    return data.user
  } catch (error) {
    console.error("Ошибка при регистрации:", error)
    throw error
  }
}

/**
 * Выход пользователя
 * @returns {Promise<void>}
 */
async function logout() {
  try {
    console.log("Выполняется выход из системы")

    // Очищаем кэш
    userCache = null
    userCacheExpiry = null

    // Отправляем запрос на сервер для завершения сессии
    await fetch(`${API_URL}/auth/logout.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Важно для передачи cookie
    })

    console.log("Выход выполнен успешно")
    window.location.href = "index.html"
  } catch (error) {
    console.error("Ошибка при выходе:", error)
    // Даже если запрос не удался, перенаправляем на главную
    window.location.href = "index.html"
  }
}

/**
 * Обновление данных пользователя
 * @param {Object} userData Данные пользователя
 * @returns {Promise<Object>} Результат обновления
 */
async function updateUserProfile(userData) {
  try {
    const response = await fetch(`${API_URL}/users/profile.php`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include", // Важно для передачи cookie
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Ошибка обновления профиля")
    }

    // Обновляем данные пользователя в кэше
    if (data.user) {
      userCache = data.user
      userCacheExpiry = Date.now() + CACHE_DURATION
    } else {
      // Если сервер не вернул обновленные данные, сбрасываем кэш
      userCache = null
      userCacheExpiry = null
    }

    return data
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error)
    throw error
  }
}

/**
 * Изменение пароля пользователя
 * @param {string} currentPassword Текущий пароль
 * @param {string} newPassword Новый пароль
 * @returns {Promise<Object>} Результат изменения
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await fetch(`${API_URL}/users/change-password.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: "include", // Важно для передачи cookie
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Ошибка изменения пароля")
    }

    return data
  } catch (error) {
    console.error("Ошибка при изменении пароля:", error)
    throw error
  }
}

/**
 * Обновление секции пользователя в навигационной панели
 * @returns {Promise<void>}
 */
async function updateUserSection() {
  const userSection = document.getElementById("userSection")
  if (!userSection) return

  try {
    const isUserAuthenticated = await isAuthenticated()
    console.log("Пользователь авторизован:", isUserAuthenticated)

    if (isUserAuthenticated) {
      const user = await getCurrentUser()
      console.log("Данные пользователя:", user)

      let html = `
       <div class="dropdown">
         <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
           <i class="bi bi-person-circle"></i> ${user.name || "Пользователь"}
         </button>
         <ul class="dropdown-menu dropdown-menu-end">
     `

      if (user.role === "admin") {
        html += `<li><a class="dropdown-item" href="admin.html"><i class="bi bi-speedometer2"></i> Админ-панель</a></li>`
      } else {
        html += `<li><a class="dropdown-item" href="personal_cabinet.html"><i class="bi bi-person"></i> Личный кабинет</a></li>`
      }

      html += `
           <li><a class="dropdown-item" href="#" id="navLogoutBtn"><i class="bi bi-box-arrow-right"></i> Выйти</a></li>
         </ul>
       </div>
     `

      userSection.innerHTML = html

      // Добавляем обработчик для кнопки выхода в навигационной панели
      const logoutBtn = document.getElementById("navLogoutBtn")
      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault()
          logout()
        })
      }
    } else {
      userSection.innerHTML = `
       <a href="login.html" class="btn btn-outline-light me-2">
         <i class="bi bi-box-arrow-in-right"></i> Войти
       </a>
       <a href="register.html" class="btn btn-light">
         <i class="bi bi-person-plus"></i> Регистрация
       </a>
     `
    }
  } catch (error) {
    console.error("Ошибка при обновлении секции пользователя:", error)
    // В случае ошибки показываем кнопки входа и регистрации
    userSection.innerHTML = `
     <a href="login.html" class="btn btn-outline-light me-2">
       <i class="bi bi-box-arrow-in-right"></i> Войти
     </a>
     <a href="register.html" class="btn btn-light">
       <i class="bi bi-person-plus"></i> Регистрация
     </a>
   `
  }
}

// Экспорт функций
export {
  isAuthenticated,
  getCurrentUser,
  isAdmin,
  login,
  register,
  logout,
  updateUserProfile,
  changePassword,
  updateUserSection,
}

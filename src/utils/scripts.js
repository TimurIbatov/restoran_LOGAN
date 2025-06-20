// Импортируем функции из auth.js
import { isAuthenticated, getCurrentUser, updateUserSection, isAdmin } from "./auth.js"

// Глобальные переменные
let bootstrap

// Функция для проверки авторизации
async function requireAuth() {
  try {
    console.log("Проверка авторизации...")
    const authenticated = await isAuthenticated()
    console.log("Пользователь авторизован:", authenticated)

    if (!authenticated) {
      showToast("Требуется авторизация", "Для доступа к этой странице необходимо войти в систему")
      setTimeout(() => (window.location.href = "login.html"), 2000)
      return false
    }

    // Если пользователь - администратор и пытается зайти в личный кабинет, перенаправляем на админпанель
    const user = await getCurrentUser()
    if (user && user.role === "admin" && window.location.pathname.includes("personal_cabinet.html")) {
      showToast("Перенаправление", "Администраторы используют панель администратора вместо личного кабинета")
      setTimeout(() => (window.location.href = "admin.html"), 2000)
      return false
    }

    return true
  } catch (error) {
    console.error("Ошибка при проверке авторизации:", error)
    showToast("Ошибка", "Не удалось проверить авторизацию")
    setTimeout(() => (window.location.href = "login.html"), 2000)
    return false
  }
}

// Функция для проверки прав администратора
async function requireAdmin() {
  try {
    console.log("Проверка прав администратора...")
    const authenticated = await isAuthenticated()
    console.log("Пользователь авторизован:", authenticated)

    if (!authenticated) {
      showToast("Требуется авторизация", "Для доступа к этой странице необходимо войти в систему")
      setTimeout(() => (window.location.href = "login.html"), 2000)
      return false
    }

    // Проверяем, является ли пользователь администратором
    const isUserAdmin = await isAdmin()
    console.log("Пользователь администратор:", isUserAdmin)

    if (!isUserAdmin) {
      showToast("Доступ запрещен", "У вас нет прав для доступа к этой странице")
      setTimeout(() => (window.location.href = "index.html"), 2000)
      return false
    }

    return true
  } catch (error) {
    console.error("Ошибка при проверке прав администратора:", error)
    showToast("Ошибка", "Не удалось проверить права доступа")
    setTimeout(() => (window.location.href = "login.html"), 2000)
    return false
  }
}

// Функция для отображения уведомлений
function showToast(title, message, type = "info") {
  const toastElement = document.getElementById("toast")
  if (!toastElement) {
    console.error("Элемент toast не найден")
    return
  }

  const toastTitle = document.getElementById("toastTitle")
  const toastMessage = document.getElementById("toastMessage")

  if (toastTitle) toastTitle.textContent = title
  if (toastMessage) toastMessage.textContent = message

  // Устанавливаем класс в зависимости от типа уведомления
  toastElement.className = "toast"
  if (type === "success") {
    toastElement.classList.add("bg-success", "text-white")
  } else if (type === "error") {
    toastElement.classList.add("bg-danger", "text-white")
  } else if (type === "warning") {
    toastElement.classList.add("bg-warning")
  } else {
    toastElement.classList.add("bg-info", "text-white")
  }

  // Показываем уведомление
  const toast = new bootstrap.Toast(toastElement)
  toast.show()
}

// Функция для выполнения API-запросов
async function apiRequest(endpoint, method = "GET", data = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Важно для передачи cookie
    }

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`/api${endpoint}`, options)

    if (!response.ok) {
      // Если ответ 401, перенаправляем на страницу входа
      if (response.status === 401) {
        showToast("Требуется авторизация", "Для выполнения этого действия необходимо войти в систему")
        setTimeout(() => (window.location.href = "login.html"), 2000)
        throw new Error("Пользователь не авторизован")
      }

      const errorData = await response.json()
      throw new Error(errorData.message || `Ошибка ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Ошибка API-запроса к ${endpoint}:`, error)
    throw error
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Инициализация страницы...")

    // Инициализируем bootstrap
    bootstrap = window.bootstrap

    // Обновляем секцию пользователя в навигационной панели
    await updateUserSection()

    // Если мы на странице личного кабинета, проверяем авторизацию
    if (window.location.pathname.includes("personal_cabinet.html")) {
      await requireAuth()
      // Загружаем данные пользователя
      loadUserProfile()
    }

    // Если мы на странице админ-панели, проверяем права администратора
    if (window.location.pathname.includes("admin.html")) {
      await requireAdmin()
      // Загружаем данные для админ-панели
      loadAdminData()
    }

    // Если мы на странице входа или регистрации и пользователь уже авторизован,
    // перенаправляем на соответствующую страницу
    if (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html")) {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        // Получаем данные пользователя
        const user = await getCurrentUser()

        // Перенаправляем в зависимости от роли
        if (user && user.role === "admin") {
          window.location.href = "admin.html"
        } else {
          window.location.href = "personal_cabinet.html"
        }
      }
    }
  } catch (error) {
    console.error("Ошибка при инициализации страницы:", error)
  }
})

// Загрузка данных профиля пользователя
async function loadUserProfile() {
  try {
    const profileContainer = document.getElementById("userProfileContainer")
    if (!profileContainer) return

    // Получаем данные пользователя
    const user = await getCurrentUser()

    if (!user) {
      showToast("Ошибка", "Не удалось загрузить данные пользователя", "error")
      return
    }

    // Заполняем поля формы профиля
    const nameInput = document.getElementById("userName")
    const emailInput = document.getElementById("userEmail")
    const phoneInput = document.getElementById("userPhone")
    const addressInput = document.getElementById("userAddress")

    if (nameInput) nameInput.value = user.name || ""
    if (emailInput) emailInput.value = user.email || ""
    if (phoneInput) phoneInput.value = user.phone || ""
    if (addressInput) addressInput.value = user.address || ""

    // Загружаем историю бронирований
    loadBookingHistory()
  } catch (error) {
    console.error("Ошибка при загрузке профиля пользователя:", error)
    showToast("Ошибка", "Не удалось загрузить данные профиля", "error")
  }
}

// Загрузка истории бронирований
async function loadBookingHistory() {
  try {
    const bookingHistoryContainer = document.getElementById("bookingHistory")
    if (!bookingHistoryContainer) return

    const bookings = await apiRequest("/bookings/user.php")

    if (bookings.length === 0) {
      bookingHistoryContainer.innerHTML = '<p class="text-muted">У вас пока нет бронирований</p>'
      return
    }

    let html = '<div class="list-group">'

    bookings.forEach((booking) => {
      html += `
       <div class="list-group-item">
         <div class="d-flex w-100 justify-content-between">
           <h5 class="mb-1">Бронирование #${booking.id}</h5>
           <small>${new Date(booking.date).toLocaleDateString()}</small>
         </div>
         <p class="mb-1">Столик: ${booking.table_name}, Время: ${booking.time}</p>
         <p class="mb-1">Количество гостей: ${booking.guests}</p>
         <small class="text-${getStatusClass(booking.status)}">${getStatusText(booking.status)}</small>
       </div>
     `
    })

    html += "</div>"
    bookingHistoryContainer.innerHTML = html
  } catch (error) {
    console.error("Ошибка при загрузке истории бронирований:", error)
    const bookingHistoryContainer = document.getElementById("bookingHistory")
    if (bookingHistoryContainer) {
      bookingHistoryContainer.innerHTML = '<p class="text-danger">Ошибка при загрузке истории бронирований</p>'
    }
  }
}

// Получение класса для статуса бронирования
function getStatusClass(status) {
  switch (status) {
    case "confirmed":
      return "success"
    case "pending":
      return "warning"
    case "cancelled":
      return "danger"
    case "completed":
      return "info"
    default:
      return "secondary"
  }
}

// Получение текста для статуса бронирования
function getStatusText(status) {
  switch (status) {
    case "confirmed":
      return "Подтверждено"
    case "pending":
      return "Ожидает подтверждения"
    case "cancelled":
      return "Отменено"
    case "completed":
      return "Завершено"
    default:
      return "Неизвестный статус"
  }
}

// Загрузка данных для админ-панели
async function loadAdminData() {
  try {
    // Загружаем статистику
    loadAdminStatistics()

    // Загружаем последние бронирования
    loadRecentBookings()

    // Загружаем данные для управления меню
    await loadMenuData()

    // Загружаем данные для управления столиками
    await loadTablesData()
  } catch (error) {
    console.error("Ошибка при загрузке данных для админ-панели:", error)
    showToast("Ошибка", "Не удалось загрузить данные для админ-панели", "error")
  }
}

// Загрузка статистики для админ-панели
async function loadAdminStatistics() {
  try {
    const statsContainer = document.getElementById("adminStatistics")
    if (!statsContainer) return

    const stats = await apiRequest("/admin/statistics.php")

    // Обновляем счетчики
    const bookingsCountElement = document.getElementById("bookingsCount")
    const usersCountElement = document.getElementById("usersCount")
    const tablesCountElement = document.getElementById("tablesCount")
    const menuItemsCountElement = document.getElementById("menuItemsCount")

    if (bookingsCountElement) bookingsCountElement.textContent = stats.bookings_count
    if (usersCountElement) usersCountElement.textContent = stats.users_count
    if (tablesCountElement) tablesCountElement.textContent = stats.tables_count
    if (menuItemsCountElement) menuItemsCountElement.textContent = stats.menu_items_count
  } catch (error) {
    console.error("Ошибка при загрузке статистики:", error)
  }
}

// Загрузка последних бронирований для админ-панели
async function loadRecentBookings() {
  try {
    const recentBookingsContainer = document.getElementById("recentBookings")
    if (!recentBookingsContainer) return

    const bookings = await apiRequest("/admin/bookings/recent.php")

    if (bookings.length === 0) {
      recentBookingsContainer.innerHTML = '<p class="text-muted">Нет бронирований</p>'
      return
    }

    let html = '<div class="table-responsive"><table class="table table-striped">'
    html += `
     <thead>
       <tr>
         <th>#</th>
         <th>Пользователь</th>
         <th>Столик</th>
         <th>Дата</th>
         <th>Время</th>
         <th>Гости</th>
         <th>Статус</th>
         <th>Действия</th>
       </tr>
     </thead>
     <tbody>
   `

    bookings.forEach((booking) => {
      html += `
       <tr>
         <td>${booking.id}</td>
         <td>${booking.user_name}</td>
         <td>${booking.table_name}</td>
         <td>${new Date(booking.date).toLocaleDateString()}</td>
         <td>${booking.time}</td>
         <td>${booking.guests}</td>
         <td><span class="badge bg-${getStatusClass(booking.status)}">${getStatusText(booking.status)}</span></td>
         <td>
           <div class="btn-group btn-group-sm">
             <button class="btn btn-outline-primary" onclick="viewBooking(${booking.id})">
               <i class="bi bi-eye"></i>
             </button>
             <button class="btn btn-outline-success" onclick="confirmBooking(${booking.id})">
               <i class="bi bi-check-lg"></i>
             </button>
             <button class="btn btn-outline-danger" onclick="cancelBooking(${booking.id})">
               <i class="bi bi-x-lg"></i>
             </button>
           </div>
         </td>
       </tr>
     `
    })

    html += "</tbody></table></div>"
    recentBookingsContainer.innerHTML = html
  } catch (error) {
    console.error("Ошибка при загрузке последних бронирований:", error)
    const recentBookingsContainer = document.getElementById("recentBookings")
    if (recentBookingsContainer) {
      recentBookingsContainer.innerHTML = '<p class="text-danger">Ошибка при загрузке бронирований</p>'
    }
  }
}

// Загрузка данных для управления меню
async function loadMenuData() {
  try {
    const menuContainer = document.getElementById("menuManagement")
    if (!menuContainer) return

    const categories = await apiRequest("/menu/categories.php")

    if (categories.length === 0) {
      menuContainer.innerHTML = '<p class="text-muted">Нет категорий меню</p>'
      return
    }

    // Отображаем категории и блюда
    let html = '<div class="accordion" id="menuAccordion">'

    categories.forEach((category, index) => {
      html += `
       <div class="accordion-item">
         <h2 class="accordion-header" id="heading${category.id}">
           <button class="accordion-button ${index > 0 ? "collapsed" : ""}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${category.id}" aria-expanded="${index === 0 ? "true" : "false"}" aria-controls="collapse${category.id}">
             ${category.name}
           </button>
         </h2>
         <div id="collapse${category.id}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" aria-labelledby="heading${category.id}" data-bs-parent="#menuAccordion">
           <div class="accordion-body">
             <div class="d-flex justify-content-between mb-3">
               <h5>${category.name}</h5>
               <button class="btn btn-sm btn-primary" onclick="addMenuItem(${category.id})">
                 <i class="bi bi-plus-lg"></i> Добавить блюдо
               </button>
             </div>
             <div class="table-responsive">
               <table class="table table-striped">
                 <thead>
                   <tr>
                     <th>Название</th>
                     <th>Описание</th>
                     <th>Цена</th>
                     <th>Действия</th>
                   </tr>
                 </thead>
                 <tbody id="menuItems${category.id}">
                   <tr>
                     <td colspan="4" class="text-center">
                       <div class="spinner-border spinner-border-sm" role="status">
                         <span class="visually-hidden">Загрузка...</span>
                       </div>
                       Загрузка блюд...
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       </div>
     `
    })

    html += "</div>"
    menuContainer.innerHTML = html

    // Загружаем блюда для каждой категории
    categories.forEach(async (category) => {
      try {
        const items = await apiRequest(`/menu/items.php?category_id=${category.id}`)
        const menuItemsContainer = document.getElementById(`menuItems${category.id}`)

        if (!menuItemsContainer) return

        if (items.length === 0) {
          menuItemsContainer.innerHTML = '<tr><td colspan="4" class="text-center">Нет блюд в этой категории</td></tr>'
          return
        }

        let itemsHtml = ""
        items.forEach((item) => {
          itemsHtml += `
           <tr>
             <td>${item.name}</td>
             <td>${item.description ? item.description.substring(0, 50) + "..." : ""}</td>
             <td>${item.price} ₽</td>
             <td>
               <div class="btn-group btn-group-sm">
                 <button class="btn btn-outline-primary" onclick="editMenuItem(${item.id})">
                   <i class="bi bi-pencil"></i>
                 </button>
                 <button class="btn btn-outline-danger" onclick="deleteMenuItem(${item.id})">
                   <i class="bi bi-trash"></i>
                 </button>
               </div>
             </td>
           </tr>
         `
        })

        menuItemsContainer.innerHTML = itemsHtml
      } catch (error) {
        console.error(`Ошибка при загрузке блюд для категории ${category.id}:`, error)
        const menuItemsContainer = document.getElementById(`menuItems${category.id}`)
        if (menuItemsContainer) {
          menuItemsContainer.innerHTML = '<tr><td colspan="4" class="text-danger">Ошибка при загрузке блюд</td></tr>'
        }
      }
    })
  } catch (error) {
    console.error("Ошибка при загрузке данных меню:", error)
    const menuContainer = document.getElementById("menuManagement")
    if (menuContainer) {
      menuContainer.innerHTML = '<p class="text-danger">Ошибка при загрузке данных меню</p>'
    }
  }
}

// Загрузка данных для управления столиками
async function loadTablesData() {
  try {
    const tablesContainer = document.getElementById("tablesManagement")
    if (!tablesContainer) return

    const zones = await apiRequest("/zones/list.php")

    if (zones.length === 0) {
      tablesContainer.innerHTML = '<p class="text-muted">Нет зон ресторана</p>'
      return
    }

    // Отображаем зоны и столики
    let html = '<div class="accordion" id="zonesAccordion">'

    zones.forEach((zone, index) => {
      html += `
       <div class="accordion-item">
         <h2 class="accordion-header" id="headingZone${zone.id}">
           <button class="accordion-button ${index > 0 ? "collapsed" : ""}" type="button" data-bs-toggle="collapse" data-bs-target="#collapseZone${zone.id}" aria-expanded="${index === 0 ? "true" : "false"}" aria-controls="collapseZone${zone.id}">
             ${zone.name}
           </button>
         </h2>
         <div id="collapseZone${zone.id}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" aria-labelledby="headingZone${zone.id}" data-bs-parent="#zonesAccordion">
           <div class="accordion-body">
             <div class="d-flex justify-content-between mb-3">
               <h5>${zone.name}</h5>
               <button class="btn btn-sm btn-primary" onclick="addTable(${zone.id})">
                 <i class="bi bi-plus-lg"></i> Добавить столик
               </button>
             </div>
             <div class="table-responsive">
               <table class="table table-striped">
                 <thead>
                   <tr>
                     <th>Название</th>
                     <th>Вместимость</th>
                     <th>Статус</th>
                     <th>Действия</th>
                   </tr>
                 </thead>
                 <tbody id="tables${zone.id}">
                   <tr>
                     <td colspan="4" class="text-center">
                       <div class="spinner-border spinner-border-sm" role="status">
                         <span class="visually-hidden">Загрузка...</span>
                       </div>
                       Загрузка столиков...
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       </div>
     `
    })

    html += "</div>"
    tablesContainer.innerHTML = html

    // Загружаем столики для каждой зоны
    zones.forEach(async (zone) => {
      try {
        const tables = await apiRequest(`/tables/list.php?zone_id=${zone.id}`)
        const tablesContainer = document.getElementById(`tables${zone.id}`)

        if (!tablesContainer) return

        if (tables.length === 0) {
          tablesContainer.innerHTML = '<tr><td colspan="4" class="text-center">Нет столиков в этой зоне</td></tr>'
          return
        }

        let tablesHtml = ""
        tables.forEach((table) => {
          tablesHtml += `
           <tr>
             <td>${table.name}</td>
             <td>${table.capacity} чел.</td>
             <td><span class="badge bg-${table.is_active ? "success" : "danger"}">${table.is_active ? "Активен" : "Неактивен"}</span></td>
             <td>
               <div class="btn-group btn-group-sm">
                 <button class="btn btn-outline-primary" onclick="editTable(${table.id})">
                   <i class="bi bi-pencil"></i>
                 </button>
                 <button class="btn btn-outline-danger" onclick="deleteTable(${table.id})">
                   <i class="bi bi-trash"></i>
                 </button>
               </div>
             </td>
           </tr>
         `
        })

        tablesContainer.innerHTML = tablesHtml
      } catch (error) {
        console.error(`Ошибка при загрузке столиков для зоны ${zone.id}:`, error)
        const tablesContainer = document.getElementById(`tables${zone.id}`)
        if (tablesContainer) {
          tablesContainer.innerHTML = '<tr><td colspan="4" class="text-danger">Ошибка при загрузке столиков</td></tr>'
        }
      }
    })
  } catch (error) {
    console.error("Ошибка при загрузке данных столиков:", error)
    const tablesContainer = document.getElementById("tablesManagement")
    if (tablesContainer) {
      tablesContainer.innerHTML = '<p class="text-danger">Ошибка при загрузке данных столиков</p>'
    }
  }
}

// Добавляем глобальные функции для работы с админкой
window.viewBooking = async (bookingId) => {
  try {
    console.log("Просмотр бронирования:", bookingId)
    const booking = await apiRequest(`/bookings/${bookingId}`)

    // Создаем модальное окно для отображения деталей бронирования
    const modalHTML = `
     <div class="modal fade" id="bookingDetailsModal" tabindex="-1" aria-labelledby="bookingDetailsModalLabel" aria-hidden="true">
       <div class="modal-dialog modal-lg">
         <div class="modal-content">
           <div class="modal-header">
             <h5 class="modal-title" id="bookingDetailsModalLabel">Детали бронирования #${bookingId}</h5>
             <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
           </div>
           <div class="modal-body">
             <div class="row">
               <div class="col-md-6">
                 <p><strong>Пользователь:</strong> ${booking.user_name}</p>
                 <p><strong>Email:</strong> ${booking.user_email}</p>
                 <p><strong>Телефон:</strong> ${booking.user_phone || "Не указан"}</p>
               </div>
               <div class="col-md-6">
                 <p><strong>Дата:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                 <p><strong>Время:</strong> ${booking.time}</p>
                 <p><strong>Гости:</strong> ${booking.guests}</p>
                 <p><strong>Статус:</strong> <span class="badge bg-${getStatusClass(booking.status)}">${getStatusText(booking.status)}</span></p>
               </div>
             </div>
             <hr>
             <h6>Комментарий:</h6>
             <p>${booking.comment || "Нет комментария"}</p>
           </div>
           <div class="modal-footer">
             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
             ${booking.status === "pending" ? `<button type="button" class="btn btn-success" onclick="confirmBooking(${bookingId})">Подтвердить</button>` : ""}
             ${booking.status !== "cancelled" ? `<button type="button" class="btn btn-danger" onclick="cancelBooking(${bookingId})">Отменить</button>` : ""}
           </div>
         </div>
       </div>
     </div>
   `

    // Добавляем модальное окно на страницу
    document.body.insertAdjacentHTML("beforeend", modalHTML)

    // Открываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById("bookingDetailsModal"))
    modal.show()

    // Удаляем модальное окно после закрытия
    document.getElementById("bookingDetailsModal").addEventListener("hidden.bs.modal", function () {
      this.remove()
    })
  } catch (error) {
    console.error("Ошибка при загрузке деталей бронирования:", error)
    showToast("Ошибка", "Не удалось загрузить детали бронирования", "error")
  }
}

window.confirmBooking = async (bookingId) => {
  try {
    console.log("Подтверждение бронирования:", bookingId)
    if (confirm("Вы уверены, что хотите подтвердить это бронирование?")) {
      const response = await apiRequest(`/admin/bookings/update-status.php`, "POST", {
        booking_id: bookingId,
        status: "confirmed",
      })

      showToast("Успех", "Бронирование успешно подтверждено", "success")

      // Закрываем модальное окно, если оно открыто
      const modal = bootstrap.Modal.getInstance(document.getElementById("bookingDetailsModal"))
      if (modal) {
        modal.hide()
      }

      // Обновляем список бронирований
      loadRecentBookings()
    }
  } catch (error) {
    console.error("Ошибка при подтверждении бронирования:", error)
    showToast("Ошибка", "Не удалось подтвердить бронирование", "error")
  }
}

window.cancelBooking = async (bookingId) => {
  try {
    console.log("Отмена бронирования:", bookingId)
    if (confirm("Вы уверены, что хотите отменить это бронирование?")) {
      const response = await apiRequest(`/admin/bookings/update-status.php`, "POST", {
        booking_id: bookingId,
        status: "cancelled",
      })

      showToast("Успех", "Бронирование успешно отменено", "success")

      // Закрываем модальное окно, если оно открыто
      const modal = bootstrap.Modal.getInstance(document.getElementById("bookingDetailsModal"))
      if (modal) {
        modal.hide()
      }

      // Обновляем список бронирований
      loadRecentBookings()
    }
  } catch (error) {
    console.error("Ошибка при отмене бронирования:", error)
    showToast("Ошибка", "Не удалось отменить бронирование", "error")
  }
}

// Экспорт функций
export { requireAuth,
        requireAdmin,
        showToast,
        apiRequest,
        loadUserProfile,
        loadBookingHistory,
        loadAdminData,
        updateUserSection,
        getCurrentUser
}

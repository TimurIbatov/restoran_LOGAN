"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useNavigate } from "react-router-dom"
import { restaurantAPI, bookingAPI, accountAPI } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalTables: 0,
    availableTables: 0,
    totalUsers: 0,
    revenue: 0,
  })
  const [bookings, setBookings] = useState([])
  const [tables, setTables] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [users, setUsers] = useState([])
  const [zones, setZones] = useState([])
  const [categories, setCategories] = useState([])

  // Модальные окна
  const [showTableModal, setShowTableModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [editingMenuItem, setEditingMenuItem] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin_user) {
      showToast("Доступ запрещен", "Только администраторы могут просматривать эту страницу", "error")
      navigate("/")
      return
    }

    loadDashboardData()
  }, [isAuthenticated, user, navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [bookingsData, tablesData, menuData, usersData, zonesData, categoriesData] = await Promise.all([
        bookingAPI.getAllBookings().catch(() => []),
        restaurantAPI.getTables().catch(() => []),
        restaurantAPI.getMenuItems().catch(() => []),
        accountAPI.getUsers().catch(() => []),
        restaurantAPI.getZones().catch(() => []),
        restaurantAPI.getMenuCategories().catch(() => []),
      ])

      // Убеждаемся, что все данные являются массивами
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : []
      const tablesArray = Array.isArray(tablesData) ? tablesData : []
      const usersArray = Array.isArray(usersData) ? usersData : []
      const menuArray = Array.isArray(menuData) ? menuData : []
      const zonesArray = Array.isArray(zonesData) ? zonesData : []
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []

      setBookings(bookingsArray)
      setTables(tablesArray)
      setUsers(usersArray)
      setMenuItems(menuArray)
      setZones(zonesArray)
      setCategories(categoriesArray)

      // Вычисляем статистику
      const today = new Date().toDateString()
      const todayBookingsCount = bookingsArray.filter(
        (booking) => new Date(booking.start_time).toDateString() === today,
      ).length

      const availableTablesCount = tablesArray.filter((table) => table.current_status === "available").length

      setStats({
        totalBookings: bookingsArray.length,
        todayBookings: todayBookingsCount,
        totalTables: tablesArray.length,
        availableTables: availableTablesCount,
        totalUsers: usersArray.length,
        revenue: bookingsArray.reduce((sum, booking) => sum + (booking.total_amount || 0), 0),
      })
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
      showToast("Ошибка", "Не удалось загрузить данные панели", "error")
      setBookings([])
      setTables([])
      setUsers([])
      setMenuItems([])
      setZones([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async (bookingId) => {
    try {
      await bookingAPI.confirmBooking(bookingId)
      showToast("Успешно", "Бронирование подтверждено", "success")
      loadDashboardData()
    } catch (error) {
      showToast("Ошибка", "Не удалось подтвердить бронирование", "error")
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingAPI.cancelBooking(bookingId, "Отменено администратором")
      showToast("Успешно", "Бронирование отменено", "success")
      loadDashboardData()
    } catch (error) {
      showToast("Ошибка", "Не удалось отменить бронирование", "error")
    }
  }

  const handleSaveTable = async (tableData) => {
    try {
      console.log("Saving table with ID:", editingTable?.id, "Data:", Object.fromEntries(tableData)) // Для отладки
      if (!tableData.has("name") || !tableData.has("capacity") || !tableData.has("zone")) {
        throw new Error("Необходимо заполнить обязательные поля: название, вместимость и зона")
      }
      if (editingTable) {
        await restaurantAPI.updateTable(editingTable.id, tableData)
        showToast("Успешно", "Столик обновлен", "success")
      } else {
        await restaurantAPI.createTable(tableData)
        showToast("Успешно", "Столик добавлен", "success")
      }
      setShowTableModal(false)
      setEditingTable(null)
      loadDashboardData()
    } catch (error) {
      console.error("Ошибка сохранения столика:", error)
      if (error.message === "Ресурс не найден") {
        showToast("Ошибка", `Столик с ID ${editingTable?.id} не найден. Проверьте данные или создайте новый столик.`, "error")
      } else {
        showToast("Ошибка", error.message || "Не удалось сохранить столик", "error")
      }
    }
  }

  const handleDeleteTable = async (tableId) => {
    if (window.confirm("Вы уверены, что хотите удалить этот столик?")) {
      try {
        await restaurantAPI.deleteTable(tableId)
        showToast("Успешно", "Столик удален", "success")
        loadDashboardData()
      } catch (error) {
        console.error("Ошибка удаления столика:", error)
        showToast("Ошибка", error.message || "Не удалось удалить столик", "error")
      }
    }
  }

  const handleSaveMenuItem = async (menuData) => {
    try {
      if (editingMenuItem) {
        await restaurantAPI.updateMenuItem(editingMenuItem.id, menuData)
        showToast("Успешно", "Блюдо обновлено", "success")
      } else {
        await restaurantAPI.createMenuItem(menuData)
        showToast("Успешно", "Блюдо добавлено", "success")
      }
      setShowMenuModal(false)
      setEditingMenuItem(null)
      loadDashboardData()
    } catch (error) {
      console.error("Ошибка сохранения блюда:", error)
      showToast("Ошибка", error.message || "Не удалось сохранить блюдо", "error")
    }
  }

  const handleDeleteMenuItem = async (itemId) => {
    if (window.confirm("Вы уверены, что хотите удалить это блюдо?")) {
      try {
        await restaurantAPI.deleteMenuItem(itemId)
        showToast("Успешно", "Блюдо удалено", "success")
        loadDashboardData()
      } catch (error) {
        console.error("Ошибка удаления блюда:", error)
        showToast("Ошибка", error.message || "Не удалось удалить блюдо", "error")
      }
    }
  }

  if (!isAuthenticated || !user?.is_admin_user) {
    return null
  }

  return (
    <div>
      <section className="bg-danger text-white py-4">
        <div className="container">
          <h1 className="h3 mb-0">
            <i className="bi bi-gear me-2"></i>
            Панель администратора
          </h1>
        </div>
      </section>

      <div className="container-fluid my-4">
        {loading ? (
          <LoadingSpinner message="Загрузка панели администратора..." />
        ) : (
          <>
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <i className="bi bi-graph-up me-1"></i>
                  Обзор
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "bookings" ? "active" : ""}`}
                  onClick={() => setActiveTab("bookings")}
                >
                  <i className="bi bi-calendar-check me-1"></i>
                  Бронирования
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "tables" ? "active" : ""}`}
                  onClick={() => setActiveTab("tables")}
                >
                  <i className="bi bi-table me-1"></i>
                  Столики
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "menu" ? "active" : ""}`}
                  onClick={() => setActiveTab("menu")}
                >
                  <i className="bi bi-journal-text me-1"></i>
                  Меню
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                  onClick={() => setActiveTab("users")}
                >
                  <i className="bi bi-people me-1"></i>
                  Пользователи
                </button>
              </li>
            </ul>

            {activeTab === "overview" && (
              <div>
                <div className="row mb-4">
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-primary text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Всего бронирований</h6>
                            <h2 className="mb-0">{stats.totalBookings}</h2>
                          </div>
                          <i className="bi bi-calendar-check display-6"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-success text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Сегодня</h6>
                            <h2 className="mb-0">{stats.todayBookings}</h2>
                          </div>
                          <i className="bi bi-calendar-day display-6"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-info text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Свободные столики</h6>
                            <h2 className="mb-0">
                              {stats.availableTables}/{stats.totalTables}
                            </h2>
                          </div>
                          <i className="bi bi-table display-6"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-warning text-dark">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Пользователи</h6>
                            <h2 className="mb-0">{stats.totalUsers}</h2>
                          </div>
                          <i className="bi bi-people display-6"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Последние бронирования</h5>
                  </div>
                  <div className="card-body">
                    {bookings.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Клиент</th>
                              <th>Столик</th>
                              <th>Дата/Время</th>
                              <th>Статус</th>
                              <th>Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.slice(0, 5).map((booking) => (
                              <tr key={booking.id}>
                                <td>#{booking.id}</td>
                                <td>{booking.user_name || booking.contact_name}</td>
                                <td>{booking.table_details?.name}</td>
                                <td>{new Date(booking.start_time).toLocaleString("ru-RU")}</td>
                                <td>
                                  <span
                                    className={`badge bg-${booking.status === "confirmed" ? "success" : booking.status === "pending" ? "warning" : "secondary"}`}
                                  >
                                    {booking.status}
                                  </span>
                                </td>
                                <td>
                                  {booking.status === "pending" && (
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        className="btn btn-success"
                                        onClick={() => handleConfirmBooking(booking.id)}
                                      >
                                        Подтвердить
                                      </button>
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => handleCancelBooking(booking.id)}
                                      >
                                        Отменить
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">Нет бронирований</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Управление бронированиями</h5>
                </div>
                <div className="card-body">
                  {bookings.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Клиент</th>
                            <th>Столик</th>
                            <th>Дата/Время</th>
                            <th>Гости</th>
                            <th>Статус</th>
                            <th>Сумма</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <tr key={booking.id}>
                              <td>#{booking.id}</td>
                              <td>
                                <div>
                                  <strong>{booking.user_name || booking.contact_name}</strong>
                                  <br />
                                  <small className="text-muted">{booking.contact_phone}</small>
                                </div>
                              </td>
                              <td>{booking.table_details?.name}</td>
                              <td>
                                {new Date(booking.start_time).toLocaleDateString("ru-RU")}
                                <br />
                                <small>
                                  {new Date(booking.start_time).toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              </td>
                              <td>{booking.guests_count}</td>
                              <td>
                                <span
                                  className={`badge bg-${booking.status === "confirmed" ? "success" : booking.status === "pending" ? "warning" : "secondary"}`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                              <td>{booking.total_amount?.toLocaleString() || 0} сум</td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  {booking.status === "pending" && (
                                    <>
                                      <button
                                        className="btn btn-success"
                                        onClick={() => handleConfirmBooking(booking.id)}
                                      >
                                        <i className="bi bi-check"></i>
                                      </button>
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => handleCancelBooking(booking.id)}
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">Нет бронирований</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tables" && (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Управление столиками</h5>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingTable(null)
                      setShowTableModal(true)
                    }}
                  >
                    <i className="bi bi-plus me-1"></i>
                    Добавить столик
                  </button>
                </div>
                <div className="card-body">
                  <div className="row">
                    {tables.map((table) => (
                      <div key={table.id} className="col-lg-4 col-md-6 mb-3">
                        <div className="card">
                          {table.image && (
                            <img
                              src={table.image || "/placeholder.svg"}
                              className="card-img-top"
                              alt={table.name}
                              style={{ height: "200px", objectFit: "cover" }}
                            />
                          )}
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title">{table.name}</h6>
                              <span
                                className={`badge bg-${table.current_status === "available" ? "success" : "warning"}`}
                              >
                                {table.current_status}
                              </span>
                            </div>
                            <p className="card-text small">
                              <i className="bi bi-people me-1"></i>
                              {table.capacity} мест | {table.zone_name}
                            </p>
                            {table.price_per_hour > 0 && (
                              <p className="card-text small text-success">
                                {table.price_per_hour.toLocaleString()} сум/час
                              </p>
                            )}
                            {table.position_x && table.position_y && (
                              <p className="card-text small text-info">
                                Позиция: ({table.position_x}, {table.position_y})
                              </p>
                            )}
                            <div className="btn-group btn-group-sm w-100">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  console.log("Setting editingTable:", table)
                                  setEditingTable(table)
                                  setShowTableModal(true)
                                }}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteTable(table.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "menu" && (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Управление меню</h5>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingMenuItem(null)
                      setShowMenuModal(true)
                    }}
                  >
                    <i className="bi bi-plus me-1"></i>
                    Добавить блюдо
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Изображение</th>
                          <th>Название</th>
                          <th>Категория</th>
                          <th>Цена</th>
                          <th>Статус</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {item.image ? (
                                <img
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                  className="rounded"
                                />
                              ) : (
                                <div
                                  className="bg-light rounded d-flex align-items-center justify-content-center"
                                  style={{ width: "50px", height: "50px" }}
                                >
                                  <i className="bi bi-image text-muted"></i>
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{item.name}</strong>
                              <br />
                              <small className="text-muted">{item.description}</small>
                            </td>
                            <td>{item.category_name}</td>
                            <td>{item.price.toLocaleString()} сум</td>
                            <td>
                              <span className={`badge bg-${item.is_available ? "success" : "danger"}`}>
                                {item.is_available ? "Доступно" : "Недоступно"}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => {
                                    setEditingMenuItem(item)
                                    setShowMenuModal(true)
                                  }}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Пользователи системы</h5>
                </div>
                <div className="card-body">
                  {users.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Телефон</th>
                            <th>Роль</th>
                            <th>Дата регистрации</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>#{user.id}</td>
                              <td>{user.full_name || `${user.first_name} ${user.last_name}`}</td>
                              <td>{user.email}</td>
                              <td>{user.phone || "-"}</td>
                              <td>
                                {user.is_admin_user && <span className="badge bg-danger me-1">Админ</span>}
                                {user.is_staff_user && <span className="badge bg-warning me-1">Сотрудник</span>}
                                {!user.is_admin_user && !user.is_staff_user && (
                                  <span className="badge bg-secondary">Клиент</span>
                                )}
                              </td>
                              <td>{new Date(user.date_joined).toLocaleDateString("ru-RU")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">Нет пользователей</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showTableModal && (
        <TableModal
          table={editingTable}
          zones={zones}
          onSave={handleSaveTable}
          onClose={() => {
            setShowTableModal(false)
            setEditingTable(null)
          }}
        />
      )}

      {showMenuModal && (
        <MenuItemModal
          menuItem={editingMenuItem}
          categories={categories}
          onSave={handleSaveMenuItem}
          onClose={() => {
            setShowMenuModal(false)
            setEditingMenuItem(null)
          }}
        />
      )}
    </div>
  )
}

const TableModal = ({ table, zones, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: table?.name || "",
    capacity: table?.capacity || 2,
    zone: table?.zone || (zones.length > 0 ? zones[0].id : ""),
    price_per_hour: table?.price_per_hour || 0,
    deposit: table?.deposit || 0,
    is_vip: table?.is_vip || false,
    position_x: table?.position_x || 0,
    position_y: table?.position_y || 0,
    description: table?.description || "",
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(table?.image || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const submitData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      // Пропускаем undefined или null, конвертируем boolean в строку
      if (value !== undefined && value !== null) {
        submitData.append(key, typeof value === "boolean" ? value.toString() : value)
      }
    })

    if (imageFile) {
      submitData.append("image", imageFile)
    }

    console.log("FormData contents:", Object.fromEntries(submitData)) // Для отладки

    try {
      await onSave(submitData)
    } catch (error) {
      console.error("Ошибка в TableModal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content text-dark">
          <div className="modal-header">
            <h5 className="modal-title">{table ? "Редактировать столик" : "Добавить столик"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Название</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Вместимость</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) || 2 })}
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Зона</label>
                    <select
                      className="form-select"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      required
                    >
                      {zones.length > 0 ? (
                        zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          Нет доступных зон
                        </option>
                      )}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Описание</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Изображение</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px", maxHeight: "150px" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Цена за час (сум)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price_per_hour}
                      onChange={(e) => setFormData({ ...formData, price_per_hour: Number.parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Депозит (сум)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: Number.parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Позиция X (пиксели)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.position_x}
                      onChange={(e) => setFormData({ ...formData, position_x: Number.parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Позиция Y (пиксели)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.position_y}
                      onChange={(e) => setFormData({ ...formData, position_y: Number.parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.is_vip}
                    onChange={(e) => setFormData({ ...formData, is_vip: e.target.checked })}
                  />
                  <label className="form-check-label">VIP столик</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const MenuItemModal = ({ menuItem, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: menuItem?.name || "",
    description: menuItem?.description || "",
    price: menuItem?.price || 0,
    category: menuItem?.category || (categories.length > 0 ? categories[0].id : ""),
    is_available: menuItem?.is_available ?? true,
    weight: menuItem?.weight || "",
    calories: menuItem?.calories || "",
    cooking_time: menuItem?.cooking_time || 15,
    ingredients: menuItem?.ingredients || "",
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(menuItem?.image || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const submitData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        submitData.append(key, typeof value === "boolean" ? value.toString() : value)
      }
    })

    if (imageFile) {
      submitData.append("image", imageFile)
    }

    try {
      await onSave(submitData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content text-dark">
          <div className="modal-header">
            <h5 className="modal-title">{menuItem ? "Редактировать блюдо" : "Добавить блюдо"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Название</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Описание</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Состав</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Цена (сум)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Изображение</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px", maxHeight: "150px" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Категория</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Вес (г)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Калории</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.calories}
                          onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Время приготовления (мин)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.cooking_time}
                      onChange={(e) => setFormData({ ...formData, cooking_time: Number.parseInt(e.target.value) || 15 })}
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  />
                  <label className="form-check-label">Доступно для заказа</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
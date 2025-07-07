"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { bookingAPI, restaurantAPI } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"

const StaffDashboard = () => {
  const [bookings, setBookings] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("today")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff_user) {
      showToast("Доступ запрещен", "У вас нет прав сотрудника", "error")
      navigate("/")
      return
    }

    loadData()
  }, [isAuthenticated, user, navigate, selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [bookingsData, tablesData] = await Promise.all([
        bookingAPI.getUserBookings().catch(() => []),
        restaurantAPI.getTables().catch(() => []),
      ])

      // Убеждаемся, что данные являются массивами
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : []
      const tablesArray = Array.isArray(tablesData) ? tablesData : []

      setBookings(bookingsArray)
      setTables(tablesArray)
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
      showToast("Ошибка", "Не удалось загрузить данные", "error")

      // Устанавливаем пустые массивы по умолчанию
      setBookings([])
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const confirmBooking = async (bookingId) => {
    try {
      await bookingAPI.confirmBooking(bookingId)
      showToast("Успешно", "Бронирование подтверждено", "success")
      loadData()
    } catch (error) {
      showToast("Ошибка", "Не удалось подтвердить бронирование", "error")
    }
  }

  const cancelBooking = async (bookingId) => {
    const reason = prompt("Укажите причину отмены:")
    if (reason !== null) {
      try {
        await bookingAPI.cancelBooking(bookingId, reason || "Отменено сотрудником")
        showToast("Успешно", "Бронирование отменено", "success")
        loadData()
      } catch (error) {
        showToast("Ошибка", "Не удалось отменить бронирование", "error")
      }
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "success"
      case "pending":
        return "warning"
      case "cancelled":
        return "danger"
      case "completed":
        return "info"
      case "active":
        return "primary"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Подтверждено"
      case "pending":
        return "Ожидает подтверждения"
      case "cancelled":
        return "Отменено"
      case "completed":
        return "Завершено"
      case "active":
        return "Активно"
      default:
        return status
    }
  }

  const getTodayBookings = () => {
    const today = new Date().toISOString().split("T")[0]
    return bookings.filter((booking) => booking.start_time.split("T")[0] === today)
  }

  const getSelectedDateBookings = () => {
    return bookings.filter((booking) => booking.start_time.split("T")[0] === selectedDate)
  }

  const getPendingBookings = () => {
    return bookings.filter((booking) => booking.status === "pending")
  }

  const getTableStatus = (tableId) => {
    const now = new Date()
    const activeBooking = bookings.find(
      (booking) =>
        booking.table_details?.id === tableId &&
        booking.status === "active" &&
        new Date(booking.start_time) <= now &&
        new Date(booking.end_time) >= now,
    )

    if (activeBooking) return "occupied"

    const reservedBooking = bookings.find(
      (booking) =>
        booking.table_details?.id === tableId && booking.status === "confirmed" && new Date(booking.start_time) > now,
    )

    if (reservedBooking) return "reserved"

    return "available"
  }

  if (!isAuthenticated || !user?.is_staff_user) {
    return null
  }

  return (
    <div>
      <section className="bg-success text-white py-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="display-5 mb-2">
                <i className="bi bi-person-badge me-2"></i>
                Панель сотрудника
              </h1>
              <p className="lead mb-0">Добро пожаловать, {user?.full_name || user?.email}</p>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="text-white">
                <i className="bi bi-clock me-1"></i>
                {new Date().toLocaleString("ru-RU")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container my-5">
        {loading ? (
          <LoadingSpinner message="Загрузка панели сотрудника..." />
        ) : (
          <>
            {/* Быстрая статистика */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h3>{getTodayBookings().length}</h3>
                    <p className="mb-0">Бронирований сегодня</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h3>{getPendingBookings().length}</h3>
                    <p className="mb-0">Ожидают подтверждения</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h3>{tables.filter((t) => getTableStatus(t.id) === "available").length}</h3>
                    <p className="mb-0">Свободных столиков</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-danger text-white">
                  <div className="card-body text-center">
                    <h3>{tables.filter((t) => getTableStatus(t.id) === "occupied").length}</h3>
                    <p className="mb-0">Занятых столиков</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Вкладки */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "today" ? "active" : ""}`}
                  onClick={() => setActiveTab("today")}
                >
                  <i className="bi bi-calendar-day me-1"></i>
                  Сегодня
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  <i className="bi bi-clock me-1"></i>
                  Ожидают подтверждения
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "tables" ? "active" : ""}`}
                  onClick={() => setActiveTab("tables")}
                >
                  <i className="bi bi-table me-1"></i>
                  Статус столиков
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "schedule" ? "active" : ""}`}
                  onClick={() => setActiveTab("schedule")}
                >
                  <i className="bi bi-calendar-week me-1"></i>
                  Расписание
                </button>
              </li>
            </ul>

            {/* Содержимое вкладок */}
            {activeTab === "today" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-day me-2"></i>
                    Бронирования на сегодня ({new Date().toLocaleDateString("ru-RU")})
                  </h5>
                </div>
                <div className="card-body">
                  {getTodayBookings().length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-calendar-x display-4 mb-3"></i>
                      <p>На сегодня нет бронирований</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Время</th>
                            <th>Столик</th>
                            <th>Гость</th>
                            <th>Количество</th>
                            <th>Статус</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTodayBookings()
                            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                            .map((booking) => (
                              <tr key={booking.id}>
                                <td>
                                  <strong>
                                    {new Date(booking.start_time).toLocaleTimeString("ru-RU", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -
                                    {new Date(booking.end_time).toLocaleTimeString("ru-RU", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </strong>
                                </td>
                                <td>{booking.table_details?.name}</td>
                                <td>
                                  <div>
                                    <strong>{booking.user_name}</strong>
                                    <br />
                                    <small className="text-muted">{booking.contact_phone}</small>
                                  </div>
                                </td>
                                <td>{booking.guests_count} чел.</td>
                                <td>
                                  <span className={`badge bg-${getStatusClass(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                  </span>
                                </td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    {booking.status === "pending" && (
                                      <button
                                        className="btn btn-success"
                                        onClick={() => confirmBooking(booking.id)}
                                        title="Подтвердить"
                                      >
                                        <i className="bi bi-check"></i>
                                      </button>
                                    )}
                                    {booking.can_be_cancelled && (
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => cancelBooking(booking.id)}
                                        title="Отменить"
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "pending" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-clock me-2"></i>
                    Бронирования, ожидающие подтверждения
                  </h5>
                </div>
                <div className="card-body">
                  {getPendingBookings().length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-check-circle display-4 mb-3"></i>
                      <p>Все бронирования обработаны</p>
                    </div>
                  ) : (
                    <div className="row">
                      {getPendingBookings().map((booking) => (
                        <div key={booking.id} className="col-md-6 mb-3">
                          <div className="card border-warning">
                            <div className="card-header bg-warning text-dark">
                              <h6 className="mb-0">
                                <i className="bi bi-clock me-1"></i>
                                Бронирование #{booking.id}
                              </h6>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-6">
                                  <strong>Дата:</strong>
                                  <br />
                                  {new Date(booking.start_time).toLocaleDateString("ru-RU")}
                                </div>
                                <div className="col-6">
                                  <strong>Время:</strong>
                                  <br />
                                  {new Date(booking.start_time).toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -
                                  {new Date(booking.end_time).toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                              <hr />
                              <div className="row">
                                <div className="col-6">
                                  <strong>Столик:</strong>
                                  <br />
                                  {booking.table_details?.name}
                                </div>
                                <div className="col-6">
                                  <strong>Гостей:</strong>
                                  <br />
                                  {booking.guests_count} человек
                                </div>
                              </div>
                              <hr />
                              <div>
                                <strong>Гость:</strong>
                                <br />
                                {booking.user_name}
                                <br />
                                <small className="text-muted">
                                  {booking.contact_phone} | {booking.contact_email}
                                </small>
                              </div>
                              {booking.comment && (
                                <>
                                  <hr />
                                  <div>
                                    <strong>Комментарий:</strong>
                                    <br />
                                    <em>{booking.comment}</em>
                                  </div>
                                </>
                              )}
                              <hr />
                              <div className="d-grid gap-2 d-md-flex">
                                <button
                                  className="btn btn-success flex-fill"
                                  onClick={() => confirmBooking(booking.id)}
                                >
                                  <i className="bi bi-check me-1"></i>
                                  Подтвердить
                                </button>
                                <button className="btn btn-danger flex-fill" onClick={() => cancelBooking(booking.id)}>
                                  <i className="bi bi-x me-1"></i>
                                  Отклонить
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tables" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-table me-2"></i>
                    Текущий статус столиков
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {tables.map((table) => {
                      const status = getTableStatus(table.id)
                      return (
                        <div key={table.id} className="col-md-4 col-lg-3 mb-3">
                          <div
                            className={`card ${status === "available" ? "border-success" : status === "occupied" ? "border-danger" : "border-warning"}`}
                          >
                            <div className="card-body text-center">
                              <h5 className="card-title">{table.name}</h5>
                              <p className="card-text">
                                <i className="bi bi-people me-1"></i>
                                {table.capacity} мест
                              </p>
                              <span
                                className={`badge bg-${status === "available" ? "success" : status === "occupied" ? "danger" : "warning"}`}
                              >
                                {status === "available" ? "Свободен" : status === "occupied" ? "Занят" : "Забронирован"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-week me-2"></i>
                    Расписание бронирований
                  </h5>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: "auto" }}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="card-body">
                  {getSelectedDateBookings().length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-calendar-x display-4 mb-3"></i>
                      <p>На выбранную дату нет бронирований</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Время</th>
                            <th>Столик</th>
                            <th>Гость</th>
                            <th>Количество</th>
                            <th>Статус</th>
                            <th>Контакты</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSelectedDateBookings()
                            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                            .map((booking) => (
                              <tr key={booking.id}>
                                <td>
                                  <strong>
                                    {new Date(booking.start_time).toLocaleTimeString("ru-RU", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -
                                    {new Date(booking.end_time).toLocaleTimeString("ru-RU", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </strong>
                                </td>
                                <td>{booking.table_details?.name}</td>
                                <td>{booking.user_name}</td>
                                <td>{booking.guests_count} чел.</td>
                                <td>
                                  <span className={`badge bg-${getStatusClass(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                  </span>
                                </td>
                                <td>
                                  <small>
                                    {booking.contact_phone}
                                    <br />
                                    {booking.contact_email}
                                  </small>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard

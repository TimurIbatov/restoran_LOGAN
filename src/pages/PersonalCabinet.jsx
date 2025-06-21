import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { bookingAPI, accountAPI } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const PersonalCabinet = () => {
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const { user, isAuthenticated, updateProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Доступ ограничен', 'Необходимо войти в систему', 'warning')
      navigate('/login')
      return
    }

    loadUserData()
    loadBookingHistory()
  }, [isAuthenticated, user, navigate])

  const loadUserData = async () => {
    try {
      const userData = await accountAPI.getProfile()
      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      })
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
    }
  }

  const loadBookingHistory = async () => {
    try {
      setLoading(true)
      const data = await bookingAPI.getUserBookings()
      setBookings(data || [])
    } catch (error) {
      console.error('Ошибка загрузки бронирований:', error)
      showToast('Ошибка', 'Не удалось загрузить историю бронирований', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileLoading(true)

    try {
      await accountAPI.updateProfile(profileData)
      showToast('Успешно', 'Профиль успешно обновлен', 'success')
      loadUserData()
    } catch (error) {
      showToast('Ошибка', error.message || 'Не удалось обновить профиль', 'error')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('Ошибка', 'Пароли не совпадают', 'error')
      return
    }

    setPasswordLoading(true)

    try {
      await accountAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      
      showToast('Успешно', 'Пароль успешно изменен', 'success')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      showToast('Ошибка', error.message || 'Не удалось изменить пароль', 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'danger'
      case 'completed':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Подтверждено'
      case 'pending':
        return 'Ожидает подтверждения'
      case 'cancelled':
        return 'Отменено'
      case 'completed':
        return 'Завершено'
      default:
        return 'Неизвестный статус'
    }
  }

  const cancelBooking = async (bookingId) => {
    if (window.confirm('Вы уверены, что хотите отменить бронирование?')) {
      try {
        await bookingAPI.cancelBooking(bookingId, 'Отменено пользователем')
        showToast('Успешно', 'Бронирование успешно отменено', 'success')
        loadBookingHistory()
      } catch (error) {
        showToast('Ошибка', error.message || 'Не удалось отменить бронирование', 'error')
      }
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <section className="page-header login-header">
        <div className="container">
          <h1 className="display-4">Личный кабинет</h1>
          <p className="lead">Управление профилем и история бронирований</p>
        </div>
      </section>

      <main className="container my-5">
        <div className="row">
          {/* Левая колонка - Профиль */}
          <div className="col-lg-4 mb-4">
            <div className="profile-section">
              <h3 className="mb-3">Мой профиль</h3>
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label htmlFor="first_name" className="form-label">Имя</label>
                  <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="last_name" className="form-label">Фамилия</label>
                  <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Телефон</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">Адрес</label>
                  <textarea
                    className="form-control"
                    id="address"
                    name="address"
                    rows="2"
                    value={profileData.address}
                    onChange={handleProfileChange}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileLoading}
                >
                  {profileLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить изменения'
                  )}
                </button>
              </form>
            </div>

            <div className="profile-section">
              <h3 className="mb-3">Изменить пароль</h3>
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label htmlFor="current_password" className="form-label">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="new_password" className="form-label">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirm_password" className="form-label">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Изменение...
                    </>
                  ) : (
                    'Изменить пароль'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Правая колонка - Бронирования */}
          <div className="col-lg-8">
            <div className="profile-section">
              <h3 className="mb-3">Мои бронирования</h3>
              <div id="bookingHistory">
                {loading ? (
                  <LoadingSpinner message="Загрузка бронирований..." />
                ) : bookings.length === 0 ? (
                  <p className="text-muted">У вас пока нет бронирований</p>
                ) : (
                  bookings.map(booking => (
                    <div key={booking.id} className={`card booking-card ${booking.status} mb-3`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="card-title mb-0">
                            Бронирование #{booking.id}
                          </h5>
                          <span className={`badge bg-${getStatusClass(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        <p className="card-text">
                          <strong>Дата:</strong> {new Date(booking.start_time).toLocaleDateString('ru-RU')}<br/>
                          <strong>Время:</strong> {new Date(booking.start_time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - {new Date(booking.end_time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}<br/>
                          <strong>Столик:</strong> {booking.table_details?.name}<br/>
                          <strong>Количество гостей:</strong> {booking.guests_count}<br/>
                          {booking.comment && <><strong>Комментарий:</strong> {booking.comment}<br/></>}
                        </p>

                        {booking.menu_items && booking.menu_items.length > 0 && (
                          <div className="mt-3">
                            <h6>Выбранные блюда:</h6>
                            <ul className="list-group list-group-flush">
                              {booking.menu_items.map((item, index) => (
                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent">
                                  {item.menu_item_details?.name}
                                  <span>{item.quantity} x {item.price.toLocaleString()} сум</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {booking.can_be_cancelled && (
                          <div className="mt-3">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => cancelBooking(booking.id)}
                            >
                              Отменить бронирование
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PersonalCabinet
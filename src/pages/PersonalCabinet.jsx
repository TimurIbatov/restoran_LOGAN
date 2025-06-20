import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getMockData } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const PersonalCabinet = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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

  const loadUserData = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      })
    }
  }

  const loadBookingHistory = async () => {
    try {
      setLoading(true)
      const data = await getMockData('bookings')
      setBookings(data.bookings || [])
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
      const result = await updateProfile(profileData)
      if (result.success) {
        showToast('Успешно', 'Профиль успешно обновлен', 'success')
      } else {
        showToast('Ошибка', result.error || 'Не удалось обновить профиль', 'error')
      }
    } catch (error) {
      showToast('Ошибка', 'Произошла ошибка при обновлении профиля', 'error')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Ошибка', 'Пароли не совпадают', 'error')
      return
    }

    setPasswordLoading(true)

    try {
      // Здесь должен быть вызов API для смены пароля
      // Пока просто симулируем успешную смену
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showToast('Успешно', 'Пароль успешно изменен', 'success')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      showToast('Ошибка', 'Не удалось изменить пароль', 'error')
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
        // Здесь должен быть вызов API для отмены бронирования
        showToast('Успешно', 'Бронирование успешно отменено', 'success')
        loadBookingHistory()
      } catch (error) {
        showToast('Ошибка', 'Не удалось отменить бронирование', 'error')
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
                  <label htmlFor="userName" className="form-label">Имя</label>
                  <input
                    type="text"
                    className="form-control"
                    id="userName"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="userEmail" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="userEmail"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="userPhone" className="form-label">Телефон</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="userPhone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="userAddress" className="form-label">Адрес</label>
                  <textarea
                    className="form-control"
                    id="userAddress"
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
                  <label htmlFor="currentPassword" className="form-label">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
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
                          <strong>Дата:</strong> {new Date(booking.date).toLocaleDateString('ru-RU')}<br/>
                          <strong>Время:</strong> {booking.time}<br/>
                          <strong>Столик:</strong> {booking.table.name}<br/>
                          <strong>Количество гостей:</strong> {booking.guests}<br/>
                          <strong>Комментарий:</strong> {booking.comment}
                        </p>

                        {booking.menu_items && booking.menu_items.length > 0 && (
                          <div className="mt-3">
                            <h6>Выбранные блюда:</h6>
                            <ul className="list-group list-group-flush">
                              {booking.menu_items.map((item, index) => (
                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent">
                                  {item.name}
                                  <span>{item.quantity} x {item.price.toLocaleString()} сум</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
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
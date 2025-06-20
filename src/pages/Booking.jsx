import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getMockData } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Booking = () => {
  const [searchParams] = useSearchParams()
  const [selectedTable, setSelectedTable] = useState(null)
  const [tables, setTables] = useState([])
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    guests: 2,
    comment: '',
    tableId: null
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Доступ ограничен', 'Необходимо войти в систему для бронирования', 'warning')
      navigate('/login')
      return
    }

    const tableId = searchParams.get('table') || localStorage.getItem('selectedTableId')
    if (tableId) {
      setBookingData(prev => ({ ...prev, tableId: parseInt(tableId) }))
    }

    loadTables()
  }, [isAuthenticated, navigate, searchParams])

  const loadTables = async () => {
    try {
      setLoading(true)
      const data = await getMockData('tables')
      const tablesData = data.tables || []
      setTables(tablesData)

      // Если есть выбранный столик, найдем его
      const tableId = bookingData.tableId || parseInt(searchParams.get('table'))
      if (tableId) {
        const table = tablesData.find(t => t.id === tableId)
        if (table) {
          setSelectedTable(table)
          setBookingData(prev => ({ ...prev, tableId: table.id }))
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки столиков:', error)
      showToast('Ошибка', 'Не удалось загрузить информацию о столиках', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    })
  }

  const handleTableSelect = (tableId) => {
    const table = tables.find(t => t.id === tableId)
    setSelectedTable(table)
    setBookingData({
      ...bookingData,
      tableId: tableId
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedTable) {
      showToast('Ошибка', 'Пожалуйста, выберите столик', 'error')
      return
    }

    if (!bookingData.date || !bookingData.time) {
      showToast('Ошибка', 'Пожалуйста, укажите дату и время', 'error')
      return
    }

    setSubmitting(true)

    try {
      // Симулируем отправку бронирования
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      showToast('Успешно', 'Бронирование успешно создано!', 'success')
      
      // Очищаем выбранный столик из localStorage
      localStorage.removeItem('selectedTableId')
      
      // Переходим в личный кабинет
      navigate('/personal-cabinet')
    } catch (error) {
      showToast('Ошибка', 'Не удалось создать бронирование', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <section className="page-header login-header">
        <div className="container">
          <h1 className="display-4">Бронирование столика</h1>
          <p className="lead">Забронируйте столик для незабываемого вечера</p>
        </div>
      </section>

      <div className="container my-5">
        {loading ? (
          <LoadingSpinner message="Загрузка информации..." />
        ) : (
          <div className="row">
            {/* Форма бронирования */}
            <div className="col-lg-8 mb-4">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    Детали бронирования
                  </h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="date" className="form-label">Дата</label>
                        <input
                          type="date"
                          className="form-control"
                          id="date"
                          name="date"
                          value={bookingData.date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="time" className="form-label">Время</label>
                        <input
                          type="time"
                          className="form-control"
                          id="time"
                          name="time"
                          value={bookingData.time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="guests" className="form-label">Количество гостей</label>
                      <input
                        type="number"
                        className="form-control"
                        id="guests"
                        name="guests"
                        value={bookingData.guests}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="comment" className="form-label">Комментарий</label>
                      <textarea
                        className="form-control"
                        id="comment"
                        name="comment"
                        rows="3"
                        value={bookingData.comment}
                        onChange={handleInputChange}
                        placeholder="Особые пожелания или требования..."
                      ></textarea>
                    </div>

                    {/* Быстрый выбор столика */}
                    <div className="mb-4">
                      <label className="form-label">Выберите столик</label>
                      <div className="row">
                        {tables.slice(0, 6).map(table => (
                          <div key={table.id} className="col-md-4 mb-2">
                            <div
                              className={`card ${selectedTable?.id === table.id ? 'border-primary' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleTableSelect(table.id)}
                            >
                              <div className="card-body py-2">
                                <small className="fw-bold">{table.name}</small><br/>
                                <small className="text-muted">
                                  {table.capacity} мест, {table.zone_name}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!selectedTable && (
                        <small className="text-muted">
                          Или <a href="/tables">выберите из полного списка</a>
                        </small>
                      )}
                    </div>

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={submitting || !selectedTable}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Бронирование...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Забронировать
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Информация о выбранном столике */}
            <div className="col-lg-4">
              <div className="card shadow">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Информация о бронировании
                  </h5>
                </div>
                <div className="card-body">
                  {selectedTable ? (
                    <div>
                      <img
                        src={selectedTable.image || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                        alt={selectedTable.name}
                        className="img-fluid rounded mb-3"
                      />
                      <h6>{selectedTable.name}</h6>
                      <p className="mb-2">
                        <i className="bi bi-people-fill me-1"></i>
                        Вместимость: {selectedTable.capacity} человек
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-geo-alt-fill me-1"></i>
                        Зона: {selectedTable.zone_name}
                      </p>
                      <div className="mt-3">
                        <small className="text-muted">
                          <i className="bi bi-person-circle me-1"></i>
                          Гость: {user?.name || user?.email}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted">
                      <i className="bi bi-table display-4 mb-3"></i>
                      <p>Выберите столик для бронирования</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Правила и условия */}
              <div className="card shadow mt-4">
                <div className="card-header bg-warning text-dark">
                  <h6 className="mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Правила бронирования
                  </h6>
                </div>
                <div className="card-body">
                  <small>
                    • Бронирование действительно 15 минут<br/>
                    • Отмена возможна за 2 часа до времени<br/>
                    • При опоздании на 15 минут бронь снимается<br/>
                    • Предоплата не требуется<br/>
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Booking
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getMockData } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Tables = () => {
  const [tables, setTables] = useState([])
  const [filteredTables, setFilteredTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' или 'plan'
  const [floorPlanData, setFloorPlanData] = useState(null)
  const [selectedZone, setSelectedZone] = useState('all')
  const [filters, setFilters] = useState({
    date: '',
    time: '',
    guests: 2,
    zone: 'all'
  })

  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Доступ ограничен', 'Необходимо войти в систему', 'warning')
      navigate('/login')
      return
    }

    if (user?.role === 'admin') {
      showToast('Доступ ограничен', 'Администраторам недоступен просмотр столиков', 'warning')
      navigate('/admin')
      return
    }

    loadTables()
    loadFloorPlan()
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    applyFilters()
  }, [tables, filters])

  const loadTables = async () => {
    try {
      setLoading(true)
      const data = await getMockData('tables')
      setTables(data.tables || [])
    } catch (error) {
      console.error('Ошибка загрузки столиков:', error)
      showToast('Ошибка', 'Не удалось загрузить столики', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFloorPlan = async () => {
    try {
      // Здесь должен быть запрос к API для получения плана зала
      const mockFloorPlan = {
        zones: [
          { id: 1, name: 'Основной зал', slug: 'main' },
          { id: 2, name: 'VIP-зона', slug: 'vip' },
          { id: 3, name: 'Терраса', slug: 'terrace' }
        ],
        tables: tables.map(table => ({
          ...table,
          position_x: Math.random() * 600,
          position_y: Math.random() * 400
        }))
      }
      setFloorPlanData(mockFloorPlan)
    } catch (error) {
      console.error('Ошибка загрузки плана зала:', error)
    }
  }

  const applyFilters = () => {
    let filtered = tables.filter(table => table.is_active)

    if (filters.guests > 0) {
      filtered = filtered.filter(table => table.capacity >= filters.guests)
    }

    if (filters.zone !== 'all') {
      filtered = filtered.filter(table => table.zone_slug === filters.zone)
    }

    setFilteredTables(filtered)
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const resetFilters = () => {
    setFilters({
      date: '',
      time: '',
      guests: 2,
      zone: 'all'
    })
  }

  const selectTable = (tableId) => {
    localStorage.setItem('selectedTableId', tableId)
    showToast('Столик выбран', `Переход к бронированию столика #${tableId}`, 'success')
    navigate(`/booking?table=${tableId}`)
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'available':
        return 'status-available'
      case 'partially':
        return 'status-partially'
      case 'booked':
        return 'status-booked'
      default:
        return 'bg-secondary text-white'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Свободен'
      case 'partially':
        return 'Частично занят'
      case 'booked':
        return 'Занят'
      default:
        return 'Неизвестно'
    }
  }

  const groupTablesByZone = (tables) => {
    return tables.reduce((acc, table) => {
      const zoneKey = table.zone_slug || 'other'
      if (!acc[zoneKey]) {
        acc[zoneKey] = {
          name: table.zone_name || 'Другая зона',
          slug: zoneKey,
          tables: []
        }
      }
      acc[zoneKey].tables.push(table)
      return acc
    }, {})
  }

  const renderGridView = () => {
    if (filteredTables.length === 0) {
      return (
        <div className="col-12 text-center">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Нет подходящих столиков с выбранными параметрами
          </div>
        </div>
      )
    }

    const groupedTables = groupTablesByZone(filteredTables)

    return Object.entries(groupedTables).map(([zoneKey, zone]) => (
      <div key={zoneKey} className="zone-section mb-5">
        <div className="zone-header">
          <img
            src={`https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`}
            alt={zone.name}
            className="zone-image w-100"
          />
          <div className="zone-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
            <h2 className="text-white mb-0">{zone.name}</h2>
          </div>
        </div>

        <div className="row">
          {zone.tables.map(table => (
            <div key={table.id} className="col-md-4 col-lg-3 mb-4">
              <div className="card table-card position-relative h-100">
                <img
                  src={table.image || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  className="card-img-top"
                  alt={table.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{table.name}</h5>
                  <p className="card-text">
                    <i className="bi bi-people-fill me-1"></i>
                    Вместимость: {table.capacity} чел.<br />
                    <i className="bi bi-geo-alt-fill me-1"></i>
                    Зона: {table.zone_name}
                  </p>
                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => selectTable(table.id)}
                  >
                    <i className="bi bi-calendar-check me-1"></i>
                    Забронировать
                  </button>
                </div>
                <div className={`table-status ${getStatusClass(table.status)}`}>
                  {getStatusText(table.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))
  }

  const renderFloorPlan = () => {
    if (!floorPlanData) {
      return <LoadingSpinner message="Загрузка плана зала..." />
    }

    return (
      <div className="floor-plan-container">
        <div className="floor-plan-wrapper">
          {/* Зоны */}
          {floorPlanData.zones.map(zone => (
            <div
              key={zone.id}
              className={`zone-area ${selectedZone === zone.slug ? 'active' : ''}`}
              style={{
                left: `${20 + zone.id * 200}px`,
                top: `${50 + (zone.id % 2) * 200}px`,
                width: '180px',
                height: '150px'
              }}
            >
              <div className="zone-label">{zone.name}</div>
            </div>
          ))}

          {/* Столики */}
          {filteredTables.map(table => (
            <div
              key={table.id}
              className={`table-marker ${table.status} ${table.is_vip ? 'vip' : ''}`}
              style={{
                left: `${table.position_x || Math.random() * 600}px`,
                top: `${table.position_y || Math.random() * 400}px`
              }}
              onClick={() => selectTable(table.id)}
              title={`${table.name} - ${table.capacity} мест`}
            >
              {table.name}
            </div>
          ))}
        </div>

        {/* Легенда */}
        <div className="floor-plan-legend">
          <h6>Статус столиков</h6>
          <div className="legend-item">
            <span className="legend-color available"></span>
            Свободен
          </div>
          <div className="legend-item">
            <span className="legend-color booked"></span>
            Забронирован
          </div>
          <div className="legend-item">
            <span className="legend-color vip"></span>
            VIP столик
          </div>
        </div>

        {/* Фильтр по зонам */}
        <div className="zone-filter">
          <button
            className={`btn btn-sm ${selectedZone === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setSelectedZone('all')}
          >
            Все зоны
          </button>
          {floorPlanData.zones.map(zone => (
            <button
              key={zone.id}
              className={`btn btn-sm ${selectedZone === zone.slug ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedZone(zone.slug)}
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <section className="page-header tables-header">
        <div className="container">
          <h1 className="display-4">Наши столики</h1>
          <p className="lead">Выберите идеальный столик для вашего визита</p>
        </div>
      </section>

      <main className="container">
        {/* Переключатель вида */}
        <div className="view-switcher mb-4">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="bi bi-grid-3x3 me-1"></i>
              Список
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'plan' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('plan')}
            >
              <i className="bi bi-diagram-3 me-1"></i>
              План зала
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="filters">
          <div className="row">
            <div className="col-md-3 mb-3 mb-md-0">
              <label htmlFor="dateFilter" className="form-label">Дата</label>
              <input
                type="date"
                className="form-control"
                id="dateFilter"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <label htmlFor="timeFilter" className="form-label">Время</label>
              <input
                type="time"
                className="form-control"
                id="timeFilter"
                name="time"
                value={filters.time}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <label htmlFor="guestsFilter" className="form-label">
                Количество гостей
              </label>
              <input
                type="number"
                className="form-control"
                id="guestsFilter"
                name="guests"
                min="1"
                value={filters.guests}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <label htmlFor="zoneFilter" className="form-label">Зона</label>
              <select
                className="form-select"
                id="zoneFilter"
                name="zone"
                value={filters.zone}
                onChange={handleFilterChange}
              >
                <option value="all">Все зоны</option>
                <option value="main">Основной зал</option>
                <option value="terrace">Терраса</option>
                <option value="vip">VIP-зона</option>
              </select>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12 text-end">
              <button className="btn btn-outline-secondary" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Контент */}
        <div className="tables-content">
          {loading ? (
            <LoadingSpinner message="Загрузка столиков..." />
          ) : viewMode === 'grid' ? (
            <div className="row">
              {renderGridView()}
            </div>
          ) : (
            renderFloorPlan()
          )}
        </div>
      </main>

      <style jsx>{`
        .floor-plan-container {
          position: relative;
          width: 100%;
          height: 600px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .floor-plan-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .zone-area {
          position: absolute;
          border: 2px dashed #667eea;
          border-radius: 10px;
          background: rgba(102, 126, 234, 0.1);
          transition: all 0.3s ease;
        }

        .zone-area.active {
          background: rgba(102, 126, 234, 0.2);
          border-color: #667eea;
        }

        .zone-label {
          position: absolute;
          top: -15px;
          left: 10px;
          background: #667eea;
          color: white;
          padding: 5px 15px;
          border-radius: 15px;
          font-size: 0.8em;
          font-weight: bold;
        }

        .table-marker {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.7em;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          border: 2px solid white;
          color: white;
        }

        .table-marker:hover {
          transform: scale(1.2);
          z-index: 10;
        }

        .table-marker.available {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
        }

        .table-marker.booked {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .table-marker.vip {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          border-color: gold;
        }

        .floor-plan-legend {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 10px;
          padding: 15px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.9em;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .legend-color.available {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
        }

        .legend-color.booked {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .legend-color.vip {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          border: 2px solid gold;
        }

        .zone-filter {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .view-switcher {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}

export default Tables
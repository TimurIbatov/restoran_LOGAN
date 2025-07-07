"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { restaurantAPI } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"
import { useAuth } from "../contexts/AuthContext"

const Tables = () => {
  const [tables, setTables] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState(null)
  const [viewMode, setViewMode] = useState("zones") // 'zones' или 'grid'
  const [editingZone, setEditingZone] = useState(null)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const { showToast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tablesData, zonesData] = await Promise.all([
        restaurantAPI.getTables(),
        restaurantAPI.getZones(),
      ])
      
      setTables(Array.isArray(tablesData) ? tablesData : [])
      setZones(Array.isArray(zonesData) ? zonesData : [])
      
      // Выбираем первую зону по умолчанию
      if (zonesData && zonesData.length > 0) {
        setSelectedZone(zonesData[0])
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
      showToast("Ошибка", "Не удалось загрузить данные", "error")
      setTables([])
      setZones([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "success"
      case "occupied":
        return "danger"
      case "reserved":
        return "warning"
      case "maintenance":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "available":
        return "Свободен"
      case "occupied":
        return "Занят"
      case "reserved":
        return "Забронирован"
      case "maintenance":
        return "Обслуживание"
      default:
        return "Неизвестно"
    }
  }

  const handleTableSelect = (tableId) => {
    localStorage.setItem("selectedTableId", tableId.toString())
    showToast("Столик выбран", "Перейдите к бронированию", "success")
  }

  const getTablesForZone = (zoneId) => {
    return tables.filter(table => table.zone === zoneId)
  }

  const getTablePosition = (table, index) => {
    // Если есть сохраненные координаты, используем их
    if (table.position_x && table.position_y) {
      return { x: table.position_x, y: table.position_y }
    }
    
    // Иначе генерируем позицию на основе индекса
    const cols = 4
    const row = Math.floor(index / cols)
    const col = index % cols
    
    return {
      x: 80 + col * 120,
      y: 80 + row * 120
    }
  }

  const handleZoneEdit = (zone) => {
    setEditingZone(zone)
    setShowZoneModal(true)
  }

  const handleZoneCreate = () => {
    setEditingZone(null)
    setShowZoneModal(true)
  }

  return (
    <div>
      <section className="bg-info text-white py-5">
        <div className="container">
          <h1 className="display-4">Столики</h1>
          <p className="lead">Выберите подходящий столик для вашего визита</p>
        </div>
      </section>

      <main className="container my-5">
        {loading ? (
          <LoadingSpinner message="Загрузка столиков..." />
        ) : (
          <>
            {/* Управление и фильтры */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === "zones" ? "btn-info" : "btn-outline-info"}`}
                    onClick={() => setViewMode("zones")}
                  >
                    <i className="bi bi-diagram-3 me-1"></i>
                    По зонам
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === "grid" ? "btn-info" : "btn-outline-info"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <i className="bi bi-grid-3x3-gap me-1"></i>
                    Сетка
                  </button>
                </div>
              </div>
              
              {user?.is_admin_user && (
                <div className="col-md-6 text-end">
                  <button
                    className="btn btn-success"
                    onClick={handleZoneCreate}
                  >
                    <i className="bi bi-plus me-1"></i>
                    Добавить зону
                  </button>
                </div>
              )}
            </div>

            {/* Легенда статусов */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Статусы столиков:</h6>
                    <div className="d-flex flex-wrap gap-3">
                      <span className="badge bg-success">Свободен</span>
                      <span className="badge bg-warning text-dark">Забронирован</span>
                      <span className="badge bg-danger">Занят</span>
                      <span className="badge bg-secondary">Обслуживание</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Отображение по зонам */}
            {viewMode === "zones" ? (
              <div className="row">
                {zones.length > 0 ? (
                  zones.map((zone) => {
                    const zoneTables = getTablesForZone(zone.id)
                    return (
                      <div key={zone.id} className="col-12 mb-5">
                        <div className="card shadow-lg">
                          {/* Заголовок зоны */}
                          <div className="card-header bg-primary text-white">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h3 className="mb-1">
                                  <i className="bi bi-geo-alt me-2"></i>
                                  {zone.name}
                                </h3>
                                {zone.description && (
                                  <p className="mb-0 opacity-75">{zone.description}</p>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-light text-dark">
                                  {zoneTables.length} столиков
                                </span>
                                {user?.is_admin_user && (
                                  <button
                                    className="btn btn-outline-light btn-sm"
                                    onClick={() => handleZoneEdit(zone)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* План зоны */}
                          <div className="card-body p-0">
                            <div 
                              className="position-relative"
                              style={{
                                height: "400px",
                                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                overflow: "hidden"
                              }}
                            >
                              {/* Столики в зоне */}
                              {zoneTables.map((table, index) => {
                                const position = getTablePosition(table, index)
                                return (
                                  <div
                                    key={table.id}
                                    className={`position-absolute rounded-circle d-flex align-items-center justify-content-center text-white fw-bold border border-3 ${
                                      table.current_status === "available" ? "bg-success border-success" :
                                      table.current_status === "occupied" ? "bg-danger border-danger" :
                                      table.current_status === "reserved" ? "bg-warning border-warning" :
                                      "bg-secondary border-secondary"
                                    } ${table.is_vip ? "border-warning" : ""}`}
                                    style={{
                                      left: position.x + "px",
                                      top: position.y + "px",
                                      width: "80px",
                                      height: "80px",
                                      cursor: "pointer",
                                      fontSize: "0.9rem",
                                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                                      transition: "all 0.3s ease",
                                      zIndex: 1
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = "scale(1.1)"
                                      e.target.style.zIndex = "10"
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = "scale(1)"
                                      e.target.style.zIndex = "1"
                                    }}
                                    title={`${table.name} (${table.capacity} мест) - ${getStatusText(table.current_status)}`}
                                  >
                                    {table.name.replace("Столик №", "").replace("VIP №", "V").replace("Терраса №", "Т")}
                                    {table.is_vip && (
                                      <i className="bi bi-star-fill position-absolute" style={{top: "-5px", right: "-5px", color: "gold", fontSize: "0.7rem"}}></i>
                                    )}
                                  </div>
                                )
                              })}

                              {/* Информация о зоне */}
                              <div 
                                className="position-absolute bg-white rounded p-3 shadow-sm"
                                style={{top: "20px", right: "20px", maxWidth: "200px"}}
                              >
                                <h6 className="mb-2">{zone.name}</h6>
                                <div className="small text-muted">
                                  <div>Всего столиков: {zoneTables.length}</div>
                                  <div>Свободно: {zoneTables.filter(t => t.current_status === "available").length}</div>
                                  <div>VIP: {zoneTables.filter(t => t.is_vip).length}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Список столиков зоны */}
                          <div className="card-footer">
                            <div className="row">
                              {zoneTables.map((table) => (
                                <div key={table.id} className="col-lg-3 col-md-4 col-sm-6 mb-3">
                                  <div className={`card h-100 ${table.is_vip ? "border-warning" : ""}`}>
                                    <div className="card-body p-3">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="card-title mb-0">{table.name}</h6>
                                        <span className={`badge bg-${getStatusColor(table.current_status)}`}>
                                          {getStatusText(table.current_status)}
                                        </span>
                                      </div>
                                      
                                      <div className="small text-muted mb-2">
                                        <div><i className="bi bi-people me-1"></i>{table.capacity} мест</div>
                                        {table.price_per_hour > 0 && (
                                          <div><i className="bi bi-credit-card me-1"></i>{table.price_per_hour.toLocaleString()} сум</div>
                                        )}
                                      </div>

                                      {table.current_status === "available" ? (
                                        <Link
                                          to={`/booking?table=${table.id}`}
                                          className="btn btn-success btn-sm w-100"
                                          onClick={() => handleTableSelect(table.id)}
                                        >
                                          <i className="bi bi-calendar-check me-1"></i>
                                          Забронировать
                                        </Link>
                                      ) : (
                                        <button className="btn btn-secondary btn-sm w-100" disabled>
                                          <i className="bi bi-x-circle me-1"></i>
                                          Недоступен
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="bi bi-building display-1 text-muted"></i>
                      <h3 className="mt-3">Зоны не найдены</h3>
                      <p className="text-muted">Пока нет доступных зон</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Отображение сеткой */
              <div className="row">
                {tables.length > 0 ? (
                  tables.map((table) => (
                    <div key={table.id} className="col-lg-4 col-md-6 mb-4">
                      <div className={`card h-100 ${table.is_vip ? "border-warning" : ""}`}>
                        {table.is_vip && (
                          <div className="card-header bg-warning text-dark">
                            <i className="bi bi-star-fill me-1"></i>
                            VIP столик
                          </div>
                        )}
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="card-title">{table.name}</h5>
                            <span className={`badge bg-${getStatusColor(table.current_status)}`}>
                              {getStatusText(table.current_status)}
                            </span>
                          </div>

                          <div className="mb-3">
                            <p className="card-text mb-1">
                              <i className="bi bi-people-fill me-2"></i>
                              Вместимость: <strong>{table.capacity} человек</strong>
                            </p>
                            <p className="card-text mb-1">
                              <i className="bi bi-geo-alt-fill me-2"></i>
                              Зона: <strong>{table.zone_name}</strong>
                            </p>
                            {table.price_per_hour > 0 && (
                              <p className="card-text mb-1">
                                <i className="bi bi-credit-card me-2"></i>
                                Цена: <strong>{table.price_per_hour.toLocaleString()} сум/час</strong>
                              </p>
                            )}
                            {table.deposit > 0 && (
                              <p className="card-text mb-1">
                                <i className="bi bi-shield-check me-2"></i>
                                Депозит: <strong>{table.deposit.toLocaleString()} сум</strong>
                              </p>
                            )}
                          </div>

                          <div className="mt-auto">
                            {table.current_status === "available" ? (
                              <div className="d-grid gap-2">
                                <Link
                                  to={`/booking?table=${table.id}`}
                                  className="btn btn-success"
                                  onClick={() => handleTableSelect(table.id)}
                                >
                                  <i className="bi bi-calendar-check me-1"></i>
                                  Забронировать
                                </Link>
                              </div>
                            ) : (
                              <button className="btn btn-secondary w-100" disabled>
                                <i className="bi bi-x-circle me-1"></i>
                                Недоступен
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="bi bi-table display-1 text-muted"></i>
                      <h3 className="mt-3">Столики не найдены</h3>
                      <p className="text-muted">Нет доступных столиков</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Информационная панель */}
            <div className="row mt-5">
              <div className="col-12">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-info-circle me-2"></i>
                      Информация о бронировании
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <ul className="list-unstyled">
                          <li>
                            <i className="bi bi-check text-success me-2"></i>Бронирование бесплатно
                          </li>
                          <li>
                            <i className="bi bi-check text-success me-2"></i>Подтверждение в течение 15 минут
                          </li>
                          <li>
                            <i className="bi bi-check text-success me-2"></i>Отмена за 2 часа до визита
                          </li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <ul className="list-unstyled">
                          <li>
                            <i className="bi bi-clock me-2"></i>Время работы: 10:00 - 23:00
                          </li>
                          <li>
                            <i className="bi bi-telephone me-2"></i>Телефон: +998 (93) 668-29-24
                          </li>
                          <li>
                            <i className="bi bi-envelope me-2"></i>Email: info@restaurant-logan.com
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Модальное окно для редактирования зоны */}
      {showZoneModal && (
        <ZoneModal
          zone={editingZone}
          onSave={(zoneData) => {
            // Здесь будет логика сохранения зоны
            console.log("Saving zone:", zoneData)
            setShowZoneModal(false)
            setEditingZone(null)
            loadData()
          }}
          onClose={() => {
            setShowZoneModal(false)
            setEditingZone(null)
          }}
        />
      )}
    </div>
  )
}

const ZoneModal = ({ zone, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: zone?.name || "",
    description: zone?.description || "",
    is_active: zone?.is_active ?? true,
    sort_order: zone?.sort_order || 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content text-dark">
          <div className="modal-header">
            <h5 className="modal-title">{zone ? "Редактировать зону" : "Добавить зону"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Название зоны</label>
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
                <label className="form-label">Порядок сортировки</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label className="form-check-label">Активная зона</label>
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

export default Tables
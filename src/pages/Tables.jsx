"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { restaurantAPI } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"

const Tables = () => {
  const [tables, setTables] = useState([])
  const [zones, setZones] = useState([])
  const [floorPlan, setFloorPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // 'grid' или 'floor'
  const { showToast } = useToast()

  useEffect(() => {
    loadTables()
    loadZones()
    loadFloorPlan()
  }, [])

  const loadTables = async () => {
    try {
      const data = await restaurantAPI.getTables()
      setTables(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Ошибка загрузки столиков:", error)
      
      setTables(demoTables)
    }
  }

  const loadZones = async () => {
    try {
      const data = await restaurantAPI.getZones()
      setZones(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Ошибка загрузки зон:", error)
      
    } finally {
      setLoading(false)
    }
  }

  const loadFloorPlan = async () => {
    try {
      const data = await restaurantAPI.getFloorPlan()
      setFloorPlan(data)
    } catch (error) {
      console.error("Ошибка загрузки плана зала:", error)
      setFloorPlan(null)
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

  const filteredTables = selectedZone === "all" ? tables : tables.filter((table) => table.zone_name === selectedZone)

  const handleTableSelect = (tableId) => {
    localStorage.setItem("selectedTableId", tableId.toString())
    showToast("Столик выбран", "Перейдите к бронированию", "success")
  }

  const [selectedTable, setSelectedTable] = useState(null)

  const getZonePosition = (zoneSlug, index) => {
    const positions = {
      main: { x: 50, y: 100, width: 400, height: 200 },
      vip: { x: 500, y: 100, width: 200, height: 150 },
      terrace: { x: 150, y: 350, width: 300, height: 180 },
    }

    return (
      positions[zoneSlug] || {
        x: 50 + index * 150,
        y: 100 + index * 100,
        width: 300,
        height: 150,
      }
    )
  }

  const getTablePosition = (tableId, zoneName, index) => {
    const zonePositions = {
      "Основной зал": [
        { x: 100, y: 150 },
        { x: 200, y: 150 },
        { x: 300, y: 150 },
        { x: 150, y: 220 },
        { x: 250, y: 220 },
      ],
      "VIP-зона": [
        { x: 550, y: 150 },
        { x: 600, y: 200 },
      ],
      Терраса: [
        { x: 200, y: 400 },
        { x: 300, y: 400 },
        { x: 400, y: 400 },
      ],
    }

    const positions = zonePositions[zoneName] || []
    const tableIndex = positions.length > 0 ? (tableId - 1) % positions.length : index

    return (
      positions[tableIndex] || {
        x: 100 + index * 80,
        y: 150 + Math.floor(index / 5) * 80,
      }
    )
  }

  const getTableStatusClass = (status) => {
    switch (status) {
      case "available":
        return "bg-success"
      case "occupied":
        return "bg-danger"
      case "reserved":
        return "bg-warning"
      default:
        return "bg-secondary"
    }
  }

  const handleTableClick = (table) => {
    setSelectedTable(table)
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
            {/* Фильтры и переключатель вида */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label htmlFor="zoneFilter" className="form-label">
                  Фильтр по зоне
                </label>
                <select
                  id="zoneFilter"
                  className="form-select"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  <option value="all">Все зоны</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.name}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Вид отображения</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === "grid" ? "btn-info" : "btn-outline-info"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <i className="bi bi-grid-3x3-gap me-1"></i>
                    Сетка
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === "floor" ? "btn-info" : "btn-outline-info"}`}
                    onClick={() => setViewMode("floor")}
                  >
                    <i className="bi bi-diagram-3 me-1"></i>
                    План зала
                  </button>
                </div>
              </div>
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

            {/* Отображение столиков */}
            {viewMode === "grid" ? (
              <div className="row">
                {filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
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
                      <p className="text-muted">В выбранной зоне нет доступных столиков</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* План зала */
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-diagram-3 me-2"></i>
                        План зала
                      </h5>
                    </div>
                    <div className="card-body">
                      <div
                        className="floor-plan-container position-relative"
                        style={{
                          height: "600px",
                          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                          borderRadius: "15px",
                          overflow: "hidden",
                        }}
                      >
                        {/* Зоны */}
                        {zones.map((zone, index) => {
                          const zonePosition = getZonePosition(zone.slug, index)
                          return (
                            <div
                              key={zone.id}
                              className="position-absolute border border-2 border-primary rounded"
                              style={{
                                left: zonePosition.x + "px",
                                top: zonePosition.y + "px",
                                width: zonePosition.width + "px",
                                height: zonePosition.height + "px",
                                backgroundColor: "rgba(13, 110, 253, 0.1)",
                                borderStyle: "dashed",
                              }}
                            >
                              <div
                                className="position-absolute bg-primary text-white px-3 py-1 rounded-pill"
                                style={{ top: "-15px", left: "10px", fontSize: "0.8rem", fontWeight: "bold" }}
                              >
                                {zone.name}
                              </div>
                            </div>
                          )
                        })}

                        {/* Столики */}
                        {filteredTables.map((table, index) => {
                          const tablePosition = getTablePosition(table.id, table.zone_name, index)
                          return (
                            <div
                              key={table.id}
                              className={`position-absolute rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${getTableStatusClass(table.current_status)} ${table.is_vip ? "border border-warning border-3" : "border border-white border-2"}`}
                              style={{
                                left: tablePosition.x + "px",
                                top: tablePosition.y + "px",
                                width: "60px",
                                height: "60px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                                transition: "all 0.3s ease",
                              }}
                              onClick={() => handleTableClick(table)}
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
                              {table.name.replace("Столик №", "").replace("VIP №", "V")}
                            </div>
                          )
                        })}

                        {/* Легенда */}
                        <div
                          className="position-absolute bg-white rounded p-3 shadow"
                          style={{ top: "20px", right: "20px" }}
                        >
                          <h6 className="mb-3">Статус столиков</h6>
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle me-2"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  background: "linear-gradient(135deg, #198754, #157347)",
                                }}
                              ></div>
                              <small>Свободен</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle me-2"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  background: "linear-gradient(135deg, #ffc107, #ffca2c)",
                                }}
                              ></div>
                              <small>Забронирован</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle me-2"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  background: "linear-gradient(135deg, #dc3545, #bb2d3b)",
                                }}
                              ></div>
                              <small>Занят</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle border border-warning border-2 me-2"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  background: "linear-gradient(135deg, #6f42c1, #59359a)",
                                }}
                              ></div>
                              <small>VIP столик</small>
                            </div>
                          </div>
                        </div>

                        {/* Информация о выбранном столике */}
                        {selectedTable && (
                          <div
                            className="position-absolute bg-white rounded p-3 shadow"
                            style={{
                              bottom: "20px",
                              left: "20px",
                              minWidth: "250px",
                              zIndex: 1000,
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">{selectedTable.name}</h6>
                              <button
                                type="button"
                                className="btn-close btn-sm"
                                onClick={() => setSelectedTable(null)}
                              ></button>
                            </div>
                            <div className="small">
                              <div className="row">
                                <div className="col-6">
                                  <strong>Зона:</strong>
                                  <br />
                                  {selectedTable.zone_name}
                                </div>
                                <div className="col-6">
                                  <strong>Вместимость:</strong>
                                  <br />
                                  {selectedTable.capacity} человек
                                </div>
                              </div>
                              <div className="row mt-2">
                                <div className="col-6">
                                  <strong>Статус:</strong>
                                  <br />
                                  <span className={`badge bg-${getStatusColor(selectedTable.current_status)}`}>
                                    {getStatusText(selectedTable.current_status)}
                                  </span>
                                </div>
                                <div className="col-6">
                                  <strong>Тип:</strong>
                                  <br />
                                  {selectedTable.is_vip ? "VIP столик" : "Обычный"}
                                </div>
                              </div>
                              {selectedTable.price_per_hour > 0 && (
                                <div className="mt-2">
                                  <strong>Цена:</strong> {selectedTable.price_per_hour.toLocaleString()} сум/час
                                </div>
                              )}
                            </div>
                            {selectedTable.current_status === "available" && (
                              <div className="mt-3">
                                <Link
                                  to={`/booking?table=${selectedTable.id}`}
                                  className="btn btn-success btn-sm w-100"
                                  onClick={() => handleTableSelect(selectedTable.id)}
                                >
                                  <i className="bi bi-calendar-check me-1"></i>
                                  Забронировать
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                            <i className="bi bi-telephone me-2"></i>Телефон: +998 90 123 45 67
                          </li>
                          <li>
                            <i className="bi bi-envelope me-2"></i>Email: info@restaurant.uz
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
    </div>
  )
}

export default Tables

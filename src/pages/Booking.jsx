"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { restaurantAPI, bookingAPI } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"

const Booking = () => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  // Состояния
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState([])
  const [tables, setTables] = useState([])
  const [selectedZone, setSelectedZone] = useState("")
  const [selectedTable, setSelectedTable] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedMenuItems, setSelectedMenuItems] = useState([])

  // Данные формы
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    guests: 1,
    comment: "",
    specialRequests: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        contactName: user.get_full_name || user.first_name + " " + user.last_name || "",
        contactPhone: user.phone || "",
        contactEmail: user.email || "",
      }))
    }
  }, [user])

  useEffect(() => {
    if (selectedZone) {
      const zoneTables = tables.filter((table) => table.zone === Number.parseInt(selectedZone))
      if (zoneTables.length > 0 && !selectedTable) {
        setSelectedTable(zoneTables[0])
      }
    }
  }, [selectedZone, tables])

  useEffect(() => {
    if (formData.date && selectedTable) {
      loadAvailableSlots()
    }
  }, [formData.date, selectedTable])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [zonesData, tablesData, menuData] = await Promise.all([
        restaurantAPI.getZones(),
        restaurantAPI.getTables(),
        restaurantAPI.getMenuItems(),
      ])

      setZones(zonesData || [])
      setTables(tablesData || [])
      setMenuItems(menuData || [])

      // Устанавливаем дату по умолчанию (завтра)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData((prev) => ({
        ...prev,
        date: tomorrow.toISOString().split("T")[0],
      }))
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
      showToast("Ошибка", "Не удалось загрузить данные", "error")
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!formData.date || !selectedTable) return

    try {
      const slots = await bookingAPI.getAvailableSlots({
        date: formData.date,
        table_id: selectedTable.id,
        duration: 120,
      })
      setAvailableSlots(slots.available_slots || [])
    } catch (error) {
      console.error("Ошибка загрузки слотов:", error)
      setAvailableSlots([])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTimeSlotSelect = (slot) => {
    setFormData((prev) => ({
      ...prev,
      startTime: slot.start_time,
      endTime: slot.end_time,
    }))
  }

  const handleMenuItemToggle = (item) => {
    setSelectedMenuItems((prev) => {
      const existing = prev.find((selected) => selected.menu_item_id === item.id)
      if (existing) {
        return prev.filter((selected) => selected.menu_item_id !== item.id)
      } else {
        return [...prev, { menu_item_id: item.id, quantity: 1, notes: "" }]
      }
    })
  }

  const handleMenuItemQuantityChange = (itemId, quantity) => {
    setSelectedMenuItems((prev) =>
      prev.map((item) => (item.menu_item_id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item)),
    )
  }

  const calculateTotal = () => {
    if (!selectedTable) return 0

    const tablePrice = Number.parseFloat(selectedTable.price_per_hour || 0)
    const menuTotal = selectedMenuItems.reduce((total, selectedItem) => {
      const menuItem = menuItems.find((item) => item.id === selectedItem.menu_item_id)
      return total + (menuItem ? Number.parseFloat(menuItem.price) * selectedItem.quantity : 0)
    }, 0)

    return tablePrice + menuTotal
  }

  const calculateDeposit = () => {
    if (!selectedTable) return 0
    return Number.parseFloat(selectedTable.price_per_hour || 0) / 2
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showToast("Ошибка", "Необходимо войти в систему для бронирования", "error")
      return
    }

    if (!selectedTable) {
      showToast("Ошибка", "Выберите столик", "error")
      return
    }

    if (!formData.startTime || !formData.endTime) {
      showToast("Ошибка", "Выберите время бронирования", "error")
      return
    }

    try {
      setLoading(true)

      // Формируем datetime строки
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`)

      const bookingData = {
        table: selectedTable.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        guests_count: Number.parseInt(formData.guests),
        comment: formData.comment,
        special_requests: formData.specialRequests,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        selected_menu_items: selectedMenuItems,
      }

      console.log("Отправляем данные бронирования:", bookingData)

      const response = await bookingAPI.createBooking(bookingData)

      if (response) {
        showToast(
          "Успешно",
          `Бронирование создано! Номер: ${response.booking_number}. Проверьте email для подтверждения.`,
          "success",
        )

        // Сбрасываем форму
        setFormData((prev) => ({
          ...prev,
          startTime: "",
          endTime: "",
          guests: 1,
          comment: "",
          specialRequests: "",
        }))
        setSelectedMenuItems([])
        setSelectedTable(null)
        setSelectedZone("")
      }
    } catch (error) {
      console.error("Ошибка создания бронирования:", error)
      showToast("Ошибка", error.message || "Не удалось создать бронирование", "error")
    } finally {
      setLoading(false)
    }
  }

  if (loading && zones.length === 0) {
    return <LoadingSpinner />
  }

  const filteredTables = selectedZone ? tables.filter((table) => table.zone === Number.parseInt(selectedZone)) : tables

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <h1 className="display-4">Бронирование столика</h1>
          <p className="lead">Забронируйте столик в нашем ресторане</p>
        </div>
      </section>

      <div className="container my-5">
        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-body">
                <h3 className="card-title mb-4">Детали бронирования</h3>

                <form onSubmit={handleSubmit}>
                  {/* Выбор зоны */}
                  <div className="mb-4">
                    <label className="form-label">Выберите зону</label>
                    <select
                      className="form-select"
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      required
                    >
                      <option value="">Выберите зону</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Выбор столика */}
                  {selectedZone && (
                    <div className="mb-4">
                      <label className="form-label">Выберите столик</label>
                      <div className="row">
                        {filteredTables.map((table) => (
                          <div key={table.id} className="col-md-6 col-lg-4 mb-3">
                            <div
                              className={`card h-100 cursor-pointer ${
                                selectedTable?.id === table.id ? "border-primary" : ""
                              }`}
                              onClick={() => setSelectedTable(table)}
                            >
                              <div className="card-body text-center">
                                <h6 className="card-title">{table.name}</h6>
                                <p className="card-text">
                                  <small className="text-muted">
                                    Вместимость: {table.capacity} чел.
                                    <br />
                                    Цена: {Number.parseFloat(table.price_per_hour || 0).toLocaleString()} сум
                                    <br />
                                    Депозит: {Number.parseFloat(table.deposit || 0).toLocaleString()} сум
                                  </small>
                                </p>
                                {table.is_vip && <span className="badge bg-warning">VIP</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Дата и время */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Дата</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Количество гостей</label>
                      <input
                        type="number"
                        className="form-control"
                        name="guests"
                        value={formData.guests}
                        onChange={handleInputChange}
                        min="1"
                        max={selectedTable?.capacity || 20}
                        required
                      />
                    </div>
                  </div>

                  {/* Доступные слоты времени */}
                  {availableSlots.length > 0 && (
                    <div className="mb-4">
                      <label className="form-label">Выберите время</label>
                      <div className="row">
                        {availableSlots.map((slot, index) => (
                          <div key={index} className="col-md-4 col-lg-3 mb-2">
                            <button
                              type="button"
                              className={`btn w-100 ${
                                formData.startTime === slot.start_time ? "btn-primary" : "btn-outline-primary"
                              }`}
                              onClick={() => handleTimeSlotSelect(slot)}
                            >
                              {slot.start_time} - {slot.end_time}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Контактная информация */}
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <label className="form-label">Имя</label>
                      <input
                        type="text"
                        className="form-control"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Телефон</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Комментарии */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Комментарий</label>
                      <textarea
                        className="form-control"
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Дополнительная информация..."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Особые пожелания</label>
                      <textarea
                        className="form-control"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Аллергии, диетические ограничения..."
                      />
                    </div>
                  </div>

                  {/* Предзаказ блюд */}
                  {menuItems.length > 0 && (
                    <div className="mb-4">
                      <h5>Предзаказ блюд (опционально)</h5>
                      <div className="row">
                        {menuItems.slice(0, 6).map((item) => {
                          const selectedItem = selectedMenuItems.find((selected) => selected.menu_item_id === item.id)
                          const isSelected = !!selectedItem

                          return (
                            <div key={item.id} className="col-md-6 col-lg-4 mb-3">
                              <div className={`card h-100 ${isSelected ? "border-success" : ""}`}>
                                <div className="card-body">
                                  <h6 className="card-title">{item.name}</h6>
                                  <p className="card-text">
                                    <small className="text-muted">{item.description}</small>
                                  </p>
                                  <p className="fw-bold">{Number.parseFloat(item.price).toLocaleString()} сум</p>

                                  <div className="d-flex align-items-center gap-2">
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${isSelected ? "btn-success" : "btn-outline-success"}`}
                                      onClick={() => handleMenuItemToggle(item)}
                                    >
                                      {isSelected ? "Убрать" : "Добавить"}
                                    </button>

                                    {isSelected && (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        style={{ width: "70px" }}
                                        value={selectedItem.quantity}
                                        onChange={(e) =>
                                          handleMenuItemQuantityChange(item.id, Number.parseInt(e.target.value))
                                        }
                                        min="1"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading || !selectedTable || !formData.startTime}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Создание бронирования...
                      </>
                    ) : (
                      "Забронировать столик"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Сводка бронирования */}
          <div className="col-lg-4">
            <div className="card shadow sticky-top">
              <div className="card-body">
                <h5 className="card-title">Сводка бронирования</h5>

                {selectedTable && (
                  <>
                    <div className="mb-3">
                      <strong>Столик:</strong> {selectedTable.name}
                      <br />
                      <strong>Зона:</strong> {selectedTable.zone_name}
                      <br />
                      <strong>Вместимость:</strong> {selectedTable.capacity} чел.
                    </div>

                    {formData.date && (
                      <div className="mb-3">
                        <strong>Дата:</strong> {new Date(formData.date).toLocaleDateString("ru-RU")}
                        <br />
                        {formData.startTime && formData.endTime && (
                          <>
                            <strong>Время:</strong> {formData.startTime} - {formData.endTime}
                          </>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <strong>Гостей:</strong> {formData.guests}
                    </div>

                    {selectedMenuItems.length > 0 && (
                      <div className="mb-3">
                        <strong>Предзаказанные блюда:</strong>
                        <ul className="list-unstyled mt-2">
                          {selectedMenuItems.map((selectedItem) => {
                            const menuItem = menuItems.find((item) => item.id === selectedItem.menu_item_id)
                            return (
                              <li key={selectedItem.menu_item_id} className="small">
                                {menuItem?.name} x{selectedItem.quantity} ={" "}
                                {(Number.parseFloat(menuItem?.price || 0) * selectedItem.quantity).toLocaleString()} сум
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    <hr />

                    <div className="mb-2">
                      <strong>Цена столика:</strong>{" "}
                      {Number.parseFloat(selectedTable.price_per_hour || 0).toLocaleString()} сум
                    </div>

                    <div className="mb-2">
                      <strong>Депозит (50%):</strong> {calculateDeposit().toLocaleString()} сум
                    </div>

                    {selectedMenuItems.length > 0 && (
                      <div className="mb-2">
                        <strong>Блюда:</strong>{" "}
                        {selectedMenuItems
                          .reduce((total, selectedItem) => {
                            const menuItem = menuItems.find((item) => item.id === selectedItem.menu_item_id)
                            return total + Number.parseFloat(menuItem?.price || 0) * selectedItem.quantity
                          }, 0)
                          .toLocaleString()}{" "}
                        сум
                      </div>
                    )}

                    <hr />

                    <div className="h5">
                      <strong>Итого к оплате:</strong> {calculateTotal().toLocaleString()} сум
                    </div>

                    <small className="text-muted">
                      * Депозит оплачивается при бронировании
                      <br />* Остальная сумма оплачивается в ресторане
                    </small>
                  </>
                )}

                {!selectedTable && <p className="text-muted">Выберите столик для просмотра деталей</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Booking

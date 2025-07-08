import React, { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { bookingAPI } from '../utils/api'

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('click')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const paymentMethods = [
    {
      id: 'click',
      name: 'Click',
      icon: 'bi-credit-card',
      color: 'primary',
      description: 'Оплата через Click'
    },
    {
      id: 'payme',
      name: 'Payme',
      icon: 'bi-wallet2',
      color: 'success',
      description: 'Оплата через Payme'
    },
    {
      id: 'uzcard',
      name: 'UzCard',
      icon: 'bi-credit-card-2-front',
      color: 'info',
      description: 'Оплата через UzCard'
    },
    {
      id: 'humo',
      name: 'Humo',
      icon: 'bi-credit-card-2-back',
      color: 'warning',
      description: 'Оплата через Humo'
    }
  ]

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      const response = await bookingAPI.createPayment(booking.id, {
        method: selectedMethod,
        amount: booking.deposit_amount
      })

      if (response.payment_url) {
        // Открываем платежную страницу в новом окне
        const paymentWindow = window.open(
          response.payment_url,
          'payment',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        )

        // Проверяем закрытие окна оплаты
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed)
            showToast('Информация', 'Окно оплаты закрыто. Проверьте статус платежа.', 'info')
            onSuccess()
          }
        }, 1000)

        showToast('Успешно', 'Перенаправление на страницу оплаты...', 'success')
      }
    } catch (error) {
      showToast('Ошибка', error.message || 'Не удалось создать платеж', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-credit-card me-2"></i>
              Оплата бронирования #{booking.booking_number}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Детали бронирования:</h6>
                <ul className="list-unstyled">
                  <li><strong>Столик:</strong> {booking.table_details?.name}</li>
                  <li><strong>Дата:</strong> {new Date(booking.start_time).toLocaleDateString('ru-RU')}</li>
                  <li><strong>Время:</strong> {new Date(booking.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</li>
                  <li><strong>Гостей:</strong> {booking.guests_count}</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>К оплате:</h6>
                <div className="bg-light p-3 rounded">
                  <div className="d-flex justify-content-between">
                    <span>Депозит:</span>
                    <strong>{booking.deposit_amount?.toLocaleString()} сум</strong>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between">
                    <span><strong>Итого:</strong></span>
                    <strong className="text-primary">{booking.deposit_amount?.toLocaleString()} сум</strong>
                  </div>
                </div>
              </div>
            </div>

            <h6 className="mb-3">Выберите способ оплаты:</h6>
            <div className="row">
              {paymentMethods.map(method => (
                <div key={method.id} className="col-md-6 mb-3">
                  <div 
                    className={`card h-100 cursor-pointer ${selectedMethod === method.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="card-body text-center">
                      <i className={`${method.icon} display-6 text-${method.color} mb-2`}></i>
                      <h6 className="card-title">{method.name}</h6>
                      <p className="card-text small text-muted">{method.description}</p>
                      {selectedMethod === method.id && (
                        <i className="bi bi-check-circle-fill text-success"></i>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="alert alert-info mt-3">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Важно:</strong> После оплаты депозита ваше бронирование будет подтверждено. 
              Остальная сумма оплачивается в ресторане.
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Обработка...
                </>
              ) : (
                <>
                  <i className="bi bi-credit-card me-2"></i>
                  Оплатить {booking.deposit_amount?.toLocaleString()} сум
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
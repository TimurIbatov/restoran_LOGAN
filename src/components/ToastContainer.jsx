import React, { useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    // Инициализируем Bootstrap tooltips/toasts если нужно
    if (window.bootstrap) {
      const toastElements = document.querySelectorAll('.toast')
      toastElements.forEach(toastEl => {
        const toast = new window.bootstrap.Toast(toastEl)
        toast.show()
      })
    }
  }, [toasts])

  const getToastClass = (type) => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'error':
        return 'text-danger'
      case 'warning':
        return 'text-warning'
      default:
        return 'text-info'
    }
  }

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill'
      case 'error':
        return 'bi-exclamation-triangle-fill'
      case 'warning':
        return 'bi-exclamation-circle-fill'
      default:
        return 'bi-info-circle-fill'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast show"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <i className={`bi ${getToastIcon(toast.type)} me-2 ${getToastClass(toast.type)}`}></i>
            <strong className="me-auto">{toast.title}</strong>
            <small>{new Date(toast.timestamp).toLocaleTimeString()}</small>
            <button
              type="button"
              className="btn-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            ></button>
          </div>
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
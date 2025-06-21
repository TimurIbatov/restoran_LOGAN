import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        showToast('Успешно', 'Вы успешно вошли в систему', 'success')
        navigate('/')
      } else {
        showToast('Ошибка', result.error || 'Неверный email или пароль', 'error')
      }
    } catch (error) {
      showToast('Ошибка', 'Произошла ошибка при входе', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section className="page-header login-header">
        <div className="container">
          <h1 className="display-4">Вход в систему</h1>
          <p className="lead">Войдите в свой аккаунт для доступа к полному функционалу</p>
        </div>
      </section>

      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Вход в систему
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Пароль</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-key"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Вход...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Войти
                        </>
                      )}
                    </button>
                    <Link to="/register" className="btn btn-outline-secondary">
                      <i className="bi bi-person-plus me-2"></i>
                      Регистрация
                    </Link>
                  </div>
                </form>

                {/* Демо аккаунты */}
                <div className="mt-4 pt-3 border-top">
                  <h6 className="text-muted mb-3">Демо аккаунты для тестирования:</h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <button 
                        className="btn btn-outline-info btn-sm w-100"
                        onClick={() => setFormData({email: 'admin@logan.com', password: 'admin123'})}
                      >
                        👨‍💼 Администратор
                      </button>
                    </div>
                    <div className="col-md-6 mb-2">
                      <button 
                        className="btn btn-outline-success btn-sm w-100"
                        onClick={() => setFormData({email: 'user@logan.com', password: 'user123'})}
                      >
                        👤 Пользователь
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
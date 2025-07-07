"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const { register, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    checkPasswordStrength(formData.password)
  }, [formData.password])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const checkPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    setPasswordStrength(strength)
  }

  const getPasswordStrengthClass = () => {
    if (passwordStrength <= 25) return "bg-danger"
    if (passwordStrength <= 50) return "bg-warning"
    if (passwordStrength <= 75) return "bg-info"
    return "bg-success"
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      showToast("Ошибка", "Введите имя", "error")
      return false
    }

    if (!formData.lastName.trim()) {
      showToast("Ошибка", "Введите фамилию", "error")
      return false
    }

    if (!formData.email.trim()) {
      showToast("Ошибка", "Введите email", "error")
      return false
    }

    // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    //   showToast("Ошибка", "Введите корректный email", "error")
    //   return false
    // }

    if (!formData.phone.trim()) {
      showToast("Ошибка", "Введите номер телефона", "error")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showToast("Ошибка", "Пароли не совпадают", "error")
      return false
    }

    if (passwordStrength < 50) {
      showToast("Ошибка", "Пароль слишком слабый. Используйте минимум 8 символов, включая буквы и цифры.", "error")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const result = await register({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      })

      if (result.success) {
        if (result.user) {
          showToast("Успешно", "Регистрация прошла успешно! Добро пожаловать!", "success")
          navigate("/")
        } else {
          showToast("Успешно", result.message || "Регистрация прошла успешно", "success")
          navigate("/login")
        }
      } else {
        showToast("Ошибка", result.error || "Ошибка при регистрации", "error")
      }
    } catch (error) {
      console.error("Registration error:", error)
      showToast("Ошибка", error.message || "Произошла ошибка при регистрации", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section className="page-header login-header">
        <div className="container">
          <h1 className="display-4">Регистрация</h1>
          <p className="lead">Создайте аккаунт для доступа к бронированию и другим возможностям</p>
        </div>
      </section>

      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow">
              <div className="card-body p-5 text-dark">
                <h2 className="card-title text-center mb-4">Регистрация</h2>

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">
                        Имя *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email *
                    </label>
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
                        disabled={loading}
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      Телефон *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-telephone"></i>
                      </span>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="+998 (93) 123-45-67"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Пароль *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </button>
                    </div>
                    {formData.password && (
                      <div className="progress mt-2" style={{ height: "5px" }}>
                        <div
                          className={`progress-bar ${getPasswordStrengthClass()}`}
                          role="progressbar"
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    )}
                    <small className="form-text text-muted">Минимум 8 символов, включая буквы и цифры</small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Подтверждение пароля *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <small className="text-danger">Пароли не совпадают</small>
                    )}
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Регистрация...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-plus me-2"></i>
                          Зарегистрироваться
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-4">
                  <p>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

"use client"

import { useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // Инициализируем Bootstrap dropdown после монтирования
  useEffect(() => {
    if (window.bootstrap) {
      // Инициализируем все dropdown элементы
      const dropdownElementList = document.querySelectorAll(".dropdown-toggle")
      dropdownElementList.forEach((dropdownToggleEl) => {
        new window.bootstrap.Dropdown(dropdownToggleEl)
      })
    }
  }, [isAuthenticated, user])

  const handleLogout = () => {
    if (window.confirm("Вы уверены, что хотите выйти из системы?")) {
      logout()
      showToast("Успешно", "Вы вышли из системы", "success")
      navigate("/")
    }
  }

  const isActive = (path) => location.pathname === path

  // Проверяем, может ли пользователь делать бронирования
  const canMakeBookings = !user?.is_admin_user && !user?.is_staff_user

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-cup-hot-fill me-2"></i>
          Ресторан "LOGAN"
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/menu") ? "active" : ""}`} to="/menu">
                <i className="bi bi-journal-text me-1"></i>
                Меню
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/tables") ? "active" : ""}`} to="/tables">
                <i className="bi bi-grid-3x3 me-1"></i>
                Столики
              </Link>
            </li>
            {/* Бронирование только для обычных пользователей */}
            {canMakeBookings && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive("/booking") ? "active" : ""}`} to="/booking">
                  <i className="bi bi-calendar-check me-1"></i>
                  Бронирование
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-nav">
            {isAuthenticated ? (
              <div className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.full_name || user?.first_name || user?.email || "Пользователь"}
                  {user?.role && (
                    <span
                      className={`badge ms-2 ${
                        user.role === "admin" ? "bg-danger" : user.role === "staff" ? "bg-warning" : "bg-primary"
                      }`}
                    >
                      {user.role === "admin" ? "Админ" : user.role === "staff" ? "Сотрудник" : "Пользователь"}
                    </span>
                  )}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  {/* Личный кабинет только для обычных пользователей */}
                  {!user?.is_admin_user && !user?.is_staff_user && (
                    <li>
                      <Link className="dropdown-item" to="/personal-cabinet">
                        <i className="bi bi-person me-2"></i>
                        Личный кабинет
                      </Link>
                    </li>
                  )}

                  {/* Панель администратора */}
                  {user?.is_admin_user && (
                    <>
                      {!user?.is_admin_user && !user?.is_staff_user && (
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                      )}
                      <li>
                        <Link className="dropdown-item text-danger" to="/admin-dashboard">
                          <i className="bi bi-speedometer2 me-2"></i>
                          Панель администратора
                        </Link>
                      </li>
                                          </>
                  )}

                  {/* Панель сотрудника только для сотрудников (не админов) */}
                  {user?.is_staff_user && !user?.is_admin_user && (
                    <>
                      {!user?.is_admin_user && !user?.is_staff_user && (
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                      )}
                      <li>
                        <Link className="dropdown-item text-warning" to="/staff-dashboard">
                          <i className="bi bi-person-badge me-2"></i>
                          Панель сотрудника
                        </Link>
                      </li>
                    </>
                  )}

                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Выйти из системы
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive("/login") ? "active" : ""}`} to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Вход
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive("/register") ? "active" : ""}`} to="/register">
                    <i className="bi bi-person-plus me-1"></i>
                    Регистрация
                  </Link>
                </li>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

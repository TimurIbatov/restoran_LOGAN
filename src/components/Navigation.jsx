import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    showToast('Успешно', 'Вы вышли из системы', 'success')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

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
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/') ? 'active' : ''}`} 
                to="/"
              >
                <i className="bi bi-house me-1"></i>
                Главная
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/menu') ? 'active' : ''}`} 
                to="/menu"
              >
                <i className="bi bi-journal-text me-1"></i>
                Меню
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/tables') ? 'active' : ''}`} 
                to="/tables"
              >
                <i className="bi bi-grid-3x3 me-1"></i>
                Столики
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/booking') ? 'active' : ''}`} 
                to="/booking"
              >
                <i className="bi bi-calendar-check me-1"></i>
                Бронирование
              </Link>
            </li>
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
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.name || user?.email}
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/personal-cabinet">
                      <i className="bi bi-person me-2"></i>
                      Личный кабинет
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Выйти
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/login') ? 'active' : ''}`} 
                    to="/login"
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Вход
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/register') ? 'active' : ''}`} 
                    to="/register"
                  >
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
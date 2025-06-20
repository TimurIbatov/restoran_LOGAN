import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiRequest } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await apiRequest('/auth/check', 'GET')
      if (response.user) {
        setUser(response.user)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      localStorage.removeItem('token')
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', 'POST', { email, password })
      
      if (response.token) {
        localStorage.setItem('token', response.token)
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true }
      }
      
      return { success: false, error: 'Неверные данные для входа' }
    } catch (error) {
      return { success: false, error: error.message || 'Ошибка при входе' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiRequest('/auth/register', 'POST', userData)
      
      if (response.token) {
        localStorage.setItem('token', response.token)
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true }
      }
      
      return { success: false, error: 'Ошибка при регистрации' }
    } catch (error) {
      return { success: false, error: error.message || 'Ошибка при регистрации' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await apiRequest('/users/profile', 'PUT', profileData)
      if (response.user) {
        setUser(response.user)
        return { success: true }
      }
      return { success: false, error: 'Ошибка при обновлении профиля' }
    } catch (error) {
      return { success: false, error: error.message || 'Ошибка при обновлении профиля' }
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '../utils/api'

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
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }

      const userData = await getCurrentUser()
      if (userData) {
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      await apiLogin(email, password)
      const userData = await getCurrentUser()
      
      if (userData) {
        setUser(userData)
        setIsAuthenticated(true)
        return { success: true }
      }
      
      return { success: false, error: 'Не удалось получить данные пользователя' }
    } catch (error) {
      return { success: false, error: error.message || 'Ошибка при входе' }
    }
  }

  const register = async (userData) => {
    try {
      await apiRegister({
        email: userData.email,
        username: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        password: userData.password
      })
      
      // После регистрации автоматически логинимся
      const loginResult = await login(userData.email, userData.password)
      return loginResult
    } catch (error) {
      return { success: false, error: error.message || 'Ошибка при регистрации' }
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await accountAPI.updateProfile(profileData)
      if (response) {
        setUser(response)
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
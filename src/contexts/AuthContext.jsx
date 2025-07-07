"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  logout as apiLogout,
  accountAPI,
} from "../utils/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
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
      const token = localStorage.getItem("access_token")
      if (!token) {
        setLoading(false)
        return
      }

      const userData = await getCurrentUser()
      if (userData) {
        // Добавляем вычисляемые свойства для ролей
        userData.is_admin_user = userData.role === "admin" || userData.is_superuser
        userData.is_staff_user = userData.role === "staff" || userData.role === "admin" || userData.is_staff

        setUser(userData)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      }
    } catch (error) {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await apiLogin(email, password)

      if (response && response.access) {
        const userData = await getCurrentUser()

        if (userData) {
          // Добавляем вычисляемые свойства для ролей
          userData.is_admin_user = userData.role === "admin" || userData.is_superuser
          userData.is_staff_user = userData.role === "staff" || userData.role === "admin" || userData.is_staff

          setUser(userData)
          setIsAuthenticated(true)
          return { success: true }
        }
      }

      return { success: false, error: "Не удалось получить данные пользователя" }
    } catch (error) {
      console.error("Ошибка входа:", error)
      return { success: false, error: error.message || "Ошибка при входе" }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)

      console.log("Данные для регистрации:", userData)

      const response = await apiRegister(userData)

      if (response && response.success) {
        return response
      }

      return { success: false, error: "Ошибка при регистрации" }
    } catch (error) {
      console.error("Ошибка регистрации:", error)

      let errorMessage = "Ошибка при регистрации"

      if (error.message.includes("email")) {
        errorMessage = "Пользователь с таким email уже существует"
      } else if (error.message.includes("username")) {
        errorMessage = "Пользователь с таким именем уже существует"
      } else if (error.message.includes("password") || error.message.includes("пароль")) {
        errorMessage = "Пароль не соответствует требованиям"
      } else if (error.message) {
        errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
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
        // Обновляем данные пользователя с вычисляемыми свойствами
        response.is_admin_user = response.role === "admin" || response.is_superuser
        response.is_staff_user = response.role === "staff" || response.role === "admin" || response.is_staff

        setUser(response)
        return { success: true }
      }
      return { success: false, error: "Ошибка при обновлении профиля" }
    } catch (error) {
      return { success: false, error: error.message || "Ошибка при обновлении профиля" }
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
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

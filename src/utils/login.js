/**
 * Модуль для обработки страницы входа
 */

import { login } from "./auth.js"
import { showToast } from "./scripts.js"

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Получаем данные формы
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      // Проверяем заполнение полей
      if (!email || !password) {
        showToast("Ошибка", "Пожалуйста, заполните все поля", "error")
        return
      }

      try {
        // Отключаем кнопку на время запроса
        const submitButton = loginForm.querySelector('button[type="submit"]')
        submitButton.disabled = true
        submitButton.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Вход...'

        // Выполняем вход
        await login(email, password)

        // Показываем сообщение об успехе
        showToast("Успешно", "Вы успешно вошли в систему", "success")

        // Перенаправляем на главную страницу
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1000)
      } catch (error) {
        // Показываем сообщение об ошибке
        showToast("Ошибка", error.message || "Не удалось войти в систему", "error")

        // Возвращаем кнопку в исходное состояние
        const submitButton = loginForm.querySelector('button[type="submit"]')
        submitButton.disabled = false
        submitButton.innerHTML = "Войти"
      }
    })
  }
})

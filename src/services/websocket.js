// WebSocket сервис для real-time обновлений
class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 5000
    this.listeners = new Map()
  }

  connect(url) {
    try {
      this.socket = new WebSocket(url)
      
      this.socket.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.emit('connected')
      }
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit('message', data)
          
          // Обрабатываем специфичные типы сообщений
          if (data.type) {
            this.emit(data.type, data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected')
        this.emit('disconnected')
        this.attemptReconnect()
      }
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect(this.lastUrl)
      }, this.reconnectInterval)
    } else {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket event callback:', error)
        }
      })
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN
  }
}

// Создаем единственный экземпляр
const websocketService = new WebSocketService()

export default websocketService

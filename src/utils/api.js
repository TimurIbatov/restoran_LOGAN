const API_BASE_URL = 'http://localhost:8000/api' // Замените на ваш API URL

export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('token')
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Мок данные для демонстрации
export const mockData = {
  menuItems: [
    {
      id: 1,
      name: 'Стейк Рибай',
      description: 'Сочный стейк из говядины, приготовленный на гриле',
      price: 85000,
      category: 'Основные блюда',
      category_slug: 'main',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_special: true
    },
    {
      id: 2,
      name: 'Салат Цезарь',
      description: 'Классический салат с курицей, пармезаном и соусом цезарь',
      price: 35000,
      category: 'Салаты',
      category_slug: 'salads',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_special: false
    },
    {
      id: 3,
      name: 'Борщ украинский',
      description: 'Традиционный борщ с говядиной и сметаной',
      price: 25000,
      category: 'Супы',
      category_slug: 'soups',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_special: false
    },
    {
      id: 4,
      name: 'Тирамису',
      description: 'Классический итальянский десерт',
      price: 28000,
      category: 'Десерты',
      category_slug: 'desserts',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_special: true
    }
  ],
  tables: [
    {
      id: 1,
      name: 'Столик №1',
      capacity: 2,
      zone_name: 'Основной зал',
      zone_slug: 'main',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 2,
      name: 'Столик №2',
      capacity: 4,
      zone_name: 'Терраса',
      zone_slug: 'terrace',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 3,
      name: 'VIP Столик №1',
      capacity: 6,
      zone_name: 'VIP-зона',
      zone_slug: 'vip',
      status: 'partially',
      image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      is_active: true
    }
  ],
  bookings: [
    {
      id: 1,
      date: '2025-01-15',
      time: '19:00',
      guests: 2,
      status: 'confirmed',
      comment: 'Столик у окна',
      table: {
        id: 1,
        name: 'Столик №1'
      },
      menu_items: [
        {
          name: 'Стейк Рибай',
          quantity: 1,
          price: 85000
        },
        {
          name: 'Салат Цезарь',
          quantity: 1,
          price: 35000
        }
      ]
    }
  ]
}

// Функция для получения данных с fallback на mock
export const getMockData = (type) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ [type]: mockData[type] })
    }, 500)
  })
}
import React, { useState, useEffect } from 'react'
import { getMockData } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

const Menu = () => {
  const [menuItems, setMenuItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: 'all',
    special: 'all',
    sort: 'default'
  })

  const { showToast } = useToast()

  useEffect(() => {
    loadMenu()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [menuItems, filters])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const data = await getMockData('menuItems')
      setMenuItems(data.menuItems || [])
    } catch (error) {
      console.error('Ошибка загрузки меню:', error)
      showToast('Ошибка', 'Не удалось загрузить меню', 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...menuItems]

    // Фильтр по категории
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category_slug === filters.category)
    }

    // Фильтр по спецпредложениям
    if (filters.special === 'special') {
      filtered = filtered.filter(item => item.is_special)
    }

    // Сортировка
    switch (filters.sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }

    setFilteredItems(filtered)
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const resetFilters = () => {
    setFilters({
      category: 'all',
      special: 'all',
      sort: 'default'
    })
  }

  const renderMenuItems = () => {
    if (filteredItems.length === 0) {
      return (
        <div className="col-12 text-center">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Нет блюд, соответствующих выбранным фильтрам
          </div>
        </div>
      )
    }

    // Группируем по категориям
    const groupedItems = filteredItems.reduce((acc, item) => {
      const category = item.category || 'Прочее'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {})

    return Object.entries(groupedItems).map(([category, items]) => (
      <div key={category} className="menu-category mb-5">
        <h3 className="menu-category-title">{category}</h3>
        <div className="row">
          {items.map(item => (
            <div key={item.id} className="col-md-4">
              <div className="menu-item position-relative">
                {item.is_special && (
                  <div className="special-badge">Спецпредложение</div>
                )}
                <div className="menu-item-image">
                  <img
                    src={item.image || 'https://via.placeholder.com/400x200'}
                    alt={item.name}
                    className="img-fluid"
                  />
                </div>
                <div className="menu-item-title h5">{item.name}</div>
                <div className="menu-item-description text-muted">
                  {item.description || 'Без описания'}
                </div>
                <div className="menu-item-price text-primary fw-bold">
                  {item.price.toLocaleString()} сум
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))
  }

  return (
    <div>
      <section className="page-header menu-header">
        <div className="container">
          <h1 className="display-4">Наше меню</h1>
          <p className="lead">Изысканные блюда от наших шеф-поваров</p>
        </div>
      </section>

      <main className="container">
        {/* Фильтры */}
        <div className="menu-filters">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <label htmlFor="categoryFilter" className="form-label">Категория</label>
              <select
                className="form-select"
                id="categoryFilter"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="all">Все категории</option>
                <option value="starters">Закуски</option>
                <option value="salads">Салаты</option>
                <option value="soups">Супы</option>
                <option value="main">Основные блюда</option>
                <option value="desserts">Десерты</option>
                <option value="drinks">Напитки</option>
              </select>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <label htmlFor="specialFilter" className="form-label">
                Специальные предложения
              </label>
              <select
                className="form-select"
                id="specialFilter"
                name="special"
                value={filters.special}
                onChange={handleFilterChange}
              >
                <option value="all">Все блюда</option>
                <option value="special">Только специальные</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="sortFilter" className="form-label">Сортировка</label>
              <select
                className="form-select"
                id="sortFilter"
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
              >
                <option value="default">По умолчанию</option>
                <option value="price-asc">По цене (возрастание)</option>
                <option value="price-desc">По цене (убывание)</option>
                <option value="name-asc">По названию (А-Я)</option>
              </select>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12 text-end">
              <button className="btn btn-outline-secondary me-2" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Меню */}
        <div id="menuContainer">
          {loading ? (
            <LoadingSpinner message="Загрузка меню..." />
          ) : (
            <div className="row">
              {renderMenuItems()}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Menu
"use client"

import { useState, useEffect } from "react"
import { restaurantAPI } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"
import { useToast } from "../contexts/ToastContext"

const Menu = () => {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const { showToast } = useToast()

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    try {
      setLoading(true)
      const [menuData, categoriesData] = await Promise.all([
        restaurantAPI.getMenuItems(),
        restaurantAPI.getMenuCategories(),
      ])

      // Обрабатываем меню
      let processedMenu = []
      if (Array.isArray(menuData)) {
        processedMenu = menuData
      } else {
        
      }

      setMenuItems(processedMenu.filter((item) => item.is_available))

      // Обрабатываем категории
      let processedCategories = []
      if (Array.isArray(categoriesData)) {
        processedCategories = categoriesData
      } else {
        // Извлекаем категории из меню
        const uniqueCategories = [...new Set(processedMenu.map((item) => item.category_name))]
        processedCategories = uniqueCategories.map((name, index) => ({
          id: index + 1,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
        }))
      }

      setCategories(processedCategories)
    } catch (error) {
      console.error("Ошибка загрузки меню:", error)
      showToast("Ошибка", "Не удалось загрузить меню", "error")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!Array.isArray(menuItems)) return []

    let filtered = [...menuItems]

    // Фильтр по категории
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category_name === selectedCategory)
    }

    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "name":
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }

  const filteredItems = applyFilters()

  return (
    <div>
      <section className="bg-primary text-white py-5">
        <div className="container">
          <h1 className="display-4">Наше меню</h1>
          <p className="lead">Изысканные блюда от наших шеф-поваров</p>
        </div>
      </section>

      <main className="container my-5">
        {loading ? (
          <LoadingSpinner message="Загрузка меню..." />
        ) : (
          <>
            {/* Фильтры */}
            <div className="row mb-4">
              <div className="col-md-4 mb-3">
                <label htmlFor="categoryFilter" className="form-label">
                  Категория
                </label>
                <select
                  id="categoryFilter"
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Все категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="searchInput" className="form-label">
                  Поиск
                </label>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control"
                  placeholder="Поиск по названию или описанию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="sortSelect" className="form-label">
                  Сортировка
                </label>
                <select
                  id="sortSelect"
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">По названию</option>
                  <option value="price-asc">По цене (возрастание)</option>
                  <option value="price-desc">По цене (убывание)</option>
                </select>
              </div>
            </div>

            {/* Результаты */}
            <div className="row">
              <div className="col-12 mb-3">
                <p className="text-muted">
                  Найдено блюд: <strong>{filteredItems.length}</strong>
                </p>
              </div>
            </div>

            {/* Меню */}
            <div className="row">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div key={item.id} className="col-lg-4 col-md-6 mb-4">
                    <div className="card h-100 shadow-sm">
                      <img
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                        }
                        className="card-img-top"
                        alt={item.name}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title">{item.name}</h5>
                          <span className="badge bg-secondary">{item.category_name}</span>
                        </div>
                        <p className="card-text text-muted flex-grow-1">{item.description}</p>
                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <span className="h5 text-success mb-0">{item.price.toLocaleString()} сум</span>
                          {item.is_available ? (
                            <span className="badge bg-success">Доступно</span>
                          ) : (
                            <span className="badge bg-danger">Нет в наличии</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="bi bi-search display-1 text-muted"></i>
                    <h3 className="mt-3">Блюда не найдены</h3>
                    <p className="text-muted">Попробуйте изменить параметры поиска</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Menu

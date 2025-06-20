import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="page-header" style={{
        background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="display-3 fw-bold mb-4">Добро пожаловать в ресторан "LOGAN"</h1>
              <p className="lead mb-4">
                Изысканная кухня, уютная атмосфера и безупречный сервис для незабываемого вечера
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Link to="/menu" className="btn btn-primary btn-lg">
                  <i className="bi bi-journal-text me-2"></i>
                  Посмотреть меню
                </Link>
                <Link to="/tables" className="btn btn-outline-light btn-lg">
                  <i className="bi bi-calendar-check me-2"></i>
                  Забронировать столик
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center">
            <div className="col-lg-4 mb-4">
              <div className="card h-100 border-0 shadow">
                <div className="card-body p-4">
                  <i className="bi bi-award-fill text-primary display-4 mb-3"></i>
                  <h4>Премиальное качество</h4>
                  <p className="text-muted">
                    Только свежие продукты от проверенных поставщиков и опытные шеф-повара
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 mb-4">
              <div className="card h-100 border-0 shadow">
                <div className="card-body p-4">
                  <i className="bi bi-clock-fill text-primary display-4 mb-3"></i>
                  <h4>Быстрая подача</h4>
                  <p className="text-muted">
                    Профессиональная кухня гарантирует быструю подачу без потери качества
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 mb-4">
              <div className="card h-100 border-0 shadow">
                <div className="card-body p-4">
                  <i className="bi bi-heart-fill text-primary display-4 mb-3"></i>
                  <h4>Уютная атмосфера</h4>
                  <p className="text-muted">
                    Располагающая обстановка для романтических свиданий и деловых встреч
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h2 className="mb-3">Готовы к незабываемому вечеру?</h2>
              <p className="mb-0">
                Забронируйте столик прямо сейчас и насладитесь изысканной кухней в уютной атмосфере
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/booking" className="btn btn-light btn-lg">
                <i className="bi bi-calendar-check me-2"></i>
                Забронировать
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
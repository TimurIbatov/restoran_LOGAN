import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-5">
      <div className="container">
        <div className="row text-center text-md-start">
          <div className="col-md-4 mb-3 mb-md-0">
            <h5>Ресторан "LOGAN"</h5>
            <p className="text-secondary">Лучшие блюда для настоящих гурманов</p>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <h5>Контакты</h5>
            <p className="text-secondary">
              <i className="bi bi-geo-alt me-1"></i>Адрес: ул. Рудаки, 1<br />
              <i className="bi bi-telephone me-1"></i>Телефон: +998 (93) 668-29-24<br />
              <i className="bi bi-envelope me-1"></i>Email: info@gurman-restaurant.ru
            </p>
          </div>
          <div className="col-md-4">
            <h5>Мы в социальных сетях</h5>
            <div className="d-flex gap-3 fs-4 justify-content-center justify-content-md-start">
              <a href="#" className="text-white">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-telegram"></i>
              </a>
            </div>
          </div>
        </div>
        <hr className="my-4" />
        <div className="text-center">
          <p className="mb-0">&copy; 2025 Ресторан "LOGAN". Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
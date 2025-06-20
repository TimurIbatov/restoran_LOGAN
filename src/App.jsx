import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import ToastContainer from './components/ToastContainer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import Tables from './pages/Tables'
import PersonalCabinet from './pages/PersonalCabinet'
import Booking from './pages/Booking'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="App">
            <Navigation />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/personal-cabinet" element={<PersonalCabinet />} />
                <Route path="/booking" element={<Booking />} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
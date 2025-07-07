import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Menu from "./pages/Menu";
import Tables from "./pages/Tables";
import PersonalCabinet from "./pages/PersonalCabinet";
import Booking from "./pages/Booking";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import "./App.css";

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-gray-900 text-white">
            <header>
              <Navigation />
            </header>
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/personal-cabinet" element={<PersonalCabinet />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/staff-dashboard" element={<StaffDashboard />} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
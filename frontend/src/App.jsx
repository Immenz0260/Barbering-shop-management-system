import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AuthProvider } from "./context/AuthContext";
import ForgotPasswordPage from "./pages/FogotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingPage from "./pages/BookingPage";  
import ProtectedRoute from "./components/ProtectedRoute";  
import DashboardPage from "./pages/DashboardPage";  

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage/>} />
          <Route path="/reset-password" element={<ResetPasswordPage/>} />
          <Route path="/booking" element={<BookingPage />} />
          <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["owner"]}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
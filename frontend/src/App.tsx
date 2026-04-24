import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CalendarPage } from './pages/CalendarPage';
import { AdminOfficesRoomsPage } from './pages/AdminOfficesRoomsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/ToastProvider';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/offices-rooms"
            element={
              <ProtectedRoute adminOnly>
                <AdminOfficesRoomsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

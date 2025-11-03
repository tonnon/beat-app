import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/protected-route/ProtectedRoute';
import PublicRoute from '@/components/public-route/PublicRoute';
import HomePage from '@/pages/home/HomePage';
import EmployeePage from '@/pages/user-employee/UserEmployeePage';
import AdminPage from '@/pages/user-admin/UserAdminPage';
import ManagerPage from '@/pages/user-manager/UserManagerPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/daily" 
        element={
          <ProtectedRoute>
            <EmployeePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <ManagerPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

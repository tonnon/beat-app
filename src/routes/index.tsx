import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/protected-route/ProtectedRoute';
import PublicRoute from '@/components/public-route/PublicRoute';
import HomePage from '@/pages/home/HomePage';
import UserPage from '@/pages/user-default/UserPage';
import AdminPage from '@/pages/user-admin/AdminPage';
import EnterpriseAdminPage from '@/pages/user-enterprise-admin/EntrepriseAdminPage';

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
            <UserPage />
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
            <EnterpriseAdminPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

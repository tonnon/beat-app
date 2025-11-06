import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/protected-route/ProtectedRoute';
import PublicRoute from '@/components/public-route/PublicRoute';
import HomePage from '@/pages/home/HomePage';
import QuestionnairesPage from '@/pages/user-employee/questionnaires/QuestionnairesPage';
import DailyPage from '@/pages/user-employee/daily/DailyPage';
import EducationPage from '@/pages/user-employee/education/EducationPage';
import PraticePage from '@/pages/user-employee/pratice/PraticePage';
import CalendarPage from '@/pages/user-employee/calendar/CalendarPage';
import AdminPage from '@/pages/user-admin/UserAdminPage';
import ManagerPage from '@/pages/user-manager/UserManagerPage';
import BottomNavLayout from '@/layout/user-layout/BottomNavLayout';
import { DEFAULT_BOTTOM_NAVBAR_ITEMS } from '@/components/navbar/bottom-navbar/defaultItems';

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
        element={
          <ProtectedRoute>
            <BottomNavLayout items={DEFAULT_BOTTOM_NAVBAR_ITEMS} />
          </ProtectedRoute>
        }
      >
        <Route path="/daily" element={<DailyPage />} />
  <Route path="/questionnaires" element={<QuestionnairesPage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/pratice" element={<PraticePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>
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

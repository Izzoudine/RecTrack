import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import ChiefLayout from './layouts/ChiefLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import UserDashboard from './pages/user/Dashboard';
import UserRecommendations from './pages/user/Recommendations';

import AdminDashboard from './pages/admin/Dashboard';
import AdminDepartments from './pages/admin/Departments';
import AdminRecommendations from './pages/admin/Recommendations';
import AdminUsers from './pages/admin/Users';

import ChiefDashboard from './pages/chief/Dashboard';
import ChiefValidations from './pages/chief/Validations';
import ChiefRecommendations from './pages/chief/Recommendations';
import ChiefUsers from './pages/chief/Users';
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* User Routes */}
      <Route element={<UserLayout />}>
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user']} requireDepartment>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/recommendations"
          element={
            <ProtectedRoute allowedRoles={['user']} requireDepartment>
              <UserRecommendations />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recommendations"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Chief Routes */}
      <Route element={<ChiefLayout />}>
        <Route
          path="/chief"
          element={
            <ProtectedRoute allowedRoles={['chief']}>
              <ChiefDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chief/recommendations"
          element={
            <ProtectedRoute allowedRoles={['chief']}>
              <ChiefRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chief/validations"
          element={
            <ProtectedRoute allowedRoles={['chief']}>
              <ChiefValidations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chief/users"
          element={
            <ProtectedRoute allowedRoles={['chief']}>
              <ChiefUsers />
            </ProtectedRoute>
          }
        />
      </Route>


      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
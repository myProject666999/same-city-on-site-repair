import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import NewsList from './pages/NewsList';
import NewsDetail from './pages/NewsDetail';
import Comments from './pages/Comments';
import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import CategoryManage from './pages/admin/CategoryManage';
import ProductManage from './pages/admin/ProductManage';
import OrderManage from './pages/admin/OrderManage';
import UserManage from './pages/admin/UserManage';
import CommentManage from './pages/admin/CommentManage';
import NewsManage from './pages/admin/NewsManage';
import BannerManage from './pages/admin/BannerManage';
import AdminSettings from './pages/admin/AdminSettings';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'staff' && user.role !== 'admin' && user.role !== 'staff') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  return children;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      <Route path="/" element={
        <PublicRoute>
          <Home />
        </PublicRoute>
      } />
      <Route path="/products" element={
        <PublicRoute>
          <ProductList />
        </PublicRoute>
      } />
      <Route path="/products/:id" element={
        <PublicRoute>
          <ProductDetail />
        </PublicRoute>
      } />
      <Route path="/cart" element={
        <PrivateRoute>
          <Cart />
        </PrivateRoute>
      } />
      <Route path="/orders" element={
        <PrivateRoute>
          <OrderList />
        </PrivateRoute>
      } />
      <Route path="/orders/:id" element={
        <PrivateRoute>
          <OrderDetail />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      <Route path="/news" element={
        <PublicRoute>
          <NewsList />
        </PublicRoute>
      } />
      <Route path="/news/:id" element={
        <PublicRoute>
          <NewsDetail />
        </PublicRoute>
      } />
      <Route path="/comments" element={
        <PrivateRoute>
          <Comments />
        </PrivateRoute>
      } />

      <Route path="/admin/*" element={
        <PrivateRoute requiredRole="staff">
          <AdminLayout>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="categories" element={<CategoryManage />} />
              <Route path="products" element={<ProductManage />} />
              <Route path="orders" element={<OrderManage />} />
              <Route path="users" element={
                <PrivateRoute requiredRole="admin">
                  <UserManage />
                </PrivateRoute>
              } />
              <Route path="comments" element={<CommentManage />} />
              <Route path="news" element={<NewsManage />} />
              <Route path="banners" element={<BannerManage />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </AdminLayout>
        </PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

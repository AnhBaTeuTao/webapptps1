import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import StoreLayout from './layouts/StoreLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StoreHomePage from './pages/StoreHomePage';
import { LanguageProvider } from './contexts/LanguageContext';

const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ExcelOrderPage = lazy(() => import('./pages/ExcelOrderPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

const LoadingScreen = () => (
  <div className="fixed inset-0 min-h-screen bg-white flex flex-col items-center justify-center z-50">
    <img
      src={`${import.meta.env.BASE_URL}images/tps1-logo-vertical.png`}
      alt="Thực Phẩm Số Một"
      className="w-36 max-w-[50vw] h-auto object-contain mb-6 animate-pulse"
    />
    <div className="w-8 h-8 border-3 border-[#eaf6ef] border-t-[#0f7a4f] rounded-full animate-spin" />
    <p className="mt-3 text-xs font-medium text-[#59665f] tracking-wide">Đang tải dữ liệu...</p>
  </div>
);

// App chỉ dành cho khách hàng. Cửa hàng (trang chủ, danh mục, sản phẩm, giỏ
// hàng) mở cho khách chưa đăng nhập; đặt nhanh, đơn hàng, tài khoản bắt đăng
// nhập và đưa khách quay lại đúng trang sau khi đăng nhập (?quay-lai=).
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to={`/dang-nhap?quay-lai=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  // Mật khẩu do sale cấp lần đầu bắt buộc phải đổi trước khi làm gì khác —
  // chặn cứng ở đây, không chỉ ẩn/hiện nút trên giao diện.
  if (session.mustChangePassword && location.pathname !== '/doi-mat-khau') {
    return <Navigate to="/doi-mat-khau" replace />;
  }
  return <>{children}</>;
};

// Trang công khai: khách đã đăng nhập bằng mật khẩu tạm do sale cấp vẫn
// phải đổi mật khẩu trước, giống các trang bắt đăng nhập.
const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (session?.mustChangePassword) return <Navigate to="/doi-mat-khau" replace />;
  return <>{children}</>;
};

function NativeBackButton() {
  const location = useLocation();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener('backButton', () => {
      if (location.pathname === '/') void NativeApp.exitApp();
      else window.history.back();
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, [location.pathname]);
  return null;
}

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) void SplashScreen.hide();
  }, []);
  const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
  return (
    <LanguageProvider><AuthProvider>
      <CartProvider>
        <Router>
          <NativeBackButton />
          <Suspense fallback={<LoadingScreen />}><Routes>
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/" element={<StoreLayout />}>
              {/* Công khai */}
              <Route index element={<PasswordGate><StoreHomePage /></PasswordGate>} />
              <Route path="danh-muc" element={<PasswordGate><ProductListingPage mode="categories" /></PasswordGate>} />
              <Route path="danh-muc/:slug" element={<PasswordGate><ProductListingPage mode="category" /></PasswordGate>} />
              <Route path="tim-kiem" element={<PasswordGate><ProductListingPage mode="search" /></PasswordGate>} />
              <Route path="san-pham/:id" element={<PasswordGate><ProductDetailPage /></PasswordGate>} />
              <Route path="gio-hang" element={<PasswordGate><CartPage /></PasswordGate>} />
              {/* Bắt đăng nhập */}
              <Route path="dat-hang" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
              <Route path="dat-hang/excel" element={<ProtectedRoute><ExcelOrderPage /></ProtectedRoute>} />
              <Route path="don-hang" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="don-hang/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="tai-khoan" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="doi-mat-khau" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>
        </Router>
      </CartProvider>
    </AuthProvider></LanguageProvider>
  );
}

export default App;

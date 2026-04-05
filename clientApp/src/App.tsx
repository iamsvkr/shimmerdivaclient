import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Public
import PublicLayout from './pages/public/PublicLayout'
import Home from './pages/public/Home'
import Shop from './pages/public/Shop'
import ItemDetail from './pages/public/ItemDetail'
import Cart from './pages/public/Cart'
import Checkout from './pages/public/Checkout'

// Auth
import Login from './pages/Login'

// Admin
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ItemsList from './pages/admin/items/ItemsList'
import CategoriesList from './pages/admin/categories/CategoriesList'
import MaterialsList from './pages/admin/materials/MaterialsList'
import OrdersList from './pages/admin/orders/OrdersList'
import StockList from './pages/admin/stock/StockList'
import PromoCodesList from './pages/admin/promocodes/PromoCodesList'
import ReviewsList from './pages/admin/reviews/ReviewsList'

export const App = () => (
  <Routes>
    {/* Public storefront */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/item/:id" element={<ItemDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
    </Route>

    {/* Auth */}
    <Route path="/login" element={<Login />} />

    {/* Admin panel */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="items" element={<ItemsList />} />
      <Route path="categories" element={<CategoriesList />} />
      <Route path="materials" element={<MaterialsList />} />
      <Route path="orders" element={<OrdersList />} />
      <Route path="stock" element={<StockList />} />
      <Route path="promocodes" element={<PromoCodesList />} />
      <Route path="reviews" element={<ReviewsList />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

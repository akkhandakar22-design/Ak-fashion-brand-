import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Trending from './pages/Trending';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import Address from './pages/Address';
import Settings from './pages/Settings';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  if (loading) return null;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="trending" element={<Trending />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="cart" element={<Cart />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="address" element={<Address />} />
            <Route path="settings/:type" element={<Settings />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </AppProvider>
  );
}

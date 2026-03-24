import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { cart, t } = useApp();
  const location = useLocation();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="mobile-container">
      <main className={`flex-1 overflow-y-auto ${isAdminPage ? '' : 'pb-20'}`}>
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>

      {!isAdminPage && (
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(100%-3rem)] mx-auto bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50 flex items-center justify-around px-4 py-2 z-50">
          <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{t('home')}</span>
              </>
            )}
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <Grid size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{t('explore')}</span>
              </>
            )}
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''} relative`}>
            {({ isActive }) => (
              <>
                <div className="relative">
                  <ShoppingCart size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg shadow-primary/30">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{t('cart')}</span>
              </>
            )}
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <ClipboardList size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{t('orders')}</span>
              </>
            )}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{t('account')}</span>
              </>
            )}
          </NavLink>
        </nav>
      )}
    </div>
  );
}

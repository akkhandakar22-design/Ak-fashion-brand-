import React from 'react';
import { motion } from 'motion/react';
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, Package, Heart, MapPin } from 'lucide-react';
import { useApp } from '../AppContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { user, setUser, t } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-12 text-center space-y-8 bg-ivory">
        <div className="w-32 h-32 neumorphic-circle text-primary/30">
          <User size={48} strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-luxury-black">{t('welcome')}</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">Login to access your exclusive <br/>collection and orders</p>
        </div>
        <button 
          onClick={() => navigate('/auth')}
          className="bg-primary text-white px-10 py-4 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          {t('login')} / {t('register')}
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-32 bg-ivory min-h-screen"
    >
      {/* Profile Header */}
      <div className="luxury-dark p-10 pt-16 rounded-b-[48px] border-b border-gold/20 shadow-[0_20px_40px_rgba(0,0,0,0.1)] space-y-8">
        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-24 h-24 neumorphic-circle p-1 bg-black/20 border border-gold/30">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl font-display font-bold gold-text border border-gold/10">
              {user.name[0]}
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold gold-text">{user.name}</h2>
            <p className="text-[10px] font-bold text-gold-light/60 uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 relative z-10">
          <Link to="/orders" className="bg-black/40 border border-gold/20 p-4 rounded-[24px] flex flex-col items-center space-y-2 shadow-sm hover:border-gold/40 transition-all active:scale-95">
            <Package size={18} strokeWidth={1.5} className="text-gold" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold-light/80">{t('orders')}</span>
          </Link>
          <Link to="/wishlist" className="bg-black/40 border border-gold/20 p-4 rounded-[24px] flex flex-col items-center space-y-2 shadow-sm hover:border-gold/40 transition-all active:scale-95">
            <Heart size={18} strokeWidth={1.5} className="text-gold" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold-light/80">{t('wishlist')}</span>
          </Link>
          <Link to="/address" className="bg-black/40 border border-gold/20 p-4 rounded-[24px] flex flex-col items-center space-y-2 shadow-sm hover:border-gold/40 transition-all active:scale-95">
            <MapPin size={18} strokeWidth={1.5} className="text-gold" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold-light/80">{t('address')}</span>
          </Link>
        </div>
      </div>

      {/* Menu */}
      <div className="p-8 space-y-10">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] px-4">Account Excellence</h3>
          <div className="bg-white/40 border border-white rounded-[40px] overflow-hidden shadow-sm">
            <Link to="/settings/personal">
              <MenuItem icon={<User size={18} strokeWidth={1.5} />} label={t('personal_profile')} />
            </Link>
            <Link to="/settings/notifications">
              <MenuItem icon={<Bell size={18} strokeWidth={1.5} />} label={t('notifications')} />
            </Link>
            <Link to="/settings/security">
              <MenuItem icon={<Shield size={18} strokeWidth={1.5} />} label={t('security_privacy')} />
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin">
                <MenuItem icon={<Settings size={18} strokeWidth={1.5} />} label={t('admin_panel')} />
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] px-4">Concierge</h3>
          <div className="bg-white/40 border border-white rounded-[40px] overflow-hidden shadow-sm">
            <Link to="/settings/help">
              <MenuItem icon={<HelpCircle size={18} strokeWidth={1.5} />} label={t('help_center')} />
            </Link>
            <Link to="/settings/preferences">
              <MenuItem icon={<Settings size={18} strokeWidth={1.5} />} label={t('preferences')} />
            </Link>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-5 bg-white border border-black/5 text-primary rounded-full font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-sm"
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="w-full flex items-center justify-between p-6 hover:bg-white/60 transition-colors border-b border-black/5 last:border-0 cursor-pointer">
      <div className="flex items-center space-x-4">
        <div className="text-primary/60">{icon}</div>
        <span className="text-xs font-bold text-luxury-black/80 uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight size={14} className="text-gray-300" />
    </div>
  );
}

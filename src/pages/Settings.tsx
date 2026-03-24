import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, User, Bell, Shield, HelpCircle, Settings as SettingsIcon, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import toast from 'react-hot-toast';

export default function Settings() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user, setUser, language, setLanguage, t, currency, setCurrency } = useApp();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = () => {
    if (!user) return;
    setUser({ ...user, ...formData });
    toast.success(t('profile_updated'));
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHelpClick = (label: string) => {
    toast.success(`Opening ${label}... Our curator will be with you shortly.`);
  };

  const renderContent = () => {
    switch (type) {
      case 'personal':
        return (
          <div className="space-y-8">
            <div className="bg-white/50 border border-white p-8 rounded-[40px] shadow-sm space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-4">{t('full_name') || 'Full Name'}</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-ivory/50 border border-white rounded-full p-5 text-sm outline-none shadow-inner transition-all font-light"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-4">{t('email_address') || 'Email Address'}</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-ivory/50 border border-white rounded-full p-5 text-sm outline-none shadow-inner transition-all font-light"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-4">{t('phone_number') || 'Phone Number'}</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-ivory/50 border border-white rounded-full p-5 text-sm outline-none shadow-inner transition-all font-light"
                />
              </div>
            </div>
            <button 
              onClick={handleSave}
              className="w-full py-5 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <Save size={18} strokeWidth={1.5} />
              <span>{t('update_profile') || 'Update Profile'}</span>
            </button>
          </div>
        );
      case 'notifications':
        return (
          <div className="bg-white/50 border border-white p-8 rounded-[40px] shadow-sm space-y-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('communication_preferences') || 'Communication Preferences'}</h3>
            <div className="space-y-6">
              <ToggleItem label={t('email_notifications') || 'Email Notifications'} description="Receive updates about your orders and exclusive collections" defaultChecked={true} />
              <ToggleItem label={t('sms_alerts') || 'SMS Alerts'} description="Get real-time tracking updates on your mobile device" defaultChecked={true} />
              <ToggleItem label={t('push_notifications') || 'Push Notifications'} description="Be the first to know about new arrivals and limited drops" defaultChecked={false} />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <div className="bg-white/50 border border-white p-8 rounded-[40px] shadow-sm space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('security_privacy')}</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-ivory/30 rounded-[24px] border border-white">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-luxury-black uppercase tracking-widest">Two-Factor Authentication</span>
                    <p className="text-[9px] text-gray-400 font-light">Enhance your account security</p>
                  </div>
                  <button className="text-primary text-[10px] font-bold uppercase tracking-widest">Enable</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-ivory/30 rounded-[24px] border border-white">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-luxury-black uppercase tracking-widest">Change Password</span>
                    <p className="text-[9px] text-gray-400 font-light">Last updated 3 months ago</p>
                  </div>
                  <button className="text-primary text-[10px] font-bold uppercase tracking-widest">Update</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'preferences':
        return (
          <div className="bg-white/50 border border-white p-8 rounded-[40px] shadow-sm space-y-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('preferences')}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-luxury-black uppercase tracking-widest">{t('currency')}</span>
                <select 
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value as any);
                    toast.success(`Currency updated to ${e.target.value}`);
                  }}
                  className="bg-ivory/50 border border-white rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BDT">BDT (৳)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-luxury-black uppercase tracking-widest">{t('language')}</span>
                <select 
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value as 'en' | 'bn');
                    toast.success(e.target.value === 'bn' ? 'ভাষা পরিবর্তন করা হয়েছে' : 'Language updated');
                  }}
                  className="bg-ivory/50 border border-white rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none"
                >
                  <option value="en">English</option>
                  <option value="bn">Bengali (বাংলা)</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-8">
            <div className="bg-white/50 border border-white p-8 rounded-[40px] shadow-sm space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('help_center')}</h3>
              <div className="space-y-4">
                <HelpItem label="Order Inquiries" onClick={() => handleHelpClick('Order Inquiries')} />
                <HelpItem label="Shipping & Returns" onClick={() => handleHelpClick('Shipping & Returns')} />
                <HelpItem label="Authenticity Guarantee" onClick={() => handleHelpClick('Authenticity Guarantee')} />
                <HelpItem label="Contact Curator" onClick={() => handleHelpClick('Contact Curator')} />
              </div>
            </div>
            <button 
              onClick={() => toast.success('Connecting to live support...')}
              className="w-full py-5 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              Start Live Chat
            </button>
          </div>
        );
      default:
        return <div>Section not found.</div>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'personal': return t('personal_profile');
      case 'notifications': return t('notifications');
      case 'security': return t('security_privacy');
      case 'preferences': return t('preferences');
      case 'help': return t('help_center');
      default: return 'Settings';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-32 bg-ivory min-h-screen p-8 space-y-10"
    >
      <div className="flex items-center space-x-6">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="w-12 h-12 neumorphic-circle text-luxury-black">
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 className="text-3xl font-light text-luxury-black">{getTitle()}</h1>
      </div>

      {renderContent()}
    </motion.div>
  );
}

function ToggleItem({ label, description, defaultChecked }: { label: string, description: string, defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1 flex-1 pr-8">
        <span className="text-xs font-bold text-luxury-black uppercase tracking-widest">{label}</span>
        <p className="text-[9px] text-gray-400 font-light leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-primary shadow-inner' : 'bg-gray-200 shadow-inner'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function HelpItem({ label, onClick }: { label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-ivory/30 rounded-[24px] border border-white hover:bg-white transition-colors active:scale-95"
    >
      <span className="text-xs font-bold text-luxury-black uppercase tracking-widest">{label}</span>
      <ChevronLeft size={14} className="text-gray-300 rotate-180" />
    </button>
  );
}

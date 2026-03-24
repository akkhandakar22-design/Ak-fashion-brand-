import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, ChevronLeft, Save, Plus, Trash2, Edit, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import toast from 'react-hot-toast';

export default function Address() {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    const loadingToast = toast.loading('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Using OpenStreetMap's Nominatim for reverse geocoding (free)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setAddress(data.display_name);
            setIsEditing(true);
            toast.success('Location detected!', { id: loadingToast });
          } else {
            toast.error('Could not find address for this location', { id: loadingToast });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Failed to get address from coordinates', { id: loadingToast });
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let msg = 'Location unavailable';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Please allow location access in your browser settings';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Request timed out. Please try again or check GPS.';
        }
        toast.error(msg, { id: loadingToast });
        setIsDetecting(false);
      },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  };

  const handleSave = () => {
    if (!user) return;
    setUser({ ...user, address });
    toast.success('Address updated successfully');
    setIsEditing(false);
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
        <h1 className="text-3xl font-light text-luxury-black">Address</h1>
      </div>

      <div className="space-y-8">
        <div className="bg-white/50 border border-white p-8 rounded-[40px] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Primary Residence</h3>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-primary/60">
                <Edit size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-6">
              <div className="relative">
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address..."
                  className="w-full h-40 bg-ivory/50 border border-white rounded-[32px] p-6 text-sm outline-none shadow-inner transition-all font-light"
                />
                <button 
                  onClick={detectLocation}
                  disabled={isDetecting}
                  className="absolute bottom-6 right-6 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-primary hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                  title="Detect My Location"
                >
                  <Navigation size={18} strokeWidth={1.5} className={isDetecting ? 'animate-pulse' : ''} />
                </button>
              </div>
              <button 
                onClick={handleSave}
                className="w-full py-5 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                <Save size={18} strokeWidth={1.5} />
                <span>Save Address</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 neumorphic-circle text-primary/40">
                  <MapPin size={18} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-luxury-black leading-relaxed font-light">
                    {address || 'No address provided yet.'}
                  </p>
                </div>
              </div>
              {!address && (
                <button 
                  onClick={detectLocation}
                  disabled={isDetecting}
                  className="w-full py-4 bg-primary/5 text-primary border border-primary/10 rounded-full font-bold text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all"
                >
                  <Navigation size={14} strokeWidth={1.5} className={isDetecting ? 'animate-pulse' : ''} />
                  <span>{isDetecting ? 'Detecting...' : 'Detect My Location'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <button className="w-full py-5 bg-white border border-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] text-gray-400 flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-sm">
            <Plus size={18} strokeWidth={1.5} />
            <span>Add New Address</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

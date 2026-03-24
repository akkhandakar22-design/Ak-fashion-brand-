import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, CreditCard, Wallet, Truck, ChevronLeft, CheckCircle2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import toast from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Checkout() {
  const { user, setUser, cart, cartTotal, clearCart, formatPrice } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setAddress(data.display_name);
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

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place order');
      navigate('/auth');
      return;
    }

    if (isPlacingOrder) return;
    setIsPlacingOrder(true);
    const loadingToast = toast.loading('Placing your order...');

    try {
      const orderData = {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        phone: phone,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.discount_price || item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total_price: cartTotal,
        status: 'pending',
        payment_method: paymentMethod,
        address: address,
        created_at: new Date().toISOString(),
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Notify Admin via Email
      try {
        fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: docRef.id,
            userName: user.name,
            totalPrice: cartTotal,
            items: orderData.items
          })
        }).catch(err => console.error('Admin notification error:', err));
      } catch (err) {
        console.error('Notification trigger error:', err);
      }

      toast.success('Order placed successfully!', { id: loadingToast });
      setStep(3);
      clearCart();
    } catch (error) {
      console.error('Order error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      toast.error('Failed to place order. Please try again.', { id: loadingToast });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-12 text-center space-y-10 bg-ivory">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }} 
          animate={{ scale: 1, rotate: 0 }} 
          className="w-32 h-32 neumorphic-circle text-primary"
        >
          <CheckCircle2 size={64} strokeWidth={1} />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-3xl font-light text-luxury-black">Acquisition Confirmed</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">Your order has been successfully placed. <br/>Our curators are preparing your collection.</p>
        </div>
        <div className="w-full space-y-4">
          <button 
            onClick={() => navigate('/orders')}
            className="w-full py-5 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          >
            Track Your Order
          </button>
          <button 
            onClick={() => navigate('/')}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 space-y-10 pb-32 bg-ivory min-h-screen"
    >
      <div className="flex items-center space-x-6">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="w-12 h-12 neumorphic-circle text-luxury-black">
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 className="text-3xl font-light text-luxury-black">Checkout</h1>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between px-10">
        <div className={`flex flex-col items-center space-y-2 ${step >= 1 ? 'text-primary' : 'text-gray-200'}`}>
          <div className={`w-10 h-10 neumorphic-circle border-2 transition-all duration-500 ${step >= 1 ? 'border-primary text-primary' : 'border-transparent text-gray-200'}`}>
            <span className="text-xs font-bold">01</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Address</span>
        </div>
        <div className={`flex-1 h-[1px] mx-4 ${step >= 2 ? 'bg-primary/30' : 'bg-black/5'}`}></div>
        <div className={`flex flex-col items-center space-y-2 ${step >= 2 ? 'text-primary' : 'text-gray-200'}`}>
          <div className={`w-10 h-10 neumorphic-circle border-2 transition-all duration-500 ${step >= 2 ? 'border-primary text-primary' : 'border-transparent text-gray-200'}`}>
            <span className="text-xs font-bold">02</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Payment</span>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-3">
              <MapPin size={16} strokeWidth={1.5} className="text-primary" />
              <span>Contact & Shipping</span>
            </h3>
            <div className="space-y-4">
              <input 
                type="tel"
                placeholder="Phone Number"
                className="w-full bg-white/50 border border-white rounded-full px-6 py-4 text-sm outline-none shadow-sm focus:shadow-inner transition-all font-light"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <div className="relative">
                <textarea 
                  placeholder="Enter your full address..."
                  className="w-full h-40 bg-white/50 border border-white rounded-[32px] p-6 text-sm outline-none shadow-sm focus:shadow-inner transition-all font-light"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
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
            </div>
          </div>
          <button 
            onClick={() => (address && phone) ? setStep(2) : toast.error('Please enter address and phone number')}
            className="w-full py-5 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(197,160,89,0.3)] active:scale-95 transition-all"
          >
            Continue to Payment
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-3">
              <CreditCard size={16} strokeWidth={1.5} className="text-primary" />
              <span>Payment Method</span>
            </h3>
            <div className="space-y-4">
              <label className={`flex items-center justify-between p-6 rounded-[32px] border transition-all cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-white shadow-md' : 'border-white bg-white/40 shadow-sm'}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 neumorphic-circle text-primary/60">
                    <Truck size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-luxury-black uppercase tracking-widest">Cash on Delivery</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Pay upon arrival</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'cod' ? 'border-primary' : 'border-gray-200'}`}>
                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                </div>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} className="hidden" />
              </label>
              <label className={`flex items-center justify-between p-6 rounded-[32px] border transition-all cursor-pointer ${paymentMethod === 'mobile' ? 'border-primary bg-white shadow-md' : 'border-white bg-white/40 shadow-sm'}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 neumorphic-circle text-primary/60">
                    <Wallet size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-luxury-black uppercase tracking-widest">Mobile Banking</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">bKash, Nagad, Rocket</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'mobile' ? 'border-primary' : 'border-gray-200'}`}>
                  {paymentMethod === 'mobile' && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                </div>
                <input type="radio" name="payment" value="mobile" checked={paymentMethod === 'mobile'} onChange={e => setPaymentMethod(e.target.value)} className="hidden" />
              </label>
            </div>
          </div>

          <div className="bg-white/50 border border-white p-6 rounded-[32px] space-y-3 shadow-sm">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span>Order Total</span>
              <span className="text-luxury-black">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span>Shipping</span>
              <span className="text-primary">Complimentary</span>
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder}
            className="w-full py-5 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(197,160,89,0.3)] active:scale-95 transition-all"
          >
            Confirm Acquisition
          </button>
        </div>
      )}
    </motion.div>
  );
}

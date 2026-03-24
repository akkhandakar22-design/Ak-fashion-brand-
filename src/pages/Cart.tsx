import { motion } from 'motion/react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, t, formatPrice } = useApp();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-12 text-center space-y-8 bg-ivory">
        <div className="w-32 h-32 neumorphic-circle text-primary/30">
          <ShoppingBag size={48} strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-luxury-black">Your bag is empty</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Discover our latest masterpieces</p>
        </div>
        <Link to="/" className="bg-primary text-white px-10 py-4 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
          Start Exploring
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-8 space-y-10 pb-48 bg-ivory min-h-screen"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light text-luxury-black">{t('my_bag')}</h1>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cart.length} Items</span>
      </div>

      <div className="space-y-6">
        {cart.map(item => (
          <div key={item.id} className="flex space-x-6 bg-white/40 border border-white p-4 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] group">
            <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-beige flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-bold text-luxury-black uppercase tracking-widest line-clamp-1">{item.name}</h3>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-primary transition-colors">
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-primary">
                  {formatPrice((item.discount_price || item.price) * item.quantity)}
                </span>
                <div className="flex items-center bg-white/80 border border-white rounded-full px-3 py-1.5 space-x-4 shadow-sm">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-gray-400 hover:text-primary transition-colors">
                    <Minus size={12} strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-luxury-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-gray-400 hover:text-primary transition-colors">
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="fixed bottom-24 left-6 right-6 max-w-[calc(100%-3rem)] mx-auto p-8 bg-white/80 backdrop-blur-xl rounded-[40px] border border-white/50 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span>Subtotal</span>
            <span className="text-luxury-black">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span>Shipping</span>
            <span className="text-primary">Complimentary</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-4 border-t border-black/5">
            <span className="text-luxury-black uppercase tracking-widest text-sm">{t('total')}</span>
            <span className="text-primary">{formatPrice(cartTotal)}</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
          className="w-full py-4 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(197,160,89,0.3)] flex items-center justify-center space-x-3 active:scale-95 transition-all"
        >
          <span>{t('checkout')}</span>
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}

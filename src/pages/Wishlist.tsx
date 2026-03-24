import React from 'react';
import { motion } from 'motion/react';
import { Trash2, ShoppingCart, ChevronLeft, Heart, ShoppingBag } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, formatPrice, t } = useApp();
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-12 text-center space-y-8 bg-ivory">
        <div className="w-32 h-32 neumorphic-circle text-primary/30">
          <Heart size={48} strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-luxury-black">Your wishlist is empty</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Save items you love for later</p>
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
      className="pb-32 bg-ivory min-h-screen p-8 space-y-10"
    >
      <div className="flex items-center space-x-6">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="w-12 h-12 neumorphic-circle text-luxury-black">
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 className="text-3xl font-light text-luxury-black">Wishlist</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {wishlist.map(product => (
          <div key={product.id} className="flex space-x-6 bg-white/40 border border-white p-4 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] group">
            <div 
              className="w-24 h-24 rounded-[24px] overflow-hidden bg-beige flex-shrink-0 cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start">
                <h3 
                  className="text-xs font-bold text-luxury-black uppercase tracking-widest line-clamp-1 cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </h3>
                <button onClick={() => toggleWishlist(product)} className="text-primary transition-colors">
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-primary">
                  {formatPrice(product.discount_price || product.price)}
                </span>
                <button 
                  onClick={() => addToCart(product)}
                  className="p-3 bg-white border border-black/5 rounded-full text-luxury-black shadow-sm active:scale-95 transition-all"
                >
                  <ShoppingCart size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

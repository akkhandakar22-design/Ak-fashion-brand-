import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShoppingCart, Heart, Plus, Star } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Product } from '../types';
import { useApp } from '../AppContext';

export default function Trending() {
  const navigate = useNavigate();
  const { addToCart, formatPrice, toggleWishlist, isInWishlist, t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?trending=true&limit=50')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-32 bg-ivory min-h-screen"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6 flex items-center space-x-6 sticky top-0 bg-ivory/80 backdrop-blur-xl z-50 border-b border-black/5">
        <Link 
          to="/" 
          className="w-12 h-12 neumorphic-circle text-luxury-black flex items-center justify-center"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </Link>
        <h1 className="text-2xl font-light text-luxury-black">Trending <span className="font-bold">Now</span></h1>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Loading masterpieces...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {products.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="product-card group"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className={`absolute top-4 right-4 w-8 h-8 neumorphic-circle transition-all z-20 ${isInWishlist(product.id) ? 'text-primary' : 'text-luxury-black/40 hover:text-primary'}`}
                  >
                    <Heart size={14} strokeWidth={2} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {product.discount_price && (
                    <span className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      Hot
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <Link to={`/product/${product.id}`} className="block text-xs font-medium text-luxury-black/80 hover:text-primary transition-colors tracking-tight truncate">
                    {product.name}
                  </Link>
                  <div className="flex items-center space-x-1">
                    <Star size={10} className="text-primary fill-current" />
                    <span className="text-[10px] font-bold">{product.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product.discount_price || product.price)}
                      </span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 neumorphic-circle text-primary/50 hover:text-primary transition-all"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/30 rounded-[40px] border border-white/50">
            <p className="text-xs text-gray-400 uppercase tracking-widest">No trending products found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

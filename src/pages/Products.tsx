import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShoppingCart, Heart, Plus, Star, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Product } from '../types';
import { useApp } from '../AppContext';

export default function Products() {
  const navigate = useNavigate();
  const { addToCart, formatPrice, toggleWishlist, isInWishlist, t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?page=${page}&limit=${limit}&search=${searchQuery}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [page, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-32 bg-ivory min-h-screen"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6 sticky top-0 bg-ivory/80 backdrop-blur-xl z-50 border-b border-black/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="w-12 h-12 neumorphic-circle text-luxury-black flex items-center justify-center"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </Link>
            <h1 className="text-2xl font-light text-luxury-black">Our <span className="font-bold">Collection</span></h1>
          </div>
          <button className="w-12 h-12 neumorphic-circle text-primary">
            <SlidersHorizontal size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search masterpieces..." 
            className="w-full bg-white/50 border border-white rounded-[24px] py-4 pl-14 pr-6 text-sm outline-none shadow-sm focus:shadow-md transition-all placeholder:text-gray-300 font-light"
          />
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Curating collection...</p>
          </div>
        ) : products.length > 0 ? (
          <>
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
                  </div>
                  <div className="p-5 space-y-3">
                    <Link to={`/product/${product.id}`} className="block text-xs font-medium text-luxury-black/80 hover:text-primary transition-colors tracking-tight truncate">
                      {product.name}
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product.discount_price || product.price)}
                      </span>
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center space-x-4">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-primary shadow-sm hover:shadow-md'}`}
                >
                  Prev
                </button>
                <span className="text-[10px] font-bold text-luxury-black/60 uppercase tracking-widest">
                  Page {page} of {pagination.totalPages}
                </span>
                <button 
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${page === pagination.totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-primary shadow-sm hover:shadow-md'}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white/30 rounded-[40px] border border-white/50">
            <p className="text-xs text-gray-400 uppercase tracking-widest">No products found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

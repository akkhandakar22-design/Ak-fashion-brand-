import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight } from 'lucide-react';
import { Category, Product } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const { formatPrice, addToCart } = useApp();

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  useEffect(() => {
    const url = selectedId ? `/api/products?category=${selectedId}` : '/api/products';
    fetch(url).then(res => res.json()).then(data => setProducts(data.products || []));
  }, [selectedId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex h-screen overflow-hidden bg-ivory"
    >
      {/* Sidebar */}
      <div className="w-24 bg-beige/50 border-r border-black/5 overflow-y-auto pb-32">
        <button 
          onClick={() => setSearchParams({})}
          className={`w-full py-6 px-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] border-l-4 transition-all ${!selectedId ? 'bg-ivory border-primary text-primary' : 'border-transparent text-gray-400'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSearchParams({ id: cat.id.toString() })}
            className={`w-full py-8 px-2 flex flex-col items-center space-y-3 border-l-4 transition-all ${selectedId === cat.id.toString() ? 'bg-ivory border-primary text-primary' : 'border-transparent text-gray-400'}`}
          >
            <div className={`w-12 h-12 neumorphic-circle p-0.5 transition-all ${selectedId === cat.id.toString() ? 'scale-110' : 'opacity-60'}`}>
              <div className="w-full h-full rounded-full overflow-hidden border border-white">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              </div>
            </div>
            <span className="text-[9px] font-bold leading-tight uppercase tracking-widest">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search collection..." 
            className="w-full bg-white/50 border border-white rounded-full py-3.5 pl-12 pr-4 text-xs outline-none shadow-sm focus:shadow-md transition-all placeholder:text-gray-300 font-light"
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {products.length > 0 ? products.map(product => (
            <Link key={product.id} to={`/product/${product.id}`} className="flex space-x-6 bg-white/40 border border-white p-4 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] transition-all group">
              <div className="w-28 h-28 rounded-[24px] overflow-hidden bg-beige flex-shrink-0 relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                  <h3 className="text-xs font-bold text-luxury-black uppercase tracking-widest group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-[10px] text-gray-400 line-clamp-2 mt-2 font-light leading-relaxed">{product.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{formatPrice(product.discount_price || product.price)}</span>
                  <div className="w-8 h-8 neumorphic-circle text-primary/50 group-hover:text-primary group-hover:scale-110 transition-all">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-center py-20 bg-white/30 rounded-[40px] border border-white/50">
              <p className="text-xs text-gray-400 uppercase tracking-widest">No products found in this category</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Zap, ArrowRight, Star, ShoppingCart, User, Plus, Camera, X, Loader2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product, Category } from '../types';
import { useApp } from '../AppContext';
import { GoogleGenAI } from "@google/genai";
import toast from 'react-hot-toast';

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToCart, t, formatPrice, toggleWishlist, isInWishlist } = useApp();

  useEffect(() => {
    fetch('/api/products?featured=true').then(res => res.json()).then(data => setFeatured(data.products || []));
    fetch('/api/products?trending=true').then(res => res.json()).then(data => setTrending(data.products || []));
    fetch('/api/categories').then(res => res.json()).then(setCategories);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      setIsSearchActive(true);
      const res = await fetch(`/api/products?search=${query}`);
      const data = await res.json();
      setSearchResults(data.products || []);
      setIsSearching(false);
    } else if (query.length === 0) {
      setIsSearchActive(false);
      setSearchResults([]);
    }
  };

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setIsSearching(true);
      setIsSearchActive(true);
      toast.loading('Analyzing image...', { id: 'image-search' });

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: "Identify the fashion item in this image. Provide 2-3 specific keywords that would help find this exact or similar product in a database (e.g., 'denim jacket', 'wireless headphones', 'silk dress'). Only return the keywords separated by spaces, no other text." },
                { inlineData: { mimeType: file.type, data: base64 } }
              ]
            }
          ]
        });

        const keywords = response.text?.trim() || '';
        if (keywords) {
          const res = await fetch(`/api/products?search=${keywords}`);
          const data = await res.json();
          setSearchResults(data.products || []);
          setSearchQuery(keywords);
          toast.success('Found similar products!', { id: 'image-search' });
        } else {
          toast.error('Could not identify product', { id: 'image-search' });
        }
      } catch (error) {
        console.error(error);
        toast.error('Image search failed', { id: 'image-search' });
      } finally {
        setIsSearching(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-32 space-y-10"
    >
      {/* Header */}
      <div className="px-6 pt-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Exclusive Experience</p>
          <h1 className="text-2xl font-light text-luxury-black">Bonjour, <span className="font-bold">Shopper</span></h1>
        </div>
        <Link to="/profile" className="w-12 h-12 neumorphic-circle text-primary">
          <User size={20} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Search Bar */}
      <div className="px-6 space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('search_placeholder')} 
            className="w-full bg-white/50 border border-white rounded-[24px] py-4 pl-14 pr-24 text-sm outline-none shadow-[0_10px_30px_rgba(0,0,0,0.03)] focus:shadow-[0_15px_40px_rgba(197,160,89,0.1)] transition-all placeholder:text-gray-400 font-light"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-primary/50 hover:text-primary transition-colors"
              title="Search by image"
            >
              <Camera size={18} />
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSearch} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Search Results Overlay */}
      <AnimatePresence>
        {isSearchActive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-luxury-black/80">
                {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
              </h3>
              <button 
                onClick={() => {
                  setIsSearchActive(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-xs font-bold text-primary uppercase tracking-widest flex items-center space-x-1"
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            </div>

            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-gray-400 uppercase tracking-widest">Curating results...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {searchResults.map((product, idx) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={() => addToCart(product)} 
                    index={idx} 
                    formatPrice={formatPrice}
                    onWishlist={() => toggleWishlist(product)}
                    isInWishlist={isInWishlist(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/30 rounded-[40px] border border-white/50">
                <p className="text-xs text-gray-400 uppercase tracking-widest">No products found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isSearchActive && (
        <>
          {/* Hero Banner */}
          <div className="px-6">
            <div className="relative h-64 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] group luxury-dark">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent z-10"></div>
              
              {/* Logo Overlay - Inspired by the provided image */}
              <div className="absolute inset-0 z-15 flex items-center justify-center opacity-20 pointer-events-none">
                 <div className="w-48 h-48 border-4 border-gold/30 rounded-full flex items-center justify-center">
                    <span className="text-6xl font-display font-bold text-gold/40">AK</span>
                 </div>
              </div>

              <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end text-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light mb-3 block">The New Era of Style</span>
                  <h2 className="text-4xl font-display font-bold leading-tight mb-6 gold-text">Elegance <br/>Redefined</h2>
                  <Link 
                    to="/categories"
                    className="bg-gold text-black px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit hover:bg-gold-light transition-all shadow-2xl active:scale-95"
                  >
                    {t('shop_now')}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <section className="px-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-luxury-black/80">{t('categories')}</h3>
              <Link to="/categories" className="neumorphic-circle w-8 h-8 text-primary">
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
              {categories.length > 0 ? categories.map(cat => (
                <Link key={cat.id} to={`/categories?id=${cat.id}`} className="flex-shrink-0 flex flex-col items-center space-y-3 group">
                  <div className="w-20 h-20 neumorphic-circle p-1 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">{cat.name}</span>
                </Link>
              )) : (
                <div className="w-full text-center py-4">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">No categories available</p>
                </div>
              )}
            </div>
          </section>

          {/* Featured Products */}
          <section className="px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-luxury-black">{t('featured_collection')}</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Handpicked for you</p>
              </div>
              <Link to="/products" className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-primary/30 pb-1">View Collection</Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {featured.length > 0 ? featured.map((product, idx) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAdd={() => addToCart(product)} 
                  index={idx} 
                  formatPrice={formatPrice}
                  onWishlist={() => toggleWishlist(product)}
                  isInWishlist={isInWishlist(product.id)}
                />
              )) : (
                <div className="col-span-2 text-center py-10 bg-white/30 rounded-[40px] border border-white/50">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">No featured products yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Trending Section with Gradient */}
          <section className="mx-6 p-8 rounded-[48px] luxury-gradient border border-white shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <Link to="/trending" className="group flex items-center space-x-2">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{t('trending_now')}</h3>
                  <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
                <div className="flex items-center space-x-2 bg-white/50 px-3 py-1.5 rounded-full border border-white shadow-sm">
                  <Zap size={12} className="text-primary fill-current" />
                  <span className="text-[10px] font-bold text-primary">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {trending.length > 0 ? trending.slice(0, 2).map((product, idx) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={() => addToCart(product)} 
                    index={idx} 
                    formatPrice={formatPrice}
                    onWishlist={() => toggleWishlist(product)}
                    isInWishlist={isInWishlist(product.id)}
                  />
                )) : (
                  <div className="col-span-2 text-center py-10 bg-white/30 rounded-[40px] border border-white/50">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">No trending products yet</p>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-center">
                <Link 
                  to="/trending"
                  className="px-8 py-3 bg-white/50 border border-white rounded-full text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-white transition-all shadow-sm"
                >
                  View All Trending
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
  onWishlist: () => void;
  isInWishlist: boolean;
  index: number;
  formatPrice: (price: number) => string;
  key?: any;
}

function ProductCard({ product, onAdd, onWishlist, isInWishlist, index, formatPrice }: ProductCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
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
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        <button 
          onClick={(e) => {
            e.preventDefault();
            onWishlist();
          }}
          className={`absolute top-4 right-4 w-8 h-8 neumorphic-circle transition-all z-20 ${isInWishlist ? 'text-primary' : 'text-luxury-black/40 hover:text-primary'}`}
        >
          <Heart size={14} strokeWidth={2} fill={isInWishlist ? 'currentColor' : 'none'} />
        </button>

        {product.discount_price && (
          <span className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
            Limited
          </span>
        )}
      </div>
      <div className="p-5 space-y-3">
        <Link to={`/product/${product.id}`} className="block text-xs font-medium text-luxury-black/80 hover:text-primary transition-colors tracking-tight">
          {product.name}
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">
              {formatPrice(product.discount_price || product.price)}
            </span>
            {product.discount_price && (
              <span className="text-[9px] text-gray-300 line-through font-medium">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onAdd();
            }}
            className="w-8 h-8 neumorphic-circle text-primary/50 hover:text-primary transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

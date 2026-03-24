import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Star, ShoppingCart, Heart, Share2, ShieldCheck, Truck, RotateCcw, Send, X, Facebook, Twitter, MessageCircle, Copy, Check, Camera } from 'lucide-react';
import { Product, Review } from '../types';
import { useApp } from '../AppContext';
import MediaGallery from '../components/MediaGallery';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToCart, user, formatPrice, t, toggleWishlist, isInWishlist } = useApp();

  const mediaItems = product?.media ? JSON.parse(product.media) : [{ type: 'image', url: product?.image }];

  const [error, setError] = useState<string | null>(null);

  const fetchProductData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/products/${id}`).then(async res => {
        if (res.status === 404) throw new Error('Product not found');
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
      }),
      fetch(`/api/reviews/${id}`).then(res => res.ok ? res.json() : [])
    ]).then(([productData, reviewsData]) => {
      setProduct(productData);
      setReviews(reviewsData || []);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      navigate('/auth');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: id,
          user_id: user.id,
          user_name: user.name,
          rating: newRating,
          comment: newComment,
          images: reviewImages
        })
      });

      if (res.ok) {
        toast.success('Review submitted successfully!');
        setNewComment('');
        setNewRating(5);
        setReviewImages([]);
        fetchProductData();
      } else {
        toast.error('Failed to submit review');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="p-8 text-center space-y-4">
    <p className="text-red-500">{error}</p>
    <button onClick={fetchProductData} className="px-6 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest">Retry</button>
  </div>;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 bg-ivory min-h-screen"
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 p-6 flex items-center justify-between">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="w-12 h-12 neumorphic-circle text-luxury-black">
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowShareModal(true)}
            className="w-12 h-12 neumorphic-circle text-luxury-black"
          >
            <Share2 size={20} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => toggleWishlist(product)}
            className={`w-12 h-12 neumorphic-circle transition-colors ${isInWishlist(product.id) ? 'text-primary' : 'text-luxury-black'}`}
          >
            <Heart size={20} strokeWidth={1.5} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Media Gallery */}
      <MediaGallery media={mediaItems} productName={product.name} />

      {/* Content */}
      <div className="p-8 -mt-12 bg-ivory rounded-t-[48px] relative z-10 space-y-8 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              Limited Edition
            </span>
            <div className="flex items-center space-x-2 bg-white/50 px-3 py-1.5 rounded-full border border-white shadow-sm">
              <Star size={14} className="text-primary fill-current" />
              <span className="text-xs font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400 font-medium">({product.reviews_count})</span>
            </div>
          </div>
          <h1 className="text-3xl font-light text-luxury-black leading-tight">{product.name}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.discount_price || product.price)}
            </span>
            {product.discount_price && (
              <span className="text-lg text-gray-300 line-through font-light">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Inline Actions */}
          <div className="flex flex-col space-y-3 pt-2">
            <button 
              onClick={() => {
                addToCart(product);
                navigate('/checkout');
              }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
            >
              Shop Now
            </button>
            <button 
              onClick={() => addToCart(product)}
              className="w-full py-4 bg-white border border-black/5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] text-luxury-black flex items-center justify-center space-x-3 shadow-sm active:scale-95 transition-all"
            >
              <ShoppingCart size={16} strokeWidth={1.5} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">The Story</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Features */}
        {(product.has_free_delivery || product.has_return_policy || product.has_warranty) && (
          <div className="grid grid-cols-3 gap-6 py-8 border-y border-black/5">
            {product.has_free_delivery && (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 neumorphic-circle text-primary">
                  <Truck size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Free Delivery</span>
              </div>
            )}
            {product.has_return_policy && (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 neumorphic-circle text-primary">
                  <RotateCcw size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">7 Days Return</span>
              </div>
            )}
            {product.has_warranty && (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 neumorphic-circle text-primary">
                  <ShieldCheck size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">1 Year Warranty</span>
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-black">Client Reviews ({product.reviews_count})</h3>
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-primary fill-current" />
              <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Review Form */}
          {user ? (
            <form onSubmit={handleReviewSubmit} className="bg-white/50 border border-white p-6 rounded-[32px] space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Your Rating</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`${newRating >= star ? 'text-primary' : 'text-gray-200'} transition-colors`}
                    >
                      <Star size={20} fill={newRating >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full bg-ivory/50 border border-white rounded-[24px] p-4 text-sm focus:shadow-inner outline-none resize-none h-32 font-light"
                  required
                />
                
                <div className="absolute bottom-4 left-4 flex items-center space-x-3">
                  <label className="cursor-pointer p-2 neumorphic-circle text-gray-400 hover:text-primary transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Camera size={18} />
                  </label>
                  
                  {reviewImages.length > 0 && (
                    <div className="flex -space-x-2 overflow-hidden">
                      {reviewImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={img} 
                            alt="Preview" 
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="absolute bottom-4 right-4 w-12 h-12 neumorphic-circle text-primary disabled:opacity-50"
                >
                  <Send size={18} strokeWidth={2} />
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/50 border border-white p-6 rounded-[32px] text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Please <Link to="/auth" className="text-primary underline underline-offset-4">login</Link> to share your thoughts</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-300 py-8">Be the first to share a masterpiece</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="space-y-3 pb-6 border-b border-black/5 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-luxury-black uppercase tracking-widest">{review.user_name}</h4>
                      <div className="flex space-x-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={10}
                            className={`${review.rating >= star ? 'text-primary fill-current' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                      {format(new Date(review.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Review ${idx}`} 
                          className="w-16 h-16 rounded-xl object-cover border border-black/5 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-ivory/80 backdrop-blur-xl border-t border-white/50 z-50 flex space-x-4">
        <button 
          onClick={() => addToCart(product)}
          className="flex-1 py-4 bg-white border border-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] text-luxury-black flex items-center justify-center space-x-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)] active:scale-95 transition-all"
        >
          <ShoppingCart size={18} strokeWidth={1.5} />
          <span>Add to Cart</span>
        </button>
        <button 
          onClick={() => {
            addToCart(product);
            navigate('/checkout');
          }}
          className="flex-1 py-4 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(197,160,89,0.3)] active:scale-95 transition-all"
        >
          Shop Now
        </button>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] z-[101] p-8 space-y-8 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-luxury-black">Share Masterpiece</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-10 h-10 neumorphic-circle text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <ShareButton 
                  icon={<Facebook size={20} className="text-[#1877F2]" />} 
                  label="Facebook" 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}
                />
                <ShareButton 
                  icon={<Twitter size={20} className="text-[#1DA1F2]" />} 
                  label="Twitter" 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Check out this ${product.name} on AK Fashion Brand!`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                  }}
                />
                <ShareButton 
                  icon={<MessageCircle size={20} className="text-[#25D366]" />} 
                  label="WhatsApp" 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Check out this ${product.name} on AK Fashion Brand!`);
                    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                  }}
                />
                <ShareButton 
                  icon={copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-500" />} 
                  label={copied ? "Copied" : "Copy Link"} 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success('Link copied to clipboard');
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ShareButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center space-y-2 group"
    >
      <div className="w-14 h-14 neumorphic-circle bg-white group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">{label}</span>
    </button>
  );
}

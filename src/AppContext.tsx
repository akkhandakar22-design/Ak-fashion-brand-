import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CartItem, Product } from './types';
import toast from 'react-hot-toast';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where } from 'firebase/firestore';
import { useRef } from 'react';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  t: (key: string) => string;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  setCurrency: (curr: 'USD' | 'BDT' | 'EUR' | 'GBP') => void;
  formatPrice: (price: number) => string;
  logout: () => Promise<void>;
}

const translations: Record<'en' | 'bn', Record<string, string>> = {
  en: {
    'home': 'Home',
    'categories': 'Categories',
    'cart': 'Cart',
    'profile': 'Profile',
    'search_placeholder': 'Search for luxury...',
    'featured_collection': 'Featured Collection',
    'trending_now': 'Trending Now',
    'shop_now': 'Shop Now',
    'add_to_bag': 'Add to Bag',
    'buy_now': 'Buy Now',
    'my_bag': 'My Bag',
    'checkout': 'Checkout',
    'total': 'Total',
    'orders': 'Orders',
    'wishlist': 'Wishlist',
    'address': 'Address',
    'personal_profile': 'Personal Profile',
    'notifications': 'Notifications',
    'security_privacy': 'Security & Privacy',
    'help_center': 'Help Center',
    'preferences': 'Preferences',
    'logout': 'Logout',
    'login': 'Login',
    'register': 'Register',
    'language': 'Language',
    'currency': 'Currency',
    'welcome': 'Welcome to Ak Shop',
    'admin_panel': 'Curator Panel',
    'explore': 'Explore',
    'account': 'Account'
  },
  bn: {
    'home': 'হোম',
    'categories': 'ক্যাটাগরি',
    'cart': 'কার্ট',
    'profile': 'প্রোফাইল',
    'search_placeholder': 'বিলাসবহুল পণ্য খুঁজুন...',
    'featured_collection': 'সেরা কালেকশন',
    'trending_now': 'ট্রেন্ডিং পণ্য',
    'shop_now': 'কিনুন',
    'add_to_bag': 'ব্যাগ-এ যোগ করুন',
    'buy_now': 'এখনই কিনুন',
    'my_bag': 'আমার ব্যাগ',
    'checkout': 'চেকআউট',
    'total': 'মোট',
    'orders': 'অর্ডার',
    'wishlist': 'উইশলিস্ট',
    'address': 'ঠিকানা',
    'personal_profile': 'ব্যক্তিগত প্রোফাইল',
    'notifications': 'নোটিফিকেশন',
    'security_privacy': 'নিরাপত্তা ও গোপনীয়তা',
    'help_center': 'সহায়তা কেন্দ্র',
    'preferences': 'পছন্দসমূহ',
    'logout': 'লগআউট',
    'login': 'লগইন',
    'register': 'রেজিস্ট্রেশন',
    'language': 'ভাষা',
    'currency': 'মুদ্রা',
    'welcome': 'Ak Shop-এ স্বাগতম',
    'admin_panel': 'কিউরেটর প্যানেল',
    'explore': 'এক্সপ্লোর',
    'account': 'অ্যাকাউন্ট'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    return (localStorage.getItem('language') as 'en' | 'bn') || 'en';
  });

  const [currency, setCurrency] = useState<'USD' | 'BDT' | 'EUR' | 'GBP'>(() => {
    return (localStorage.getItem('currency') as 'USD' | 'BDT' | 'EUR' | 'GBP') || 'USD';
  });

  const orderStatusesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      orderStatusesRef.current = {};
      return;
    }

    const q = query(collection(db, 'orders'), where('user_id', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderId = change.doc.id;
        const newStatus = change.doc.data().status;
        const oldStatus = orderStatusesRef.current[orderId];

        if (change.type === 'modified' && oldStatus && oldStatus !== newStatus) {
          toast.success(`Order #${orderId.slice(-6).toUpperCase()} is now ${newStatus.toUpperCase()}`, {
            duration: 5000,
            icon: '📦'
          });
        }
        orderStatusesRef.current[orderId] = newStatus;
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Sync user profile from Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          const isAdminEmail = firebaseUser.email === "salamatullah5492@gmail.com" || firebaseUser.email === "akkhandakar22@gmail.com";
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (isAdminEmail && data.role !== 'admin') {
              updateDoc(userRef, { role: 'admin' }).catch(err => console.error('Role upgrade error:', err));
            }
            setUser({ id: firebaseUser.uid, ...data } as User);
          } else {
            // Create initial profile if it doesn't exist
            const initialProfile = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: isAdminEmail ? 'admin' : 'user'
            };
            setDoc(userRef, initialProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`));
            setUser({ id: firebaseUser.uid, ...initialProfile } as User);
          }
          setLoading(false);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`));
        return () => unsubProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Listen for new orders globally for admins
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = change.doc.data();
          const createdAt = new Date(orderData.created_at).getTime();
          const now = Date.now();
          
          // Only notify for orders created in the last 30 seconds to avoid initial load spam
          if (now - createdAt < 30000) {
            toast.success(`New order from ${orderData.user_name || 'Guest'}!`, {
              icon: '🛍️',
              duration: 6000,
              position: 'top-right'
            });
          }
        }
      });
    }, (err) => console.error("Admin order listener error:", err));

    return () => unsubscribe();
  }, [user?.role]);

  const formatPrice = (price: number) => {
    const rates = {
      USD: 1,
      BDT: 115,
      EUR: 0.92,
      GBP: 0.79
    };
    
    const symbols = {
      USD: '$',
      BDT: '৳',
      EUR: '€',
      GBP: '£'
    };

    const converted = price * rates[currency];
    
    if (currency === 'BDT') {
      return `${converted.toLocaleString('en-BD')} ${symbols[currency]}`;
    }
    return `${symbols[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        toast.success(`Updated ${product.name} quantity`);
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    toast.error('Removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        toast.error(`Removed ${product.name} from wishlist`);
        return prev.filter(item => item.id !== product.id);
      }
      toast.success(`Added ${product.name} to wishlist`);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const cartTotal = cart.reduce((total, item) => 
    total + ((item.discount_price || item.price || 0) * item.quantity), 0
  );

  return (
    <AppContext.Provider value={{
      user, setUser, loading, cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal,
      wishlist, toggleWishlist, isInWishlist,
      language, setLanguage, t, currency, setCurrency, formatPrice, logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

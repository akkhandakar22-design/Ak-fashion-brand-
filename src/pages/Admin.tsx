import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Users, ShoppingBag, TrendingUp, Plus, Edit, Trash2, X, Save, ChevronLeft } from 'lucide-react';
import { Product, Category, Order, User } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, getDocs, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admins only.');
      navigate('/');
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users'>('products');
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(ordersData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const unsubUsersList = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Fetch stats
    const fetchStats = async () => {
      try {
        const productsCount = await getCountFromServer(collection(db, 'products'));
        const ordersCount = await getCountFromServer(collection(db, 'orders'));
        const usersCount = await getCountFromServer(collection(db, 'users'));
        
        const salesQuery = query(collection(db, 'orders'));
        const salesSnapshot = await getAggregateFromServer(salesQuery, {
          totalSales: sum('total_price')
        });
        
        setStats({
          totalProducts: productsCount.data().count,
          totalOrders: ordersCount.data().count,
          totalUsers: usersCount.data().count,
          totalSales: salesSnapshot.data().totalSales || 0
        });
      } catch (err) {
        console.error('Stats error:', err);
      }
    };
    fetchStats();

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubUsersList();
    };
  }, [user]);

  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsProcessingMedia(true);
      
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              // Compress to JPEG with 0.7 quality
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve(dataUrl);
            };
            img.onerror = reject;
          };
          reader.onerror = reject;
        });
      };

      const processFile = async (file: File): Promise<{ type: 'image' | 'video', url: string } | null> => {
        try {
          if (file.type.startsWith('video/')) {
            if (file.size > 10 * 1024 * 1024) {
              toast.error(`${file.name} is too large (max 10MB)`);
              return null;
            }
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve({ type: 'video', url: reader.result as string });
              reader.readAsDataURL(file);
            });
          } else {
            const compressedUrl = await compressImage(file);
            return { type: 'image', url: compressedUrl };
          }
        } catch (err) {
          toast.error(`Failed to process ${file.name}`);
          return null;
        }
      };

      const results = await Promise.all(Array.from(files).map(processFile));
      const validResults = results.filter((r): r is { type: 'image' | 'video', url: string } => r !== null);

      if (validResults.length > 0) {
        setEditingProduct(prev => {
          if (!prev) return null;
          const currentMedia = JSON.parse(prev.media || '[]');
          const nextMedia = [...currentMedia, ...validResults];
          const firstImage = nextMedia.find(m => m.type === 'image')?.url;
          
          return { 
            ...prev, 
            media: JSON.stringify(nextMedia),
            image: (!prev.image || prev.image.startsWith('https://picsum')) && firstImage
              ? firstImage 
              : prev.image
          };
        });
      }
      setIsProcessingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const currentMedia = JSON.parse(prev.media || '[]');
      const nextMedia = currentMedia.filter((_: any, i: number) => i !== index);
      const firstImage = nextMedia.find((m: any) => m.type === 'image')?.url;
      
      return {
        ...prev,
        media: JSON.stringify(nextMedia),
        image: firstImage || 'https://picsum.photos/seed/placeholder/400/400'
      };
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isSaving) return;

    setIsSaving(true);
    const loadingToast = toast.loading('Saving product...');
    try {
      const productRef = editingProduct.id 
        ? doc(db, 'products', editingProduct.id) 
        : doc(collection(db, 'products'));
      
      const data = { ...editingProduct };
      delete data.id; // Don't save ID in document body

      await setDoc(productRef, data, { merge: true });
      toast.success(editingProduct.id ? 'Product updated' : 'Product added', { id: loadingToast });
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error('Failed to save product', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      toast.error('Failed to delete product');
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success('Order status updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
      toast.error('Failed to update status');
    }
  };

  const openAddModal = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      discount_price: 0,
      image: 'https://picsum.photos/seed/new/400/400',
      media: JSON.stringify([{ type: 'image', url: 'https://picsum.photos/seed/new/400/400' }]),
      category_id: categories[0]?.id || '',
      is_featured: false,
      is_trending: false,
      has_free_delivery: false,
      has_return_policy: false,
      has_warranty: false,
      stock: 10,
      rating: 4.5,
      reviews_count: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const seedStore = async () => {
    const loadingToast = toast.loading('Seeding store data...');
    try {
      const { writeBatch, collection, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      // Initial Categories
      const initialCategories = [
        { name: 'Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
        { name: 'Handbags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400' },
        { name: 'Jewelry', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400' },
        { name: 'Perfume', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=400' }
      ];

      const catRefs: Record<string, string> = {};
      initialCategories.forEach(cat => {
        const ref = doc(collection(db, 'categories'));
        batch.set(ref, cat);
        catRefs[cat.name] = ref.id;
      });

      // Initial Products
      const initialProducts = [
        {
          name: 'Royal Oak Chronograph',
          description: 'A masterpiece of horology, featuring a stunning blue dial and stainless steel case.',
          price: 45000,
          discount_price: 42000,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
          category_id: catRefs['Watches'],
          is_featured: true,
          is_trending: true,
          stock: 5,
          rating: 4.9,
          reviews_count: 12,
          media: JSON.stringify([{ type: 'image', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' }])
        },
        {
          name: 'Classic Leather Tote',
          description: 'Handcrafted from premium Italian leather, this tote is the perfect companion for the modern professional.',
          price: 1200,
          discount_price: 950,
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
          category_id: catRefs['Handbags'],
          is_featured: true,
          is_trending: false,
          stock: 15,
          rating: 4.7,
          reviews_count: 24,
          media: JSON.stringify([{ type: 'image', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800' }])
        },
        {
          name: 'Diamond Eternity Ring',
          description: 'A symbol of everlasting love, set with brilliant-cut diamonds in 18k white gold.',
          price: 8500,
          image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
          category_id: catRefs['Jewelry'],
          is_featured: false,
          is_trending: true,
          stock: 3,
          rating: 5.0,
          reviews_count: 8,
          media: JSON.stringify([{ type: 'image', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800' }])
        },
        {
          name: 'Midnight Essence',
          description: 'A sophisticated fragrance with notes of sandalwood, amber, and rare spices.',
          price: 250,
          discount_price: 199,
          image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800',
          category_id: catRefs['Perfume'],
          is_featured: true,
          is_trending: true,
          stock: 50,
          rating: 4.6,
          reviews_count: 45,
          media: JSON.stringify([{ type: 'image', url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800' }])
        }
      ];

      initialProducts.forEach(prod => {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, prod);
      });

      await batch.commit();
      toast.success('Store seeded successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed store', { id: loadingToast });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="w-10 h-10 neumorphic-circle text-luxury-black flex items-center justify-center">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={seedStore}
            className="bg-luxury-black text-white p-2 rounded-xl px-4 text-xs font-bold active:scale-95 transition-all"
          >
            Seed Store
          </button>
          <button 
            onClick={openAddModal}
            className="bg-primary text-white p-2 rounded-xl flex items-center space-x-2 px-4 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="text-sm font-bold">Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Total Sales" 
          value={`$${stats.totalSales.toFixed(2)}`} 
          color="bg-green-500" 
          onClick={() => setActiveTab('orders')}
        />
        <StatCard 
          icon={<ShoppingBag size={20} />} 
          label="Orders" 
          value={stats.totalOrders.toString()} 
          color="bg-blue-500" 
          onClick={() => setActiveTab('orders')}
        />
        <StatCard 
          icon={<Users size={20} />} 
          label="Users" 
          value={stats.totalUsers.toString()} 
          color="bg-purple-500" 
          onClick={() => setActiveTab('users')}
        />
        <StatCard 
          icon={<Package size={20} />} 
          label="Products" 
          value={stats.totalProducts.toString()} 
          color="bg-orange-500" 
          onClick={() => setActiveTab('products')}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
        >
          Orders
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
        >
          Users
        </button>
      </div>

      {/* Content */}
      {activeTab === 'products' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Manage Products</h2>
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center space-x-4">
                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500">${product.price}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="p-2 text-blue-500 bg-blue-50 rounded-lg active:scale-90 transition-transform"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(product.id)}
                    className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-90 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Manage Orders</h2>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="text-xs text-gray-400">{order.user_name} {order.phone && `• ${order.phone}`}</p>
                    {order.address && <p className="text-[10px] text-gray-400 italic mt-1">{order.address}</p>}
                  </div>
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest outline-none border-none ${
                      order.status === 'pending' ? 'bg-orange-50 text-orange-500' : 
                      order.status === 'delivered' ? 'bg-green-50 text-green-500' : 
                      'bg-blue-50 text-blue-500'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                {/* Order Items - Full Details */}
                <div className="bg-gray-50/50 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Items</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-[10px] text-gray-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <span className="font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="text-gray-400">Payment: <span className="text-luxury-black font-medium uppercase">{order.payment_method}</span></p>
                    <p className="text-gray-400">Date: <span className="text-luxury-black font-medium">{new Date(order.created_at).toLocaleString()}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Amount</p>
                    <p className="text-lg font-bold text-primary">${order.total_price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Manage Users</h2>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{u.name}</h3>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-50 text-purple-500' : 'bg-gray-50 text-gray-500'}`}>
                  {u.role || 'user'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xs rounded-[32px] p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Delete Product?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone.</p>
              </div>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-200"
                >
                  Yes, Delete
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      value={editingProduct?.name || ''}
                      onChange={e => setEditingProduct(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={editingProduct?.price || 0}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, price: parseFloat(e.target.value) || 0 }) : null)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Discount Price</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={editingProduct?.discount_price || 0}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, discount_price: parseFloat(e.target.value) || 0 }) : null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      value={editingProduct?.category_id || ''}
                      onChange={e => setEditingProduct(prev => prev ? ({ ...prev, category_id: e.target.value }) : null)}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                      value={editingProduct?.description || ''}
                      onChange={e => setEditingProduct(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase">Product Media (Images & Videos)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {JSON.parse(editingProduct?.media || '[]').map((item: any, index: number) => (
                        <div key={index} className="relative aspect-square bg-gray-50 border border-gray-100 rounded-xl overflow-hidden group">
                          {item.type === 'video' ? (
                            <video src={item.url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                          <button 
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                          >
                            <X size={14} />
                          </button>
                          {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                <Plus size={12} className="text-white rotate-45" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <label className={`aspect-square bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors ${isProcessingMedia ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isProcessingMedia ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus size={20} className="text-gray-400" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Add Media</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          multiple
                          disabled={isProcessingMedia}
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={handleMediaChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-primary"
                        checked={editingProduct?.is_featured || false}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, is_featured: e.target.checked }) : null)}
                      />
                      <span className="text-xs font-bold text-gray-600">Featured</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-primary"
                        checked={editingProduct?.is_trending || false}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, is_trending: e.target.checked }) : null)}
                      />
                      <span className="text-xs font-bold text-gray-600">Trending</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-primary"
                        checked={editingProduct?.has_free_delivery || false}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, has_free_delivery: e.target.checked }) : null)}
                      />
                      <span className="text-xs font-bold text-gray-600">Free Delivery</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-primary"
                        checked={editingProduct?.has_return_policy || false}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, has_return_policy: e.target.checked }) : null)}
                      />
                      <span className="text-xs font-bold text-gray-600">7 Days Return</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-primary"
                        checked={editingProduct?.has_warranty || false}
                        onChange={e => setEditingProduct(prev => prev ? ({ ...prev, has_warranty: e.target.checked }) : null)}
                      />
                      <span className="text-xs font-bold text-gray-600">1 Year Warranty</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving || isProcessingMedia}
                    className={`w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 ${(isSaving || isProcessingMedia) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-all'}`}
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save Product'}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: React.ReactNode, label: string, value: string, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2 text-left active:scale-95 transition-all w-full"
    >
      <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </button>
  );
}

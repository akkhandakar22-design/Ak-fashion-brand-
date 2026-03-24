import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, ChevronLeft } from 'lucide-react';
import { useApp } from '../AppContext';
import { Order } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Orders() {
  const { user, formatPrice, t } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('user_id', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      
      // Sort in memory to avoid index requirement
      ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(prevOrders => {
        // Check for status changes to notify user
        if (prevOrders.length > 0) {
          ordersData.forEach(newOrder => {
            const oldOrder = prevOrders.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              toast.success(`Order #${newOrder.id.slice(-6).toUpperCase()} status updated to ${newOrder.status}!`, {
                icon: '📦',
                duration: 5000
              });
            }
          });
        }
        return ordersData;
      });
    }, (error) => {
      console.error("Error listening to orders:", error);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return <div className="p-8 text-center">Please login to view orders</div>;

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
        <h1 className="text-3xl font-light text-luxury-black">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8">
          <div className="w-32 h-32 neumorphic-circle text-primary/30">
            <Package size={48} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No history yet</p>
            <p className="text-xs text-gray-300 font-light">Your future acquisitions will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map(order => (
            <div key={order.id} className="bg-white/40 border border-white p-6 rounded-[40px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-luxury-black uppercase tracking-widest">Order #{order.id}</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </p>
                  {order.address && (
                    <p className="text-[9px] text-gray-400 mt-2 italic">
                      Shipping to: {order.address} {order.phone && `• ${order.phone}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                    order.status === 'pending' ? 'bg-orange-50 text-orange-400 border border-orange-100' : 
                    order.status === 'delivered' ? 'bg-green-50 text-green-400 border border-green-100' : 
                    'bg-blue-50 text-blue-400 border border-blue-100'
                  }`}>
                    {order.status}
                  </span>
                  {order.estimated_delivery && order.status !== 'delivered' && (
                    <p className="text-[8px] font-bold text-primary uppercase tracking-widest mt-2">
                      Est. Delivery: {format(new Date(order.estimated_delivery), 'MMM dd')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-black/5">
                <div className="flex -space-x-3 overflow-hidden">
                  {order.items?.map((item, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-beige border-2 border-white overflow-hidden shadow-sm">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  {(!order.items || order.items.length === 0) && (
                    <div className="w-10 h-10 rounded-full bg-beige border-2 border-white flex items-center justify-center">
                      <Package size={14} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Investment</p>
                  <p className="text-sm font-bold text-primary">{formatPrice(order.total_price)}</p>
                </div>
              </div>

              {/* Tracking Status */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <StatusStep icon={<Clock size={12} />} label="Placed" active />
                  <div className={`flex-1 h-[1px] mx-2 transition-all duration-1000 ${order.status !== 'pending' ? 'bg-primary' : 'bg-black/5'}`}></div>
                  <StatusStep icon={<Package size={12} />} label="Packed" active={order.status !== 'pending'} />
                  <div className={`flex-1 h-[1px] mx-2 transition-all duration-1000 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary' : 'bg-black/5'}`}></div>
                  <StatusStep icon={<Truck size={12} />} label="Shipped" active={order.status === 'shipped' || order.status === 'delivered'} />
                  <div className={`flex-1 h-[1px] mx-2 transition-all duration-1000 ${order.status === 'delivered' ? 'bg-primary' : 'bg-black/5'}`}></div>
                  <StatusStep icon={<CheckCircle2 size={12} />} label="Delivered" active={order.status === 'delivered'} />
                </div>
                
                {order.status !== 'delivered' && (
                  <div className="bg-primary/5 rounded-2xl p-4 flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                      <Truck size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-luxury-black uppercase tracking-widest">On its way</p>
                      <p className="text-[9px] text-gray-400 font-medium">Your package is moving through our logistics network.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatusStep({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`w-8 h-8 neumorphic-circle transition-all duration-500 ${active ? 'text-primary' : 'text-gray-200 opacity-50'}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-luxury-black' : 'text-gray-300'}`}>{label}</span>
    </div>
  );
}

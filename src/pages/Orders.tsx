import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, ChevronLeft, RotateCcw, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useApp } from '../AppContext';
import { Order } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Orders() {
  const { user, formatPrice, t } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [returningItem, setReturningItem] = useState<{ orderId: string, itemId: string } | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const returnReasons = [
    "Damaged item",
    "Wrong size",
    "Not as described",
    "Changed my mind",
    "Quality issue",
    "Other"
  ];

  const handleReturnRequest = async (orderId: string, itemId: string) => {
    if (!returnReason) {
      toast.error('Please select a reason for return');
      return;
    }

    const loadingToast = toast.loading('Initiating return...');
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.items) return;

      const updatedItems = order.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            return_status: 'requested',
            return_reason: returnReason,
            return_requested_at: new Date().toISOString()
          };
        }
        return item;
      });

      await updateDoc(doc(db, 'orders', orderId), {
        items: updatedItems
      });

      // Notify Admin
      const item = order.items.find(i => i.id === itemId);
      fetch('/api/notify-return-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userName: user.name,
          itemName: item?.name || 'Unknown Item',
          reason: returnReason
        })
      }).catch(err => console.error('Notification error:', err));

      toast.success('Return request submitted successfully', { id: loadingToast });
      setReturningItem(null);
      setReturnReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      toast.error('Failed to submit return request', { id: loadingToast });
    }
  };

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
            <div key={order.id} className="bg-white/40 border border-white p-6 rounded-[40px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6 overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xs font-bold text-luxury-black uppercase tracking-widest">Order #{order.id.slice(-8).toUpperCase()}</h3>
                    <button 
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className="text-primary hover:bg-primary/5 p-1 rounded-full transition-colors"
                    >
                      {expandedOrderId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
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

              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 pt-4 border-t border-black/5"
                  >
                    <p className="text-[10px] font-bold text-luxury-black uppercase tracking-widest">Items in this order</p>
                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-white/40">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-beige overflow-hidden shadow-sm">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-luxury-black uppercase tracking-widest">{item.name}</p>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Qty: {item.quantity} • {formatPrice(item.price)}</p>
                              
                              {item.return_status && item.return_status !== 'not_requested' && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <span className={`text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                                    item.return_status === 'requested' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                    item.return_status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' :
                                    item.return_status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    'bg-gray-50 text-gray-600 border border-gray-100'
                                  }`}>
                                    Return {item.return_status}
                                  </span>
                                  {item.return_reason && (
                                    <span className="text-[8px] text-gray-400 italic">Reason: {item.return_reason}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {order.status === 'delivered' && (!item.return_status || item.return_status === 'not_requested') && (
                            <button 
                              onClick={() => setReturningItem({ orderId: order.id, itemId: item.id })}
                              className="flex items-center space-x-2 text-[9px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5 px-3 py-2 rounded-xl transition-colors"
                            >
                              <RotateCcw size={12} />
                              <span>Return</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Return Modal / Inline Form */}
                    <AnimatePresence>
                      {returningItem && returningItem.orderId === order.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-luxury-black text-white p-6 rounded-3xl space-y-4 shadow-2xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertCircle size={16} className="text-primary" />
                              <h4 className="text-[10px] font-bold uppercase tracking-widest">Return Request</h4>
                            </div>
                            <button onClick={() => setReturningItem(null)} className="text-gray-400 hover:text-white">
                              <X size={16} />
                            </button>
                          </div>
                          
                          <p className="text-[9px] text-gray-400">Please select a reason for returning this item. Our team will review your request within 24-48 hours.</p>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {returnReasons.map((reason) => (
                              <button
                                key={reason}
                                onClick={() => setReturnReason(reason)}
                                className={`text-left px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                                  returnReason === reason 
                                    ? 'bg-primary text-white' 
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleReturnRequest(returningItem.orderId, returningItem.itemId)}
                              className="bg-primary text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                              Submit Request
                            </button>
                            <button
                              onClick={() => {
                                setReturningItem(null);
                                setReturnReason('');
                              }}
                              className="bg-white/10 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

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

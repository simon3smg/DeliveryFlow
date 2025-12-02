
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Package, X, Trash2, CheckCircle, ArrowRight, User, Store as StoreIcon, Loader2, Calendar, Edit2, ChevronLeft, ChevronRight, Clock, ChevronDown, ChevronUp, AlertTriangle, CreditCard, Banknote, DollarSign, Wallet, Minus } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Delivery, Store, Product, DeliveryItem, User as UserType } from '../types';
import { SignaturePad } from '../components/SignaturePad';
import { useLocation } from 'react-router-dom';
import { formatEdmontonDate, formatEdmontonTime, getEdmontonISOString, toEdmontonISOString, getCurrentEdmontonISOString } from '../services/dateUtils';

// --- Sub-component for individual delivery card ---
const DeliveryCard: React.FC<{ 
    delivery: Delivery; 
    onEdit: (e: React.MouseEvent, d: Delivery) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onMarkPaid: (e: React.MouseEvent, d: Delivery) => void;
}> = ({ delivery, onEdit, onDelete, onMarkPaid }) => {
  const [expanded, setExpanded] = useState(false);

  const totalValue = delivery.items.reduce((sum, item) => sum + (item.quantity * item.priceAtDelivery), 0);
  const itemCount = delivery.items.reduce((sum, item) => sum + item.quantity, 0);

  // Determine if this is an unpaid cash delivery
  const isUnpaidCash = delivery.paymentMethod === 'cash' && delivery.paymentStatus === 'pending';

  return (
    <div 
      className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden group ${expanded ? 'border-indigo-200 shadow-md' : 'border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-md'}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact Header Row */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
           <div className={`p-2.5 rounded-xl shrink-0 transition-colors duration-200 ${expanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
              <StoreIcon size={20} />
           </div>
           <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{delivery.storeName}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                 <span className="flex items-center gap-1"><Calendar size={12} /> {formatEdmontonDate(delivery.timestamp)}</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                 <span className="font-medium text-slate-600">{itemCount} items</span>
                 
                 {/* Payment Method Badge */}
                 {delivery.paymentMethod === 'cash' ? (
                     <span className={`flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${isUnpaidCash ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        <Banknote size={10} /> {isUnpaidCash ? 'Cash Pending' : 'Cash Paid'}
                     </span>
                 ) : (
                     <span className="flex items-center gap-1 ml-2 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-[10px] font-bold uppercase">
                        <CreditCard size={10} /> Credit
                     </span>
                 )}
              </div>
           </div>
        </div>
        
        <div className="text-right shrink-0">
           <div className="flex flex-col items-end">
               <span className="font-bold text-slate-900 text-sm sm:text-base">${totalValue.toFixed(2)}</span>
               <div className="flex items-center gap-1 mt-1">
                   <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {delivery.status}
                   </span>
                   {expanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
               </div>
           </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      {expanded && (
        <div 
          className="px-4 pb-4 pt-0 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200 cursor-default"
          onClick={(e) => e.stopPropagation()} 
        >
           <div className="py-4 flex flex-col gap-4 text-sm text-slate-600">
              
              {/* Metadata Row */}
              <div className="flex flex-wrap gap-4 text-xs">
                 <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                    <User size={12} className="text-indigo-500"/> <span className="font-medium text-slate-700">{delivery.driverName}</span>
                 </span>
                 <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                    <Clock size={12} className="text-indigo-500"/> <span className="font-medium text-slate-700">{formatEdmontonTime(delivery.timestamp)}</span>
                 </span>
                 <span className="sm:hidden flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded font-bold uppercase tracking-wide text-[10px]">
                    <CheckCircle size={10}/> {delivery.status}
                 </span>
              </div>
              
              {/* Unpaid Warning Banner */}
              {isUnpaidCash && (
                 <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs shadow-sm">
                     <div className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span className="font-bold">Payment Not Collected</span>
                     </div>
                     <button 
                        onClick={(e) => onMarkPaid(e, delivery)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide shadow-sm transition-colors flex items-center gap-1"
                     >
                        Mark as Paid
                     </button>
                 </div>
              )}

              {/* Item List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                 <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Item</span>
                    <span>Qty / Price</span>
                 </div>
                 <div className="divide-y divide-slate-100">
                    {delivery.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs">
                          <span className="font-medium text-slate-700">{item.productName}</span>
                          <span className="font-mono text-slate-500">
                             <span className="font-bold text-slate-800">{item.quantity}</span> x ${item.priceAtDelivery}
                          </span>
                       </div>
                    ))}
                 </div>
                 <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Total</span>
                    <span className="font-bold text-indigo-600 font-mono">${totalValue.toFixed(2)}</span>
                 </div>
              </div>

              {/* Notes if any */}
              {delivery.notes && (
                 <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900">
                    <span className="font-bold block mb-1 uppercase text-[10px] tracking-wider text-amber-700">Notes</span> 
                    {delivery.notes}
                 </div>
              )}

              {/* Actions */}
              <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-200/60 relative z-10">
                 <button 
                    type="button"
                    onClick={(e) => {
                       e.stopPropagation();
                       onDelete(e, delivery.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm rounded-lg text-xs font-bold text-slate-600 hover:text-red-600 transition-all active:scale-95"
                    title="Delete Delivery"
                 >
                    <Trash2 size={14} /> Delete
                 </button>

                 <button 
                    type="button"
                    onClick={(e) => {
                       e.stopPropagation();
                       onEdit(e, delivery);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 shadow-sm rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all active:scale-95"
                 >
                    <Edit2 size={14} /> Edit Delivery
                 </button>
              </div>

              {/* Last Edited By info */}
              {delivery.lastEditedBy && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic flex items-center justify-end gap-1">
                      <Edit2 size={10} />
                      <span>Last edited by {delivery.lastEditedBy} • {formatEdmontonDate(delivery.lastEditedAt)} {formatEdmontonTime(delivery.lastEditedAt)}</span>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export const Deliveries: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [filterMode, setFilterMode] = useState<'daily' | 'pending'>('daily');
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [deliveryToDelete, setDeliveryToDelete] = useState<string | null>(null);
  
  const location = useLocation();

  const formatDateDisplay = (dateStr: string) => {
     if (!dateStr) return '';
     // dateStr is YYYY-MM-DD
     const [y, m, d] = dateStr.split('-').map(Number);
     // Use UTC to format to ensure we stay on the same day visual
     const date = new Date(Date.UTC(y, m - 1, d));
     return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(getEdmontonISOString);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [cart, setCart] = useState<DeliveryItem[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cashReceived, setCashReceived] = useState(true);

  // Helper Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Computed properties
  const selectedStore = stores.find(s => s.id === selectedStoreId);

  useEffect(() => {
    refreshData();
    const unsub = storageService.onAuthStateChanged(u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Handle Navigation from Dashboard Notifications
  useEffect(() => {
    if (location.state && (location.state as any).preSelectStoreId) {
        const preSelectedId = (location.state as any).preSelectStoreId;
        resetForm();
        setSelectedStoreId(preSelectedId);
        setView('create');
        // Clear history state to prevent re-triggering on simple reload
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Set default product when products load or view changes
  useEffect(() => {
    if ((view === 'create' || view === 'edit') && products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id);
    }
  }, [view, products, selectedProductId]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [del, str, prod] = await Promise.all([
            storageService.getDeliveries(),
            storageService.getStores(),
            storageService.getProducts()
        ]);
        setDeliveries(del);
        setStores(str);
        setProducts(prod);
    } catch (e) {
        console.error("Failed to load delivery data", e);
    } finally {
        setLoading(false);
    }
  };

  const changeDate = (days: number) => {
      // Safe arithmetic using UTC to avoid timezone shifting
      const [y, m, d] = dateFilter.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      date.setUTCDate(date.getUTCDate() + days);
      const nextDate = date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
      setDateFilter(nextDate);
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem: DeliveryItem = {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      priceAtDelivery: product.price
    };

    setCart([...cart, newItem]);
    
    // Reset defaults
    if (products.length > 0) {
        setSelectedProductId(products[0].id);
    } else {
        setSelectedProductId('');
    }
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const checkAdminPermission = () => {
    if (currentUser?.role !== 'admin') {
      alert("Access Restricted: This action is reserved for Administrators. Please contact Administration.");
      return false;
    }
    return true;
  };

  const handleEdit = (e: React.MouseEvent, delivery: Delivery) => {
      e.preventDefault();
      e.stopPropagation();

      // Permission check removed to allow drivers to edit
      setEditingId(delivery.id);
      setSelectedStoreId(delivery.storeId);
      setCart(delivery.items);
      setSignature(delivery.signatureDataUrl || null);
      setNotes(delivery.notes || '');
      // If it's a cash delivery and status is NOT paid (i.e. pending), then cashReceived is false.
      // Default to true for paid or undefined (legacy).
      if (delivery.paymentMethod === 'cash' && delivery.paymentStatus === 'pending') {
          setCashReceived(false);
      } else {
          setCashReceived(true);
      }
      setView('edit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkPaid = async (e: React.MouseEvent, delivery: Delivery) => {
      e.preventDefault();
      e.stopPropagation();

      // Permission check removed to allow drivers to mark paid

      try {
        await storageService.updateDelivery({
            ...delivery,
            paymentStatus: 'paid',
            lastEditedBy: currentUser?.name,
            lastEditedAt: getCurrentEdmontonISOString()
        });
        await refreshData();
      } catch (err) {
        console.error("Failed to mark as paid", err);
        alert("Failed to update payment status.");
      }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!checkAdminPermission()) return;

    if (id) {
        setDeliveryToDelete(id);
    }
  };

  const confirmDelete = async () => {
    if (!deliveryToDelete) return;
    
    setLoading(true);
    try {
        await storageService.deleteDelivery(deliveryToDelete);
        // Wait a moment for propagation then refresh
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshData();
    } catch (error) {
        console.error("Error deleting delivery:", error);
        alert("Failed to delete delivery. Please try again.");
    } finally {
        setLoading(false);
        setDeliveryToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStoreId || cart.length === 0) {
      alert("Please select a store and add items.");
      return;
    }

    setSubmitting(true);
    const store = stores.find(s => s.id === selectedStoreId);
    
    // Use the Edmonton ISO string with offset for the timestamp
    // Defaults to current time if creating new
    let timestamp = toEdmontonISOString(new Date());
    let id = Date.now().toString();
    let driverName = currentUser?.name || 'Unknown Driver';

    if (view === 'edit' && editingId) {
        const original = deliveries.find(d => d.id === editingId);
        if (original) {
            // Even when editing, force the format to be Edmonton offset
            // This fixes legacy data that might be in UTC 'Z' format
            timestamp = toEdmontonISOString(original.timestamp);
            id = original.id;
            driverName = original.driverName || driverName;
        }
    }

    // Determine payment status
    let paymentStatus: 'paid' | 'pending' = 'pending';
    
    if (store?.paymentMethod === 'cash') {
        paymentStatus = cashReceived ? 'paid' : 'pending';
    } else {
        paymentStatus = 'pending'; // Credit is always collected later
    }

    const payload: Delivery = {
      id,
      storeId: selectedStoreId,
      storeName: store?.name || 'Unknown Store',
      driverName,
      items: cart,
      signatureDataUrl: signature || '',
      notes,
      timestamp,
      status: 'completed',
      paymentMethod: store?.paymentMethod || 'credit',
      paymentStatus: paymentStatus
    };

    // If editing, add tracking metadata
    if (view === 'edit') {
        payload.lastEditedBy = currentUser?.name;
        payload.lastEditedAt = getCurrentEdmontonISOString();
    }

    try {
        if (view === 'edit') {
            await storageService.updateDelivery(payload);
        } else {
            await storageService.saveDelivery(payload);
        }
        await refreshData();
        setView('list');
        resetForm();
    } catch (e) {
        alert("Failed to save delivery. Check console.");
        console.error(e);
    } finally {
        setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedStoreId('');
    setCart([]);
    setSignature(null);
    setNotes('');
    setCashReceived(true);
    if (products.length > 0) {
        setSelectedProductId(products[0].id);
    } else {
        setSelectedProductId('');
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const searchMatch = d.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterMode === 'pending') {
        // Show all unpaid cash deliveries regardless of date
        return searchMatch && d.paymentMethod === 'cash' && d.paymentStatus === 'pending';
    }

    // Daily View (Edmonton Time)
    // d.timestamp might be ISO or Z, getEdmontonISOString handles both via Date constructor
    const deliveryDateStr = getEdmontonISOString(d.timestamp);
    return searchMatch && deliveryDateStr === dateFilter;
  });

  const totalPendingAmount = deliveries
    .filter(d => d.paymentMethod === 'cash' && d.paymentStatus === 'pending')
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

  if (loading && view === 'list' && deliveries.length === 0) {
      return (
          <div className="flex h-96 items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {view === 'list' && (
        <>
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm sticky top-0 z-20 md:static">
             
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                 {/* View Mode Toggle */}
                 <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full sm:w-auto">
                    <button 
                        onClick={() => setFilterMode('daily')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${filterMode === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Daily Route
                    </button>
                    <button 
                        onClick={() => setFilterMode('pending')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${filterMode === 'pending' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pending Cash
                        {totalPendingAmount > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                    </button>
                 </div>

                 {/* Date Navigator - Only show in Daily mode */}
                 {filterMode === 'daily' && (
                     <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1 w-full sm:w-auto justify-between sm:justify-start">
                        <button 
                            onClick={() => changeDate(-1)} 
                            className="p-3 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 transition-all active:scale-95"
                            title="Previous Day"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="relative mx-2 group">
                            <div className="flex items-center gap-2 px-4 py-1 cursor-pointer">
                                <Calendar size={16} className="text-indigo-600" />
                                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                    {formatDateDisplay(dateFilter)}
                                </span>
                            </div>
                            <input 
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        <button 
                            onClick={() => changeDate(1)} 
                            className="p-3 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 transition-all active:scale-95"
                            title="Next Day"
                        >
                            <ChevronRight size={20} />
                        </button>
                     </div>
                 )}
             </div>

             {/* Search & Add */}
             <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                 <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder={filterMode === 'pending' ? "Search unpaid..." : "Search deliveries..."} 
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>

                 <button 
                    onClick={() => { resetForm(); setView('create'); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 font-semibold text-sm whitespace-nowrap active:scale-95"
                  >
                    <Plus size={18} /> New Delivery
                 </button>
             </div>
          </div>

          {/* Pending Cash Summary Banner */}
          {filterMode === 'pending' && filteredDeliveries.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-white rounded-2xl border border-red-100 text-red-500 shadow-sm">
                        <Wallet size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-red-900 text-lg">Outstanding Cash</h3>
                        <p className="text-red-600/80 text-sm">Total pending collection from cash customers</p>
                     </div>
                 </div>
                 <div className="text-3xl font-bold text-red-700 tracking-tight">
                    ${totalPendingAmount.toFixed(2)}
                 </div>
              </div>
          )}

          <div className="flex flex-col gap-3">
             {filteredDeliveries.length === 0 ? (
               <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 border-dashed mt-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} className="text-slate-300" />
                 </div>
                 <p className="font-medium text-slate-600">
                     {filterMode === 'pending' 
                        ? "Great job! No pending cash payments found." 
                        : "No deliveries found for this date."}
                 </p>
                 {filterMode === 'daily' && (
                    <button 
                        onClick={() => {
                            setDateFilter(getEdmontonISOString());
                            setSearchTerm('');
                        }}
                        className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                    >
                        Reset to Today
                    </button>
                 )}
               </div>
             ) : (
               filteredDeliveries.map((delivery) => (
                   <DeliveryCard 
                      key={delivery.id} 
                      delivery={delivery} 
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onMarkPaid={handleMarkPaid}
                   />
               ))
             )}
          </div>
        </>
      )}

      {(view === 'create' || view === 'edit') && (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{view === 'edit' ? 'Edit Delivery' : 'New Delivery'}</h2>
                    <p className="text-slate-500">{view === 'edit' ? `Updating delivery for ${deliveries.find(d => d.id === editingId)?.storeName}` : 'Record a new drop-off'}</p>
                </div>
                <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-8 space-y-8">

                    {/* Store Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Select Store</label>
                        <div className="relative">
                            <select 
                                value={selectedStoreId} 
                                onChange={(e) => {
                                    setSelectedStoreId(e.target.value);
                                    setCashReceived(true); // Reset when store changes
                                }}
                                className="w-full p-4 pl-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700 text-base"
                            >
                                <option value="">-- Choose Store --</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name} - {s.address}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>
                        {selectedStore && (
                            <div className="flex flex-col gap-3">
                                <div className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-top-1 ${selectedStore.paymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                                    {selectedStore.paymentMethod === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />}
                                    <span>
                                        Payment Terms: <span className="uppercase">{selectedStore.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Monthly Credit'}</span>
                                    </span>
                                </div>
                                
                                {/* Cash Received Toggle */}
                                {selectedStore.paymentMethod === 'cash' && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-green-600">
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Cash Collected?</p>
                                                <p className="text-xs text-slate-500">Uncheck if store will pay later</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={cashReceived} 
                                                onChange={(e) => setCashReceived(e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                            <span>2. Add Products</span>
                            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{cart.length} items</span>
                        </label>
                        
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <div className="flex-1 relative">
                                    <select 
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base sm:text-sm appearance-none bg-white font-medium"
                                    >
                                    {/* Default selected option is managed by state, no need for placeholder if data exists */}
                                    {products.length === 0 && <option value="">Loading products...</option>}
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price}/{p.unit})</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                                        <button 
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-3 py-3 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 active:bg-slate-200 transition-colors h-full flex items-center justify-center"
                                            type="button"
                                        >
                                            <Minus size={18} className="text-slate-600"/>
                                        </button>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-14 py-3 text-center outline-none text-slate-800 font-bold appearance-none m-0 bg-transparent"
                                        />
                                        <button 
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-3 py-3 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 active:bg-slate-200 transition-colors h-full flex items-center justify-center"
                                            type="button"
                                        >
                                            <Plus size={18} className="text-slate-600"/>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={handleAddItem}
                                        className="bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-800 font-medium transition-colors shadow-lg shadow-slate-200 active:scale-95"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Cart List */}
                            {cart.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                                            <Package size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm">{item.productName} <span className="text-slate-400 text-xs font-normal ml-1">x{item.quantity}</span></span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-slate-800 text-sm">${(item.quantity * item.priceAtDelivery).toFixed(2)}</span>
                                        <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    </div>
                                ))}
                                <div className="pt-4 flex justify-end border-t border-slate-200 mt-4">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Value</p>
                                        <p className="text-2xl font-bold text-slate-900">${cart.reduce((acc, i) => acc + (i.quantity * i.priceAtDelivery), 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                    No items added yet
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Signature */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                3. Signature <span className="text-slate-300 font-normal ml-1">(Optional)</span>
                            </label>
                            
                            {signature ? (
                                <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden h-40 w-full relative group shadow-sm">
                                    <img src={signature} alt="Signature" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                        <p className="text-white font-bold text-sm">Signature Captured</p>
                                        <button 
                                            onClick={() => setSignature(null)} 
                                            className="bg-white text-red-500 px-4 py-2 rounded-lg font-bold shadow-lg text-xs hover:bg-red-50"
                                        >
                                            Redo Signature
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <SignaturePad onEnd={setSignature} />
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none bg-slate-50 focus:bg-white transition-colors text-base sm:text-sm"
                                placeholder="Any delivery notes or issues..."
                            />
                        </div>
                    </div>

                </div>

                <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-4">
                    <button 
                        onClick={() => setView('list')}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all w-full sm:w-auto"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        {submitting && <Loader2 className="animate-spin" size={20}/>}
                        {view === 'edit' ? 'Update Delivery' : 'Complete Delivery'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deliveryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Confirm Delete</h3>
                        <p className="text-slate-500 text-sm mt-1">Are you sure you want to remove this delivery? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setDeliveryToDelete(null)} className="flex-1 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

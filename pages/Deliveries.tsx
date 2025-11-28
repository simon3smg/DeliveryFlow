import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Package, X, Trash2, CheckCircle, ArrowRight, User, Store as StoreIcon, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Delivery, Store, Product, DeliveryItem } from '../types';
import { SignaturePad } from '../components/SignaturePad';

export const Deliveries: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [cart, setCart] = useState<DeliveryItem[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Helper Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    refreshData();
  }, []);

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
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleSubmit = async () => {
    if (!selectedStoreId || cart.length === 0 || !signature) {
      alert("Please complete all fields and sign.");
      return;
    }

    setSubmitting(true);
    const store = stores.find(s => s.id === selectedStoreId);
    
    // Auth User
    let driverName = "Unknown Driver";
    // We can't use the hook here, so we'll rely on our service
    // In a real app we might pass user as prop
    // For now we'll just placeholder or let the backend handle it if we moved logic there
    // We'll trust the user context will be improved later
    
    const newDelivery: Delivery = {
      id: Date.now().toString(), // Will be ignored by Firestore if we let it generate ID, but useful for optimistic UI
      storeId: selectedStoreId,
      storeName: store?.name || 'Unknown Store',
      driverName: 'John Driver', // Placeholder until context is wired fully
      items: cart,
      signatureDataUrl: signature,
      notes,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    try {
        await storageService.saveDelivery(newDelivery);
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
    setSelectedStoreId('');
    setCart([]);
    setSignature(null);
    setNotes('');
  };

  const filteredDeliveries = deliveries.filter(d => 
    d.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && view === 'list' && deliveries.length === 0) {
      return (
          <div className="flex h-96 items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             {/* Search Bar */}
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search store, driver..." 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-shadow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             <button 
                onClick={() => setView('create')}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
              >
                <Plus size={20} /> <span className="font-semibold">New Delivery</span>
             </button>
          </div>

          <div className="grid gap-4">
             {filteredDeliveries.length === 0 ? (
               <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
                 <Package size={48} className="mx-auto mb-4 text-slate-200" />
                 <p>No deliveries found matching your search.</p>
               </div>
             ) : (
               filteredDeliveries.map((delivery) => (
                   <div key={delivery.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                     
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <StoreIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{delivery.storeName}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {new Date(delivery.timestamp).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><User size={14} /> {delivery.driverName}</span>
                            </div>
                        </div>
                     </div>

                     <div className="flex-1 md:px-8">
                         <div className="flex flex-wrap gap-2">
                            {delivery.items.slice(0, 3).map((item, idx) => (
                                <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full font-medium">
                                    {item.productName} <span className="text-slate-400">x{item.quantity}</span>
                                </span>
                            ))}
                            {delivery.items.length > 3 && (
                                <span className="bg-slate-50 text-slate-400 text-xs px-2 py-1 rounded-full border border-slate-100">
                                    +{delivery.items.length - 3} more
                                </span>
                            )}
                         </div>
                     </div>

                     <div className="flex items-center justify-between md:justify-end gap-4 min-w-[140px]">
                         <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                            <CheckCircle size={14} strokeWidth={2.5} /> Completed
                         </span>
                         <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                            <ArrowRight size={20} />
                         </div>
                     </div>

                   </div>
               ))
             )}
          </div>
        </>
      )}

      {view === 'create' && (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">New Delivery</h2>
                    <p className="text-slate-500">Record a new drop-off</p>
                </div>
                <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 space-y-8">
                    
                    {/* Store Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">1. Select Store</label>
                        <div className="relative">
                            <select 
                                value={selectedStoreId} 
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                className="w-full p-4 pl-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Choose Store --</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name} - {s.address}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex justify-between">
                            <span>2. Add Products</span>
                            <span className="text-slate-400 font-normal normal-case">{cart.length} items added</span>
                        </label>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <div className="flex-1 relative">
                                    <select 
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none bg-white"
                                    >
                                    <option value="">Select Product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price}/{p.unit})</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="w-24 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-center"
                                    />
                                    <button 
                                        onClick={handleAddItem}
                                        className="bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-800 font-medium transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Cart List */}
                            {cart.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Package size={16} />
                                        </div>
                                        <span className="font-medium text-slate-700">{item.productName} <span className="text-slate-400 text-sm">x{item.quantity}</span></span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-slate-800">${(item.quantity * item.priceAtDelivery).toFixed(2)}</span>
                                        <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    </div>
                                ))}
                                <div className="pt-4 flex justify-end">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Total Value</p>
                                        <p className="text-xl font-bold text-slate-900">${cart.reduce((acc, i) => acc + (i.quantity * i.priceAtDelivery), 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                                    No items added yet
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Signature */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">3. Signature</label>
                            <SignaturePad onEnd={setSignature} />
                        </div>

                        {/* Notes */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Notes</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none"
                                placeholder="Any delivery notes or issues..."
                            />
                        </div>
                    </div>

                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                    <button 
                        onClick={() => setView('list')}
                        className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="animate-spin" size={20}/>}
                        Complete Delivery
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Store, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, MapPin, Phone, Mail, Store as StoreIcon, X, Edit2, Loader2, AlertTriangle, ChevronRight, CreditCard, Banknote } from 'lucide-react';

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Partial<Store>>({ paymentMethod: 'credit' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    loadStores();
    const unsub = storageService.onAuthStateChanged(u => setCurrentUser(u));
    return () => unsub();
  }, []);

  const loadStores = async () => {
      setLoading(true);
      try {
          const data = await storageService.getStores();
          setStores(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleSave = async () => {
    if (!editingStore.name || !editingStore.address) {
        alert("Store name and address are required.");
        return;
    }
    
    setSaving(true);
    try {
        if (editingStore.id) {
            await storageService.updateStore(editingStore as Store);
        } else {
            await storageService.addStore({
                name: editingStore.name!,
                address: editingStore.address!,
                contactPerson: editingStore.contactPerson || '',
                phone: editingStore.phone || '',
                email: editingStore.email || '',
                paymentMethod: editingStore.paymentMethod || 'credit',
                sequence: editingStore.sequence
            });
        }
        await loadStores();
        setIsModalOpen(false);
        setEditingStore({ paymentMethod: 'credit' });
    } catch (e) {
        alert("Error saving store");
    } finally {
        setSaving(false);
    }
  };

  const checkAdminPermission = () => {
    if (currentUser?.role !== 'admin') {
      alert("Access Restricted: This action is reserved for Administrators. Please contact Administration.");
      return false;
    }
    return true;
  };

  const handleEdit = (e: React.MouseEvent, store: Store) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!checkAdminPermission()) return;

      setEditingStore({ ...store });
      setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!checkAdminPermission()) return;

    setStoreToDelete(id);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    try {
        await storageService.deleteStore(storeToDelete);
        await loadStores();
        setStoreToDelete(null);
    } catch(e) {
        alert("Failed to delete store.");
    }
  };

  const openNewStoreModal = () => {
      if (!checkAdminPermission()) return;

      setEditingStore({ paymentMethod: 'credit' });
      setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Stores</h2>
            <p className="text-slate-500">Manage your retail network locations</p>
        </div>
        <button 
          onClick={openNewStoreModal}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> <span className="font-semibold">Add Store</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stores.map(store => (
          <div key={store.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
            
            {store.sequence && (
                <div className="absolute top-4 right-4 bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-md z-20 text-sm">
                    #{store.sequence}
                </div>
            )}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                        <StoreIcon size={28} />
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={(e) => handleEdit(e, store)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><Edit2 size={18} /></button>
                        <button onClick={(e) => handleDeleteClick(e, store.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                </div>

                <h3 className="font-bold text-xl text-slate-800 mb-2 pr-4">{store.name}</h3>
                
                {/* Payment Badge */}
                <div className="mb-4">
                    {store.paymentMethod === 'cash' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Banknote size={12} /> Cash Payment
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            <CreditCard size={12} /> Monthly Credit
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <p className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <MapPin size={16} className="text-indigo-500 mt-0.5 shrink-0" /> 
                        <span className="leading-snug">{store.address}</span>
                    </p>
                    <div className="flex gap-2">
                        {store.phone && (
                            <a href={`tel:${store.phone}`} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-2 rounded-xl hover:border-indigo-200 hover:text-indigo-600 transition-colors">
                                <Phone size={14} /> Call
                            </a>
                        )}
                        {store.email && (
                            <a href={`mailto:${store.email}`} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-2 rounded-xl hover:border-indigo-200 hover:text-indigo-600 transition-colors">
                                <Mail size={14} /> Email
                            </a>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                        {store.contactPerson || 'N/A'} <ChevronRight size={14} className="text-slate-300"/>
                    </span>
                </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] sm:p-4">
          <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-lg rounded-none sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in duration-300 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h3 className="text-xl font-bold text-slate-800">{editingStore.id ? 'Edit Store' : 'New Store'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
              <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">Store Name</label>
                     <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editingStore.name || ''}
                        onChange={e => setEditingStore({...editingStore, name: e.target.value})}
                     />
                  </div>
                  <div className="col-span-1 space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase" title="Route Sequence">Seq #</label>
                     <input 
                        type="number"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                        value={editingStore.sequence || ''}
                        onChange={e => setEditingStore({...editingStore, sequence: parseInt(e.target.value) || undefined})}
                        placeholder="#"
                     />
                  </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                 <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingStore.address || ''}
                    onChange={e => setEditingStore({...editingStore, address: e.target.value})}
                 />
              </div>
              
              {/* Payment Method Selector */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">Payment Terms</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setEditingStore({...editingStore, paymentMethod: 'credit'})}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${editingStore.paymentMethod === 'credit' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        <CreditCard size={20} />
                        <span className="text-xs font-bold">Credit Account</span>
                    </button>
                    <button 
                        onClick={() => setEditingStore({...editingStore, paymentMethod: 'cash'})}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${editingStore.paymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Banknote size={20} />
                        <span className="text-xs font-bold">Cash on Delivery</span>
                    </button>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">Contact Person</label>
                 <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingStore.contactPerson || ''}
                    onChange={e => setEditingStore({...editingStore, contactPerson: e.target.value})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                    <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editingStore.phone || ''}
                        onChange={e => setEditingStore({...editingStore, phone: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                    <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editingStore.email || ''}
                        onChange={e => setEditingStore({...editingStore, email: e.target.value})}
                    />
                 </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 pb-safe">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex justify-center gap-2 items-center">
                    {saving && <Loader2 className="animate-spin" size={20}/>} Save
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Confirm Delete</h3>
                        <p className="text-slate-500 text-sm mt-1">Are you sure you want to remove this store? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setStoreToDelete(null)} className="flex-1 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Store } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, MapPin, Phone, Mail, Store as StoreIcon, X, Edit2, Loader2 } from 'lucide-react';

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Partial<Store>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStores();
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
            // Update existing store
            await storageService.updateStore(editingStore as Store);
        } else {
            // Create new store
            await storageService.addStore({
                name: editingStore.name!,
                address: editingStore.address!,
                contactPerson: editingStore.contactPerson || '',
                phone: editingStore.phone || '',
                email: editingStore.email || ''
            });
        }
        await loadStores();
        setIsModalOpen(false);
        setEditingStore({});
    } catch (e) {
        alert("Error saving store");
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  const handleEdit = (e: React.MouseEvent, store: Store) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingStore({ ...store });
      setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this store? This action cannot be undone.")) {
        try {
            await storageService.deleteStore(id);
            await loadStores();
        } catch(e) {
            alert("Failed to delete store.");
        }
    }
  };

  const handleAddNew = () => {
      setEditingStore({});
      setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="hidden md:block text-slate-500">Manage your retail network</h2>
        <button 
          onClick={handleAddNew}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
        >
          <Plus size={20} /> <span className="font-semibold">Add Store</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stores.map(store => (
          <div key={store.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
            
            {/* Action Buttons - Absolutely Positioned for Z-index safety */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button 
                    type="button"
                    onClick={(e) => handleEdit(e, store)} 
                    className="bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 p-2 transition-all rounded-lg"
                    title="Edit Store"
                >
                    <Edit2 size={16} />
                </button>
                <button 
                    type="button"
                    onClick={(e) => handleDelete(e, store.id)} 
                    className="bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 p-2 transition-all rounded-lg"
                    title="Delete Store"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="relative z-10 mt-2">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                        <StoreIcon size={24} />
                    </div>
                </div>

                <h3 className="font-bold text-xl text-slate-800 mb-2 leading-tight pr-12">{store.name}</h3>
                
                <div className="space-y-3 mt-4">
                    <p className="flex items-start gap-3 text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" /> 
                        <span className="leading-snug">{store.address}</span>
                    </p>
                    {store.phone && (
                        <p className="flex items-center gap-3 text-sm text-slate-600">
                            <Phone size={16} className="text-slate-400 shrink-0" /> 
                            {store.phone}
                        </p>
                    )}
                    {store.email && (
                        <p className="flex items-center gap-3 text-sm text-slate-600">
                            <Mail size={16} className="text-slate-400 shrink-0" /> 
                            {store.email}
                        </p>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</span>
                    <span className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1 rounded-full">{store.contactPerson || 'N/A'}</span>
                </div>
            </div>
          </div>
        ))}
        
        {/* Empty State / Add New Card */}
        <button 
            onClick={handleAddNew}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all min-h-[280px]"
        >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2 group-hover:bg-white">
                <Plus size={32} />
            </div>
            <span className="font-semibold">Add New Store</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                <h3 className="text-xl font-bold text-slate-800">{editingStore.id ? 'Edit Store Location' : 'New Store Location'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">Store Name</label>
                 <input 
                    placeholder="e.g. Downtown Market" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={editingStore.name || ''}
                    onChange={e => setEditingStore({...editingStore, name: e.target.value})}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">Full Address</label>
                 <input 
                    placeholder="123 Street Name, City" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={editingStore.address || ''}
                    onChange={e => setEditingStore({...editingStore, address: e.target.value})}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                    <input 
                        placeholder="John Doe" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={editingStore.contactPerson || ''}
                        onChange={e => setEditingStore({...editingStore, contactPerson: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                    <input 
                        placeholder="555-0000" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={editingStore.phone || ''}
                        onChange={e => setEditingStore({...editingStore, phone: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">Email Address</label>
                 <input 
                    type="email"
                    placeholder="store@example.com" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={editingStore.email || ''}
                    onChange={e => setEditingStore({...editingStore, email: e.target.value})}
                 />
              </div>

              <div className="pt-6 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                    {saving && <Loader2 className="animate-spin" size={18}/>}
                    {editingStore.id ? 'Update Store' : 'Save Store'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
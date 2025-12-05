
import React, { useState, useEffect } from 'react';
import { Product, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, Package, Search, X, Edit2, Loader2, AlertTriangle, Tag, ChevronRight } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    loadProducts();
    const unsub = storageService.onAuthStateChanged(u => setCurrentUser(u));
    return () => unsub();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
        const data = await storageService.getProducts();
        setProducts(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingProduct.name || !editingProduct.price) return;
    setSaving(true);
    try {
        if (editingProduct.id) {
            await storageService.updateProduct(editingProduct as Product);
        } else {
            await storageService.addProduct({
                name: editingProduct.name!,
                sku: editingProduct.sku || 'N/A',
                price: Number(editingProduct.price),
                unit: editingProduct.unit || 'unit'
            });
        }
        await loadProducts();
        setIsModalOpen(false);
        setEditingProduct({});
    } catch(e) {
        alert("Failed to save product");
    } finally {
        setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
        await storageService.deleteProduct(productToDelete);
        await loadProducts();
        setProductToDelete(null);
    } catch(e) {
        alert("Failed to delete product");
    }
  };

  const checkAdminPermission = () => {
    if (currentUser?.role !== 'admin') {
      alert("Access Restricted: This action is reserved for Administrators. Please contact Administration.");
      return false;
    }
    return true;
  };

  const handleAddNew = () => {
      if (!checkAdminPermission()) return;
      setEditingProduct({}); 
      setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
      e.preventDefault();
      e.stopPropagation();
      if (!checkAdminPermission()) return;
      setEditingProduct({...product});
      setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!checkAdminPermission()) return;
      setProductToDelete(id);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-400" size={32}/></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-sm sticky top-0 z-10 md:static">
        <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                placeholder="Search inventory..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-white placeholder:text-slate-500"
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
        </div>
        <button 
          onClick={handleAddNew}
          className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-none transition-all font-medium active:scale-95"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Add Product</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map(product => (
          <div key={product.id} onClick={(e) => handleEditClick(e, product)} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm active:scale-98 transition-transform flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-900/50">
                    <Package size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{product.sku}</span>
                        <span className="text-xs font-medium text-slate-500">{product.unit}</span>
                    </div>
                </div>
             </div>
             <div className="flex flex-col items-end gap-1">
                 <span className="font-bold text-slate-100 text-lg">${product.price.toFixed(2)}</span>
                 <ChevronRight size={16} className="text-slate-600" />
             </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-800 border-b border-slate-800">
                <tr>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider pl-8">Product</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="p-6 text-right text-xs font-bold text-slate-400 uppercase tracking-wider pr-8">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-6 pl-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-900/50">
                                <Package size={20} />
                            </div>
                            <span className="font-bold text-slate-200 text-lg">{product.name}</span>
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono border border-slate-700 inline-flex items-center gap-1">
                            <Tag size={12}/> {product.sku}
                        </span>
                    </td>
                    <td className="p-6">
                        <div className="font-bold text-white text-lg">${product.price.toFixed(2)} <span className="text-slate-500 font-medium text-sm">/ {product.unit}</span></div>
                    </td>
                    <td className="p-6 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleEditClick(e, product)} className="text-slate-400 hover:text-indigo-400 p-2.5 rounded-xl hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-slate-700 transition-all"><Edit2 size={18} /></button>
                            <button onClick={(e) => handleDeleteClick(e, product.id)} className="text-slate-400 hover:text-red-400 p-2.5 rounded-xl hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-slate-700 transition-all"><Trash2 size={18} /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in duration-300">
             <div className="p-6 sm:p-8 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={20} /></button>
                </div>
                
                <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                    <input className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-colors" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="e.g. Organic Milk"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Price</label>
                        <input type="number" className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-colors" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} placeholder="0.00"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                        <input className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-colors" value={editingProduct.unit || ''} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} placeholder="box, kg..."/>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">SKU</label>
                    <input className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-colors" value={editingProduct.sku || ''} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} placeholder="OPTIONAL-SKU"/>
                </div>

                <div className="pt-2 gap-3 flex flex-col sm:flex-row">
                    {editingProduct.id && (
                        <button 
                            onClick={(e) => handleDeleteClick(e, editingProduct.id!)}
                            className="w-full py-3 border border-red-900/30 text-red-400 rounded-xl font-bold hover:bg-red-900/20 transition-colors sm:hidden"
                        >
                            Delete Product
                        </button>
                    )}
                    <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex justify-center gap-2 items-center">
                        {saving && <Loader2 className="animate-spin" size={20}/>} Save Product
                    </button>
                </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Confirm Delete</h3>
                        <p className="text-slate-400 text-sm mt-1">Are you sure you want to remove this product? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setProductToDelete(null)} className="flex-1 py-2.5 text-slate-400 font-bold hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-none transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

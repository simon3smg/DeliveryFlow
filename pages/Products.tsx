import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, Package, Search, X, Edit2, Loader2, AlertTriangle, Tag } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                placeholder="Search inventory..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
        </div>
        <button 
          onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-medium active:scale-95"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                    <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Product</th>
                    <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="p-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6 pl-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                <Package size={20} />
                            </div>
                            <span className="font-bold text-slate-700 text-lg">{product.name}</span>
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-mono border border-slate-200 inline-flex items-center gap-1">
                            <Tag size={12}/> {product.sku}
                        </span>
                    </td>
                    <td className="p-6">
                        <div className="font-bold text-slate-800 text-lg">${product.price.toFixed(2)} <span className="text-slate-400 font-medium text-sm">/ {product.unit}</span></div>
                    </td>
                    <td className="p-6 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingProduct({...product}); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"><Edit2 size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="text-slate-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"><Trash2 size={18} /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                 <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Price</label>
                    <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editingProduct.unit || ''} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">SKU</label>
                 <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editingProduct.sku || ''} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} />
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg mt-4 flex justify-center gap-2">{saving && <Loader2 className="animate-spin" size={20}/>} Save Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Confirm Delete</h3>
                        <p className="text-slate-500 text-sm mt-1">Are you sure you want to remove this product? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setProductToDelete(null)} className="flex-1 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
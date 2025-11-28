import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Trash2, Package, Search, X, Edit2 } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setProducts(storageService.getProducts());
  }, []);

  const handleSave = () => {
    if (!editingProduct.name || !editingProduct.price) return;
    
    let updatedProducts = [...products];
    
    if (editingProduct.id) {
        // Update existing
        updatedProducts = updatedProducts.map(p => 
            p.id === editingProduct.id ? { ...p, ...editingProduct } as Product : p
        );
    } else {
        // Create new
        const product: Product = {
            id: Date.now().toString(),
            name: editingProduct.name!,
            sku: editingProduct.sku || 'N/A',
            price: Number(editingProduct.price),
            unit: editingProduct.unit || 'unit'
        };
        updatedProducts.push(product);
    }
    
    storageService.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setIsModalOpen(false);
    setEditingProduct({});
  };

  const handleEditClick = (product: Product) => {
      setEditingProduct({...product});
      setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
      setEditingProduct({});
      setIsModalOpen(true);
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if(window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
        const updated = products.filter(p => p.id !== id);
        storageService.saveProducts(updated);
        setProducts(updated);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                placeholder="Search inventory..." 
                className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
        </div>
        <button 
          onClick={handleAddNewClick}
          className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-medium"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
                <tr>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Price Details</th>
                <th className="p-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Package size={20} />
                            </div>
                            <span className="font-semibold text-slate-800">{product.name}</span>
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-mono">{product.sku}</span>
                    </td>
                    <td className="p-6">
                        <div className="font-bold text-slate-800">${product.price.toFixed(2)} <span className="text-slate-400 font-normal text-sm">/ {product.unit}</span></div>
                    </td>
                    <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                type="button"
                                onClick={() => handleEditClick(product)} 
                                className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => handleDelete(e, product.id)} 
                                className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                {filteredProducts.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400">
                            No products found.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">Product Name</label>
                 <input 
                    placeholder="e.g. Organic Milk" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">SKU</label>
                 <input 
                    placeholder="PROD-001" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-sm"
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Price ($)</label>
                    <input 
                        type="number"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editingProduct.price || ''}
                        onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                    />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Unit</label>
                    <input 
                        placeholder="e.g. box" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editingProduct.unit || ''}
                        onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})}
                    />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95">
                    {editingProduct.id ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
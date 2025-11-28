import React, { useState, useEffect } from 'react';
import { Download, Sparkles, AlertCircle, Calendar, Printer } from 'lucide-react';
import { storageService } from '../services/storageService';
import { generateDeliveryReportInsight } from '../services/geminiService';
import { Delivery, Store } from '../types';

type Timeframe = 'daily' | 'monthly' | 'yearly';

export const Reports: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  // Initialize date based on type
  const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  
  // AI State
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    setDeliveries(storageService.getDeliveries());
    setStores(storageService.getStores());
  }, []);

  // Update date input when timeframe changes to valid defaults
  useEffect(() => {
    const now = new Date();
    if (timeframe === 'daily') {
        setDateValue(now.toISOString().slice(0, 10)); // YYYY-MM-DD
    } else if (timeframe === 'monthly') {
        setDateValue(now.toISOString().slice(0, 7)); // YYYY-MM
    } else if (timeframe === 'yearly') {
        setDateValue(now.getFullYear().toString()); // YYYY
    }
  }, [timeframe]);

  const filteredDeliveries = deliveries.filter(d => {
    if (timeframe === 'daily') return d.timestamp.startsWith(dateValue);
    if (timeframe === 'monthly') return d.timestamp.startsWith(dateValue);
    if (timeframe === 'yearly') return d.timestamp.startsWith(dateValue);
    return false;
  });
  
  const totalRevenue = filteredDeliveries.reduce((acc, d) => 
    acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0
  );

  const deliveriesByStore = stores.map(store => {
    const storeDeliveries = filteredDeliveries.filter(d => d.storeId === store.id);
    const storeRevenue = storeDeliveries.reduce((acc, d) => 
        acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0
    );
    return {
        ...store,
        deliveryCount: storeDeliveries.length,
        revenue: storeRevenue
    };
  }).filter(s => s.deliveryCount > 0);

  const handlePrint = () => {
    // Delay slightly to ensure browser rendering is complete if needed
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const handleGenerateAiInsight = async () => {
    setIsLoadingAi(true);
    setAiInsight('');
    const insight = await generateDeliveryReportInsight(filteredDeliveries, stores, dateValue);
    setAiInsight(insight);
    setIsLoadingAi(false);
  };

  const getReportTitle = () => {
      if (timeframe === 'daily') return `Daily Report: ${dateValue}`;
      if (timeframe === 'monthly') return `Monthly Report: ${dateValue}`;
      return `Annual Report: ${dateValue}`;
  }

  return (
    <div className="space-y-8 print:p-0 print:m-0 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
             <div>
                 <h2 className="hidden md:block text-slate-500 mb-1">Performance Overview</h2>
                 <div className="flex items-center gap-2">
                    {/* Timeframe Selector */}
                    <div className="relative">
                        <select 
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                            className="bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 shadow-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                           <Calendar size={14} />
                        </div>
                    </div>

                    {/* Date Input */}
                    <div className="bg-white p-1 px-3 rounded-xl shadow-sm border border-slate-200">
                        {timeframe === 'daily' && (
                            <input 
                                type="date" 
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none"
                            />
                        )}
                        {timeframe === 'monthly' && (
                            <input 
                                type="month" 
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none"
                            />
                        )}
                        {timeframe === 'yearly' && (
                            <input 
                                type="number" 
                                min="2000" 
                                max="2099" 
                                step="1" 
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer w-20 outline-none"
                            />
                        )}
                    </div>
                 </div>
             </div>
         </div>
        
        <button onClick={handlePrint} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all font-medium whitespace-nowrap">
            <Printer size={18} /> Print / Save as PDF
        </button>
      </div>

      {/* Report Header for Print */}
      <div className="hidden print-only mb-8">
          <h1 className="text-3xl font-bold mb-2">DeliveryFlow Report</h1>
          <p className="text-slate-500">{getReportTitle()} • Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* AI Insight Section */}
      <div className="relative group no-print">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-600 rounded-2xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
        <div className="relative bg-white rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-200">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">AI Executive Summary</h3>
                        <p className="text-xs text-slate-500">Powered by Gemini models</p>
                    </div>
                </div>
                {!aiInsight && !isLoadingAi && (
                    <button 
                        onClick={handleGenerateAiInsight}
                        className="text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        Generate Analysis
                    </button>
                )}
            </div>
            
            <div className="min-h-[60px]">
                {isLoadingAi && (
                    <div className="flex items-center gap-3 text-slate-500 animate-pulse">
                        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                        <span className="text-sm font-medium">Analyzing sales data...</span>
                    </div>
                )}

                {aiInsight && (
                    <div className="prose prose-indigo prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        {aiInsight}
                    </div>
                )}

                {!aiInsight && !isLoadingAi && (
                    <p className="text-slate-400 text-sm italic">
                        Click the button to generate a performance review and optimization suggestions for this period.
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 print:border print:border-slate-300">
            <p className="text-slate-500 text-sm font-medium">Total Deliveries</p>
            <p className="text-4xl font-bold text-slate-800 tracking-tight">{filteredDeliveries.length}</p>
        </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 print:border print:border-slate-300">
            <p className="text-slate-500 text-sm font-medium">Revenue Generated</p>
            <p className="text-4xl font-bold text-indigo-600 tracking-tight">${totalRevenue.toFixed(2)}</p>
        </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 print:border print:border-slate-300">
            <p className="text-slate-500 text-sm font-medium">Active Stores</p>
            <p className="text-4xl font-bold text-slate-800 tracking-tight">{deliveriesByStore.length}</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border print:border-slate-300">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 print:bg-white print:border-slate-200">
            <h3 className="font-bold text-lg text-slate-800">{timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Breakdown</h3>
        </div>
        <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold tracking-wider print:bg-slate-100">
                <tr>
                    <th className="p-5 pl-6">Store Name</th>
                    <th className="p-5 text-center">Deliveries</th>
                    <th className="p-5 text-right pr-6">Revenue</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm print:divide-slate-200">
                {deliveriesByStore.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="p-12 text-center text-slate-400">
                            No data for this period.
                        </td>
                    </tr>
                ) : (
                    deliveriesByStore.map(store => (
                        <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-5 pl-6 font-semibold text-slate-700">{store.name}</td>
                            <td className="p-5 text-center">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-xs print:bg-transparent print:text-slate-800">{store.deliveryCount}</span>
                            </td>
                            <td className="p-5 pr-6 text-right font-mono font-medium text-slate-800">${store.revenue.toFixed(2)}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* Invoice Section Preview */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 break-inside-avoid print:border print:border-slate-300">
        <h3 className="font-bold text-xl text-slate-800 mb-6">Invoices</h3>
        {deliveriesByStore.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveriesByStore.map(store => (
                    <div key={store.id} className="flex justify-between items-center p-5 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all group bg-slate-50/30 print:bg-white print:border-slate-300">
                        <div>
                            <p className="font-bold text-slate-800">{store.name}</p>
                            <p className="text-xs text-slate-400 mt-1 font-mono">INV-{dateValue.replace(/\D/g, '')}-{store.id.substr(0,4)}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-slate-900 text-lg">${store.revenue.toFixed(2)}</p>
                             <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full flex items-center justify-end gap-1 w-fit ml-auto mt-1 print:bg-transparent print:text-slate-600">
                                <AlertCircle size={10} /> Generated
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 print:bg-white print:border-slate-300">
                No invoices generated.
            </div>
        )}
      </div>
    </div>
  );
};
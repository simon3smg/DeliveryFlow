
import React, { useEffect, useState } from 'react';
import { Truck, Package, DollarSign, Store as StoreIcon, TrendingUp, TrendingDown, Loader2, CheckCircle, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Delivery, Store } from '../types';
import { LiveMap } from '../components/LiveMap';
import { useNavigate } from 'react-router-dom';
import { getEdmontonISOString, getEdmontonDayName, getEdmontonMonthString } from '../services/dateUtils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [del, str] = await Promise.all([
                storageService.getDeliveries(),
                storageService.getStores()
            ]);
            setDeliveries(del);
            setStores(str);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="flex h-96 items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
          </div>
      )
  }

  // --- Statistics Calculations ---
  
  // Date Keys
  const currentMonthKey = getEdmontonMonthString(); // e.g. "2024-05"
  
  // Calculate Previous Month Key
  const [currY, currM] = currentMonthKey.split('-').map(Number);
  const prevDate = new Date(currY, currM - 2, 1); 
  const prevY = prevDate.getFullYear();
  const prevMStr = String(prevDate.getMonth() + 1).padStart(2, '0');
  const prevMonthKey = `${prevY}-${prevMStr}`;

  // Filter Deliveries by Month
  const thisMonthDeliveries = deliveries.filter(d => getEdmontonISOString(d.timestamp).startsWith(currentMonthKey));
  const lastMonthDeliveries = deliveries.filter(d => getEdmontonISOString(d.timestamp).startsWith(prevMonthKey));

  // 1. Total Deliveries (Monthly Count & Trend)
  const deliveriesCount = thisMonthDeliveries.length;
  const lastDeliveriesCount = lastMonthDeliveries.length;
  const deliveryGrowth = lastDeliveriesCount === 0 
      ? (deliveriesCount > 0 ? 100 : 0) 
      : ((deliveriesCount - lastDeliveriesCount) / lastDeliveriesCount) * 100;

  // 2. Active Stores & New Stores
  const totalStores = stores.length;
  // Determine "New" stores by checking if their first ever delivery was in the current month
  const storeFirstSeen: Record<string, string> = {};
  deliveries.forEach(d => {
      const dDate = getEdmontonISOString(d.timestamp);
      if (!storeFirstSeen[d.storeId] || dDate < storeFirstSeen[d.storeId]) {
          storeFirstSeen[d.storeId] = dDate;
      }
  });
  const newStoresCount = Object.values(storeFirstSeen).filter(d => d.startsWith(currentMonthKey)).length;

  // 3. Products Sold (Monthly Quantity & Trend)
  const getQty = (dels: Delivery[]) => dels.reduce((acc, d) => acc + d.items.reduce((sum, i) => sum + i.quantity, 0), 0);
  const productsCount = getQty(thisMonthDeliveries);
  const lastProductsCount = getQty(lastMonthDeliveries);
  const productGrowth = lastProductsCount === 0 
      ? (productsCount > 0 ? 100 : 0)
      : ((productsCount - lastProductsCount) / lastProductsCount) * 100;

  // 4. Revenue (Monthly Revenue & Trend)
  const getRev = (dels: Delivery[]) => dels.reduce((acc, d) => acc + d.items.reduce((sum, i) => sum + (i.quantity * i.priceAtDelivery), 0), 0);
  const revenueCount = getRev(thisMonthDeliveries);
  const lastRevenueCount = getRev(lastMonthDeliveries);
  const revenueGrowth = lastRevenueCount === 0
      ? (revenueCount > 0 ? 100 : 0)
      : ((revenueCount - lastRevenueCount) / lastRevenueCount) * 100;

  // Helper formatting functions
  const formatTrend = (growth: number) => {
      if (growth === 0) return "No change";
      return `${growth > 0 ? '+' : ''}${growth.toFixed(0)}% vs last month`;
  };

  const getTrendDir = (growth: number): 'up' | 'down' | 'neutral' => {
      if (growth > 0) return 'up';
      if (growth < 0) return 'down';
      return 'neutral';
  };

  // --- Notification / Schedule Logic ---
  const getDailyProgress = () => {
    const todayStr = getEdmontonISOString();
    
    // Get IDs of stores visited today (Edmonton Time)
    const visitedStoreIds = new Set(
        deliveries
        .filter(d => getEdmontonISOString(d.timestamp) === todayStr)
        .map(d => d.storeId)
    );

    const pendingStores = stores
        .filter(s => !visitedStoreIds.has(s.id))
        .sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
        
    return { pending: pendingStores, visitedCount: visitedStoreIds.size, total: stores.length };
  };

  const { pending, visitedCount, total } = getDailyProgress();
  const progress = total > 0 ? (visitedCount / total) * 100 : 0;
  
  // --- Chart Data Preparation ---
  const getChartData = () => {
      const data = [];
      const limit = chartRange === 'week' ? 7 : 30;
      
      for (let i = limit - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = getEdmontonISOString(date);
          
          const count = deliveries.filter(d => getEdmontonISOString(d.timestamp) === dateKey).length;
          
          let label = '';
          if (chartRange === 'week') {
              label = getEdmontonDayName(date); // Mon, Tue...
          } else {
              label = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); // May 15
          }
          
          data.push({ label, count, fullDate: dateKey });
      }
      return data;
  };

  const chartData = getChartData();
  const maxCount = Math.max(...chartData.map(d => d.count), 5);

  const StatCard = ({ title, value, icon, colorClass, trend, trendDirection, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800 hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-5 group-hover:scale-150 transition-transform duration-500 ease-out`}></div>
      
      <div className="relative z-10 flex justify-between items-center">
          <div>
             <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
             <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{value}</h3>
             
             {trend && (
                 <div className={`mt-2 flex items-center gap-1 text-xs font-semibold w-fit px-2 py-1 rounded-full ${
                    trendDirection === 'down' 
                        ? 'text-red-400 bg-red-900/20' 
                        : trendDirection === 'up'
                            ? 'text-emerald-400 bg-emerald-900/20'
                            : 'text-slate-300 bg-slate-800'
                 }`}>
                    {trendDirection === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />} 
                    {trend}
                 </div>
             )}
          </div>
          
          <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
              {React.cloneElement(icon, { className: colorClass.replace('bg-', 'text-'), size: 28 })}
          </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* Notification / Daily Route System */}
      <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-none border border-slate-800">
         {/* Background decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

         <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
               <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {pending.length > 0 ? <AlertCircle className="text-amber-400" /> : <CheckCircle className="text-emerald-400" />}
                    Daily Route Status
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Rule: Deliver to every store at least once daily.</p>
               </div>
               <div className="bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                  <span className="font-mono font-bold text-xl text-white">{visitedCount}/{total}</span>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full mb-6 overflow-hidden border border-white/5">
               <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                  style={{ width: `${progress}%` }}
               ></div>
            </div>

            {pending.length === 0 ? (
               <div className="flex items-center gap-3 text-emerald-300 bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20 animate-in slide-in-from-bottom-2">
                  <CheckCircle className="shrink-0" size={24} />
                  <div>
                    <span className="font-bold block text-lg">Route Complete!</span>
                    <span className="text-sm text-emerald-400/80">You have visited all {total} stores today. Great job!</span>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Visits ({pending.length})</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     {pending.map(store => (
                        <div 
                            key={store.id} 
                            onClick={() => navigate('/deliveries', { state: { preSelectStoreId: store.id } })} 
                            className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors border border-white/5 group active:scale-95"
                            role="button"
                            aria-label={`Start delivery for ${store.name}`}
                        >
                           <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-bold text-indigo-400 border border-white/10 shadow-sm">
                                {store.sequence || <MapPin size={16} />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-sm block truncate text-slate-200">{store.name}</span>
                                <span className="text-xs text-slate-500 truncate block">{store.address.split(',')[0]}</span>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                               {/* Map / Directions Button */}
                               <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const query = store.lat && store.lng 
                                            ? `${store.lat},${store.lng}` 
                                            : encodeURIComponent(store.address);
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/50"
                                    title="Get Directions"
                               >
                                   <Navigation size={16} />
                               </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Deliveries" 
          value={deliveriesCount} 
          icon={<Truck />} 
          colorClass="bg-blue-600" 
          trend={formatTrend(deliveryGrowth)}
          trendDirection={getTrendDir(deliveryGrowth)}
          onClick={() => navigate('/deliveries')}
        />
        <StatCard 
          title="Active Stores" 
          value={totalStores} 
          icon={<StoreIcon />} 
          colorClass="bg-emerald-500" 
          trend={`+${newStoresCount} new`}
          trendDirection="up"
          onClick={() => navigate('/stores')}
        />
        <StatCard 
          title="Products Sold" 
          value={productsCount} 
          icon={<Package />} 
          colorClass="bg-indigo-500" 
          trend={formatTrend(productGrowth)}
          trendDirection={getTrendDir(productGrowth)}
          onClick={() => navigate('/products')}
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${revenueCount.toFixed(0)}`} 
          icon={<DollarSign />} 
          colorClass="bg-amber-500" 
          trend={formatTrend(revenueGrowth)}
          trendDirection={getTrendDir(revenueGrowth)}
          onClick={() => navigate('/reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Map */}
        <div className="lg:col-span-2 bg-slate-900 p-1 rounded-3xl shadow-sm border border-slate-800 h-[500px] flex flex-col overflow-hidden transition-colors">
            <LiveMap />
        </div>

        {/* CSS Bar Chart */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col h-[500px] transition-colors">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-bold text-lg text-white">Activity</h3>
                    <p className="text-xs text-slate-400">Volume last {chartRange === 'week' ? '7' : '30'} days</p>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                    <button 
                        onClick={() => setChartRange('week')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${chartRange === 'week' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        Week
                    </button>
                    <button 
                         onClick={() => setChartRange('month')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${chartRange === 'month' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        Month
                    </button>
                </div>
            </div>
            
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between mb-6 text-xs font-medium text-slate-500 text-right py-1">
                    <span>{maxCount}</span>
                    <span>{Math.round(maxCount * 0.75)}</span>
                    <span>{Math.round(maxCount * 0.5)}</span>
                    <span>{Math.round(maxCount * 0.25)}</span>
                    <span>0</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 flex flex-col">
                    <div className={`flex-1 relative flex items-end justify-between ${chartRange === 'week' ? 'gap-4' : 'gap-1'}`}>
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between w-full h-full pointer-events-none">
                            <div className="border-t border-slate-800 w-full h-px"></div>
                            <div className="border-t border-dashed border-slate-800 w-full h-px"></div>
                            <div className="border-t border-dashed border-slate-800 w-full h-px"></div>
                            <div className="border-t border-dashed border-slate-800 w-full h-px"></div>
                            <div className="border-t border-slate-700 w-full h-px"></div>
                        </div>

                        {/* Bars */}
                        {chartData.map((data, index) => (
                            <div key={index} className="relative flex-1 h-full flex items-end justify-center group">
                                <div 
                                    className={`w-full bg-indigo-500 group-hover:bg-indigo-400 transition-all duration-500 rounded-t-sm relative flex justify-center ${chartRange === 'month' ? 'min-w-[2px]' : 'min-w-[12px] rounded-t-lg'}`}
                                    style={{ height: `${maxCount > 0 ? (data.count / maxCount) * 100 : 0}%`, minHeight: data.count > 0 ? '4px' : '0' }}
                                >
                                    {/* Value Label (Week View) - Always visible */}
                                    {chartRange === 'week' && data.count > 0 && (
                                        <span className="absolute -top-6 text-xs font-bold text-slate-400 animate-in slide-in-from-bottom-1 fade-in">
                                            {data.count}
                                        </span>
                                    )}

                                    {/* Tooltip */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-20 whitespace-nowrap shadow-xl pointer-events-none">
                                        {data.count} deliveries<br/><span className="text-slate-400 font-normal">{data.fullDate}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* X-Axis Labels */}
                    <div className={`flex justify-between mt-3 ${chartRange === 'week' ? 'gap-4' : 'gap-1'}`}>
                        {chartData.map((data, index) => (
                            <div key={index} className="flex-1 text-center">
                                <span className="text-[10px] font-bold text-slate-500 truncate block">
                                    {chartRange === 'week' ? data.label : (index % 5 === 0 ? data.label.split(' ')[1] : '')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

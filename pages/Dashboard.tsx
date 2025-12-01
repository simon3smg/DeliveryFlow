
import React, { useEffect, useState } from 'react';
import { Truck, Package, DollarSign, Store as StoreIcon, TrendingUp, MoreHorizontal, Loader2, CheckCircle, AlertCircle, MapPin, ArrowRight } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Delivery, Store } from '../types';
import { LiveMap } from '../components/LiveMap';
import { useNavigate } from 'react-router-dom';
import { getEdmontonISOString, getEdmontonDayIndex, getEdmontonDayName } from '../services/dateUtils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

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
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      )
  }

  // --- Notification / Schedule Logic ---
  const getDailyProgress = () => {
    const todayStr = getEdmontonISOString();
    
    // Get IDs of stores visited today (Edmonton Time)
    const visitedStoreIds = new Set(
        deliveries
        .filter(d => getEdmontonISOString(d.timestamp) === todayStr)
        .map(d => d.storeId)
    );

    const pendingStores = stores.filter(s => !visitedStoreIds.has(s.id));
    return { pending: pendingStores, visitedCount: visitedStoreIds.size, total: stores.length };
  };

  const { pending, visitedCount, total } = getDailyProgress();
  const progress = total > 0 ? (visitedCount / total) * 100 : 0;
  // -------------------------------------

  const totalRevenue = deliveries.reduce((acc, d) => {
    return acc + d.items.reduce((sum, item) => sum + (item.quantity * item.priceAtDelivery), 0);
  }, 0);

  // Chart Data Preparation
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = getEdmontonDayIndex();
  const rotatedDays = [...days.slice(todayIndex + 1), ...days.slice(0, todayIndex + 1)];
  
  const chartData = rotatedDays.map(day => {
      const count = deliveries.filter(d => {
          return getEdmontonDayName(d.timestamp) === day;
      }).length;
      return { day, count };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 5);

  const StatCard = ({ title, value, icon, colorClass, trend }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-5 group-hover:scale-150 transition-transform duration-500 ease-out`}></div>
      
      <div className="relative z-10 flex justify-between items-center">
          <div>
             <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
             <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
             
             {trend && (
                 <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp size={12} /> {trend}
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
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
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
               <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-sm text-slate-300 mr-2">Progress</span>
                  <span className="font-mono font-bold text-xl">{visitedCount}/{total}</span>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full mb-6 overflow-hidden">
               <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
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
                            onClick={() => navigate('/deliveries', { state: { preSelectStoreId: store.id }})} 
                            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors border border-white/5 group active:scale-95"
                            role="button"
                            aria-label={`Start delivery for ${store.name}`}
                        >
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <MapPin size={14} className="text-indigo-300" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-sm block truncate text-slate-200">{store.name}</span>
                                <span className="text-xs text-slate-500 truncate block">{store.address.split(',')[0]}</span>
                              </div>
                           </div>
                           <ArrowRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100" />
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
          value={deliveries.length} 
          icon={<Truck />} 
          colorClass="bg-blue-600" 
          trend="+12% vs last month"
        />
        <StatCard 
          title="Active Stores" 
          value={stores.length} 
          icon={<StoreIcon />} 
          colorClass="bg-emerald-500" 
          trend="+2 new"
        />
        <StatCard 
          title="Products Sold" 
          value={deliveries.reduce((acc, d) => acc + d.items.reduce((s, i) => s + i.quantity, 0), 0)} 
          icon={<Package />} 
          colorClass="bg-indigo-500" 
          trend="High volume"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(0)}`} 
          icon={<DollarSign />} 
          colorClass="bg-amber-500" 
          trend="+5% growth"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Map */}
        <div className="lg:col-span-2 bg-white p-1 rounded-3xl shadow-sm border border-slate-100 h-[500px] flex flex-col overflow-hidden">
            <LiveMap />
        </div>

        {/* CSS Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Weekly Activity</h3>
                    <p className="text-xs text-slate-400">Delivery volume last 7 days (Edmonton)</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                    <MoreHorizontal size={20} className="text-slate-400" />
                </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-3 pb-2">
                {chartData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center gap-3 flex-1 group h-full justify-end">
                        <div className="relative w-full flex justify-end flex-col items-center h-full max-h-[350px] bg-slate-50 rounded-xl overflow-hidden group-hover:bg-indigo-50/50 transition-colors">
                            {/* Bar */}
                            <div 
                                className="w-full bg-indigo-500 group-hover:bg-indigo-600 transition-all duration-500 rounded-t-lg relative"
                                style={{ height: `${maxCount > 0 ? (data.count / maxCount) * 100 : 0}%`, minHeight: data.count > 0 ? '6px' : '0' }}
                            >
                                {/* Floating Label */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap shadow-xl">
                                    {data.count}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{data.day}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

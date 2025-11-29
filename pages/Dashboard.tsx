import React, { useEffect, useState } from 'react';
import { Truck, Package, DollarSign, Store as StoreIcon, TrendingUp, MoreHorizontal, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Delivery, Store } from '../types';
import { LiveMap } from '../components/LiveMap';

export const Dashboard: React.FC = () => {
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

  const totalRevenue = deliveries.reduce((acc, d) => {
    return acc + d.items.reduce((sum, item) => sum + (item.quantity * item.priceAtDelivery), 0);
  }, 0);

  // Chart Data: Deliveries per day (Last 7 days)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  // Rotate days array so today is last
  const rotatedDays = [...days.slice(today + 1), ...days.slice(0, today + 1)];
  
  const chartData = rotatedDays.map(day => {
      // Count deliveries for this day of week
      const count = deliveries.filter(d => {
          const dDate = new Date(d.timestamp);
          return days[dDate.getDay()] === day;
      }).length;
      return { day, count };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 5); // Minimum scale of 5

  const StatCard = ({ title, value, icon, colorClass, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
         <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
             {React.cloneElement(icon, { className: colorClass.replace('bg-', 'text-') })}
         </div>
         <button className="text-slate-300 hover:text-slate-500">
             <MoreHorizontal size={20} />
         </button>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">{value}</h3>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
      </div>
      {trend && (
         <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
            <TrendingUp size={12} /> {trend}
         </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Deliveries" 
          value={deliveries.length} 
          icon={<Truck size={24} />} 
          colorClass="bg-blue-600" 
          trend="+12% from last month"
        />
        <StatCard 
          title="Active Stores" 
          value={stores.length} 
          icon={<StoreIcon size={24} />} 
          colorClass="bg-emerald-500" 
          trend="+2 new stores"
        />
        <StatCard 
          title="Products Delivered" 
          value={deliveries.reduce((acc, d) => acc + d.items.reduce((s, i) => s + i.quantity, 0), 0)} 
          icon={<Package size={24} />} 
          colorClass="bg-indigo-500" 
          trend="High volume"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(0)}`} 
          icon={<DollarSign size={24} />} 
          colorClass="bg-amber-500" 
          trend="+5% growth"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Map - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[400px]">
            <LiveMap />
        </div>

        {/* CSS-Only Bar Chart - Takes up 1 column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">Weekly Activity</h3>
                <select className="text-xs border-none bg-slate-50 rounded-lg py-1 px-2 text-slate-500 focus:ring-0 cursor-pointer">
                    <option>This Week</option>
                    <option>Last Week</option>
                </select>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-2 min-h-[250px] pb-2">
                {chartData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="relative w-full flex justify-end flex-col items-center h-[200px] bg-slate-50/50 rounded-xl overflow-hidden">
                            {/* Bar */}
                            <div 
                                className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-500 rounded-t-lg relative group-hover:shadow-lg"
                                style={{ height: `${(data.count / maxCount) * 100}%` }}
                            >
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {data.count} Deliveries
                                </div>
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">{data.day}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
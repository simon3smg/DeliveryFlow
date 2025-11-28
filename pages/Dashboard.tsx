import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Truck, Package, DollarSign, Store as StoreIcon, TrendingUp, MoreHorizontal } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Delivery, Store } from '../types';
import { LiveMap } from '../components/LiveMap';

export const Dashboard: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    setDeliveries(storageService.getDeliveries());
    setStores(storageService.getStores());
  }, []);

  const totalRevenue = deliveries.reduce((acc, d) => {
    return acc + d.items.reduce((sum, item) => sum + (item.quantity * item.priceAtDelivery), 0);
  }, 0);

  // Chart Data: Deliveries per day (Last 7 days mockup logic)
  const chartData = deliveries.reduce((acc: any[], delivery) => {
    const date = new Date(delivery.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).slice(-7);

  // Fallback mock data if empty for visual
  const finalChartData = chartData.length > 0 ? chartData : [
    {date: 'Mon', count: 0}, {date: 'Tue', count: 0}, {date: 'Wed', count: 0}, 
    {date: 'Thu', count: 0}, {date: 'Fri', count: 0}, {date: 'Sat', count: 0}, {date: 'Sun', count: 0}
  ];

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
    <div className="space-y-8">
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
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <LiveMap />
        </div>

        {/* Charts - Takes up 1 column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">Weekly Activity</h3>
                <select className="text-xs border-none bg-slate-50 rounded-lg py-1 px-2 text-slate-500 focus:ring-0 cursor-pointer">
                    <option>This Week</option>
                    <option>Last Week</option>
                </select>
            </div>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={finalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-10}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                        cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar 
                        dataKey="count" 
                        fill="#4f46e5" 
                        radius={[6, 6, 6, 6]} 
                        barSize={32} 
                        name="Deliveries"
                    />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};
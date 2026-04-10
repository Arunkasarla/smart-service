import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, LayoutList, CalendarCheck, Activity, Image, MapIcon, DownloadCloud, ShieldAlert, MinusCircle, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom pulsating active marker
const pulseIcon = new L.DivIcon({
  className: 'custom-pulse-icon',
  html: '<div class="absolute w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div><div class="relative w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const { token } = useAuth();
  
  // States
  const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0, revenue: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [chartDataState, setChartDataState] = useState(null);
  
  const defaultCenter = [40.7128, -74.0060]; // Base node

  useEffect(() => {
    fetchMainData();
    fetchProviders();
  }, [token]);

  const fetchMainData = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/bookings/all', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if(Array.isArray(data)) {
              // Rehydrate missing lat/lng randomly around center for visual demo parity
              const mappedData = data.map(b => ({
                  ...b,
                  provider_lat: b.provider_lat || (defaultCenter[0] + (Math.random() - 0.5) * 0.1),
                  provider_lng: b.provider_lng || (defaultCenter[1] + (Math.random() - 0.5) * 0.1)
              }));
              
              setRecentBookings(mappedData);
              setStats(prev => ({...prev, bookings: data.length, revenue: data.length * 400}));
              
              // Process Doughnut Chart Metrics
              let pending = 0; let active = 0; let completed = 0; let cancelled = 0;
              data.forEach(b => {
                 if(b.status === 'pending') pending++;
                 else if(b.status === 'started' || b.status === 'confirmed') active++;
                 else if(b.status === 'completed' || b.status === 'paid') completed++;
                 else cancelled++;
              });
              
              setChartDataState({
                labels: ['Pending', 'Active (In Field)', 'Completed', 'Cancelled'],
                datasets: [{
                  data: [pending, active, completed, cancelled],
                  backgroundColor: ['#FBBF24', '#3B82F6', '#10B981', '#EF4444'],
                  hoverOffset: 4,
                  borderWidth: 0
                }]
              });
          }
      } catch(err) { console.error(err); }
  };

  const fetchProviders = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/admin/providers', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if(Array.isArray(data)) {
              setProviders(data);
              setStats(prev => ({ ...prev, providers: data.length }));
          }
      } catch(err) {}
  };

  const handleToggleBan = async (id, currentState) => {
      if(!window.confirm(`Are you sure you want to ${currentState === 1 ? 'UNBAN' : 'BAN'} this provider?`)) return;
      
      const res = await fetch(`http://localhost:5000/api/admin/provider/${id}/ban`, {
         method: 'POST',
         headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}` 
         },
         body: JSON.stringify({ is_banned: currentState === 1 ? 0 : 1 })
      });
      
      if(res.ok) {
          fetchProviders(); // Refresh list to reflect new ban state
      }
  };

  const handleExportCSV = async () => {
     try {
       const res = await fetch('http://localhost:5000/api/bookings/export', {
         headers: { 'Authorization': `Bearer ${token}` }
       });
       
       if (res.ok) {
           const blob = await res.blob();
           const url = window.URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = 'smartservice-admin-data.csv';
           document.body.appendChild(a);
           a.click();
           a.remove();
       }
     } catch(err) { alert("Network error."); }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
           <Activity size={28} className="text-primary" />
           <h1 className="text-3xl font-bold">Admin Overview</h1>
         </div>
         <button onClick={handleExportCSV} className="btn btn-outline border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 font-bold flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
            <DownloadCloud size={18}/> Export CSV Database
         </button>
      </div>

      {/* High-level metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card p-6 border-l-4 border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted text-sm font-medium mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-main">84</h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-md"><Users className="text-blue-500"/></div>
          </div>
        </div>
        
        <div className="card p-6 border-l-4 border-orange-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted text-sm font-medium mb-1">Registered Providers</p>
              <h3 className="text-3xl font-bold text-main">{stats.providers}</h3>
            </div>
            <div className="bg-orange-50 p-2 rounded-md"><LayoutList className="text-orange-500"/></div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-green-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted text-sm font-medium mb-1">Total Bookings</p>
              <h3 className="text-3xl font-bold text-main">{stats.bookings}</h3>
            </div>
            <div className="bg-green-50 p-2 rounded-md"><CalendarCheck className="text-green-500"/></div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-purple-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted text-sm font-medium mb-1">Total Platform Value</p>
              <h3 className="text-3xl font-bold text-main">₹{stats.revenue}</h3>
            </div>
            <div className="bg-purple-50 p-2 rounded-md"><Activity className="text-purple-500"/></div>
          </div>
        </div>
      </div>

      {/* Grid: Global Admin Map & System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
        {/* God Mode Map */}
        <div className="lg:col-span-1 card overflow-hidden flex flex-col h-[500px] shadow-[0_0_15px_rgba(0,0,0,0.1)] border-2 border-red-500/20 group relative">
           <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-red-50 dark:bg-red-900/10 flex justify-between items-center z-10 relative">
              <h2 className="text-sm font-bold text-red-600 flex items-center gap-2 uppercase tracking-widest"><MapIcon size={16}/> Global Telemetry</h2>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
           </div>
           <div className="flex-1 bg-slate-900 relative">
               <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {recentBookings.filter(b => b.status === "pending" || b.status === "started" || b.status === "confirmed").map(b => (
                    <Marker key={b.id} position={[b.provider_lat, b.provider_lng]} icon={pulseIcon}>
                      <Popup className="custom-popup" closeButton={false}>
                         <div className="w-48 bg-slate-800 text-white p-2 rounded scale-90 -mt-2">
                            <span className="block text-[10px] uppercase text-red-400 font-bold mb-1">ACTIVE NODE #{1000 + b.id}</span>
                            <h3 className="font-bold text-xs">{b.service_title}</h3>
                            <p className="text-[10px] text-gray-400 mt-1">{b.provider_name} → {b.user_name}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500 rounded-sm text-[9px] uppercase font-bold">{b.status}</span>
                         </div>
                      </Popup>
                    </Marker>
                  ))}
               </MapContainer>
               {/* Scanline overlay effect */}
               <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-[400] opacity-30 mix-blend-overlay"></div>
           </div>
        </div>
        
        {/* Deep Analytics Chart */}
        <div className="lg:col-span-2 card p-6 h-[500px] flex gap-8 items-center justify-between glass shadow-xl hover:shadow-2xl transition duration-500 group relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
             
             <div className="flex-1 max-w-sm h-full mx-auto pb-4 relative z-10 flex flex-col items-center">
                 <h2 className="text-xl font-bold mb-4 self-start text-left w-full border-b pb-2 dark:border-slate-700 font-sans">Order Analytics Distribution</h2>
                 {chartDataState ? (
                     <div className="w-full flex-1 min-h-0 relative object-contain flex items-center justify-center p-4">
                         <Doughnut data={chartDataState} options={{ 
                             maintainAspectRatio: false,
                             cutout: '70%', 
                             plugins: { legend: { position: 'bottom', labels: { color: 'gray', font: { family: 'inherit', weight: 600 } } } } 
                         }} />
                     </div>
                 ) : (
                     <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-slate-800 rounded-full"></div>
                 )}
             </div>
        </div>
      </div>

      {/* V6 Provider Moderation Network Grid */}
      <div className="card overflow-hidden shadow-xl mb-12">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/80">
           <h2 className="text-xl font-bold flex items-center gap-2"><ShieldAlert className="text-red-500"/> Provider Network Management</h2>
           <span className="badge badge-outline border-blue-500 text-blue-600 bg-blue-50 dark:bg-slate-900 shadow-sm">{providers.length} Local Providers</span>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-slate-800">
                 <tr className="border-b border-gray-200 dark:border-slate-700 text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Provider Info</th>
                    <th className="p-4 font-bold">Sector Category</th>
                    <th className="p-4 font-bold">Total Volume</th>
                    <th className="p-4 font-bold">Status & Action</th>
                 </tr>
              </thead>
              <tbody>
                 {providers.length > 0 ? providers.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                       <td className="p-4">
                           <h3 className="font-bold text-main">{p.name}</h3>
                           <p className="text-xs text-muted mt-1">{p.email}</p>
                           <p className="text-[10px] text-gray-400 mt-1">{p.phone}</p>
                       </td>
                       <td className="p-4">
                           <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-bold uppercase tracking-wider">{p.provider_category || 'general'}</span>
                       </td>
                       <td className="p-4">
                           <span className="font-bold text-main block text-lg">{p.total_bookings}</span>
                           <span className="text-[10px] uppercase text-muted tracking-wide block">Lifetime Mapped Bookings</span>
                       </td>
                       <td className="p-4">
                           <div className="flex items-center gap-4">
                               {p.is_banned === 1 ? (
                                   <span className="badge badge-danger bg-red-100 text-red-800 border-red-300 font-bold uppercase w-24 justify-center">BANNED</span>
                               ) : (
                                   <span className="badge badge-success bg-green-100 text-green-800 border-green-300 font-bold uppercase w-24 justify-center">ACTIVE</span>
                               )}
                               
                               <button 
                                   onClick={() => handleToggleBan(p.id, p.is_banned)}
                                   className={`btn btn-sm ${p.is_banned === 1 ? 'btn-outline border-green-500 text-green-600 hover:bg-green-600 hover:text-white' : 'btn-outline border-red-500 text-red-600 hover:bg-red-600 hover:text-white'} text-xs px-3 shadow-sm`}
                               >
                                   {p.is_banned === 1 ? <><CheckCircle size={14}/> Restore Account</> : <><MinusCircle size={14}/> Terminate Account</>}
                               </button>
                           </div>
                       </td>
                    </tr>
                 )) : <tr><td colSpan="4" className="text-center p-8 text-muted italic">No providers in network map.</td></tr>}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

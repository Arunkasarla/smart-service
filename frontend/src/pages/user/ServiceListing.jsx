import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, ShieldCheck, Zap, MapIcon, ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons physically
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ServiceListing = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('query') || '';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  // Standardize Map Center (Default somewhere neutral, dynamically updating based on data)
  const defaultCenter = [40.7128, -74.0060]; // NYC as demo base

  const fetchServices = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/services/search`;
      if (category || query) {
         url += `?category=${category}&query=${query}`;
      } else {
         url = `http://localhost:5000/api/services`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if(Array.isArray(data)) {
         // Dynamically generate semi-random map coordinates around the default center if they are missing
         const hydratedServices = data.map(service => ({
            ...service,
            lat: service.lat || (defaultCenter[0] + (Math.random() - 0.5) * 0.1),
            lng: service.lng || (defaultCenter[1] + (Math.random() - 0.5) * 0.1)
         }));
         setServices(hydratedServices);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [category]); // Removed query to allow manual search button click

  const handleSearch = (e) => {
    e.preventDefault();
    fetchServices();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen bg-background">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
        <div className="container relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">Find Your Pro</h1>
          <p className="text-primary-light text-lg">Top-rated professionals are ready to help.</p>
        </div>
      </div>

      <div className="container py-12 flex flex-col md:flex-row gap-8 -mt-10 relative z-20">
        
        {/* Filters Sidebar */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="glass p-6 rounded-2xl sticky top-24 shadow-xl border border-white/20 dark:border-slate-700">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-main"><Filter size={20}/> Filters</h2>
            
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Search providers..." 
                  className="input-field pl-10 bg-white/50 dark:bg-slate-800/50"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Categories</h3>
              {['All', 'electrician', 'plumber', 'cleaner', 'carpenter', 'mechanic'].map(cat => (
                <div key={cat} className="flex items-center">
                  <input 
                    type="radio" 
                    id={`cat-${cat}`}
                    name="category"
                    checked={cat === 'All' ? category === '' : category === cat}
                    onChange={() => setCategory(cat === 'All' ? '' : cat)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-slate-700"
                  />
                  <label htmlFor={`cat-${cat}`} className="ml-3 text-sm font-medium text-main capitalize cursor-pointer">
                    {cat}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t dark:border-slate-700">
               <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-4">View Mode</h3>
               <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button onClick={() => setViewMode('list')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-bold text-sm transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-muted'}`}>
                     <ListIcon size={16}/> List
                  </button>
                  <button onClick={() => setViewMode('map')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-bold text-sm transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-muted'}`}>
                     <MapIcon size={16}/> Map
                  </button>
               </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3,4,5,6].map(n => (
                 <div key={n} className="card h-80 animate-pulse bg-surface p-4">
                    <div className="w-full h-40 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                 </div>
               ))}
            </div>
          ) : services.length > 0 ? (
            <AnimatePresence mode="wait">
             {viewMode === 'list' ? (
                <motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" exit={{opacity: 0}} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {services.map(service => (
                    <div key={service.id} className="card group hover:shadow-2xl transition-all duration-300 overflow-hidden border border-border bg-surface flex flex-col h-[400px]">
                      <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                        <img 
                          src={service.image || `https://source.unsplash.com/400x300/?${service.category},work`} 
                          alt={service.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Service'; }}
                        />
                        <div className="absolute top-4 left-4 z-20 badge bg-primary text-white text-xs shadow-lg uppercase font-bold tracking-wide">
                          {service.category}
                        </div>
                        <div className="absolute top-4 right-4 z-20 glass px-2 py-1 rounded flex items-center gap-1 font-bold text-white text-sm">
                          <Star size={14} className="text-yellow-400 fill-current" /> {service.rating === '0.0' ? 'New' : service.rating}
                        </div>
                        <div className="absolute bottom-4 left-4 z-20 right-4">
                          <h3 className="font-bold text-lg text-white mb-1 group-hover:text-primary-light transition-colors">{service.title}</h3>
                          <div className="flex items-center text-xs text-gray-300">
                            <MapPin size={12} className="mr-1" /> {service.location || 'Local Area'}
                            <span className="mx-2">•</span>
                            <ShieldCheck size={12} className="text-green-400 mr-1"/> {service.experience} Yrs Exp
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col justify-between flex-1">
                        <p className="text-muted text-xs line-clamp-3 leading-relaxed">{service.description}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t dark:border-slate-700">
                           <div>
                             <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Starting Rate</p>
                             <p className="font-bold text-xl text-main">₹{service.price}</p>
                           </div>
                           <Link to={`/book/${service.id}`} className="btn btn-primary btn-sm bg-gradient-to-r from-primary to-primary-dark shadow-[0_0_10px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all">
                             Book Now
                           </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
             ) : (
                <motion.div key="map" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 relative z-10">
                   <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {services.map(service => (
                        <Marker key={service.id} position={[service.lat, service.lng]}>
                          <Popup className="custom-popup">
                             <div className="w-48">
                                <img src={service.image || `https://source.unsplash.com/400x300/?${service.category},work`} alt={service.title} className="w-full h-24 object-cover rounded-t-lg mb-2" />
                                <h3 className="font-bold text-sm text-main leading-tight">{service.title}</h3>
                                <div className="text-xs text-muted mb-2 flex items-center justify-between mt-1">
                                   <span className="flex items-center"><Star size={10} className="text-yellow-400 mr-1"/> {service.rating === '0.0' ? 'New' : service.rating}</span>
                                   <span className="font-bold text-primary">₹{service.price}</span>
                                </div>
                                <Link to={`/book/${service.id}`} className="btn btn-primary w-full text-xs py-1 mt-1 block text-center">Book Now</Link>
                             </div>
                          </Popup>
                        </Marker>
                      ))}
                   </MapContainer>
                </motion.div>
             )}
            </AnimatePresence>
          ) : (
            <div className="glass rounded-2xl p-16 text-center shadow-sm border border-border mt-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-muted" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-main">No providers found</h3>
              <p className="text-muted max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
              <button onClick={() => { setCategory(''); setQuery(''); fetchServices(); }} className="btn btn-outline mt-6">Clear All Filters</button>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
};

export default ServiceListing;

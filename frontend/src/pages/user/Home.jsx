import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Zap, Droplet, Paintbrush, Hammer, Wrench, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { id: 'electrician', name: 'Electrician', icon: <Zap size={28} />, color: 'from-yellow-400 to-yellow-500', shadow: 'shadow-yellow-500/40' },
  { id: 'plumber', name: 'Plumber', icon: <Droplet size={28} />, color: 'from-blue-400 to-blue-500', shadow: 'shadow-blue-500/40' },
  { id: 'cleaner', name: 'Cleaner', icon: <Paintbrush size={28} />, color: 'from-green-400 to-green-500', shadow: 'shadow-green-500/40' },
  { id: 'carpenter', name: 'Carpenter', icon: <Hammer size={28} />, color: 'from-orange-400 to-orange-500', shadow: 'shadow-orange-500/40' },
  { id: 'mechanic', name: 'Mechanic', icon: <Wrench size={28} />, color: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/40' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

const Home = () => {
  const [search, setSearch] = useState('');
  const [featuredServices, setFeaturedServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/services')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setFeaturedServices(data.slice(0, 4));
      })
      .catch(console.error);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/services?query=${search}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-blue-50 dark:to-slate-900 border-b border-border">
        {/* Animated Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"
        />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ x: -50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <span className="badge badge-primary mb-6 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 text-sm">✨ The Future of Home Services</span>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] text-main">
                Expert care for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">home</span>, on demand.
              </h1>
              <p className="text-lg md:text-xl text-muted mb-10 max-w-lg leading-relaxed">Instantly book top-rated professionals for cleaning, maintenance, and repairs from the comfort of your couch.</p>
              
              <form onSubmit={handleSearch} className="glass p-2 rounded-full flex shadow-xl max-w-lg transition-transform hover:scale-[1.02]">
                <div className="flex-1 flex items-center px-4">
                  <Search className="text-muted mr-2" size={22} />
                  <input 
                    type="text" 
                    placeholder="E.g. Electrician, Plumber..." 
                    className="w-full text-main focus:outline-none bg-transparent font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded-full px-8 py-3.5 font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2">
                  Find pros <ArrowRight size={18}/>
                </button>
              </form>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070" className="rounded-2xl shadow-2xl z-10 relative object-cover h-[500px] border border-white/20" alt="Professional Worker" />
              <div className="absolute -bottom-8 -left-8 glass p-4 rounded-xl z-20 flex items-center gap-4 shadow-xl border border-white/20 animate-bounce" style={{ animationDuration: '3s' }}>
                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white"><Star size={24} fill="currentColor"/></div>
                 <div>
                   <p className="text-main font-bold text-lg">4.9/5</p>
                   <p className="text-muted text-xs font-semibold uppercase">Average Rating</p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-surface relative z-20 border-b border-border">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-main">What do you need help with?</h2>
            <p className="text-muted">Choose from our most popular categories.</p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-5 gap-6"
          >
            {categories.map(cat => (
              <Link to={`/services?category=${cat.id}`} key={cat.id}>
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="card p-8 flex flex-col items-center text-center cursor-pointer group bg-gradient-to-b from-surface to-background border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 h-full"
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg bg-gradient-to-br ${cat.color} ${cat.shadow} group-hover:rotate-6 transition-transform duration-300`}>
                    {cat.icon}
                  </div>
                  <h3 className="font-bold text-main text-lg">{cat.name}</h3>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-main mb-2">Top Rated Providers</h2>
              <p className="text-muted">Highly recommended professionals in your area</p>
            </div>
            <Link to="/services" className="text-primary font-bold hover:text-primary-dark transition-colors flex items-center gap-1 group">
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {featuredServices.length > 0 ? featuredServices.map(service => (
              <motion.div variants={itemVariants} key={service.id} whileHover={{ y: -10 }} className="card hover-lift overflow-hidden group border border-border shadow-md bg-surface">
                <div className="h-56 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img 
                    src={service.image || `https://source.unsplash.com/400x300/?${service.category},work`} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Service'; }}
                  />
                  <div className="absolute top-4 right-4 z-20 glass px-2.5 py-1 rounded-md text-xs flex items-center gap-1 font-bold text-main">
                    <Star size={14} className="text-yellow-500 fill-current" /> 4.9
                  </div>
                  <div className="absolute bottom-4 left-4 z-20">
                     <span className="badge bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-2">{service.category}</span>
                     <h3 className="font-bold text-xl text-white leading-tight">{service.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-muted text-sm line-clamp-2 mb-6">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted font-medium mb-1">Starting from</span>
                      <span className="font-bold text-2xl text-main">${service.price}</span>
                    </div>
                    <Link to={`/book/${service.id}`} className="btn btn-primary shadow-lg shadow-primary/30 group-hover:scale-105">Book</Link>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted glass rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Wrench size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">No featured services right now.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;

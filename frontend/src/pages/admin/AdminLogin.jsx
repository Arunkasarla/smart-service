import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock, User, Mail, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminSecret: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/admin/register';
    
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (!isLogin && data.user.role !== 'admin') {
           setError('Failed to secure admin role.');
           return;
        }
        if (isLogin && data.user.role !== 'admin') {
           setError('This portal is strictly for Administrators.');
           return;
        }
        login(data.user, data.token);
        navigate('/admin');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error connecting to the secure server.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Secure Backdrop Styling */}
      <div className="absolute inset-0 z-0 opacity-20" style={{backgroundImage: "radial-gradient(#ef4444 1px, transparent 1px)", backgroundSize: "40px 40px"}}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8 text-center border-b border-white/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>
           <ShieldAlert size={48} className="text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
           <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Admin Control</h2>
           <p className="text-red-400/80 text-sm">Level 4 Authorization Required</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
           {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">{error}</div>}
           
           {!isLogin && (
             <div className="relative">
               <User className="absolute left-3 top-3 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Admin Full Name" 
                 className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 required
               />
             </div>
           )}
           
           <div className="relative">
             <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
             <input 
               type="email" 
               placeholder="Authorized Email" 
               className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
               value={formData.email}
               onChange={e => setFormData({...formData, email: e.target.value})}
               required
             />
           </div>
           
           <div className="relative">
             <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
             <input 
               type="password" 
               placeholder="Passkey" 
               className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
               value={formData.password}
               onChange={e => setFormData({...formData, password: e.target.value})}
               required
             />
           </div>

           {!isLogin && (
             <div className="relative">
               <Key className="absolute left-3 top-3 text-red-500" size={18} />
               <input 
                 type="password" 
                 placeholder="Master Admin Secret Code" 
                 className="w-full pl-10 pr-4 py-2.5 bg-red-900/10 border border-red-500/50 rounded-lg text-white placeholder-red-400/50 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                 value={formData.adminSecret}
                 onChange={e => setFormData({...formData, adminSecret: e.target.value})}
                 required
               />
             </div>
           )}
           
           <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all">
              {isLogin ? 'Initialize Session' : 'Request Security Clearance'} <ArrowRight size={18} />
           </button>
        </form>
        
        <div className="text-center pb-8">
           <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-slate-400 hover:text-white text-sm transition-colors">
              {isLogin ? 'Deploy new Admin node' : 'Return to Authorization'}
           </button>
           <br/>
           <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-4 inline-block">Return to civilian login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Wrench, User, LogOut, LayoutDashboard, CalendarDays, Moon, Sun, MapPin } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl">
          <Wrench size={28} />
          Smart Service
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/services" className="text-main font-medium hover:text-primary transition-colors">
            Explore Services
          </Link>
          
          {!user ? (
            <div className="flex items-center gap-4">
              <button onClick={toggleDarkMode} className="text-muted hover:text-primary transition-colors">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link to="/login" className="btn btn-outline text-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary text-sm">Sign Up</Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={toggleDarkMode} className="text-muted hover:text-primary transition-colors">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {user.role === 'user' && (
                <Link to="/my-bookings" className="flex items-center gap-1 text-muted hover:text-primary">
                  <CalendarDays size={20} />
                  <span className="text-sm font-medium">Bookings</span>
                </Link>
              )}
              {user.role === 'provider' && (
                <Link to="/provider" className="flex items-center gap-1 text-muted hover:text-primary">
                  <LayoutDashboard size={20} />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-1 text-muted hover:text-primary">
                  <LayoutDashboard size={20} />
                  <span className="text-sm font-medium">Admin Panel</span>
                </Link>
              )}
              
              <div className="h-8 w-[1px] bg-border mx-2"></div>
              
              <div className="flex items-center gap-2 text-sm font-medium">
                <User size={18} className="text-secondary" />
                {user.name}
              </div>
              <button onClick={handleLogout} className="text-danger hover:text-red-700 ml-4" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

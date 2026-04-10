import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Typically fetch('/api/auth/login')
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.token, data.user);
      
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'provider') navigate('/provider');
      else navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card p-8 w-full max-w-md animate-fade-in relative z-10">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary-light rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-secondary-light rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="text-center mb-8 relative z-20">
          <h1 className="text-3xl font-bold text-main">Welcome Back</h1>
          <p className="text-muted mt-2">Log in to book your next home service</p>
        </div>

        {error && <div className="bg-red-50 text-danger p-3 rounded-md mb-4 text-sm font-medium border border-red-200">{error}</div>}

        <form onSubmit={handleLogin} className="relative z-20">
          <div className="input-group">
            <label className="input-label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-muted" size={20} />
              <input 
                type="email" 
                className="input-field pl-10" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <div className="input-group mb-6">
            <label className="input-label flex justify-between">
              Password
              <a href="#" className="text-primary text-xs hover:underline">Forgot?</a>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-muted" size={20} />
              <input 
                type="password" 
                className="input-field pl-10" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

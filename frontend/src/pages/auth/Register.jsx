import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, Phone, Upload, Award } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    provider_category: 'electrician',
    experience: '' // V3 Add
  });
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // V3 Form Data Mapping (Multer Integration)
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('email', formData.email);
    payload.append('phone', formData.phone);
    payload.append('password', formData.password);
    payload.append('role', formData.role);
    
    if (formData.role === 'provider') {
       payload.append('provider_category', formData.provider_category);
       payload.append('experience', formData.experience);
       if (file) payload.append('profile_photo', file);
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: payload
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="card w-full max-w-md p-8 shadow-2xl border border-gray-100 z-10 glass">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">Create an Account</h1>
          <p className="text-muted text-sm">Join the pro service network today.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium text-center border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="flex gap-4 mb-6">
            <button type="button" onClick={() => setFormData({...formData, role: 'user'})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.role === 'user' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>Customer</button>
            <button type="button" onClick={() => setFormData({...formData, role: 'provider'})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.role === 'provider' ? 'bg-secondary text-white shadow-md shadow-secondary/30' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>Service Pro</button>
          </div>

          <div className="input-group mb-4">
            <label className="input-label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-muted" size={20} />
              <input type="text" name="name" className="input-field pl-10" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group mb-4">
            <label className="input-label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-muted" size={20} />
              <input type="email" name="email" className="input-field pl-10" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group mb-4">
            <label className="input-label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-muted" size={20} />
              <input type="tel" name="phone" className="input-field pl-10" placeholder="(555) 123-4567" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group mb-6">
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-muted" size={20} />
              <input type="password" name="password" className="input-field pl-10" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          {formData.role === 'provider' && (
            <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 mb-6 animate-fade-in space-y-4 shadow-inner">
              <div className="input-group mb-0">
                <label className="input-label font-bold">What is your profession?</label>
                <select name="provider_category" className="input-field bg-white dark:bg-slate-900 font-medium" value={formData.provider_category || 'electrician'} onChange={handleChange} required>
                  <option value="electrician">Electrician</option>
                  <option value="plumber">Plumber</option>
                  <option value="cleaner">Cleaner</option>
                  <option value="carpenter">Carpenter</option>
                  <option value="mechanic">Mechanic</option>
                </select>
              </div>

              <div className="input-group mb-0">
                <label className="input-label font-bold">Experience (Years)</label>
                <div className="relative">
                  <Award className="absolute left-3 top-3 text-muted" size={20} />
                  <input type="number" min="0" name="experience" className="input-field pl-10 bg-white dark:bg-slate-900 font-medium" placeholder="E.g. 5" value={formData.experience} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group mb-0">
                <label className="input-label font-bold">Profile Photo</label>
                <div className="relative overflow-hidden group">
                  <Upload className="absolute left-3 top-3 text-muted group-hover:text-primary transition-colors" size={20} />
                  <input type="file" accept="image/*" name="profile_photo" className="input-field pl-10 bg-white dark:bg-slate-900 py-2 cursor-pointer text-sm font-medium" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary/30 py-3 text-lg" disabled={loading}>
            {loading ? 'Processing...' : 'Complete Sign Up'}
          </button>

        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, FileText, ChevronRight, CheckCircle2, CreditCard, Banknote } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BookingFlow = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    notes: '',
    payment_method: 'cod' // default Cash On Delivery
  });

  useEffect(() => {
    // Fetch individual service details based on new V3 endpoint structure
    fetch('http://localhost:5000/api/services')
      .then(res => res.json())
      .then(data => {
        const found = data.find(s => s.id.toString() === serviceId);
        if (found) {
           setService(found);
           // Fetch unavailable dates for this provider!
           fetch(`http://localhost:5000/api/provider/${found.provider_id}/blocked-dates`, {
              headers: { 'Authorization': `Bearer ${token}` }
           }).then(r => r.json()).then(blocked => {
              if (Array.isArray(blocked)) setBlockedDates(blocked);
           }).catch(() => {}); // silent fail if disconnected
        }
        setLoading(false);
      });
  }, [serviceId]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setProcessing(true);
    
    // V5 Stripe Payment Hand-off
    if (formData.payment_method === 'online') {
       // Direct to simulated Stripe Checkout without saving booking yet! Checkout saves it.
       navigate('/checkout', { state: { service, formData } });
       return;
    }

    // COD Flow (Direct Saving)
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_id: service.id, // Using provider_id alias from serviceRoutes
          provider_id: service.provider_id,
          ...formData
        })
      });

      if (response.ok) {
        // Render step 4 local Success Page
        setStep(4);
      } else {
        const errorData = await response.json();
        alert(`Failed to book: ${errorData.message}`);
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("Network Error: Could not connect to the booking server.");
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-muted">Loading service...</div>;
  if (!service) return <div className="text-center py-20 text-danger font-bold">Service not found!</div>;

  return (
    <div className="container py-10 max-w-3xl animate-fade-in relative z-10">
      
      {step < 4 && (
        <>
          <h1 className="text-3xl font-bold mb-8">Book Service</h1>
          {/* Progress Bar */}
          <div className="flex items-center mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full dark:bg-slate-700"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-500`} style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}></div>
            
            <div className="flex justify-between w-full z-10 relative">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-sm text-white transition-all ${step >= 1 ? 'bg-primary shadow-lg shadow-primary/30 scale-110' : 'bg-gray-300 dark:bg-slate-600'}`}>1</div>
                <span className={`text-xs mt-2 font-medium ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>Schedule</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-sm text-white transition-all ${step >= 2 ? 'bg-primary shadow-lg shadow-primary/30 scale-110' : 'bg-gray-300 dark:bg-slate-600'}`}>2</div>
                 <span className={`text-xs mt-2 font-medium ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>Address</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-sm text-white transition-all ${step >= 3 ? 'bg-primary shadow-lg shadow-primary/30 scale-110' : 'bg-gray-300 dark:bg-slate-600'}`}>3</div>
                 <span className={`text-xs mt-2 font-medium ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>Confirm</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-slate-700 glass">
        
        {/* Service Summary snippet */}
        <div className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-slate-800 rounded-lg mb-8 border border-gray-100 dark:border-slate-700">
          <img src={service.image} alt="" className="w-16 h-16 rounded object-cover shadow-sm" />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-main">{service.title}</h3>
            <p className="text-sm text-muted">Provider: {service.title} • {service.experience} Yrs Exp</p>
          </div>
          <div className="font-bold text-2xl text-primary">₹{service.price}</div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="text-primary"/> Schedule Appointment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="input-group">
                <label className="input-label">Date</label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-3 text-muted" size={20} />
                   <input type="date" name="date" className="input-field pl-10 bg-white/50 dark:bg-slate-900" value={formData.date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
                </div>
                {blockedDates.includes(formData.date) && (
                   <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">The provider is unavailable on this date. Please select another.</p>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">Time</label>
                <div className="relative">
                   <Clock className="absolute left-3 top-3 text-muted" size={20} />
                   <input type="time" name="time" className="input-field pl-10 bg-white/50 dark:bg-slate-900" value={formData.time} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button disabled={!formData.date || !formData.time || blockedDates.includes(formData.date)} onClick={handleNext} className="btn btn-primary px-8">
                Next Step <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="text-primary"/> Service Location</h2>
            <div className="input-group">
              <label className="input-label">Address</label>
              <div className="relative">
                 <MapPin className="absolute left-3 top-3 text-muted" size={20} />
                 <textarea name="address" className="input-field pl-10 py-3 bg-white/50 dark:bg-slate-900" placeholder="Enter complete address..." rows="3" value={formData.address} onChange={handleChange}></textarea>
              </div>
            </div>
            <div className="input-group mt-4">
              <label className="input-label">Additional Comments (Optional)</label>
              <div className="relative">
                 <FileText className="absolute left-3 top-3 text-muted" size={20} />
                 <textarea name="notes" className="input-field pl-10 py-3 bg-white/50 dark:bg-slate-900" placeholder="Any special instructions?" rows="2" value={formData.notes} onChange={handleChange}></textarea>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="btn btn-outline">Back</button>
              <button disabled={!formData.address} onClick={handleNext} className="btn btn-primary px-8">
                Payment <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
               <CheckCircle2 size={56} className="text-success mx-auto mb-2" />
               <h2 className="text-2xl font-bold">Review & Pay</h2>
               <p className="text-muted text-sm">Please select payment method and confirm.</p>
            </div>
            
            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <div 
                 className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.payment_method === 'online' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'}`}
                 onClick={() => setFormData({...formData, payment_method: 'online'})}
               >
                 <div className="flex items-center gap-3 mb-2">
                    <CreditCard className={formData.payment_method === 'online' ? 'text-primary' : 'text-muted'} />
                    <h3 className="font-bold">Pay Online</h3>
                 </div>
                 <p className="text-xs text-muted">Securely pay via Credit Card/UPI (Dummy)</p>
               </div>
               
               <div 
                 className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'}`}
                 onClick={() => setFormData({...formData, payment_method: 'cod'})}
               >
                 <div className="flex items-center gap-3 mb-2">
                    <Banknote className={formData.payment_method === 'cod' ? 'text-primary' : 'text-muted'} />
                    <h3 className="font-bold">Cash on Delivery</h3>
                 </div>
                 <p className="text-xs text-muted">Pay the provider directly via Cash or Local UPI</p>
               </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-slate-800 p-6 rounded-xl text-left max-w-md mx-auto shadow-inner border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-muted">Date & Time:</span>
                <span className="font-bold text-main">{formData.date} at {formData.time}</span>
              </div>
              <div className="mb-3 text-sm">
                <div className="text-muted mb-1">Address:</div>
                <div className="font-medium text-main bg-white dark:bg-slate-900 p-3 border dark:border-slate-700 rounded-lg">{formData.address}</div>
              </div>
              <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount:</span>
                <span className="font-bold text-3xl text-primary">₹{service.price}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="btn btn-outline" disabled={processing}>Edit Details</button>
              <button onClick={handleSubmit} className="btn btn-success bg-success text-white hover:bg-green-600 px-8 py-3 text-lg shadow-lg shadow-success/30 font-bold" disabled={processing}>
                {processing ? 'Processing...' : formData.payment_method === 'online' ? 'Pay & Confirm Booking' : 'Confirm Cash Booking'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
           <div className="animate-fade-in text-center py-8">
              <CheckCircle2 size={80} className="text-success mx-auto mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              <h2 className="text-3xl font-bold text-main mb-4">Booking Confirmed Successfully!</h2>
              <p className="text-muted mb-8 max-w-sm mx-auto">Your booking request has been securely sent to the provider. They will review it shortly!</p>
              
              <div className="bg-gray-50/50 dark:bg-slate-800 p-6 rounded-xl text-left max-w-md mx-auto shadow-inner border border-gray-100 dark:border-slate-700 mb-8">
                 <h3 className="font-bold text-lg mb-4 text-center border-b pb-2">Booking Summary</h3>
                 <div className="flex justify-between mb-3 text-sm">
                   <span className="text-muted">Service:</span>
                   <span className="font-bold text-main">{service.title}</span>
                 </div>
                 <div className="flex justify-between mb-3 text-sm">
                   <span className="text-muted">Date & Time:</span>
                   <span className="font-bold text-main">{formData.date} at {formData.time}</span>
                 </div>
                 <div className="flex justify-between mb-3 text-sm">
                   <span className="text-muted">Payment:</span>
                   <span className="font-bold text-main uppercase">{formData.payment_method}</span>
                 </div>
                 <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-between items-center text-sm">
                   <span className="font-bold">Total Confirmed Value:</span>
                   <span className="font-bold text-xl text-primary">₹{service.price}</span>
                 </div>
              </div>
              
              <button onClick={() => navigate('/my-bookings')} className="btn btn-primary px-10 py-3 font-bold shadow-lg text-lg">
                View Status Tracking & Timeline
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;

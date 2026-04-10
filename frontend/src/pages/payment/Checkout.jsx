import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { service, formData } = location.state || {};
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  if (!service) {
    return <div className="text-center py-20">Invalid Checkout Session</div>;
  }

  // Stripe Processing Simulation
  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate real stripe tokenization delay
    setTimeout(async () => {
       try {
           // Create the physical booking dynamically now that payment succeeded visually
           const bookingPayload = {
               service_id: service.id,
               provider_id: service.provider_id,
               date: formData.date,
               time: formData.time,
               address: formData.address,
               notes: formData.notes,
               payment_method: 'online'
           };
   
           const res = await fetch('http://localhost:5000/api/bookings/create', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`
               },
               body: JSON.stringify(bookingPayload)
           });
   
           if (res.ok) {
               // Mark as 'paid' instantly since we just processed it
               const data = await res.json();
               await fetch(`http://localhost:5000/api/bookings/${data.bookingId}/status`, {
                   method: 'PUT',
                   headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${token}`
                   },
                   body: JSON.stringify({ status: 'paid' })
               });
               
               setLoading(false);
               navigate('/success', { state: { service } });
           } else {
               alert("Payment processed but Booking Failed to save. Contact support.");
               setLoading(false);
           }
       } catch (err) {
           alert("Network error talking to Stripe gateway.");
           setLoading(false);
       }
    }, 2500);
  };

  const platformFee = Math.round(service.price * 0.10); // 10% platform fee simulation
  const totalCharge = service.price + platformFee;

  return (
    <div className="container py-12 max-w-5xl animate-fade-in mb-24">
      <div className="flex items-center gap-2 mb-8 text-main">
         <Lock size={20} className="text-green-500"/> 
         <h1 className="text-2xl font-bold">Secure Stripe Checkout</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* Payment Form (Stripe Mock UI) */}
        <div className="lg:col-span-3">
          <div className="glass p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800 relative overflow-hidden">
             
            <div className="absolute top-0 left-0 w-full h-1 bg-[#635BFF]"></div>
            
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold text-main">Payment mapping</h2>
               <div className="flex gap-1 opacity-60 grayscale">
                  {/* Fake card icons */}
                  <div className="w-10 h-6 bg-blue-800 rounded"></div>
                  <div className="w-10 h-6 bg-red-500 rounded"></div>
                  <div className="w-10 h-6 bg-yellow-500 rounded"></div>
               </div>
            </div>
            
            <form onSubmit={handlePayment}>
              <div className="space-y-6">
                  
                 {/* Email mapping */}
                 <div>
                    <label className="block text-sm font-semibold text-main mb-2">Email</label>
                    <input type="email" readOnly value="Connected Account Session" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-500 text-sm outline-none cursor-not-allowed" />
                 </div>

                 {/* Card Info Stripe Element Layout */}
                 <div>
                    <label className="block text-sm font-semibold text-main mb-2">Card information</label>
                    <div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                       <div className="relative border-b border-gray-300 dark:border-slate-600 p-3 flex items-center group focus-within:border-[#635BFF]">
                          <CreditCard className="text-gray-400 mr-3" size={20} />
                          <input type="text" className="w-full bg-transparent outline-none text-main placeholder-gray-400 text-sm tracking-widest font-mono" placeholder="1234 5678 9101 1121" maxLength="19" required />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-3 ml-2 opacity-30" />
                       </div>
                       
                       <div className="flex">
                           <div className="w-1/2 p-3 border-r border-gray-300 dark:border-slate-600 focus-within:border-[#635BFF]">
                              <input type="text" className="w-full bg-transparent outline-none text-main placeholder-gray-400 text-sm font-mono tracking-widest" placeholder="MM / YY" maxLength="7" required />
                           </div>
                           <div className="w-1/2 p-3 relative focus-within:border-[#635BFF]">
                              <input type="password" className="w-full bg-transparent outline-none text-main placeholder-gray-400 text-sm font-mono tracking-widest" placeholder="CVC" maxLength="4" required />
                              <AlertCircle size={14} className="text-gray-400 absolute right-3 top-3.5"/>
                           </div>
                       </div>
                    </div>
                 </div>

                 {/* Name on card */}
                 <div>
                    <label className="block text-sm font-semibold text-main mb-2">Name on card</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-main text-sm outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all" required />
                 </div>
                 
                 {/* Country */}
                 <div>
                    <label className="block text-sm font-semibold text-main mb-2">Country or region</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-main text-sm outline-none h-[46px]">
                       <option>India</option>
                       <option>United States</option>
                       <option>United Kingdom</option>
                    </select>
                 </div>
              </div>
              
              <button type="submit" className="w-full text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-8 transition-colors shadow-lg hover:shadow-xl disabled:opacity-75" style={{backgroundColor: '#635BFF'}} disabled={loading}>
                {loading ? (
                   <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</span>
                ) : `Pay ₹${totalCharge}`}
              </button>
            </form>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="card p-6 bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold mb-6 text-main">Order Summary</h2>
            
            <div className="flex gap-4 mb-8 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
              <img src={service.image || `https://source.unsplash.com/100x100/?${service.category}`} alt="" className="w-16 h-16 rounded object-cover shadow-sm" />
              <div>
                <h3 className="font-bold text-main leading-tight mb-1">{service.title}</h3>
                <p className="text-xs text-muted font-semibold tracking-wide uppercase">{service.provider_name}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-muted">
                <span>Service Rate</span>
                <span className="font-bold text-main">₹{service.price}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Platform Commission (10%)</span>
                <span className="font-bold text-main">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-sm text-muted border-b border-gray-200 dark:border-slate-700 pb-4">
                <span>Tax</span>
                <span className="font-bold text-main">₹0.00</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-lg text-main">Total due</span>
              <span className="font-bold text-3xl" style={{color: '#635BFF'}}>₹{totalCharge}</span>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800 break-words flex items-start gap-3">
               <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={20}/>
               <p className="text-xs text-green-800 dark:text-green-400 font-medium leading-relaxed">
                  Your payments are processed securely by our simulated Stripe gateway. Bookings will correctly map to Paid status natively.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

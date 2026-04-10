import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, MapPin, CheckCircle2, Star, Image as ImageIcon, MessageSquare } from 'lucide-react';
import ChatModal from '../../components/ChatModal';

const MyBookings = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeChatProvider, setActiveChatProvider] = useState(null); // V4 Chat State

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    fetch('http://localhost:5000/api/bookings/my-bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
         setBookings(data);
      } else {
         console.error("API Error Response:", data);
         alert("Error fetching local bookings: " + (data.detail || data.message || JSON.stringify(data)));
         setBookings([]);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      alert("Network Error fetching bookings.");
      setLoading(false);
    });
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'started': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimelineSteps = (status) => {
    const defaultSteps = [
      { id: 'pending', label: 'Requested' },
      { id: 'confirmed', label: 'Confirmed' },
      { id: 'started', label: 'In Progress' },
      { id: 'completed', label: 'Job Done' },
    ];
    
    let currentIndex = 0;
    if (status === 'confirmed') currentIndex = 1;
    if (status === 'started') currentIndex = 2;
    if (status === 'completed') currentIndex = 3;

    return { steps: defaultSteps, currentIndex };
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: reviewBooking.id,
          provider_id: reviewBooking.provider_id,
          rating,
          comment
        })
      });
      
      if (res.ok) {
        alert("Review submitted successfully! Thank you.");
        setReviewBooking(null);
        setRating(5);
        setComment('');
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch(err) {
      alert("Network error.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted">Loading your bookings...</div>;

  return (
    <div className="container py-8 animate-fade-in relative">
      <h1 className="text-3xl font-bold mb-8 text-main">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="card p-12 text-center shadow-none border border-dashed glass">
          <p className="text-muted">You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => {
            const timeline = getTimelineSteps(booking.status);
            return (
              <div key={booking.id} className="card p-6 border border-gray-100 dark:border-slate-700 glass transition-all hover:shadow-xl relative overflow-hidden group">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-main">{booking.service_title}</h3>
                    <p className="text-sm text-primary font-medium">Provider: {booking.provider_name}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-muted">
                    <Calendar size={14} className="mr-2 text-primary" /> {booking.date}
                  </div>
                  <div className="flex items-center text-sm text-muted">
                    <Clock size={14} className="mr-2 text-primary" /> {booking.time}
                  </div>
                  <div className="flex items-start text-sm text-muted">
                    <MapPin size={14} className="mr-2 mt-1 text-primary shrink-0" /> <span className="line-clamp-2">{booking.address}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="relative pt-6 pb-2 border-t dark:border-slate-700">
                  <div className="flex justify-between">
                    {timeline.steps.map((step, idx) => (
                       <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
                          <div className={`w-4 h-4 rounded-full ${idx <= timeline.currentIndex || booking.status === 'paid' ? 'bg-primary border-2 border-white' : 'bg-gray-200 border-2 border-gray-300'}`}></div>
                          <span className={`text-[10px] mt-1 font-bold ${idx <= timeline.currentIndex || booking.status === 'paid' ? 'text-primary' : 'text-gray-400'}`}>{step.label}</span>
                       </div>
                    ))}
                  </div>
                  <div className="absolute top-8 left-0 w-full h-[2px] bg-gray-200 -z-0">
                     <div className="h-full bg-primary" style={{width: `${booking.status === 'paid' ? 100 : (timeline.currentIndex / (timeline.steps.length - 1)) * 100}%`}}></div>
                  </div>
                </div>
                
                {booking.payment_method && (
                   <p className="text-xs text-muted font-bold uppercase tracking-wider mt-4 text-center">Payment: {booking.payment_method}</p>
                )}

                {(booking.status === 'completed' || booking.status === 'paid') && (
                  <div className="mt-4 flex flex-col gap-2">
                     {booking.status === 'completed' && booking.payment_method === 'cod' && (
                         <button onClick={() => {
                            fetch(`http://localhost:5000/api/bookings/${booking.id}/status`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ status: 'paid' })
                            }).then(() => fetchBookings());
                         }} className="btn btn-primary w-full text-sm font-bold flex items-center justify-center bg-blue-600">
                            Confirm Payment Done
                         </button>
                     )}
                     <button onClick={() => setReviewBooking(booking)} className="btn btn-outline w-full text-sm font-bold flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary hover:text-white">
                        <Star size={16} /> Rate & Review Provider
                     </button>
                     {booking.proof_image && (
                         <a href={booking.proof_image} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full text-sm font-bold flex items-center justify-center gap-2">
                            <ImageIcon size={16} /> View Proof of Work
                         </a>
                     )}
                  </div>
                )}
                
                {booking.status !== 'completed' && booking.status !== 'paid' && (
                  <div className="mt-4 border-t dark:border-slate-700 pt-4">
                     <button onClick={() => setActiveChatProvider({ id: booking.provider_id, name: booking.provider_name, role: 'provider' })} className="btn bg-slate-100 dark:bg-slate-800 text-main hover:bg-primary hover:text-white w-full text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                        <MessageSquare size={16} /> Message Provider
                     </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="card w-full max-w-md p-6 bg-white dark:bg-slate-800 animate-fade-in shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">Rate Provider</h2>
               <p className="text-muted mb-4 text-sm">How was your experience with <b>{reviewBooking.provider_name}</b>?</p>
               
               <form onSubmit={handleReviewSubmit}>
                 <div className="flex justify-center gap-2 mb-6">
                    {[1,2,3,4,5].map(star => (
                      <Star 
                        key={star} 
                        size={32} 
                        onClick={() => setRating(star)} 
                        className={`cursor-pointer transition-transform hover:scale-110 ${star <= rating ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                 </div>
                 
                 <div className="input-group mb-6">
                    <label className="input-label">Leave a Comment</label>
                    <textarea 
                      className="input-field py-3 bg-gray-50/50 dark:bg-slate-900" 
                      rows="4" 
                      placeholder="They did an amazing job..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    ></textarea>
                 </div>
                 
                 <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => setReviewBooking(null)} className="btn btn-outline" disabled={submittingReview}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submittingReview}>{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
                 </div>
               </form>
           </div>
        </div>
      )}

      {/* V4 Real-time Chat Container */}
      <ChatModal 
        isOpen={!!activeChatProvider} 
        targetUser={activeChatProvider} 
        onClose={() => setActiveChatProvider(null)} 
      />
    </div>
  );
};

export default MyBookings;

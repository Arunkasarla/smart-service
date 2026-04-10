import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, MoreVertical, ShieldCheck, ArrowRight, Upload, MessageSquare } from 'lucide-react';
import ChatModal from '../../components/ChatModal';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js v3+ to initialize all scales

const ProviderDashboard = () => {
  const { token, socket, user } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Realtime notification state
  const [newNotification, setNewNotification] = useState(null);

  // Proof Upload Modal state
  const [completeBookingUI, setCompleteBookingUI] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null); // V4 Chat State

  // V5 Calendar State
  const [blockedDates, setBlockedDates] = useState([]);
  const [calendarDateInput, setCalendarDateInput] = useState('');

  useEffect(() => {
    fetchRequests();
    if(user?.id) fetchBlockedDates();

    if (socket && user?.id) {
       socket.on('booking_notification', (data) => {
         if (data.providerId === user.id) {
            setNewNotification(data);
            fetchRequests(); // Automatically refresh list

            // Clear banner automatically after 5 sec
            setTimeout(() => setNewNotification(null), 5000);
         }
       });
    }
    
    return () => {
       if (socket) {
          socket.off('booking_notification');
       }
    }
  }, [socket, user]);

  const fetchRequests = () => {
    fetch('http://localhost:5000/api/bookings/requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setRequests(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  const fetchBlockedDates = () => {
    fetch(`http://localhost:5000/api/provider/${user.id}/blocked-dates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setBlockedDates(Array.isArray(data) ? data : []);
    });
  };

  const toggleBlockDate = async (date) => {
    if(!date) return;
    const isCurrentlyBlocked = blockedDates.includes(date);
    const res = await fetch('http://localhost:5000/api/provider/blocked-dates', {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}` 
       },
       body: JSON.stringify({ date: date, isBlocked: !isCurrentlyBlocked })
    });
    if(res.ok) {
       fetchBlockedDates();
       setCalendarDateInput('');
    }
  };

  const handleUpdateStatus = (id, newStatus) => {
    fetch(`http://localhost:5000/api/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    }).then(() => fetchRequests());
  };

  const handleCompleteWithProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
        alert("Please upload a proof image to complete the job!");
        return;
    }
    setCompleting(true);

    const formData = new FormData();
    formData.append('proof_image', proofFile);

    try {
        const res = await fetch(`http://localhost:5000/api/bookings/${completeBookingUI.id}/complete`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            alert('Service marked as completed successfully!');
            setCompleteBookingUI(null);
            setProofFile(null);
            fetchRequests();
        } else {
            const err = await res.json();
            alert(err.message || 'Error uploading file');
        }
    } catch(err) {
        alert("Network error.");
    } finally {
        setCompleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      started: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${map[status] || map.pending}`}>{status}</span>;
  }

  // --- Graph Analytics Dummy Logic ---
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Earnings (₹)',
        data: [1200, 1900, 800, 2500, 3200, 4800, 1500],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)'} }, x: { grid: { display: false } } } };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted">Loading your dashboard...</div>;

  return (
    <div className="container py-8 relative">
      
      {/* Real-time Socket.io Notification Banner */}
      {newNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(34,197,94,0.4)] border border-green-400">
           <div className="bg-white/20 p-2 rounded-full"><CheckCircle size={24} /></div>
           <div>
             <h4 className="font-bold">Incoming Booking!</h4>
             <p className="text-sm font-medium opacity-90">{newNotification.message}</p>
           </div>
        </div>
      )}

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Provider Dashboard</h1>
          <p className="text-muted font-medium flex items-center gap-2"><ShieldCheck size={16} className="text-primary"/> Verified Account</p>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border border-primary/20 bg-primary/5">
          <p className="text-muted uppercase text-xs font-bold tracking-wider mb-1">Total Earnings</p>
          <div className="text-3xl font-bold text-main mb-2">₹15,900</div>
          <p className="text-xs text-primary font-medium flex items-center gap-1">+12% from last week</p>
        </div>
        
        {/* V5 Calendar Block Feature */}
        <div className="card p-6 border-l-4 border-l-orange-500">
           <h3 className="font-bold text-main mb-2 flex items-center gap-2"><Calendar size={18} className="text-orange-500"/> Manage Availability</h3>
           <p className="text-xs text-muted mb-4">Block upcoming dates so customers cannot double-book you when you are out of office.</p>
           
           <div className="flex gap-2 mb-3">
              <input type="date" className="input-field py-1 px-3 text-sm flex-1" min={new Date().toISOString().split('T')[0]} value={calendarDateInput} onChange={(e) => setCalendarDateInput(e.target.value)} />
              <button disabled={!calendarDateInput} onClick={() => toggleBlockDate(calendarDateInput)} className={`btn ${blockedDates.includes(calendarDateInput) ? 'btn-outline' : 'btn-primary'} py-1 px-4 text-sm`}>
                 {blockedDates.includes(calendarDateInput) ? 'Unblock' : 'Block Date'}
              </button>
           </div>
           
           <div className="flex flex-wrap gap-2 mt-4">
              {blockedDates.map(d => (
                 <span key={d} className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                    {d} <button onClick={() => toggleBlockDate(d)} className="hover:text-red-900"><XCircle size={10}/></button>
                 </span>
              ))}
           </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
         <h2 className="text-xl font-bold">Booking Jobs</h2>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center shadow-none border border-dashed text-muted">
          <p>No booking requests yet. They'll appear here when users book you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow group">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-main">{request.user_name}</h3>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                  <span className="flex items-center gap-1"><Calendar size={14} className="text-primary"/> {request.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-primary"/> {request.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-primary"/> {request.address}</span>
                  <span className="font-bold text-primary">₹{Math.floor(Math.random() * 500) + 300} (COD)</span>
                </div>
              </div>

              {/* Action Buttons Pipeline */}
              <div className="flex gap-2">
                {request.status !== 'completed' && request.status !== 'paid' && (
                   <button onClick={() => setActiveChatUser({ id: request.user_id, name: request.user_name, role: 'user' })} className="btn btn-outline bg-slate-50 dark:bg-slate-800 text-main border-gray-200 hover:bg-primary hover:text-white px-3" title="Message User">
                      <MessageSquare size={18}/>
                   </button>
                )}
                {request.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdateStatus(request.id, 'cancelled')} className="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white px-3"><XCircle size={18}/></button>
                    <button onClick={() => handleUpdateStatus(request.id, 'confirmed')} className="btn btn-primary bg-primary text-white hover:shadow-lg transition-all"><CheckCircle size={18}/> Accept Job</button>
                  </>
                )}

                {request.status === 'confirmed' && (
                  <button onClick={() => handleUpdateStatus(request.id, 'started')} className="btn btn-secondary bg-secondary text-white hover:shadow-lg transition-all"><Clock size={18}/> Start Job</button>
                )}

                {request.status === 'started' && (
                  <button onClick={() => setCompleteBookingUI(request)} className="btn btn-success bg-gradient-to-r from-success to-green-600 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all font-bold tracking-wide"><CheckCircle size={18}/> Mark Done</button>
                )}

                {request.status === 'completed' && (
                    <button disabled className="btn btn-outline bg-gray-50 dark:bg-slate-800 text-muted border-dashed font-bold flex items-center gap-2"><CheckCircle size={16}/> Completed</button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Complete Job Proof Upload Modal */}
      {completeBookingUI && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="card w-full max-w-md p-6 bg-white dark:bg-slate-800 animate-fade-in shadow-2xl">
                <h2 className="text-2xl font-bold mb-2 text-success flex items-center gap-2"><CheckCircle /> Complete Job UI</h2>
                 <p className="text-muted mb-6 text-sm">Upload proof of work photo to finalize Job for {completeBookingUI.user_name}.</p>
                 
                 <form onSubmit={handleCompleteWithProof}>
                   <div className="input-group mb-6">
                      <label className="input-label font-bold text-main">Proof of Service Photo</label>
                      <div className="relative overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 hover:border-primary transition-colors text-center group cursor-pointer">
                         <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" required />
                         <Upload size={32} className={`mx-auto mb-2 ${proofFile ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition-colors'}`} />
                         <span className={`font-semibold text-sm ${proofFile ? 'text-primary' : 'text-gray-500'}`}>
                             {proofFile ? proofFile.name : 'Click or drag image to upload'}
                         </span>
                      </div>
                   </div>
                   
                   <div className="flex justify-end gap-4 mt-6">
                      <button type="button" onClick={() => { setCompleteBookingUI(null); setProofFile(null); }} className="btn btn-outline" disabled={completing}>Cancel</button>
                      <button type="submit" className="btn btn-success" disabled={completing}>{completing ? 'Uploading...' : 'Submit Proof & Complete'}</button>
                   </div>
                 </form>
             </div>
          </div>
      )}

      {/* V4 Real-time Chat Container */}
      <ChatModal 
        isOpen={!!activeChatUser} 
        targetUser={activeChatUser} 
        onClose={() => setActiveChatUser(null)} 
      />

    </div>
  );
};

export default ProviderDashboard;

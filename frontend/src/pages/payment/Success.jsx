import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const Success = () => {
  const location = useLocation();
  const { service } = location.state || {};

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in p-4">
      <div className="card p-8 md:p-12 max-w-md w-full text-center relative overflow-hidden">
        {/* Animated Background Confetti/Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-400 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-success" />
          </div>
          
          <h1 className="text-3xl font-bold text-main mb-2">Booking Confirmed!</h1>
          <p className="text-muted mb-8">
            Your booking for <span className="font-semibold text-main">{service?.title || 'the service'}</span> has been successfully processed. The provider will be notified shortly.
          </p>
          
          <div className="w-full flex flex-col gap-3">
            <Link to="/my-bookings" className="btn btn-primary w-full">
              View My Bookings
            </Link>
            <Link to="/" className="btn btn-outline w-full flex items-center justify-center gap-2">
              Back to Home <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;

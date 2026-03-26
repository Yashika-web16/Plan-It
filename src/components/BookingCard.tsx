import { Calendar, MapPin, CheckCircle, Clock, XCircle, Navigation, FileText, Sparkles } from "lucide-react";
import { Booking } from "../types";
import { GlassCard } from "./GlassCard";
import { useState } from "react";
import { PlanModal } from "./PlanModal";

interface BookingCardProps {
  booking: Booking;
  title: string;
  location: string;
}

export const BookingCard = ({ booking, title, location }: BookingCardProps) => {
  const [showPlan, setShowPlan] = useState(false);
  const statusColors = {
    confirmed: "text-brand-secondary",
    pending: "text-brand-accent",
    cancelled: "text-brand-primary"
  };

  const StatusIcon = {
    confirmed: CheckCircle,
    pending: Clock,
    cancelled: XCircle
  }[booking.status];

  const displayTitle = booking.type === 'plan' ? (booking.details?.type || "Event Plan") : (booking.eventTitle || title);
  const displayLocation = booking.location || booking.venue || location;

  const handleGetDirections = () => {
    const encodedLocation = encodeURIComponent(displayLocation);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`, '_blank');
  };

  return (
    <>
      <GlassCard className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
          {booking.type === 'plan' ? (
            <Sparkles className="w-8 h-8 text-brand-primary" />
          ) : (
            <Calendar className="w-8 h-8 text-brand-primary" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg capitalize">{displayTitle}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/50 mt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {displayLocation}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(booking.date).toLocaleDateString()}
            </div>
          </div>
          
          {booking.type === 'plan' ? (
            <button 
              onClick={() => setShowPlan(true)}
              className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-secondary hover:text-brand-secondary/80 transition-colors"
            >
              <FileText className="w-3 h-3" /> View Detailed Plan
            </button>
          ) : booking.status === 'confirmed' && (
            <button 
              onClick={handleGetDirections}
              className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              <Navigation className="w-3 h-3" /> Get Directions
            </button>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <div className={`flex items-center gap-1 text-sm font-bold uppercase tracking-wider ${statusColors[booking.status]}`}>
            <StatusIcon className="w-4 h-4" /> {booking.status}
          </div>
          <span className="text-xl font-bold font-display">
            ₹{Number(booking.totalAmount).toLocaleString()}
          </span>
        </div>
      </GlassCard>

      {showPlan && booking.details && (
        <PlanModal 
          plan={booking.details} 
          onClose={() => setShowPlan(false)} 
        />
      )}
    </>
  );
};
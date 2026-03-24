import { MapPin, Users, Sparkles, Star, Loader2, Hotel, Music } from "lucide-react";
import { Venue } from "../types";
import { GlassCard } from "./GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { VenueBookingModal } from "./VenueBookingModal";

interface VenueCardProps {
  venue: Venue;
}

export const VenueCard = ({ venue }: VenueCardProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <>
      <GlassCard className="flex flex-col h-full group">
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
          <img
            src={venue.images[0] || `https://picsum.photos/seed/${venue.id}/800/450`}
            alt={venue.name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            <div className="px-3 py-1 rounded-full glass-dark text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-brand-accent">
              <Star className="w-3 h-3 fill-brand-accent" /> 4.8
            </div>
            {venue.isHotel && (
              <div className="px-3 py-1 rounded-full bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-brand-primary/20">
                <Hotel className="w-3 h-3" /> Hotel
              </div>
            )}
            {venue.isOpenAir && (
              <div className="px-3 py-1 rounded-full bg-brand-secondary text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-brand-secondary/20">
                <Music className="w-3 h-3" /> Open-Air
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 font-display group-hover:text-brand-primary transition-colors">{venue.name}</h3>
          
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-secondary" />
              <span>{venue.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-accent" />
              <span>Up to {venue.capacity} guests</span>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {venue.themeCompatibility.map(theme => (
              <span key={theme} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] uppercase tracking-wider font-bold text-white/40">
                {theme}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-brand-secondary">
              ₹{venue.pricePerHour}
            </span>
            <span className="text-[10px] text-white/40 uppercase">per hour</span>
          </div>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Book Now
          </button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {isBookingOpen && (
          <VenueBookingModal 
            venue={venue} 
            isOpen={isBookingOpen} 
            onClose={() => setIsBookingOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

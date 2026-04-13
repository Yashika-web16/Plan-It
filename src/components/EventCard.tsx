import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Sparkles, Loader2 } from "lucide-react";
import { Event } from "../types";
import { GlassCard } from "./GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { BookingModal } from "./BookingModal";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBookNow = async () => {
    // For this demo, we use the internal BookingModal for all events
    // to ensure a smooth experience without external Stripe configuration.
    setIsModalOpen(true);
  };

  return (
    <>
      <GlassCard className="flex flex-col h-full p-0 overflow-hidden border-white/[0.05]">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={event.images[0] || `https://picsum.photos/seed/${event.id}/800/450`}
            alt={event.title}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4">
            <span className="mono-tag bg-black/40 backdrop-blur-md border-white/10 text-white">
              {event.category}
            </span>
          </div>
        </div>
        
        <div className="p-8 flex-1 flex flex-col">
          <h3 className="text-2xl font-bold mb-4 font-display tracking-tight leading-tight">{event.title}</h3>
          
          <div className="space-y-3 text-sm text-white/40 font-medium">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-white/20" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-white/20" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{event.bookedCount}/{event.capacity} Booked</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.05] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Price</span>
              <span className="text-2xl font-bold text-white">
                ₹{event.price}
              </span>
            </div>
            <button
              onClick={handleBookNow}
              disabled={loading}
              className="btn-primary py-3 px-6 text-xs uppercase tracking-widest flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Book
            </button>
          </div>
        </div>
      </GlassCard>

      <AnimatePresence>
        {isModalOpen && (
          <BookingModal
            event={event}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

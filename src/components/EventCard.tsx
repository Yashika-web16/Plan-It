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
    if (event.category === "Movie" || event.title.includes("Dhurandhar")) {
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          title: event.title,
          price: event.price,
          image: event.images[0] || `https://picsum.photos/seed/${event.id}/800/450`,
        }),
      });

      const { id } = await response.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) as any;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: id });
        if (error) console.error(error);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to initiate booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlassCard className="flex flex-col h-full">
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
          <img
            src={event.images[0] || `https://picsum.photos/seed/${event.id}/800/450`}
            alt={event.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full glass-dark text-xs font-medium">
            {event.category}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 font-display">{event.title}</h3>
          
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-secondary" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-accent" />
              <span>{event.bookedCount}/{event.capacity} Booked</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <span className="text-2xl font-bold text-brand-primary">
            ₹{event.price}
          </span>
          <button
            onClick={handleBookNow}
            disabled={loading}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Book Now
          </button>
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

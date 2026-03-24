import { useState, useEffect } from "react";
import { X, Calendar, Clock, Loader2, Sparkles, MapPin, Users, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Venue, Booking } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { GlassCard, cn } from "./GlassCard";

interface BookingModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
}

export const VenueBookingModal = ({ venue, isOpen, onClose }: BookingModalProps) => {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [similarVenues, setSimilarVenues] = useState<Venue[]>([]);

  useEffect(() => {
    if (conflict) {
      fetchSimilarVenues();
    }
  }, [conflict]);

  const fetchSimilarVenues = async () => {
    try {
      const venuesRef = collection(db, "venues");
      const snapshot = await getDocs(venuesRef);
      const allVenues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Venue[];
      
      // Filter similar venues by theme compatibility or location
      const similar = allVenues
        .filter(v => v.id !== venue.id)
        .filter(v => 
          v.themeCompatibility.some(theme => venue.themeCompatibility.includes(theme)) ||
          v.location.toLowerCase().includes(venue.location.toLowerCase())
        )
        .slice(0, 2);
      
      setSimilarVenues(similar);
    } catch (error) {
      console.error("Error fetching similar venues:", error);
    }
  };

  const checkAvailability = async () => {
    if (!date || !time) return;
    
    setChecking(true);
    setConflict(false);
    
    try {
      const bookingsRef = collection(db, "bookings");
      // Check if this venue is booked on this date
      // In a real app, we'd check for overlapping time slots
      const q = query(
        bookingsRef, 
        where("venueId", "==", venue.id),
        where("date", "==", date),
        where("time", "==", time)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setConflict(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "bookings");
    } finally {
      setChecking(false);
    }
  };

  const handleBook = async () => {
    if (!user) {
      alert("Please login to book a venue!");
      return;
    }
    if (!date || !time) {
      alert("Please select a date and time!");
      return;
    }

    setLoading(true);
    try {
      // Final check before booking
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef, 
        where("venueId", "==", venue.id),
        where("date", "==", date),
        where("time", "==", time)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setConflict(true);
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        venueId: venue.id,
        venue: venue.name,
        location: venue.location, // Save the venue's address
        type: 'venue',
        status: 'confirmed',
        totalAmount: venue.pricePerHour * 4, // Default 4 hours
        date,
        time,
        createdAt: new Date().toISOString()
      });
      
      alert("Venue booked successfully! 🚀 Check your dashboard for details.");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "bookings");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl"
      >
        <GlassCard className="p-0 overflow-hidden">
          <div className="relative h-48">
            <img 
              src={venue.images[0] || `https://picsum.photos/seed/${venue.id}/800/450`} 
              alt={venue.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-6">
              <h2 className="text-3xl font-bold font-display">{venue.name}</h2>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin className="w-4 h-4" /> {venue.location}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Select Date
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setConflict(false);
                    }}
                    onBlur={checkAvailability}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Select Time
                  </label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      setConflict(false);
                    }}
                    onBlur={checkAvailability}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Price Details</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-bold text-brand-secondary">₹{venue.pricePerHour}</div>
                      <div className="text-[10px] text-white/40 uppercase">per hour</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white/60">Total (4hrs)</div>
                      <div className="text-xl font-bold text-brand-primary">₹{venue.pricePerHour * 4}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <Users className="w-4 h-4 text-brand-accent" />
                  <span>Capacity: Up to {venue.capacity} guests</span>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {conflict ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-500">Venue Already Booked</h4>
                      <p className="text-sm text-white/60">This venue is already booked for {date} at {time}. Please try another time or check these similar venues.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-white/40">Similar Venues You'll Love</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {similarVenues.map(v => (
                        <div key={v.id} className="glass rounded-xl overflow-hidden group cursor-pointer hover:border-brand-primary transition-colors">
                          <div className="aspect-video relative">
                            <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                          </div>
                          <div className="p-3">
                            <h6 className="font-bold text-xs truncate">{v.name}</h6>
                            <div className="text-[10px] text-white/40 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {v.location}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="book-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleBook}
                  disabled={loading || checking || !date || !time}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  {checking ? "Checking Availability..." : "Confirm Booking"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

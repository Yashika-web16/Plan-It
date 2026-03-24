import { useState } from "react";
import { X, Ticket, Armchair, Popcorn, CreditCard, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Event } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { GlassCard, cn } from "./GlassCard";

interface BookingModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const SEAT_TYPES = [
  { name: "Executive", price: 0, icon: Armchair },
  { name: "Club", price: 150, icon: Armchair },
  { name: "Recliner", price: 350, icon: Armchair },
];

const CINEMAS = ["PVR: Phoenix Palladium", "PVR: Juhu", "PVR: Oberoi Mall", "PVR: Citi Mall"];

export const BookingModal = ({ event, isOpen, onClose }: BookingModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCinema, setSelectedCinema] = useState(CINEMAS[0]);
  const [selectedSeat, setSelectedSeat] = useState(SEAT_TYPES[0]);
  const [addFood, setAddFood] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalPrice = event.price + selectedSeat.price + (addFood ? 450 : 0);

  const handleBooking = async () => {
    if (!user) {
      alert("Please login to book tickets!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        eventId: event.id,
        eventTitle: event.title,
        venue: selectedCinema,
        location: event.location, // Save the event's location
        seatType: selectedSeat.name,
        addFood,
        type: 'ticket',
        status: 'confirmed',
        totalAmount: totalPrice,
        date: event.date,
        createdAt: new Date().toISOString()
      });
      setStep(3);
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
        className="relative w-full max-w-xl"
      >
        <GlassCard className="p-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-bold">{event.title}</h3>
                <p className="text-xs text-white/40">Step {step} of 3</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Select Cinema</label>
                  <div className="grid grid-cols-1 gap-3">
                    {CINEMAS.map(cinema => (
                      <button
                        key={cinema}
                        onClick={() => setSelectedCinema(cinema)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          selectedCinema === cinema ? "bg-brand-primary/10 border-brand-primary text-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {cinema}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Seat Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    {SEAT_TYPES.map(seat => (
                      <button
                        key={seat.name}
                        onClick={() => setSelectedSeat(seat)}
                        className={cn(
                          "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                          selectedSeat.name === seat.name ? "bg-brand-secondary/10 border-brand-secondary text-brand-secondary" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        )}
                      >
                        <seat.icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase">{seat.name}</span>
                        <span className="text-xs">+{seat.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="w-full btn-primary py-4 text-lg">
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Base Ticket</span>
                    <span className="font-bold">₹{event.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Seat Upgrade ({selectedSeat.name})</span>
                    <span className="font-bold">₹{selectedSeat.price}</span>
                  </div>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Popcorn className="w-5 h-5 text-brand-accent" />
                      <div>
                        <div className="text-sm font-bold">Popcorn & Coke Combo</div>
                        <div className="text-[10px] text-white/40 uppercase">Save 20% on pre-book</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={addFood} onChange={e => setAddFood(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-white/5" />
                  </label>
                  {addFood && (
                    <div className="flex justify-between items-center text-brand-accent">
                      <span>Food & Beverage</span>
                      <span className="font-bold">₹450</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount</span>
                    <span className="text-2xl font-bold text-brand-primary">₹{totalPrice}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                      <CreditCard className="w-5 h-5" />
                      <span className="text-sm font-bold">UPI / Card</span>
                    </button>
                    <button className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                      <CreditCard className="w-5 h-5" />
                      <span className="text-sm font-bold">Net Banking</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 glass py-4 font-bold">Back</button>
                  <button onClick={handleBooking} disabled={loading} className="flex-[2] btn-primary py-4 text-lg flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    Pay Now
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-display mb-2">Booking Confirmed!</h3>
                  <p className="text-white/50">Your tickets for {event.title} have been booked successfully.</p>
                </div>
                <div className="p-6 rounded-2xl glass-dark text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Cinema</span>
                    <span className="font-bold">{selectedCinema}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Seat</span>
                    <span className="font-bold">{selectedSeat.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Date</span>
                    <span className="font-bold">{event.date}</span>
                  </div>
                </div>
                <button onClick={onClose} className="w-full btn-secondary py-4 font-bold">Close & View Tickets</button>
              </motion.div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

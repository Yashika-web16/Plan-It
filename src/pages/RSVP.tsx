import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Sparkles, Calendar, MapPin, Users, Trophy } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import confetti from "canvas-confetti";

import { useAuth } from "../AuthContext";
import { ScavengerHuntSection } from "../components/ScavengerHuntSection";

// RSVP page for guests to respond to invitations
export const RSVP = () => {
  const { user } = useAuth();
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get("guestId");
  const guestName = searchParams.get("name");

  const [status, setStatus] = useState<'loading' | 'form' | 'scavenger_opt_in' | 'success' | 'error'>('loading');
  const [eventData, setEventData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<'Attending' | 'Declined' | null>(null);
  const [wantsScavenger, setWantsScavenger] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!bookingId) {
        setStatus('error');
        return;
      }

      try {
        const docRef = doc(db, "bookings", bookingId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setEventData(data);
          // If guest already responded, show success screen
          const guest = data.details?.guests?.find((g: any) => g.id === guestId);
          if (guest?.status === 'Attending' || guest?.status === 'Declined') {
            setResponse(guest.status);
            setStatus('success');
          } else {
            setStatus('form');
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setStatus('error');
      }
    };

    fetchEvent();
  }, [bookingId, guestId]);

  const handleRSVP = async (choice: 'Attending' | 'Declined') => {
    if (!bookingId || !guestId) return;
    
    setSubmitting(true);
    try {
      const docRef = doc(db, "bookings", bookingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedGuests = (data.details?.guests || []).map((g: any) => 
          g.id === guestId ? { ...g, status: choice, respondedAt: new Date().toISOString() } : g
        );

        const updateData: any = {
          "details.guests": updatedGuests
        };

        if (choice === 'Attending' && user) {
          updateData.participantIds = arrayUnion(user.uid);
        }

        console.log("Updating booking with data:", updateData);
        await updateDoc(docRef, updateData);

        // Update local eventData so the success screen has the latest info
        setEventData((prev: any) => ({
          ...prev,
          details: {
            ...prev.details,
            guests: updatedGuests
          },
          participantIds: choice === 'Attending' && user ? [...(prev.participantIds || []), user.uid] : prev.participantIds
        }));

        if (choice === 'Attending') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899']
          });

          // If there's a scavenger hunt, ask if they want to join
          if (data.details?.scavengerHunt?.length > 0) {
            setStatus('scavenger_opt_in');
          } else {
            setStatus('success');
          }
        } else {
          setStatus('success');
        }
      }
    } catch (error) {
      console.error("RSVP Error:", error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, "bookings");
      } catch (e) {
        // handleFirestoreError throws, but we want to continue to show the alert
      }
      alert(`Failed to save your response: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScavengerOptIn = async (optIn: boolean) => {
    if (!bookingId || !guestId) return;
    setSubmitting(true);
    try {
      const docRef = doc(db, "bookings", bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedGuests = (data.details?.guests || []).map((g: any) => 
          g.id === guestId ? { ...g, wantsScavenger: optIn } : g
        );

        await updateDoc(docRef, {
          "details.guests": updatedGuests
        });

        setEventData((prev: any) => ({
          ...prev,
          details: {
            ...prev.details,
            guests: updatedGuests
          }
        }));

        setWantsScavenger(optIn);
        setStatus('success');
      }
    } catch (error) {
      console.error("Opt-in Error:", error);
      alert("Failed to save your preference. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass p-12 rounded-3xl text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Invalid Link</h1>
          <p className="text-white/50">This invitation link seems to be broken or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-gradient-to-b from-[#0F172A] to-black">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {status === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 md:p-12 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="w-32 h-32 text-brand-primary" />
              </div>

              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold font-display mb-2">
                  Hi {guestName || 'there'}! 👋
                </h1>
                <p className="text-xl text-white/60 mb-10">
                  You've been invited to a <span className="text-brand-primary font-bold">{eventData.details?.type || 'special event'}</span>.
                </p>

                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-4 text-lg">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-white/40 uppercase tracking-widest font-bold">When</p>
                      <p className="font-medium">{new Date(eventData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-lg">
                    <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-brand-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-white/40 uppercase tracking-widest font-bold">Where</p>
                      <p className="font-medium">{eventData.details?.location || 'TBA'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRSVP('Attending')}
                    disabled={submitting}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-brand-primary text-white font-bold text-xl hover:scale-105 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8" />
                      I'm Coming!
                    </div>
                  </button>

                  <button
                    onClick={() => handleRSVP('Declined')}
                    disabled={submitting}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="w-8 h-8" />
                      Can't Make It
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'scavenger_opt_in' && (
            <motion.div
              key="scavenger_opt_in"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-12 rounded-[2rem] text-center border border-brand-primary/30 shadow-2xl"
            >
              <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Trophy className="w-12 h-12 text-brand-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Wait, there's more! 🏆</h1>
              <p className="text-xl text-white/60 mb-10">
                The host has organized a <span className="text-brand-primary font-bold">Crazy Scavenger Hunt</span> for this event! 
                Want to participate, earn points, and win rewards?
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleScavengerOptIn(true)}
                  disabled={submitting}
                  className="p-6 rounded-2xl bg-brand-primary text-white font-bold text-xl hover:scale-105 transition-all shadow-lg shadow-brand-primary/20"
                >
                  Yes, Count Me In! 🏹
                </button>
                <button
                  onClick={() => handleScavengerOptIn(false)}
                  disabled={submitting}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-xl hover:bg-white/10 hover:text-white transition-all"
                >
                  Maybe Next Time
                </button>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <div className="space-y-8">
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-12 rounded-[2rem] text-center border border-brand-primary/30 shadow-2xl shadow-brand-primary/10"
              >
                <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  {response === 'Attending' ? (
                    <CheckCircle2 className="w-12 h-12 text-brand-primary" />
                  ) : (
                    <XCircle className="w-12 h-12 text-white/40" />
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">
                  {response === 'Attending' ? "See you there! 🎉" : "We'll miss you! ❤️"}
                </h1>
                <p className="text-xl text-white/50">
                  {response === 'Attending' 
                    ? "Your response has been sent to the host. Get ready for an amazing time!" 
                    : "Thank you for letting us know. We hope to see you at the next one!"}
                </p>
                
                <button 
                  onClick={() => window.location.href = '/'}
                  className="mt-12 text-brand-primary font-bold hover:underline"
                >
                  Back to Home
                </button>
              </motion.div>

              {response === 'Attending' && wantsScavenger && eventData.details?.scavengerHunt?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-display">Join the Fun! 🏹</h2>
                    {!user && (
                      <p className="text-xs text-brand-primary font-bold animate-pulse">Login to earn points!</p>
                    )}
                  </div>
                  <ScavengerHuntSection 
                    eventId={bookingId || ''} 
                    missions={eventData.details.scavengerHunt}
                    currentUser={user ? { uid: user.uid, displayName: user.name || guestName || 'Guest', photoURL: user.photoURL || undefined } : undefined}
                  />
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

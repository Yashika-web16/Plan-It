import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Wallet, ListTodo, Users2, CheckCircle2, Circle, Mail, Trophy } from "lucide-react";
import { GlassCard, cn } from "./GlassCard";
import { BudgetItem, PlanItem, Guest } from "../types";
import { ScavengerHuntSection } from "./ScavengerHuntSection";
import { useAuth } from "../AuthContext";

interface PlanModalProps {
  bookingId: string;
  plan: {
    type: string;
    date: string;
    location: string;
    budget: string;
    guestCount: string;
    themes?: { name: string; description: string }[];
    budgetBreakdown?: BudgetItem[];
    checklist?: PlanItem[];
    guests?: Guest[];
    scavengerHunt?: any[];
  };
  onClose: () => void;
}

// PlanModal component for displaying detailed event plans
export const PlanModal = ({ bookingId, plan, onClose }: PlanModalProps) => {
  const { user } = useAuth();
  const guestInfo = plan.guests?.find(g => g.email === user?.email);
  const isParticipant = user?.uid === plan.guests?.find(g => g.email === user?.email)?.id || user?.uid === (plan as any).userId;
  const hasOptedIn = guestInfo?.wantsScavenger || user?.uid === (plan as any).userId;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <GlassCard className="h-full flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display capitalize">{plan.type} Plan</h2>
                <p className="text-sm text-white/50">{new Date(plan.date).toLocaleDateString()} • {plan.location}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Budget</p>
                <p className="text-xl font-bold text-brand-accent">₹{Number(plan.budget).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Guests</p>
                <p className="text-xl font-bold text-brand-secondary">{plan.guestCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Themes</p>
                <p className="text-xl font-bold text-brand-primary">{plan.themes?.length || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Tasks</p>
                <p className="text-xl font-bold text-white">{plan.checklist?.length || 0}</p>
              </div>
            </div>

            {/* Themes */}
            {plan.themes && plan.themes.length > 0 && (
              <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-primary" /> Suggested Themes
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {plan.themes.map((theme, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20">
                      <h4 className="font-bold text-brand-primary mb-1">{theme.name}</h4>
                      <p className="text-xs text-white/60">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Budget */}
              <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-brand-accent" /> Budget Breakdown (₹{(plan.budgetBreakdown?.reduce((acc, item) => acc + (Number(item.estimatedCost) || 0), 0) || 0).toLocaleString()})
                </h3>
                <div className="space-y-3">
                  {plan.budgetBreakdown?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm font-medium">{item.category}</p>
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase",
                          item.priority === 'High' ? "bg-red-500/20 text-red-500" :
                          item.priority === 'Medium' ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-green-500/20 text-green-500"
                        )}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-accent">₹{Number(item.estimatedCost).toLocaleString()}</p>
                        {item.cateringDetails && item.cateringDetails.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.cateringDetails.map((detail, di) => (
                              <p key={di} className="text-[8px] text-white/40">
                                {detail.type}: {detail.count} x ₹{detail.costPerPlate}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Checklist */}
              <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-brand-secondary" /> Checklist
                </h3>
                <div className="space-y-2">
                  {plan.checklist?.map((item, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      item.completed ? "bg-brand-primary/10 border-brand-primary/30 opacity-60" : "bg-white/5 border-white/10"
                    )}>
                      {item.completed ? <CheckCircle2 className="w-4 h-4 text-brand-primary" /> : <Circle className="w-4 h-4 text-white/30" />}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", item.completed && "line-through")}>{item.task}</p>
                        {item.timeline && <p className="text-[10px] text-white/40">{item.timeline}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {plan.guests && plan.guests.length > 0 && (
              <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-brand-accent" /> Guest List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.guests.map((guest, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold">
                          {guest.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{guest.name}</p>
                          <p className="text-[10px] text-white/40 flex items-center gap-1">
                            <Mail className="w-2 h-2" /> {guest.email}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[8px] px-2 py-1 rounded-full font-bold uppercase", 
                        guest.status === 'Attending' ? "bg-green-500/20 text-green-500" :
                        guest.status === 'Declined' ? "bg-red-500/20 text-red-500" :
                        "bg-brand-secondary/20 text-brand-secondary"
                      )}>
                        {guest.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Scavenger Hunt */}
            {plan.scavengerHunt && plan.scavengerHunt.length > 0 && (
              <section className="pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-display flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-brand-primary" /> Scavenger Hunt
                  </h3>
                  {guestInfo && (
                    <span className="text-xs text-brand-primary font-bold uppercase tracking-widest">
                      {hasOptedIn ? "Active Participant" : "Join the Hunt!"}
                    </span>
                  )}
                </div>

                {!hasOptedIn && guestInfo ? (
                  <div className="p-8 rounded-[2rem] bg-brand-primary/5 border border-brand-primary/20 text-center">
                    <Trophy className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                    <h4 className="text-xl font-bold mb-2">Join the Crazy Scavenger Hunt! 🏆</h4>
                    <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
                      Complete missions, earn points, and win exclusive rewards like event discounts!
                    </p>
                    <button 
                      onClick={() => window.location.href = `/rsvp/${bookingId}?guestId=${guestInfo.id}&name=${encodeURIComponent(guestInfo.name)}`}
                      className="btn-primary px-8"
                    >
                      Count Me In!
                    </button>
                  </div>
                ) : (
                  <ScavengerHuntSection 
                    eventId={bookingId}
                    missions={plan.scavengerHunt}
                    currentUser={user ? { uid: user.uid, displayName: user.name, photoURL: user.photoURL } : undefined}
                    isOrganizer={user?.uid === (plan as any).userId}
                  />
                )}
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
            <button 
              onClick={onClose}
              className="btn-primary px-8"
            >
              Close Plan
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Loader2, Calendar, MapPin, DollarSign, Users, Save, CheckCircle2, Circle, Plus, Trash2, ChevronRight, ListTodo, Wallet, Users2, Mail, Copy, Check } from "lucide-react";
import { GlassCard, cn } from "../components/GlassCard";
import { aiService } from "../services/aiService";
import { useAuth } from "../AuthContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useLocation } from "../LocationContext";
import { BudgetItem, PlanItem, Guest, ScavengerMission } from "../types";

import { InvitationGenerator } from "../components/InvitationGenerator";

export const PlanEvent = () => {
  const { user } = useAuth();
  const { selectedLocation } = useLocation();
  const [activeTab, setActiveTab] = useState<'details' | 'budget' | 'checklist' | 'guests' | 'scavenger'>('details');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hey! I'm your Plan-It assistant. What kind of event are we dreaming up today? ✨" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedBookingId, setSavedBookingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    type: 'wedding',
    date: '',
    budget: '',
    guestCount: '',
    location: selectedLocation || ''
  });

  const [themes, setThemes] = useState<{ name: string, description: string }[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetItem[]>([]);
  const [checklist, setChecklist] = useState<PlanItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [scavengerHunt, setScavengerHunt] = useState<ScavengerMission[]>([]);
  const [generatingHunt, setGeneratingHunt] = useState(false);

  useEffect(() => {
    if (selectedLocation) {
      setFormData(prev => ({ ...prev, location: selectedLocation }));
    }
  }, [selectedLocation]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await aiService.chatAssistant(userMsg, []);
      setMessages(prev => [...prev, { role: 'bot', text: response || "I'm not sure how to respond to that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Oops! My AI brain hit a snag. Try again? 😅" }]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = "Please select a date for your event.";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Event date cannot be in the past.";
      }
    }

    if (!formData.budget || isNaN(Number(formData.budget)) || Number(formData.budget) <= 0) {
      newErrors.budget = "Please enter a valid budget amount greater than 0.";
    } else if (Number(formData.budget) > 100000000) {
      newErrors.budget = "Budget seems too high. Please check again.";
    }

    if (!formData.guestCount || isNaN(Number(formData.guestCount)) || Number(formData.guestCount) <= 0) {
      newErrors.guestCount = "Please enter a valid number of guests.";
    } else if (Number(formData.guestCount) > 50000) {
      newErrors.guestCount = "Guest count seems too high for a standard event.";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Please enter a preferred location.";
    } else if (formData.location.trim().length < 3) {
      newErrors.location = "Location name is too short.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAiRecommendations = async () => {
    if (!validateForm()) {
      setMessages(prev => [...prev, { role: 'bot', text: "Please fix the errors in the details form before I can generate recommendations! 🧐" }]);
      return;
    }
    setAiAnalyzing(true);
    try {
      const plan = await aiService.getStructuredPlan(formData);
      if (plan.themes) setThemes(plan.themes);
      
      if (plan.budgetBreakdown) {
        const targetBudget = Number(formData.budget);
        const totalReturned = plan.budgetBreakdown.reduce((acc: number, item: any) => acc + (Number(item.estimatedCost) || 0), 0);
        
        let sanitizedBudget = plan.budgetBreakdown.map((item: any) => ({
          ...item,
          estimatedCost: Number(item.estimatedCost) || 0
        }));

        // If the AI hallucinated a different budget (more than 1% difference), normalize it
        if (totalReturned > 0 && Math.abs(totalReturned - targetBudget) > (targetBudget * 0.01)) {
          const ratio = targetBudget / totalReturned;
          sanitizedBudget = sanitizedBudget.map((item: any) => ({
            ...item,
            estimatedCost: Math.round(item.estimatedCost * ratio)
          }));
          
          // Adjust the last item to handle rounding errors
          const newTotal = sanitizedBudget.reduce((acc, item) => acc + item.estimatedCost, 0);
          const diff = targetBudget - newTotal;
          if (diff !== 0 && sanitizedBudget.length > 0) {
            sanitizedBudget[sanitizedBudget.length - 1].estimatedCost += diff;
          }
        }
        
        setBudgetBreakdown(sanitizedBudget);
      }
      
      if (plan.checklist) setChecklist(plan.checklist.map((item: any) => ({ ...item, completed: false })));
      
      setMessages(prev => [...prev, { role: 'bot', text: "I've generated a complete plan for you! Check the Budget and Checklist tabs. 🚀" }]);
      setActiveTab('budget');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message?.includes("Quota Exceeded") 
        ? error.message 
        : "I couldn't generate a structured plan. Let's keep chatting instead!";
      setMessages(prev => [...prev, { role: 'bot', text: errorMsg }]);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleGenerateScavengerHunt = async () => {
    if (!validateForm()) {
      alert("Please fill in the event details first!");
      return;
    }
    setGeneratingHunt(true);
    try {
      const hunt = await aiService.generateScavengerHunt(formData);
      setScavengerHunt(hunt.map((m: any) => ({ ...m, completed: false })));
      setMessages(prev => [...prev, { role: 'bot', text: "Boom! 💥 Your AI Scavenger Hunt is ready. Check the new tab!" }]);
      setActiveTab('scavenger');
    } catch (error: any) {
      console.error(error);
      alert("Failed to generate scavenger hunt. " + error.message);
    } finally {
      setGeneratingHunt(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user) {
      alert("Please login to save your plan!");
      return;
    }
    
    if (!validateForm()) {
      alert("Please fix the errors in the form before saving!");
      return;
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        type: 'plan',
        status: 'pending',
        totalAmount: Number(formData.budget) || 0,
        date: new Date(formData.date).toISOString(),
        details: {
          ...formData,
          themes,
          budgetBreakdown,
          checklist,
          guests,
          scavengerHunt
        },
        createdAt: new Date().toISOString()
      });
      setSavedBookingId(docRef.id);
      alert("Plan saved to your dashboard! 🚀");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "bookings");
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (index: number) => {
    const newList = [...checklist];
    newList[index].completed = !newList[index].completed;
    setChecklist(newList);
  };

  const addGuest = () => {
    const newGuest: Guest = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      email: "",
      status: "Pending"
    };
    setGuests([...guests, newGuest]);
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests(guests.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter(g => g.id !== id));
  };

  const toggleMission = (id: string) => {
    setScavengerHunt(scavengerHunt.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const handleSendInvite = async (guest: Guest) => {
    if (!guest.email || !guest.name) {
      alert("Please fill in the guest's name and email first!");
      return;
    }

    if (!savedBookingId) {
      alert("Please save your plan first to generate an RSVP link! 💾");
      return;
    }

    setSendingInvite(guest.id);
    try {
      const inviteText = await aiService.generateInvitation({
        ...formData,
        guestName: guest.name
      });

      const subject = `You're Invited: ${formData.type.toUpperCase()}! ✨`;
      const rsvpLink = `${window.location.origin}/rsvp/${savedBookingId}?guestId=${guest.id}&name=${encodeURIComponent(guest.name)}`;
      
      // Call server-side API for real email sending
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guest.email,
          name: guest.name,
          subject: subject,
          body: inviteText,
          rsvpLink: rsvpLink
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }
      
      // Update status
      updateGuest(guest.id, { status: 'Invited', invitedAt: new Date().toISOString() });
      alert(`Invitation sent successfully to ${guest.name}! 💌`);
    } catch (error: any) {
      console.error("Invite error:", error);
      alert(`Failed to send invite: ${error.message}. Make sure RESEND_API_KEY is configured in settings.`);
    } finally {
      setSendingInvite(null);
    }
  };

  const handleCopyInviteLink = (guest: Guest) => {
    if (!savedBookingId) {
      alert("Please save your plan first to generate an RSVP link! 💾");
      return;
    }

    const rsvpLink = `${window.location.origin}/rsvp/${savedBookingId}?guestId=${guest.id}&name=${encodeURIComponent(guest.name)}`;
    
    // Fallback for clipboard copying
    try {
      navigator.clipboard.writeText(rsvpLink).then(() => {
        setCopiedId(guest.id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        // Manual fallback
        const textArea = document.createElement("textarea");
        textArea.value = rsvpLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(guest.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    } catch (err) {
      console.error('Clipboard API error: ', err);
    }
  };

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Planning Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="mb-8">
            <h1 className="text-5xl font-bold font-display mb-4">Start Your <span className="text-gradient">Plan</span></h1>
            <p className="text-white/50">Fill in the details and let our AI suggest the perfect venues and themes.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1.5 glass rounded-full w-fit overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: 'details', icon: Sparkles, label: 'Details' },
              { id: 'budget', icon: Wallet, label: 'Budget' },
              { id: 'checklist', icon: ListTodo, label: 'Checklist' },
              { id: 'guests', icon: Users2, label: 'Guests' },
              { id: 'scavenger', icon: Bot, label: 'Scavenger Hunt' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                  activeTab === tab.id ? "bg-white text-black shadow-lg" : "hover:bg-white/5 text-white/40"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GlassCard className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-primary" /> Event Type
                      </label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors"
                      >
                        <option value="wedding">Wedding</option>
                        <option value="birthday">Birthday Party</option>
                        <option value="corporate">Corporate Summit</option>
                        <option value="concert">Concert / Fest</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-secondary" /> Date
                      </label>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => {
                          setFormData({ ...formData, date: e.target.value });
                          if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
                        }}
                        className={cn(
                          "w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors",
                          errors.date ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-brand-secondary"
                        )} 
                      />
                      {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-brand-accent" /> Budget (₹)
                      </label>
                      <input 
                        type="number" 
                        placeholder="e.g. 50000" 
                        value={formData.budget}
                        onChange={(e) => {
                          setFormData({ ...formData, budget: e.target.value });
                          if (errors.budget) setErrors(prev => ({ ...prev, budget: "" }));
                        }}
                        className={cn(
                          "w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors",
                          errors.budget ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-brand-accent"
                        )} 
                      />
                      {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                        <Users className="w-4 h-4 text-white" /> Guest Count
                      </label>
                      <input 
                        type="number" 
                        placeholder="e.g. 100" 
                        value={formData.guestCount}
                        onChange={(e) => {
                          setFormData({ ...formData, guestCount: e.target.value });
                          if (errors.guestCount) setErrors(prev => ({ ...prev, guestCount: "" }));
                        }}
                        className={cn(
                          "w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors",
                          errors.guestCount ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white"
                        )} 
                      />
                      {errors.guestCount && <p className="text-red-500 text-xs mt-1">{errors.guestCount}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-primary" /> Preferred Location
                    </label>
                    <input 
                      type="text" 
                      placeholder="City, Area" 
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                        if (errors.location) setErrors(prev => ({ ...prev, location: "" }));
                      }}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors",
                        errors.location ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-brand-primary"
                      )} 
                    />
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={handleAiRecommendations}
                      disabled={aiAnalyzing}
                      className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-3"
                    >
                      {aiAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      AI Recommendations
                    </button>
                    <button 
                      onClick={handleSavePlan}
                      disabled={saving}
                      className="btn-secondary px-8 flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save Plan
                    </button>
                  </div>
                </GlassCard>

                {themes.length > 0 && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {themes.map((theme, i) => (
                      <GlassCard key={i} className="p-4 border-brand-primary/20">
                        <h4 className="font-bold text-brand-primary mb-2">{theme.name}</h4>
                        <p className="text-xs text-white/60">{theme.description}</p>
                      </GlassCard>
                    ))}
                  </div>
                )}

                <InvitationGenerator eventDetails={formData} />
              </motion.div>
            )}

            {activeTab === 'budget' && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-brand-accent" /> Budget Breakdown
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-white/50 uppercase tracking-wider">Total Estimated</p>
                      <p className="text-2xl font-bold text-brand-secondary">
                        ₹{budgetBreakdown.reduce((acc, item) => acc + (Number(item.estimatedCost) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {budgetBreakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <span className={cn(
                            "mono-tag mt-2 inline-block",
                            item.priority === 'High' ? "text-red-400 border-red-400/20 bg-red-400/5" :
                            item.priority === 'Medium' ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" :
                            "text-green-400 border-green-400/20 bg-green-400/5"
                          )}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-accent">₹{Number(item.estimatedCost).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {budgetBreakdown.length === 0 && (
                      <div className="text-center py-10 text-white/40">
                        Use AI Recommendations to generate a budget breakdown!
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'checklist' && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-brand-primary" /> Planning Checklist
                  </h3>
                  <div className="space-y-3">
                    {checklist.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => toggleChecklistItem(i)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                          item.completed ? "bg-brand-primary/10 border-brand-primary/30 opacity-60" : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        {item.completed ? <CheckCircle2 className="w-5 h-5 text-brand-primary" /> : <Circle className="w-5 h-5 text-white/30" />}
                        <div className="flex-1">
                          <p className={cn("font-medium", item.completed && "line-through")}>{item.task}</p>
                          {item.timeline && <p className="text-xs text-white/40">{item.timeline}</p>}
                        </div>
                      </button>
                    ))}
                    {checklist.length === 0 && (
                      <div className="text-center py-10 text-white/40">
                        Your AI-powered checklist will appear here.
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'guests' && (
              <motion.div
                key="guests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Users2 className="w-5 h-5 text-brand-secondary" /> Guest List
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSavePlan} 
                        disabled={saving}
                        className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 border-brand-primary/30"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Plan
                      </button>
                      <button onClick={addGuest} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Guest
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {guests.map((guest) => (
                      <div key={guest.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4 group relative">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Guest Name</label>
                            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                              <User className="w-4 h-4 text-brand-secondary" />
                              <input 
                                type="text" 
                                value={guest.name} 
                                onChange={(e) => updateGuest(guest.id, { name: e.target.value })} 
                                placeholder="Full Name" 
                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full" 
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Email Address</label>
                            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                              <Mail className="w-4 h-4 text-brand-primary" />
                              <input 
                                type="email" 
                                value={guest.email} 
                                onChange={(e) => updateGuest(guest.id, { email: e.target.value })} 
                                placeholder="email@example.com" 
                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "mono-tag", 
                              guest.status === 'Invited' ? "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5" : ""
                            )}>
                              {guest.status}
                            </span>
                            {guest.invitedAt && (
                              <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest">
                                Sent {new Date(guest.invitedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleSendInvite(guest)} 
                                  disabled={sendingInvite === guest.id} 
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase hover:bg-brand-primary hover:text-white transition-all"
                                >
                                  {sendingInvite === guest.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} 
                                  Send Invite
                                </button>
                                <button 
                                  onClick={() => handleCopyInviteLink(guest)} 
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                                    copiedId === guest.id ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                                  )}
                                >
                                  {copiedId === guest.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} 
                                  {copiedId === guest.id ? "Copied!" : "Copy Link"}
                                </button>
                              </div>
                              <p className="text-[8px] text-white/20 text-center max-w-[200px]">
                                * Sandbox: Only verified emails can receive. Use "Copy Link" for others.
                              </p>
                            </div>
                            <button 
                              onClick={() => removeGuest(guest.id)} 
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {guests.length === 0 && (
                      <div className="text-center py-10 text-white/40">
                        No guests added yet. Click "Add Guest" to start!
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
            {activeTab === 'scavenger' && (
              <motion.div
                key="scavenger"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Bot className="w-6 h-6 text-brand-primary" /> AI Scavenger Hunt
                      </h3>
                      <p className="text-white/40 text-sm mt-1">Gamify your event with AI-generated missions!</p>
                    </div>
                    <button 
                      onClick={handleGenerateScavengerHunt}
                      disabled={generatingHunt}
                      className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
                    >
                      {generatingHunt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {scavengerHunt.length > 0 ? "Regenerate" : "Generate Hunt"}
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {scavengerHunt.map((mission) => (
                      <button
                        key={mission.id}
                        onClick={() => toggleMission(mission.id)}
                        className={cn(
                          "w-full flex items-center gap-6 p-6 rounded-[2rem] border transition-all text-left group",
                          mission.completed ? "bg-brand-primary/10 border-brand-primary/30 opacity-60" : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                          mission.completed ? "bg-brand-primary text-white" : "bg-white/5 text-white/20 group-hover:bg-white/10"
                        )}>
                          {mission.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={cn("text-lg font-bold", mission.completed && "line-through text-white/40")}>{mission.mission}</h4>
                            <span className="mono-tag text-[10px]">{mission.points} PTS</span>
                          </div>
                          <p className="text-sm text-white/40 leading-relaxed">{mission.description}</p>
                        </div>
                      </button>
                    ))}

                    {scavengerHunt.length === 0 && !generatingHunt && (
                      <div className="text-center py-20 bento-card border-dashed border-white/10">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                          <Bot className="w-8 h-8 text-white/20" />
                        </div>
                        <h4 className="text-xl font-bold mb-2">No Hunt Generated</h4>
                        <p className="text-white/40 max-w-xs mx-auto mb-8">Let our AI create a custom scavenger hunt based on your event theme and location.</p>
                        <button 
                          onClick={handleGenerateScavengerHunt}
                          className="btn-primary py-3 px-8"
                        >
                          Generate Now
                        </button>
                      </div>
                    )}

                    {generatingHunt && (
                      <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-6" />
                        <h4 className="text-xl font-bold mb-2">Creating your adventure...</h4>
                        <p className="text-white/40">Our AI is brainstorming fun missions for your guests.</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Chatbot */}
        <div className="lg:col-span-1">
          <GlassCard className="h-[600px] flex flex-col p-0 overflow-hidden sticky top-32">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Plan-It AI</h3>
                <p className="text-xs text-brand-secondary">Online & Ready</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                      msg.role === 'bot' ? "bg-brand-primary" : "bg-white/10"
                    )}>
                      {msg.role === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm",
                      msg.role === 'bot' ? "glass-dark" : "bg-brand-secondary text-black font-medium"
                    )}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl glass-dark text-sm">Thinking...</div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

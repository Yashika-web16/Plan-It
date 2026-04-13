import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Loader2, Calendar, MapPin, DollarSign, Users, Save, CheckCircle2, Circle, Plus, Trash2, ChevronRight, ListTodo, Wallet, Users2, Mail, Copy, Check, Trophy } from "lucide-react";
import { GlassCard, cn } from "../components/GlassCard";
import { aiService } from "../services/aiService";
import { useAuth } from "../AuthContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, doc, updateDoc, query, where, orderBy, onSnapshot, getDoc } from "firebase/firestore";
import { useLocation } from "../LocationContext";
import { BudgetItem, PlanItem, Guest, ScavengerMission, ScavengerSubmission, CateringPlateDetail } from "../types";
import { useParams, useNavigate } from "react-router-dom";

import { InvitationGenerator } from "../components/InvitationGenerator";
import { ScavengerHuntSection } from "../components/ScavengerHuntSection";

export const PlanEvent = () => {
  const { user } = useAuth();
  const { bookingId: paramBookingId } = useParams();
  const navigate = useNavigate();
  const { selectedLocation } = useLocation();
  const [activeTab, setActiveTab] = useState<'details' | 'budget' | 'checklist' | 'guests' | 'scavenger' | 'submissions'>('details');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hey! I'm your Plan-It assistant. What kind of event are we dreaming up today? ✨" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedBookingId, setSavedBookingId] = useState<string | null>(paramBookingId || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allSubmissions, setAllSubmissions] = useState<ScavengerSubmission[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(!!paramBookingId);

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
    if (selectedLocation && !paramBookingId) {
      setFormData(prev => ({ ...prev, location: selectedLocation }));
    }
  }, [selectedLocation, paramBookingId]);

  // Load existing booking
  useEffect(() => {
    if (!paramBookingId) return;

    const fetchBooking = async () => {
      try {
        const docRef = doc(db, "bookings", paramBookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Ownership check: Only the organizer can edit
          if (user && data.userId !== user.uid) {
            alert("You don't have permission to edit this plan. Only the organizer can make changes.");
            navigate('/dashboard');
            return;
          }

          setFormData({
            type: data.details.type,
            date: data.date.split('T')[0],
            budget: data.details.budget,
            guestCount: data.details.guestCount,
            location: data.details.location
          });
          setThemes(data.details.themes || []);
          setBudgetBreakdown(data.details.budgetBreakdown || []);
          setChecklist(data.details.checklist || []);
          setGuests(data.details.guests || []);
          setScavengerHunt(data.details.scavengerHunt || []);
          setMessages([{ role: 'bot', text: `Welcome back! I've loaded your ${data.details.type} plan. What would you like to adjust? 🛠️` }]);
        }
      } catch (error) {
        console.error("Error loading booking:", error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchBooking();
  }, [paramBookingId]);

  // Listen for real-time updates (especially for guests)
  useEffect(() => {
    if (!savedBookingId) return;

    const unsubscribe = onSnapshot(doc(db, "bookings", savedBookingId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGuests(data.details.guests || []);
      }
    });

    return () => unsubscribe();
  }, [savedBookingId]);

  useEffect(() => {
    if (!savedBookingId) return;
    
    const q = query(
      collection(db, 'scavenger_submissions'),
      where('eventId', '==', savedBookingId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScavengerSubmission)));
    });

    return () => unsubscribe();
  }, [savedBookingId]);

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, 'scavenger_submissions', submissionId), {
        status: 'approved'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'scavenger_submissions');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, 'scavenger_submissions', submissionId), {
        status: 'rejected'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'scavenger_submissions');
    }
  };

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

  const savePlanCore = async (silent = false) => {
    if (!user) {
      if (!silent) alert("Please login to save your plan!");
      return null;
    }
    
    if (!validateForm()) {
      if (!silent) alert("Please fix the errors in the form before saving!");
      return null;
    }

    setSaving(true);
    try {
      const bookingData = {
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
        updatedAt: new Date().toISOString()
      };

      if (savedBookingId) {
        await updateDoc(doc(db, "bookings", savedBookingId), bookingData);
        if (!silent) alert("Plan updated successfully! 🚀");
        return savedBookingId;
      } else {
        const docRef = await addDoc(collection(db, "bookings"), {
          ...bookingData,
          participantIds: [user.uid],
          createdAt: new Date().toISOString()
        });
        setSavedBookingId(docRef.id);
        if (!silent) alert("Plan saved to your dashboard! 🚀");
        return docRef.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "bookings");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = () => savePlanCore(false);

  const removeBudgetItem = (index: number) => {
    setBudgetBreakdown(prev => prev.filter((_, i) => i !== index));
  };

  const addBudgetItem = () => {
    setBudgetBreakdown(prev => [...prev, { category: "New Item", estimatedCost: 0, priority: 'Medium' }]);
  };

  const updateBudgetItem = (index: number, updates: Partial<BudgetItem>) => {
    setBudgetBreakdown(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const addCateringDetail = (itemIndex: number) => {
    setBudgetBreakdown(prev => {
      const newBreakdown = [...prev];
      const item = { ...newBreakdown[itemIndex] };
      if (!item.cateringDetails) item.cateringDetails = [];
      item.cateringDetails = [...item.cateringDetails, { type: 'Veg', count: 0, costPerPlate: 0 }];
      newBreakdown[itemIndex] = item;
      return newBreakdown;
    });
  };

  const updateCateringDetail = (itemIndex: number, detailIndex: number, updates: Partial<CateringPlateDetail>) => {
    setBudgetBreakdown(prev => {
      const newBreakdown = [...prev];
      const item = { ...newBreakdown[itemIndex] };
      if (!item.cateringDetails) return prev;
      const newDetails = [...item.cateringDetails];
      newDetails[detailIndex] = { ...newDetails[detailIndex], ...updates };
      item.cateringDetails = newDetails;
      
      // Recalculate total for this item if it's catering
      item.estimatedCost = newDetails.reduce((acc, d) => acc + (Number(d.count) * Number(d.costPerPlate)), 0);
      
      newBreakdown[itemIndex] = item;
      return newBreakdown;
    });
  };

  const removeCateringDetail = (itemIndex: number, detailIndex: number) => {
    setBudgetBreakdown(prev => {
      const newBreakdown = [...prev];
      const item = { ...newBreakdown[itemIndex] };
      if (!item.cateringDetails) return prev;
      item.cateringDetails = item.cateringDetails.filter((_, i) => i !== detailIndex);
      item.estimatedCost = item.cateringDetails.reduce((acc, d) => acc + (Number(d.count) * Number(d.costPerPlate)), 0);
      newBreakdown[itemIndex] = item;
      return newBreakdown;
    });
  };

  const toggleChecklistItem = (index: number) => {
    setChecklist(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], completed: !newList[index].completed };
      return newList;
    });
  };

  const addGuest = () => {
    const newGuest: Guest = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      email: "",
      status: "Pending"
    };
    setGuests(prev => [...prev, newGuest]);
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const toggleMission = (id: string) => {
    setScavengerHunt(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const handleSendInvite = async (guest: Guest) => {
    if (!guest.email || !guest.name) {
      alert("Please fill in the guest's name and email first!");
      return;
    }

    // Auto-save before sending to ensure the guest ID exists in the DB
    const currentId = await savePlanCore(true);
    if (!currentId) return;

    setSendingInvite(guest.id);
    try {
      const inviteText = await aiService.generateInvitation({
        ...formData,
        guestName: guest.name
      });

      const subject = `You're Invited: ${formData.type.toUpperCase()}! ✨`;
      const rsvpLink = `${window.location.origin}/rsvp/${currentId}?guestId=${guest.id}&name=${encodeURIComponent(guest.name)}`;
      
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

  const handleCopyInviteLink = async (guest: Guest) => {
    // Auto-save before copying to ensure the guest ID exists in the DB
    const currentId = await savePlanCore(true);
    if (!currentId) return;

    const rsvpLink = `${window.location.origin}/rsvp/${currentId}?guestId=${guest.id}&name=${encodeURIComponent(guest.name)}`;
    
    // Fallback for clipboard copying
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(rsvpLink);
        setCopiedId(guest.id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        // Manual fallback
        const textArea = document.createElement("textarea");
        textArea.value = rsvpLink;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopiedId(guest.id);
          setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
      }
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
              { id: 'scavenger', icon: Bot, label: 'Scavenger Hunt' },
              { id: 'submissions', icon: CheckCircle2, label: 'Submissions' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all relative",
                  activeTab === tab.id ? "bg-white text-black shadow-lg" : "hover:bg-white/5 text-white/40"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'submissions' && allSubmissions.filter(s => s.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded-full animate-pulse">
                    {allSubmissions.filter(s => s.status === 'pending').length}
                  </span>
                )}
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
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-white/50 uppercase tracking-wider">Total Estimated</p>
                        <p className="text-2xl font-bold text-brand-secondary">
                          ₹{budgetBreakdown.reduce((acc, item) => acc + (Number(item.estimatedCost) || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={addBudgetItem} 
                        className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {budgetBreakdown.map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input 
                              type="text"
                              value={item.category}
                              onChange={(e) => updateBudgetItem(i, { category: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                              placeholder="Category Name"
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                              <input 
                                type="number"
                                value={item.estimatedCost}
                                onChange={(e) => updateBudgetItem(i, { estimatedCost: Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                                placeholder="Cost"
                                disabled={!!item.cateringDetails && item.cateringDetails.length > 0}
                              />
                            </div>
                            <select 
                              value={item.priority}
                              onChange={(e) => updateBudgetItem(i, { priority: e.target.value as any })}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                            >
                              <option value="High">High Priority</option>
                              <option value="Medium">Medium Priority</option>
                              <option value="Low">Low Priority</option>
                            </select>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeBudgetItem(i)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Detailed Catering Breakdown */}
                        {(item.category.toLowerCase().includes('catering') || item.category.toLowerCase().includes('food')) && (
                          <div className="pl-4 border-l-2 border-brand-primary/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand-primary">Per Plate Breakdown</h4>
                              <button 
                                type="button"
                                onClick={() => addCateringDetail(i)}
                                className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 uppercase tracking-widest"
                              >
                                <Plus className="w-3 h-3" /> Add Plate Type
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {item.cateringDetails?.map((detail, di) => (
                                <div key={di} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                  <select 
                                    value={detail.type}
                                    onChange={(e) => updateCateringDetail(i, di, { type: e.target.value as any })}
                                    className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                                  >
                                    <option value="Veg">Veg</option>
                                    <option value="Non-Veg">Non-Veg</option>
                                    <option value="Kids">Kids</option>
                                    <option value="Adults">Adults</option>
                                    <option value="Aged">Aged</option>
                                  </select>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/20">Qty</span>
                                    <input 
                                      type="number"
                                      value={detail.count}
                                      onChange={(e) => updateCateringDetail(i, di, { count: Number(e.target.value) })}
                                      className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                                      placeholder="Count"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/20">₹/Plate</span>
                                    <input 
                                      type="number"
                                      value={detail.costPerPlate}
                                      onChange={(e) => updateCateringDetail(i, di, { costPerPlate: Number(e.target.value) })}
                                      className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                                      placeholder="Price"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-brand-accent">₹{(detail.count * detail.costPerPlate).toLocaleString()}</span>
                                    <button 
                                      type="button"
                                      onClick={() => removeCateringDetail(i, di)}
                                      className="p-1 text-white/20 hover:text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(!item.cateringDetails || item.cateringDetails.length === 0) && (
                                <p className="text-[10px] text-white/20 italic">No detailed breakdown added yet.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {budgetBreakdown.length === 0 && (
                      <div className="text-center py-10 text-white/40">
                        Use AI Recommendations to generate a budget breakdown or add items manually!
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
                              guest.status === 'Invited' ? "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5" : 
                              guest.status === 'Attending' ? "text-green-400 border-green-400/20 bg-green-400/5" :
                              guest.status === 'Declined' ? "text-red-400 border-red-400/20 bg-red-400/5" :
                              ""
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
                {scavengerHunt.length > 0 ? (
                  <ScavengerHuntSection 
                    eventId={savedBookingId || ''} 
                    missions={scavengerHunt} 
                    currentUser={user ? { uid: user.uid, displayName: user.name || 'Organizer', photoURL: user.photoURL || undefined } : undefined}
                    isOrganizer={true}
                  />
                ) : (
                  <GlassCard className="p-6 text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <Bot className="w-8 h-8 text-white/20" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">No Hunt Generated</h4>
                    <p className="text-white/40 max-w-xs mx-auto mb-8">Let our AI create a custom scavenger hunt based on your event theme and location.</p>
                    <button 
                      onClick={handleGenerateScavengerHunt}
                      disabled={generatingHunt}
                      className="btn-primary py-3 px-8 flex items-center gap-2 mx-auto"
                    >
                      {generatingHunt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate Now
                    </button>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeTab === 'submissions' && (
              <motion.div
                key="submissions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary" /> Guest Submissions
                  </h3>
                  
                  <div className="space-y-4">
                    {allSubmissions.map((sub) => (
                      <div key={sub.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                              {sub.userPhoto ? <img src={sub.userPhoto} alt={sub.userName} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white/20" />}
                            </div>
                            <div>
                              <p className="font-bold">{sub.userName}</p>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                Mission: {scavengerHunt.find(m => m.id === sub.missionId)?.mission || 'Unknown Mission'}
                              </p>
                            </div>
                          </div>
                          <span className={cn(
                            "mono-tag",
                            sub.status === 'approved' ? "text-green-400 border-green-400/20 bg-green-400/5" :
                            sub.status === 'rejected' ? "text-red-400 border-red-400/20 bg-red-400/5" :
                            "text-yellow-400 border-yellow-400/20 bg-yellow-400/5"
                          )}>
                            {sub.status}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                          <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-2">Proof ({sub.proofType})</p>
                          {sub.proofType === 'image' ? (
                            <img src={sub.proofValue} alt="Proof" className="max-w-full h-auto rounded-xl border border-white/10" referrerPolicy="no-referrer" />
                          ) : (
                            <p className="text-sm text-white/70 italic">"{sub.proofValue}"</p>
                          )}
                        </div>

                        {sub.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => handleApproveSubmission(sub.id)}
                              className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-500 text-xs font-bold uppercase hover:bg-green-500 hover:text-white transition-all"
                            >
                              Approve & Award {sub.pointsAwarded} PTS
                            </button>
                            <button 
                              onClick={() => handleRejectSubmission(sub.id)}
                              className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-500 text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {allSubmissions.length === 0 && (
                      <div className="text-center py-20 text-white/20">
                        No submissions yet. Invite guests to start the hunt! 🏹
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

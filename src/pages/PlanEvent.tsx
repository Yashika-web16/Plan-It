import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Loader2, Calendar, MapPin, DollarSign, Users, Save, CheckCircle2, Circle, Plus, Trash2, ChevronRight, ListTodo, Wallet, Users2 } from "lucide-react";
import { GlassCard, cn } from "../components/GlassCard";
import { aiService } from "../services/aiService";
import { useAuth } from "../AuthContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useLocation } from "../LocationContext";
import { BudgetItem, PlanItem, Guest } from "../types";

import { InvitationGenerator } from "../components/InvitationGenerator";

export const PlanEvent = () => {
  const { user } = useAuth();
  const { selectedLocation } = useLocation();
  const [activeTab, setActiveTab] = useState<'details' | 'budget' | 'checklist' | 'guests'>('details');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hey! I'm your Plan-It assistant. What kind of event are we dreaming up today? ✨" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
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

  useEffect(() => {
    if (selectedLocation) {
      setFormData(prev => ({ ...prev, location: selectedLocation }));
    }
  }, [selectedLocation]);

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
        const sanitizedBudget = plan.budgetBreakdown.map((item: any) => ({
          ...item,
          estimatedCost: Number(item.estimatedCost) || 0
        }));
        setBudgetBreakdown(sanitizedBudget);
      }
      
      if (plan.checklist) setChecklist(plan.checklist.map((item: any) => ({ ...item, completed: false })));
      
      setMessages(prev => [...prev, { role: 'bot', text: "I've generated a complete plan for you! Check the Budget and Checklist tabs. 🚀" }]);
      setActiveTab('budget');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "I couldn't generate a structured plan. Let's keep chatting instead!" }]);
    } finally {
      setAiAnalyzing(false);
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
      await addDoc(collection(db, "bookings"), {
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
          guests
        },
        createdAt: new Date().toISOString()
      });
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
    setGuests([...guests, { name: "New Guest", status: "Pending" }]);
  };

  const removeGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
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
          <div className="flex gap-2 p-1 glass rounded-2xl w-fit">
            {[
              { id: 'details', icon: Sparkles, label: 'Details' },
              { id: 'budget', icon: Wallet, label: 'Budget' },
              { id: 'checklist', icon: ListTodo, label: 'Checklist' },
              { id: 'guests', icon: Users2, label: 'Guests' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id ? "bg-brand-primary text-white shadow-lg" : "hover:bg-white/5 text-white/60"
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
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                            item.priority === 'High' ? "bg-red-500/20 text-red-500" :
                            item.priority === 'Medium' ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-green-500/20 text-green-500"
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
                    <button onClick={addGuest} className="btn-secondary py-2 px-4 text-xs flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Guest
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {guests.map((guest, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group">
                        <div className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold">
                          {guest.name[0]}
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={guest.name}
                            onChange={(e) => {
                              const newGuests = [...guests];
                              newGuests[i].name = e.target.value;
                              setGuests(newGuests);
                            }}
                            className="bg-transparent border-none focus:ring-0 p-0 font-medium w-full"
                          />
                          <p className="text-xs text-white/40">{guest.status}</p>
                        </div>
                        <button onClick={() => removeGuest(i)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {guests.length === 0 && (
                      <div className="text-center py-10 text-white/40">
                        Start adding guests to your event!
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
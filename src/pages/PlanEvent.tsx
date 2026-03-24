import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Loader2, Calendar, MapPin, DollarSign, Users, Save } from "lucide-react";
import { GlassCard, cn } from "../components/GlassCard";
import { aiService } from "../services/aiService";
import { useAuth } from "../AuthContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useLocation } from "../LocationContext";

import { InvitationGenerator } from "../components/InvitationGenerator";

export const PlanEvent = () => {
  const { user } = useAuth();
  const { selectedLocation } = useLocation();
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hey! I'm your Plan-It assistant. What kind of event are we dreaming up today? ✨" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const [formData, setFormData] = useState({
    type: 'wedding',
    date: '',
    budget: '',
    guestCount: '',
    location: selectedLocation || ''
  });

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
      
      // Try to extract event details from AI response
      if (response) {
        const lowerResponse = response.toLowerCase();
        if (lowerResponse.includes("budget") || lowerResponse.includes("guest") || lowerResponse.includes("location")) {
          // In a real app, we'd use a structured output from the LLM
          // For now, let's just simulate AI helping fill the form
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Oops! My AI brain hit a snag. Try again? 😅" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAiRecommendations = async () => {
    setAiAnalyzing(true);
    try {
      const prompt = `Based on these event details: Type: ${formData.type}, Date: ${formData.date}, Budget: ${formData.budget}, Guests: ${formData.guestCount}, Location: ${formData.location}. Suggest 3 unique themes and a brief planning checklist.`;
      const response = await aiService.chatAssistant(prompt, []);
      setMessages(prev => [...prev, { role: 'bot', text: response || "I've analyzed your plan! Here are some thoughts..." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user) {
      alert("Please login to save your plan!");
      return;
    }
    if (!formData.date || !formData.location) {
      alert("Please fill in the date and location!");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        type: 'venue',
        status: 'pending',
        totalAmount: Number(formData.budget) || 0,
        date: new Date(formData.date).toISOString(),
        details: formData,
        createdAt: new Date().toISOString()
      });
      alert("Plan saved to your dashboard! 🚀");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "bookings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Planning Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="mb-8">
            <h1 className="text-5xl font-bold font-display mb-4">Start Your <span className="text-gradient">Plan</span></h1>
            <p className="text-white/50">Fill in the details and let our AI suggest the perfect venues and themes.</p>
          </div>
          
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
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-secondary transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-brand-accent" /> Budget ($)
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" /> Guest Count
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 100" 
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors" 
                />
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
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors" 
              />
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

          <InvitationGenerator eventDetails={formData} />
        </div>

        {/* AI Chatbot */}
        <div className="lg:col-span-1">
          <GlassCard className="h-[600px] flex flex-col p-0 overflow-hidden">
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

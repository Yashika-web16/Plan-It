import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Sparkles, Layout, LogIn, LogOut, User as UserIcon, ChevronDown, Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./GlassCard";
import { useAuth } from "../AuthContext";
import { useLocation } from "../LocationContext";
import { useTheme, ThemeType } from "../ThemeContext";

const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Goa", "Pune", "Udaipur", "Jodhpur", "Hyderabad", "Agra"];

const THEMES: { id: ThemeType; label: string; color: string }[] = [
  { id: 'vibrant', label: 'Vibrant Pink', color: '#f472b6' },
  { id: 'sunset', label: 'Sunset Orange', color: '#f97316' },
  { id: 'emerald', label: 'Emerald Green', color: '#10b981' },
  { id: 'midnight', label: 'Midnight Blue', color: '#6366f1' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#00ff00' },
];

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const { selectedLocation, setSelectedLocation } = useLocation();
  const { theme, setTheme } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 px-6">
      <div className="max-w-5xl mx-auto glass rounded-full px-8 py-3 flex items-center justify-between border-white/[0.05]">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_var(--glow-1)]">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">Plan-It</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/40">
            <Link to="/discover" className="hover:text-white transition-colors">Discover</Link>
            <Link to="/vendors" className="hover:text-white transition-colors flex items-center gap-2">
              Vendor Search
            </Link>
            <Link to="/plan" className="hover:text-white transition-colors">Plan Event</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Theme Switcher */}
          <div className="relative">
            <button 
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
              title="Change Theme"
            >
              <Palette className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isThemeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 p-3 glass rounded-2xl min-w-[200px] shadow-2xl z-[60]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 px-2">Select Mood</p>
                  <div className="space-y-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setIsThemeOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left",
                          theme === t.id ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm" 
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-xs font-medium">{t.label}</span>
                        </div>
                        {theme === t.id && <Check className="w-3 h-3 text-brand-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer group relative">
            <MapPin className="w-3.5 h-3.5 text-white/40" />
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer appearance-none pr-6"
            >
              <option value="" className="bg-obsidian">Global</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc} className="bg-obsidian">{loc}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-3 pointer-events-none text-white/20 group-hover:text-white transition-colors" />
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
                  <Layout className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => logout()}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => login()}
                className="btn-primary py-2 px-6 text-xs uppercase tracking-widest"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

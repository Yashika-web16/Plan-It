import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Sparkles, Layout, LogIn, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../AuthContext";
import { useLocation } from "../LocationContext";

const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Goa", "Pune", "Udaipur", "Jodhpur", "Hyderabad", "Agra"];

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const { selectedLocation, setSelectedLocation } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">Plan-It</span>
          </Link>

          <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-brand-primary transition-colors cursor-pointer group relative">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-brand-primary" />
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-[10px] md:text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer appearance-none pr-5 md:pr-6"
            >
              <option value="" className="bg-[#0F172A]">Global</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc} className="bg-[#0F172A]">{loc}</option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3 absolute right-2 md:right-3 pointer-events-none text-white/40 group-hover:text-white transition-colors" />
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/discover" className="hover:text-brand-primary transition-colors">Discover</Link>
          <Link to="/vendors" className="hover:text-brand-accent transition-colors flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Vendor Search
          </Link>
          <Link to="/plan" className="hover:text-brand-secondary transition-colors">Plan Event</Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                <Layout className="w-4 h-4" /> Dashboard
              </Link>
              <button 
                onClick={() => logout()}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => login()}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

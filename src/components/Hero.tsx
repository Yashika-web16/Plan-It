import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "./GlassCard";

export const Hero = () => {
  return (
    <section className="relative pt-40 pb-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass text-[10px] font-bold uppercase tracking-widest mb-10 border-white/10">
            <Sparkles className="w-3 h-3 text-brand-primary" />
            <span className="text-white/60">AI-Powered Event Planning</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold font-display leading-[0.9] mb-10 tracking-tighter">
            Plan Your <br />
            <span className="text-gradient">Dream Event</span> <br />
            Effortlessly.
          </h1>
          
          <p className="text-lg md:text-xl text-white/40 mb-12 max-w-2xl mx-auto leading-relaxed">
            The all-in-one AI platform for modern event planning. Find vendors, manage budgets, and design experiences in seconds.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/discover" className="btn-primary flex items-center gap-3">
              Explore Events <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/vendors" className="btn-secondary flex items-center gap-3">
              Find Vendors <MapPin className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--glow-1)] rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--glow-2)] rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />
    </section>
  );
};

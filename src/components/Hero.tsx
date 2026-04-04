import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "./GlassCard";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-brand-accent" />
            <span className="text-brand-accent">AI-Powered Event Planning</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold font-display leading-tight mb-6">
            Plan Your <br />
            <span className="text-gradient">Dream Event</span> <br />
            Effortlessly.
          </h1>
          
          <p className="text-xl text-white/60 mb-10 max-w-lg leading-relaxed">
            Find real-world vendors with our intelligent search. From concept to reality, we've got you covered.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/discover" className="btn-primary flex items-center gap-2 text-lg">
              Explore Events <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/vendors" className="btn-secondary flex items-center gap-2 text-lg">
              Find Vendors <MapPin className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <GlassCard className="aspect-square flex flex-col justify-center items-center text-center p-4">
              <Users className="w-12 h-12 text-brand-primary mb-4" />
              <h3 className="text-2xl font-bold font-display">10k+</h3>
              <p className="text-sm text-white/50">Happy Users</p>
            </GlassCard>
            <GlassCard className="aspect-square flex flex-col justify-center items-center text-center p-4 mt-8">
              <MapPin className="w-12 h-12 text-brand-secondary mb-4" />
              <h3 className="text-2xl font-bold font-display">500+</h3>
              <p className="text-sm text-white/50">Premium Venues</p>
            </GlassCard>
            <GlassCard className="aspect-square flex flex-col justify-center items-center text-center p-4 -mt-8">
              <Calendar className="w-12 h-12 text-brand-accent mb-4" />
              <h3 className="text-2xl font-bold font-display">2k+</h3>
              <p className="text-sm text-white/50">Events Hosted</p>
            </GlassCard>
            <GlassCard className="aspect-square flex flex-col justify-center items-center text-center p-4">
              <Sparkles className="w-12 h-12 text-white mb-4" />
              <h3 className="text-2xl font-bold font-display">AI</h3>
              <p className="text-sm text-white/50">Smart Assistant</p>
            </GlassCard>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-secondary/20 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

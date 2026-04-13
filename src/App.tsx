import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { PlanEvent } from "./pages/PlanEvent";
import { Discover } from "./pages/Discover";
import { VendorSearch } from "./pages/VendorSearch";
import { RSVP } from "./pages/RSVP";
import { Dashboard } from "./pages/Dashboard";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/plan" element={<PlanEvent />} />
            <Route path="/plan/:bookingId" element={<PlanEvent />} />
            <Route path="/vendors" element={<VendorSearch />} />
            <Route path="/rsvp/:bookingId" element={<RSVP />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AnimatePresence>
        
        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10 mt-20 text-center text-white/40 text-sm">
          <p>© 2026 Plan-It. All rights reserved. Made by Yashika.</p>
        </footer>
      </div>
    </Router>
  );
}

const PlaceholderPage = ({ title }: { title: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="pt-32 px-6 max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center"
  >
    <h1 className="text-5xl font-bold font-display mb-4">{title}</h1>
    <p className="text-white/50">This feature is coming soon! Stay tuned for more AI-powered magic.</p>
  </motion.div>
);

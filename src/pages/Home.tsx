import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { EventCard } from "../components/EventCard";
import { Event } from "../types";
import { motion } from "framer-motion";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { Calendar, Users, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { useLocation } from "../LocationContext";

export const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedLocation } = useLocation();

  useEffect(() => {
    const q = query(collection(db, "events"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "events");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = events
    .filter(e => !selectedLocation || e.location.toLowerCase().includes(selectedLocation.toLowerCase()))
    .slice(0, 3);

  return (
    <main>
      <Hero />
      
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold font-display mb-4">Trending Events</h2>
            <p className="text-white/50">Don't miss out on the most popular events happening soon.</p>
          </div>
          <Link to="/discover" className="btn-secondary">View All</Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-xl font-bold mb-2">No events in {selectedLocation}</h3>
            <p className="text-white/40">Try selecting a different location or browse all events.</p>
            <Link to="/discover" className="btn-primary mt-6 inline-block">Browse All</Link>
          </div>
        )}
      </section>
      
      <section className="bg-white/5 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold font-display mb-12">AI-Powered Planning Tools</h2>
          <div className="grid md:grid-cols-1 max-w-2xl mx-auto gap-8">
            <Link to="/vendors" className="p-8 rounded-3xl glass hover:bg-white/15 transition-all text-left group">
              <div className="w-16 h-16 rounded-2xl bg-brand-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-brand-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real Vendor Search</h3>
              <p className="text-white/50 text-sm mb-6">Find top-rated local vendors, photographers, and caterers verified by Google Maps.</p>
              <span className="text-brand-secondary font-bold flex items-center gap-2">
                Search Vendors <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

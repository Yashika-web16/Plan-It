import { useEffect, useState } from "react";
import { Search, Filter, SlidersHorizontal, MapPin } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { Event } from "../types";
import { motion } from "framer-motion";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useLocation } from "../LocationContext";
import { cn } from "../components/GlassCard";

const CATEGORIES = ["All", "Concert", "Comedy", "Tech", "Party", "Workshop"];

export const Discover = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { selectedLocation } = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
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

  const filteredEvents = events.filter(e => 
    (category === "All" || e.category === category) &&
    (e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase())) &&
    (!selectedLocation || e.location.toLowerCase().includes(selectedLocation.toLowerCase()))
  );

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="text-5xl font-bold font-display mb-6">Discover <span className="text-gradient">Events</span></h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-6 py-4 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                  category === cat ? "btn-primary" : "glass hover:bg-white/15"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}
      </div>
      
      {filteredEvents.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-white/40">No events found matching your criteria. 🔍</p>
        </div>
      )}
    </div>
  );
};

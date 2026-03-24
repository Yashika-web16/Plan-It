import { useEffect, useState } from "react";
import { VenueCard } from "../components/VenueCard";
import { Venue } from "../types";
import { motion } from "framer-motion";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useLocation } from "../LocationContext";
import { Search, MapPin, Hotel, Music } from "lucide-react";
import { cn } from "../components/GlassCard";

export const Venues = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHotels, setFilterHotels] = useState(false);
  const [filterOpenAir, setFilterOpenAir] = useState(false);
  const { selectedLocation } = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "venues"), (snapshot) => {
      const venuesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      setVenues(venuesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "venues");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredVenues = venues
    .filter(v => 
      (v.name.toLowerCase().includes(search.toLowerCase()) || v.location.toLowerCase().includes(search.toLowerCase())) &&
      (!selectedLocation || v.location.toLowerCase().includes(selectedLocation.toLowerCase())) &&
      (!filterHotels || v.isHotel) &&
      (!filterOpenAir || v.isOpenAir)
    )
    .sort((a, b) => {
      // Prioritize open-air venues
      if (a.isOpenAir && !b.isOpenAir) return -1;
      if (!a.isOpenAir && b.isOpenAir) return 1;
      return 0;
    });

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-bold font-display mb-4">Premium <span className="text-gradient">Venues</span></h1>
            <p className="text-white/50 max-w-2xl">Browse our hand-picked selection of the finest venues, from luxury hotels to open-air concert grounds.</p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search venues or location..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-brand-secondary transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setFilterHotels(!filterHotels)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  filterHotels ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "glass hover:bg-white/10"
                )}
              >
                <Hotel className="w-4 h-4" /> Famous Hotels
              </button>
              <button 
                onClick={() => setFilterOpenAir(!filterOpenAir)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  filterOpenAir ? "bg-brand-secondary text-black shadow-lg shadow-brand-secondary/20" : "glass hover:bg-white/10"
                )}
              >
                <Music className="w-4 h-4" /> Open-Air Concerts
              </button>
            </div>
          </div>
        </div>

        {selectedLocation && (
          <div className="flex items-center gap-2 text-brand-secondary mb-8 bg-brand-secondary/10 w-fit px-4 py-2 rounded-full border border-brand-secondary/20">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Showing venues in {selectedLocation}</span>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredVenues.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVenues.map((venue, index) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VenueCard venue={venue} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-3xl border border-white/10">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No venues found</h3>
          <p className="text-white/40 max-w-md mx-auto">We couldn't find any venues matching your criteria in {selectedLocation || 'this area'}. Try adjusting your search or location.</p>
        </div>
      )}
    </div>
  );
};

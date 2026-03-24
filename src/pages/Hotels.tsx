import { useEffect, useState } from "react";
import { Hotel } from "../types";
import { motion } from "framer-motion";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useLocation } from "../LocationContext";
import { Search, MapPin, Star, Bed, Coffee, Wifi } from "lucide-react";
import { GlassCard, cn } from "../components/GlassCard";

export const Hotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { selectedLocation } = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "hotels"), (snapshot) => {
      const hotelsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hotel[];
      setHotels(hotelsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "hotels");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredHotels = hotels.filter(h => 
    (h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase())) &&
    (!selectedLocation || h.location.toLowerCase().includes(selectedLocation.toLowerCase()))
  );

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-bold font-display mb-4">Luxury <span className="text-gradient">Hotels</span></h1>
            <p className="text-white/50 max-w-2xl">Discover the most prestigious stays and event-ready hotels in your selected location.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hotels or location..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
        </div>

        {selectedLocation && (
          <div className="flex items-center gap-2 text-brand-secondary mb-8 bg-brand-secondary/10 w-fit px-4 py-2 rounded-full border border-brand-secondary/20">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Showing hotels in {selectedLocation}</span>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredHotels.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="flex flex-col h-full group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                  <img
                    src={hotel.images[0] || `https://picsum.photos/seed/${hotel.id}/800/450`}
                    alt={hotel.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full glass-dark text-xs font-bold text-brand-accent flex items-center gap-1">
                    <Star className="w-3 h-3 fill-brand-accent" /> {hotel.stars} Stars
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 font-display">{hotel.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{hotel.location}</span>
                  </div>
                  
                  <p className="text-sm text-white/40 line-clamp-2 mb-6">{hotel.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {hotel.amenities.slice(0, 3).map(amenity => (
                      <span key={amenity} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Bed className="w-4 h-4" /> {hotel.roomCount} Rooms
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Starting from</div>
                    <div className="text-xl font-bold text-brand-secondary">₹{hotel.pricePerHour}<span className="text-xs font-normal text-white/40">/hr</span></div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-3xl border border-white/10">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No hotels found</h3>
          <p className="text-white/40 max-w-md mx-auto">We couldn't find any hotels matching your criteria in {selectedLocation || 'this area'}. Try adjusting your search or location.</p>
        </div>
      )}
    </div>
  );
};

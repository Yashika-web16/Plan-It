import { useState } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { GlassCard } from "./GlassCard";
import { Plus, Loader2, Image as ImageIcon, MapPin, Calendar, Clock, DollarSign, Users, Tag } from "lucide-react";

type FormType = 'event' | 'venue' | 'hotel';

export const AdminContentForm = () => {
  const [type, setType] = useState<FormType>('event');
  const [loading, setLoading] = useState(false);
  
  // Event Form State
  const [eventData, setEventData] = useState({
    title: "",
    category: "Concert",
    date: "",
    time: "",
    location: "",
    price: "",
    capacity: "",
    imageUrl: "",
    tags: ""
  });

  // Venue Form State
  const [venueData, setVenueData] = useState({
    name: "",
    location: "",
    capacity: "",
    pricePerHour: "",
    description: "",
    imageUrl: "",
    isHotel: false,
    isOpenAir: false,
    themeCompatibility: "Party, Wedding"
  });

  // Hotel Form State
  const [hotelData, setHotelData] = useState({
    name: "",
    location: "",
    capacity: "",
    pricePerHour: "",
    description: "",
    stars: "5",
    roomCount: "",
    amenities: "Spa, Pool, Wifi",
    imageUrl: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'event') {
        await addDoc(collection(db, "events"), {
          ...eventData,
          price: Number(eventData.price),
          capacity: Number(eventData.capacity),
          bookedCount: 0,
          images: [eventData.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/450`],
          tags: eventData.tags.split(",").map(t => t.trim()),
          organizerId: "admin"
        });
        setEventData({ title: "", category: "Concert", date: "", time: "", location: "", price: "", capacity: "", imageUrl: "", tags: "" });
      } else if (type === 'venue') {
        await addDoc(collection(db, "venues"), {
          ...venueData,
          capacity: Number(venueData.capacity),
          pricePerHour: Number(venueData.pricePerHour),
          images: [venueData.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/450`],
          themeCompatibility: venueData.themeCompatibility.split(",").map(t => t.trim())
        });
        setVenueData({ name: "", location: "", capacity: "", pricePerHour: "", description: "", imageUrl: "", isHotel: false, isOpenAir: false, themeCompatibility: "Party, Wedding" });
      } else if (type === 'hotel') {
        await addDoc(collection(db, "hotels"), {
          ...hotelData,
          capacity: Number(hotelData.capacity),
          pricePerHour: Number(hotelData.pricePerHour),
          stars: Number(hotelData.stars),
          roomCount: Number(hotelData.roomCount),
          amenities: hotelData.amenities.split(",").map(t => t.trim()),
          images: [hotelData.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/450`],
          themeCompatibility: ["Wedding", "Gala", "Corporate"]
        });
        setHotelData({ name: "", location: "", capacity: "", pricePerHour: "", description: "", stars: "5", roomCount: "", amenities: "Spa, Pool, Wifi", imageUrl: "" });
      }
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully! 🚀`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${type}s`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-8">
      <div className="flex gap-4 mb-8">
        {(['event', 'venue', 'hotel'] as FormType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
              type === t ? "bg-brand-primary text-white" : "glass hover:bg-white/10 text-white/40"
            }`}
          >
            Add {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'event' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Event Title</label>
              <input required value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="e.g. Rock Night" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Category</label>
              <select value={eventData.category} onChange={e => setEventData({...eventData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none">
                <option value="Concert">Concert</option>
                <option value="Sports">Sports</option>
                <option value="Tech">Tech</option>
                <option value="Cultural">Cultural</option>
                <option value="Party">Party</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Date</label>
              <input required type="date" value={eventData.date} onChange={e => setEventData({...eventData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Time</label>
              <input required type="time" value={eventData.time} onChange={e => setEventData({...eventData, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Location</label>
              <input required value={eventData.location} onChange={e => setEventData({...eventData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="City, Venue" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Price (₹)</label>
              <input required type="number" value={eventData.price} onChange={e => setEventData({...eventData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="0 for free" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Capacity</label>
              <input required type="number" value={eventData.capacity} onChange={e => setEventData({...eventData, capacity: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="Total tickets" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Tags (comma separated)</label>
              <input value={eventData.tags} onChange={e => setEventData({...eventData, tags: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="Music, Rock, Live" />
            </div>
          </div>
        )}

        {type === 'venue' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Venue Name</label>
              <input required value={venueData.name} onChange={e => setVenueData({...venueData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-secondary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Location</label>
              <input required value={venueData.location} onChange={e => setVenueData({...venueData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-secondary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Capacity</label>
              <input required type="number" value={venueData.capacity} onChange={e => setVenueData({...venueData, capacity: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-secondary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Price Per Hour (₹)</label>
              <input required type="number" value={venueData.pricePerHour} onChange={e => setVenueData({...venueData, pricePerHour: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-secondary outline-none" />
            </div>
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={venueData.isHotel} onChange={e => setVenueData({...venueData, isHotel: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-white/5" />
                <span className="text-sm">Is Hotel?</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={venueData.isOpenAir} onChange={e => setVenueData({...venueData, isOpenAir: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-white/5" />
                <span className="text-sm">Open Air?</span>
              </label>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Description</label>
              <textarea required value={venueData.description} onChange={e => setVenueData({...venueData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-secondary outline-none h-24" />
            </div>
          </div>
        )}

        {type === 'hotel' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Hotel Name</label>
              <input required value={hotelData.name} onChange={e => setHotelData({...hotelData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Location</label>
              <input required value={hotelData.location} onChange={e => setHotelData({...hotelData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Stars</label>
              <select value={hotelData.stars} onChange={e => setHotelData({...hotelData, stars: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none">
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Room Count</label>
              <input required type="number" value={hotelData.roomCount} onChange={e => setHotelData({...hotelData, roomCount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Price Per Hour (₹)</label>
              <input required type="number" value={hotelData.pricePerHour} onChange={e => setHotelData({...hotelData, pricePerHour: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Amenities (comma separated)</label>
              <input value={hotelData.amenities} onChange={e => setHotelData({...hotelData, amenities: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Description</label>
              <textarea required value={hotelData.description} onChange={e => setHotelData({...hotelData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-accent outline-none h-24" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">Image URL (Optional)</label>
          <div className="flex gap-4">
            <input value={type === 'event' ? eventData.imageUrl : type === 'venue' ? venueData.imageUrl : hotelData.imageUrl} onChange={e => {
              if (type === 'event') setEventData({...eventData, imageUrl: e.target.value});
              else if (type === 'venue') setVenueData({...venueData, imageUrl: e.target.value});
              else setHotelData({...hotelData, imageUrl: e.target.value});
            }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="https://..." />
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center overflow-hidden">
              <ImageIcon className="w-6 h-6 text-white/20" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
            type === 'event' ? "btn-primary" : type === 'venue' ? "btn-secondary" : "bg-brand-accent text-black hover:scale-[1.02]"
          }`}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
          Add {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      </form>
    </GlassCard>
  );
};

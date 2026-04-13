import { useEffect, useState } from "react";
import { User, Layout, Calendar, BarChart3, Settings, LogOut, Sparkles, Database, Table as TableIcon, Search, MapPin, Hotel as HotelIcon, PlusCircle, Trophy } from "lucide-react";
import { GlassCard, cn } from "../components/GlassCard";
import { BookingCard } from "../components/BookingCard";
import { AdminContentForm } from "../components/AdminContentForm";
import { SettingsForm } from "../components/SettingsForm";
import { motion } from "framer-motion";
import { useAuth } from "../AuthContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Booking, Event, Venue, Hotel } from "../types";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Bookings - Query for events where user is a participant (owner or guest)
    // We check both participantIds and userId for backward compatibility and robustness
    const q = query(
      collection(db, "bookings"), 
      where("participantIds", "array-contains", user.uid)
    );
    
    // We also fetch where userId == user.uid and merge them to be safe
    const q2 = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid)
    );

    const unsubscribeBookings = onSnapshot(q, (snapshot) => {
      const pBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      
      getDocs(q2).then(ownerSnap => {
        const oBookings = ownerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
        
        // Merge all bookings
        const allBookings = [...pBookings, ...oBookings];
        
        // Deduplicate by eventId to ensure a unique list of events
        // If eventId is missing (e.g. custom plan), fallback to document id
        const uniqueMap = new Map();
        allBookings.forEach(booking => {
          const key = booking.eventId || booking.id;
          // Keep the most recent booking if there are duplicates for the same event
          if (!uniqueMap.has(key) || new Date(booking.createdAt || 0) > new Date(uniqueMap.get(key).createdAt || 0)) {
            uniqueMap.set(key, booking);
          }
        });
        
        const uniqueBookings = Array.from(uniqueMap.values());
        
        // Sort by date descending
        uniqueBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setBookings(uniqueBookings);
        setLoading(false);
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "bookings");
      setLoading(false);
    });

    // Events (for Data Explorer)
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "events");
    });

    // Venues (for Data Explorer)
    const unsubscribeVenues = onSnapshot(collection(db, "venues"), (snapshot) => {
      setVenues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Venue[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "venues");
    });

    // Hotels (for Data Explorer)
    const unsubscribeHotels = onSnapshot(collection(db, "hotels"), (snapshot) => {
      setHotels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Hotel[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "hotels");
    });

    return () => {
      unsubscribeBookings();
      unsubscribeEvents();
      unsubscribeVenues();
      unsubscribeHotels();
    };
  }, [user]);

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      // The onSnapshot will automatically update the UI
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "bookings");
    }
  };

  const seedData = async () => {
    try {
      const eventsRef = collection(db, "events");
      const venuesRef = collection(db, "venues");
      const hotelsRef = collection(db, "hotels");
      
      const events = [
        { title: "Dhurandhar: The Revenge", category: "Movie", date: "2026-04-01", time: "19:00", location: "PVR Cinemas, Mumbai", price: 450, organizerId: "admin", capacity: 200, bookedCount: 50, images: ["https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80"], tags: ["Action", "Thriller", "Bollywood"] },
        { title: "IPL Final 2026", category: "Sports", date: "2026-05-24", time: "20:00", location: "Wankhede Stadium, Mumbai", price: 2500, organizerId: "admin", capacity: 33000, bookedCount: 30000, images: ["https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80"], tags: ["Cricket", "Sports", "Mumbai"] },
        { title: "Sunburn Festival Goa", category: "Concert", date: "2026-12-28", time: "16:00", location: "Vagator Beach, Goa", price: 4999, organizerId: "admin", capacity: 50000, bookedCount: 35000, images: ["https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=800&q=80"], tags: ["Music", "Festival", "Goa"] },
        { title: "Comic Con India - Delhi", category: "Convention", date: "2026-11-15", time: "11:00", location: "NSIC Grounds, New Delhi", price: 899, organizerId: "admin", capacity: 10000, bookedCount: 7500, images: ["https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=800&q=80"], tags: ["Comics", "Pop Culture"] },
        { title: "NH7 Weekender Pune", category: "Concert", date: "2026-11-25", time: "15:00", location: "Mahalakshmi Lawns, Pune", price: 3500, organizerId: "admin", capacity: 15000, bookedCount: 12000, images: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"], tags: ["Indie", "Music"] },
        { title: "Bangalore Tech Expo", category: "Tech", date: "2026-08-12", time: "10:00", location: "BIEC, Bangalore", price: 500, organizerId: "admin", capacity: 5000, bookedCount: 2000, images: ["https://images.unsplash.com/photo-1540575861501-7ad0582371f3?auto=format&fit=crop&w=800&q=80"], tags: ["Tech", "Expo"] },
        { title: "Udaipur Heritage Walk", category: "Cultural", date: "2026-09-05", time: "07:00", location: "Old City, Udaipur", price: 300, organizerId: "admin", capacity: 50, bookedCount: 20, images: ["https://images.unsplash.com/photo-1590050752117-23a9d7fc0b5d?auto=format&fit=crop&w=800&q=80"], tags: ["Heritage", "Walk"] }
      ];

      const venues = [
        { name: "PVR ICON: Phoenix Palladium", location: "Lower Parel, Mumbai", capacity: 150, pricePerHour: 15000, description: "Premium cinema experience with state-of-the-art sound and projection.", images: ["https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Movie", "Corporate"], isHotel: false, isOpenAir: false },
        { name: "PVR: Juhu", location: "Juhu, Mumbai", capacity: 200, pricePerHour: 12000, description: "Classic cinema destination in the heart of Juhu.", images: ["https://images.unsplash.com/photo-1517604401159-52c62754e481?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Movie", "Party"], isHotel: false, isOpenAir: false },
        { name: "Taj Mahal Palace Ballroom", location: "Mumbai, MH", capacity: 600, pricePerHour: 50000, description: "Historic luxury in the heart of Mumbai. Perfect for royal weddings and elite corporate events.", images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Wedding", "Gala", "Corporate"], isHotel: true, isOpenAir: false },
        { name: "The Leela Palace Gardens", location: "Udaipur, RJ", capacity: 400, pricePerHour: 75000, description: "Breathtaking lakeside views and royal Rajasthani hospitality. Ideal for destination weddings.", images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Wedding", "Party"], isHotel: true, isOpenAir: true },
        { name: "Jio World Garden", location: "Mumbai, MH", capacity: 5000, pricePerHour: 100000, description: "Massive open-air garden in BKC. Perfect for large-scale concerts and exhibitions.", images: ["https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Concert", "Festival"], isHotel: false, isOpenAir: true },
        { name: "JW Marriott Ballroom", location: "Bangalore, KA", capacity: 1000, pricePerHour: 80000, description: "Ultra-modern luxury in the heart of the tech city.", images: ["https://images.unsplash.com/photo-1551882547-ff43c63e1c04?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Corporate", "Wedding"], isHotel: true, isOpenAir: false }
      ];

      const hotelData = [
        { name: "The Oberoi Amarvilas", location: "Agra, UP", capacity: 300, pricePerHour: 45000, description: "Uninterrupted views of the Taj Mahal.", stars: 5, roomCount: 102, amenities: ["Spa", "Taj View", "Butler Service"], images: ["https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Wedding", "Gala"] },
        { name: "Umaid Bhawan Palace", location: "Jodhpur, RJ", capacity: 500, pricePerHour: 150000, description: "One of the world's largest private residences, now a luxury hotel.", stars: 5, roomCount: 70, amenities: ["Museum", "Royal Spa", "Vintage Cars"], images: ["https://images.unsplash.com/photo-1590050752117-23a9d7fc0b5d?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Wedding", "Gala"] },
        { name: "The Lodhi", location: "New Delhi, DL", capacity: 200, pricePerHour: 35000, description: "Modern luxury with private plunge pools.", stars: 5, roomCount: 40, amenities: ["Private Pool", "Art Gallery"], images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Corporate", "Party"] },
        { name: "W Goa", location: "Vagator, Goa", capacity: 500, pricePerHour: 60000, description: "Vibrant and trendy beach resort.", stars: 5, roomCount: 160, amenities: ["Beach Club", "Infinity Pool"], images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"], themeCompatibility: ["Party", "Wedding"] }
      ];

      for (const e of events) await addDoc(eventsRef, e);
      for (const v of venues) await addDoc(venuesRef, v);
      for (const h of hotelData) await addDoc(hotelsRef, h);
      
      alert("Database seeded successfully! 🚀");
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Error seeding data. Check console for details.");
    }
  };

  if (!user) {
    return (
      <div className="pt-32 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-bold font-display mb-4">Please Login</h1>
        <p className="text-white/50">You need to be logged in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary mx-auto mb-4 p-1">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                alt="User"
                className="w-full h-full rounded-full bg-slate-900"
              />
            </div>
            <h2 className="text-xl font-bold font-display">{user.name}</h2>
            <p className="text-sm text-white/50 mb-6">{user.email}</p>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("bookings")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === "bookings" ? "bg-brand-primary text-white" : "hover:bg-white/5"
                )}
              >
                <Calendar className="w-4 h-4" /> My Bookings
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab("manage")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === "manage" ? "bg-brand-primary text-white" : "hover:bg-white/5"
                  )}
                >
                  <PlusCircle className="w-4 h-4" /> Manage Content
                </button>
              )}
              <button
                onClick={() => setActiveTab("explorer")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === "explorer" ? "bg-brand-secondary text-black" : "hover:bg-white/5"
                )}
              >
                <TableIcon className="w-4 h-4" /> Data Explorer
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === "analytics" ? "bg-brand-secondary text-black" : "hover:bg-white/5"
                )}
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === "settings" ? "bg-brand-accent text-black" : "hover:bg-white/5"
                )}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>
            
            <div className="pt-6 mt-6 border-t border-white/10">
              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-primary hover:bg-brand-primary/10 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </GlassCard>
          
          {user.role === 'admin' && (
            <GlassCard className="p-6 border-brand-accent/30">
              <Database className="w-8 h-8 text-brand-accent mb-4" />
              <h3 className="font-bold mb-2">Admin Tools</h3>
              <p className="text-xs text-white/50 mb-4">Populate the database with sample events, venues, and hotels.</p>
              <button onClick={seedData} className="w-full btn-secondary py-2 text-xs border-brand-accent/50 text-brand-accent">
                Seed Database
              </button>
            </GlassCard>
          )}

          <GlassCard className="p-6 bg-gradient-to-br from-brand-primary/20 to-transparent">
            <Sparkles className="w-8 h-8 text-brand-primary mb-4" />
            <h3 className="font-bold mb-2">Pro Planner</h3>
            <p className="text-xs text-white/50 mb-4">Unlock AI-powered event management and premium venues.</p>
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Your Rewards</p>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-primary" />
                <p className="text-xl font-bold text-brand-primary">{user.points || 0} PTS</p>
              </div>
              <p className="text-[8px] text-white/30 mt-1">* Use points for discounts in Discover!</p>
            </div>

            <button className="w-full btn-primary py-2 text-xs">Upgrade Now</button>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-4xl font-bold font-display">
              {activeTab === "bookings" && "My Bookings"}
              {activeTab === "manage" && "Manage Platform Content"}
              {activeTab === "explorer" && "Data Explorer"}
              {activeTab === "analytics" && "Event Analytics"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-xl glass text-xs font-bold uppercase tracking-widest text-brand-secondary">
                {user.role} Mode
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {activeTab === "bookings" && (
              loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : bookings.length > 0 ? (
                bookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <BookingCard
                      booking={booking}
                      title={booking.eventId ? "Event Ticket" : "Venue Booking"}
                      location={booking.location || "Check details"}
                      onDelete={() => handleDeleteBooking(booking.id)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <p className="text-white/40">You haven't made any bookings yet. 🎫</p>
                  <Link to="/discover" className="btn-primary mt-6 inline-block">Explore Events</Link>
                </div>
              )
            )}

            {activeTab === "manage" && user.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AdminContentForm />
              </motion.div>
            )}

            {activeTab === "explorer" && (
              <div className="space-y-8">
                {/* Events Table */}
                <GlassCard className="p-6 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-xl font-bold">Discover Events</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-white/40 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Capacity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {events.map(e => (
                          <tr key={e.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-medium">{e.title}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold">{e.category}</span></td>
                            <td className="px-4 py-3 text-white/60">{e.location}</td>
                            <td className="px-4 py-3 font-bold text-brand-secondary">₹{e.price}</td>
                            <td className="px-4 py-3 text-white/40">{e.bookedCount}/{e.capacity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>

                {/* Hotels Table */}
                <GlassCard className="p-6 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <HotelIcon className="w-5 h-5 text-brand-secondary" />
                    <h3 className="text-xl font-bold">Hotel Database</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-white/40 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Rating</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Rooms</th>
                          <th className="px-4 py-3">Price/Hr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {hotels.map(h => (
                          <tr key={h.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-medium">{h.name}</td>
                            <td className="px-4 py-3 text-brand-accent">{"★".repeat(h.stars)}</td>
                            <td className="px-4 py-3 text-white/60">{h.location}</td>
                            <td className="px-4 py-3 text-white/40">{h.roomCount}</td>
                            <td className="px-4 py-3 font-bold text-brand-secondary">₹{h.pricePerHour}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>

                {/* Venues Table */}
                <GlassCard className="p-6 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-brand-accent" />
                    <h3 className="text-xl font-bold">Venues</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-white/40 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Capacity</th>
                          <th className="px-4 py-3">Price/Hr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {venues.map(v => (
                          <tr key={v.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-medium">{v.name}</td>
                            <td className="px-4 py-3">
                              {v.isHotel && <span className="mr-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold">Hotel</span>}
                              {v.isOpenAir && <span className="px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary text-[10px] font-bold">Open-Air</span>}
                            </td>
                            <td className="px-4 py-3 text-white/60">{v.location}</td>
                            <td className="px-4 py-3 text-white/40">{v.capacity}</td>
                            <td className="px-4 py-3 font-bold text-brand-secondary">₹{v.pricePerHour}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}
            
            {activeTab === "analytics" && (
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="p-8 flex flex-col items-center justify-center text-center">
                  <BarChart3 className="w-12 h-12 text-brand-primary mb-4" />
                  <h3 className="text-3xl font-bold font-display">
                    ${bookings.reduce((acc, b) => acc + b.totalAmount, 0)}
                  </h3>
                  <p className="text-sm text-white/50">Total Spent</p>
                </GlassCard>
                <GlassCard className="p-8 flex flex-col items-center justify-center text-center">
                  <Calendar className="w-12 h-12 text-brand-secondary mb-4" />
                  <h3 className="text-3xl font-bold font-display">{bookings.length}</h3>
                  <p className="text-sm text-white/50">Events Attended</p>
                </GlassCard>
              </div>
            )}
            
            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SettingsForm />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

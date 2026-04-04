import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, ExternalLink, Loader2, Navigation, AlertCircle, Sparkles } from "lucide-react";
import Markdown from "react-markdown";

interface Vendor {
  name: string;
  rating?: number;
  address?: string;
  url?: string;
  description?: string;
}

export const VendorSearch = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  const searchVendors = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResults(null);
    setGroundingChunks([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Find real vendors for: ${query}${location ? ` in ${location}` : ""}. Provide a list of recommended vendors with their names, ratings, and a brief description of why they are good.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: userCoords ? {
                latitude: userCoords.lat,
                longitude: userCoords.lng
              } : undefined
            }
          }
        },
      });

      setResults(response.text || "No results found.");
      setGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search vendors. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-20">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold font-display mb-6"
        >
          Real Vendor Search
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg max-w-2xl mx-auto"
        >
          Find the best local vendors for your event. We search real-world data from Google Maps to bring you the top-rated professionals.
        </motion.p>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <div className="glass p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-4 shadow-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for? (e.g., Wedding Photographers, Catering)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <button
            onClick={searchVendors}
            disabled={isSearching || !query.trim()}
            className="btn-primary px-8 py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Search className="w-6 h-6" />
                Search
              </>
            )}
          </button>
        </div>
        {userCoords && (
          <p className="text-xs text-white/30 mt-4 flex items-center gap-1 justify-center">
            <Navigation className="w-3 h-3" />
            Using your current location for better results
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">Searching Google Maps...</h3>
            <p className="text-white/40">Finding the best vendors near you.</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 text-red-400"
          >
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-bold mb-1">Search Failed</h3>
              <p>{error}</p>
            </div>
          </motion.div>
        ) : results ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="glass p-8 rounded-3xl border border-white/10">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-brand-primary" />
                  AI Recommendations
                </h2>
                <div className="markdown-body prose prose-invert max-w-none">
                  <Markdown>{results}</Markdown>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Direct Links</h2>
              {groundingChunks.length > 0 ? (
                groundingChunks.map((chunk, idx) => (
                  chunk.maps && (
                    <motion.a
                      key={idx}
                      href={chunk.maps.uri}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="block glass p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">
                          {chunk.maps.title || "View on Maps"}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Verified on Maps</span>
                      </div>
                      <p className="text-xs text-white/40 truncate">
                        {chunk.maps.uri}
                      </p>
                    </motion.a>
                  )
                ))
              ) : (
                <div className="glass p-8 rounded-2xl border border-white/10 text-center text-white/40">
                  <MapPin className="w-8 h-8 mx-auto mb-4 opacity-20" />
                  <p>No direct map links found for this search.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 opacity-20"
          >
            <Search className="w-20 h-20 mx-auto mb-6" />
            <h3 className="text-2xl font-bold">Start your search above</h3>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

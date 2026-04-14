import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Loader2, AlertCircle, Sparkles, Info } from "lucide-react";
import Markdown from "react-markdown";
import { aiService } from "../services/aiService";

export const VendorSearch = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchVendors = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await aiService.getVendorRecommendations(query, location);
      setResults(response);
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
          Vendor Recommendations
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg max-w-2xl mx-auto"
        >
          Get AI-powered recommendations for the best local vendors for your event. We analyze industry trends and reviews to find the top professionals.
        </motion.p>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <div className="bento-card p-4 flex flex-col md:flex-row gap-4 shadow-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchVendors()}
              placeholder="What are you looking for?"
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchVendors()}
              placeholder="Location"
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <button
            onClick={() => searchVendors()}
            disabled={isSearching || !query.trim()}
            className="btn-primary px-10 py-5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <p className="mono-tag mt-6 mx-auto w-fit flex items-center gap-2">
          <Info className="w-3 h-3" />
          AI-generated recommendations
        </p>
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
            <h3 className="text-xl font-bold mb-2">Analyzing Vendors...</h3>
            <p className="text-white/40">Finding the best professionals for your event.</p>
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
              <p className="mb-4 whitespace-pre-line">{error}</p>
              <button 
                onClick={() => searchVendors()}
                className="btn-secondary py-2 px-4 text-sm bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : results ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bento-card">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-brand-primary" />
                Top Recommendations
              </h2>
              <div className="markdown-body prose prose-invert max-w-none">
                <Markdown>{results}</Markdown>
              </div>
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

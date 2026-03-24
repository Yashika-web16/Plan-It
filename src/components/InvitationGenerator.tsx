import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { aiService } from "../services/aiService";
import { motion, AnimatePresence } from "framer-motion";

interface InvitationGeneratorProps {
  eventDetails: {
    type: string;
    date: string;
    location: string;
    theme?: string;
  };
}

export const InvitationGenerator = ({ eventDetails }: InvitationGeneratorProps) => {
  const [invitation, setInvitation] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const text = await aiService.generateInvitation(eventDetails);
      setInvitation(text || "");
    } catch (error) {
      console.error(error);
      setInvitation("Failed to generate invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-display flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-brand-primary" /> AI Invitation Generator
        </h3>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {invitation ? "Regenerate" : "Generate"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {invitation ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative group"
          >
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {invitation}
            </div>
            <button
              onClick={copyToClipboard}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-brand-secondary" /> : <Copy className="w-4 h-4" />}
            </button>
          </motion.div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-white/30 text-sm">
            <Sparkles className="w-8 h-8 mb-2 opacity-20" />
            Click generate to create a trendy invitation!
          </div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

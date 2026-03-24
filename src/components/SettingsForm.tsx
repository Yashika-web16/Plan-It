import { useState } from "react";
import { useAuth } from "../AuthContext";
import { GlassCard } from "./GlassCard";
import { User, Mail, Shield, Bell, Save, Loader2, Camera } from "lucide-react";

export const SettingsForm = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    photoURL: user?.photoURL || "",
    notifications: true,
    privacy: "public"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        photoURL: formData.photoURL
      });
      alert("Profile updated successfully! ✨");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <GlassCard className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Profile Settings</h3>
            <p className="text-sm text-white/40">Update your personal information and profile picture.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <input
                disabled
                value={formData.email}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/30 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Camera className="w-3 h-3" /> Profile Photo URL
              </label>
              <input
                value={formData.photoURL}
                onChange={e => setFormData({ ...formData, photoURL: e.target.value })}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-secondary/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-brand-secondary" />
            </div>
            <h3 className="font-bold">Notifications</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-sm">Email Notifications</span>
              <input 
                type="checkbox" 
                checked={formData.notifications} 
                onChange={e => setFormData({...formData, notifications: e.target.checked})}
                className="w-5 h-5 rounded border-white/10 bg-white/5" 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-sm">Booking Reminders</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-white/10 bg-white/5" />
            </label>
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-accent" />
            </div>
            <h3 className="font-bold">Privacy & Security</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Profile Visibility</label>
              <select 
                value={formData.privacy}
                onChange={e => setFormData({...formData, privacy: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
              >
                <option value="public">Public Profile</option>
                <option value="private">Private Profile</option>
              </select>
            </div>
            <button className="w-full py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-colors">
              Change Password
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

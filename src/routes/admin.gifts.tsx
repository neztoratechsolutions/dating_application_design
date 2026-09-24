import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Coins, Gift as GiftIcon, Loader2, Plus, X, Save, Percent, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/admin/gifts")({ component: AdminGifts });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type Gift = {
  id?: number;
  catalog_name: string;
  icon: string;
  coins: number;
};

function AdminGifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Global Revenue Split
  const [creatorShare, setCreatorShare] = useState(80); // Default 80% to creator
  const [isSavingSplit, setIsSavingSplit] = useState(false);
  
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    catalog_name: "",
    icon: "🎁",
    coins: 0,
  });

  const fetchGifts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/gifts/`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data?.detail === "Data not found" || res.status === 404) {
          setGifts([]);
        } else {
          throw new Error(data?.detail || "Failed to fetch gifts");
        }
        return;
      }
      
      setGifts(Array.isArray(data) ? data : (data?.data || []));
    } catch (err: any) {
      toast.error(err.message || "Unable to load gifts");
      setGifts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "coins" ? Number(value) : value,
    }));
  };

  // Helper to render Emoji or Image URL
  const renderIcon = (icon: string) => {
    if (!icon) return <GiftIcon className="h-8 w-8 mx-auto text-muted-foreground" />;
    if (icon.startsWith("http") || icon.startsWith("data:") || icon.startsWith("uploads/")) {
      const src = icon.startsWith("http") ? icon : `${API_BASE_URL}/${icon.replace(/^\//, '')}`;
      return <img src={src} alt="Gift" className="w-12 h-12 mx-auto object-contain rounded-lg" />;
    }
    return <div className="text-4xl">{icon}</div>;
  };

  // Handle File Upload for Icon
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setIsUploadingIcon(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Assuming a generic upload endpoint. Change '/gifts/upload' if your backend differs.
      const res = await fetch(`${API_BASE_URL}/gifts/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Icon upload failed");
      
      const data = await res.json();
      // Assuming API returns { "url": "uploads/gifts/icon.png" } or similar
      const uploadedPath = data.url || data.file_path || data.path;
      
      setForm(prev => ({ ...prev, icon: uploadedPath }));
      toast.success("Icon uploaded");
    } catch (err: any) {
      toast.error(err.message || "Unable to upload icon");
    } finally {
      setIsUploadingIcon(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // reset input
    }
  };

  const handleCreateGift = async () => {
    if (!form.catalog_name || form.coins <= 0) {
      return toast.error("Gift name and coin price are required.");
    }

    setIsSaving(true);

    // Construct payload to match exact API requirements
    const payload = {
      catalog_name: form.catalog_name,
      icon: form.icon,
      coins: form.coins,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/gifts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create gift");
      }

      const newGift = await res.json();
      setGifts([newGift, ...gifts]);
      toast.success("Gift added to catalog!");
      
      // Reset form and close modal
      setForm({ catalog_name: "", icon: "🎁", coins: 0 });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Unable to save gift");
    } finally {
      setIsSaving(false);
    }
  };

  // Save the global revenue split
  const handleSaveSplit = async () => {
    setIsSavingSplit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_share: creatorShare }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save revenue split");
      }

      toast.success(`Revenue split saved! Creator gets ${creatorShare}%`);
    } catch (err: any) {
      toast.error(err.message || "Unable to save split");
    } finally {
      setIsSavingSplit(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader 
        title="Gift Management" 
        subtitle="Configure gift catalog & revenue splits" 
        action={
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add New Gift
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <GlassCard>
          <GiftIcon className="h-4 w-4 text-primary mb-1" />
          <p className="text-xl font-bold">{gifts.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Gifts</p>
        </GlassCard>
        <GlassCard>
          <Coins className="h-4 w-4 text-amber-400 mb-1" />
          <p className="text-xl font-bold">
            {gifts.reduce((a, g) => a + (g.coins || 0), 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Total Coins Val.</p>
        </GlassCard>
        <GlassCard>
          <Coins className="h-4 w-4 text-emerald-400 mb-1" />
          <p className="text-xl font-bold">
            {gifts.reduce((a, g) => a + Math.round((g.coins * creatorShare) / 100), 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Est. Creator Rev.</p>
        </GlassCard>
      </div>

      {/* Global Revenue Split */}
      {/* <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Percent className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Global Revenue Split</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Creators get <b className="text-emerald-400">{creatorShare}%</b> · Platform keeps <b className="text-primary">{100 - creatorShare}%</b> of all gift coins sent.
        </p>
        <input
          type="range"
          min={5}
          max={95}
          value={creatorShare}
          onChange={(e) => setCreatorShare(+e.target.value)}
          className="w-full accent-primary"
        />
        <button
          onClick={handleSaveSplit}
          disabled={isSavingSplit}
          className="mt-4 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-50"
        >
          {isSavingSplit ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Revenue Split
            </>
          )}
        </button>
      </GlassCard> */}

      {/* Gift Catalog Grid */}
      <div>
        <h3 className="font-bold mb-3">Gift Catalog ({gifts.length})</h3>
        
        {isLoading ? (
          <GlassCard className="flex justify-center items-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : gifts.length === 0 ? (
          <GlassCard className="text-center py-24 flex flex-col items-center gap-3">
            <GiftIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No gifts found.</p>
            <p className="text-muted-foreground text-xs">Click "Add New Gift" to create your first item.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {gifts.map((g, i) => (
              <GlassCard key={g.id || i} className="text-center">
                <div className="flex justify-center mb-2 h-12 items-center">
                  {renderIcon(g.icon)}
                </div>
                <p className="font-semibold text-sm">{g.catalog_name}</p>
                <p className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-0.5 mt-1">
                  <Coins className="h-3 w-3" /> {g.coins}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Gift Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" 
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              className="glass rounded-2xl p-6 max-w-md w-full space-y-4" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary">
                    <GiftIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">Create New Gift</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Icon (Emoji, URL, or Upload)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      name="icon"
                      value={form.icon}
                      onChange={handleInputChange}
                      placeholder="🎀 or https://example.com/rose.png"
                      className="flex-1 glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleIconUpload} 
                      accept="image/*"
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingIcon}
                      className="glass rounded-xl px-3 py-2.5 text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {isUploadingIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Live Preview */}
                  <div className="mt-2 p-3 glass rounded-xl flex justify-center items-center h-16">
                    {renderIcon(form.icon)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Gift Name</label>
                  <input 
                    name="catalog_name"
                    value={form.catalog_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Virtual Rose"
                    className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Coin Price (Cost to send)</label>
                  <input 
                    type="number"
                    name="coins"
                    value={form.coins}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="e.g. 50"
                    className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {form.coins > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-2 text-right">
                      Creator gets: <b className="text-emerald-400">{Math.round((form.coins * creatorShare) / 100)} coins</b> · Platform gets: <b>{form.coins - Math.round((form.coins * creatorShare) / 100)} coins</b>
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleCreateGift} 
                  disabled={isSaving}
                  className="w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity mt-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Gift"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
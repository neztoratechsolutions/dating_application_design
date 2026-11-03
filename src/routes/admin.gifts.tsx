// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { GIFTS, useGifts } from "@/lib/gift-store";
// import { Coins, TrendingUp, Gift as GiftIcon, Percent } from "lucide-react";
// import { useState } from "react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/admin/gifts")({ component: AdminGifts });

// function AdminGifts() {
//   const share = useGifts((s) => s.creatorShare);
//   const setShare = useGifts((s) => s.setCreatorShare);
//   const history = useGifts((s) => s.history);
//   const [draft, setDraft] = useState(share);

//   const totalCoins = history.reduce((a, h) => a + h.price, 0);
//   const creatorCut = Math.round((totalCoins * share) / 100);
//   const platformCut = totalCoins - creatorCut;

//   return (
//     <div className="space-y-6">
//       <PageHeader title="Gift Management" subtitle="Configure gift catalog & revenue split" />

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         {[
//           { icon: GiftIcon, label: "Gifts sent", value: history.length },
//           { icon: Coins, label: "Gift revenue", value: totalCoins },
//           { icon: TrendingUp, label: "Platform earnings", value: platformCut },
//           { icon: Percent, label: "Creator share", value: `${share}%` },
//         ].map((s) => (
//           <GlassCard key={s.label}>
//             <s.icon className="h-4 w-4 text-primary mb-1" />
//             <p className="text-xl font-bold">{s.value}</p>
//             <p className="text-[10px] text-muted-foreground">{s.label}</p>
//           </GlassCard>
//         ))}
//       </div>

//       <GlassCard>
//         <h3 className="font-bold mb-3">Revenue Split</h3>
//         <p className="text-xs text-muted-foreground mb-3">Creators get <b>{draft}%</b> · Platform keeps {100 - draft}%</p>
//         <input
//           type="range"
//           min={5}
//           max={80}
//           value={draft}
//           onChange={(e) => setDraft(+e.target.value)}
//           className="w-full"
//         />
//         <button
//           onClick={() => { setShare(draft); toast.success(`Creator share set to ${draft}%`); }}
//           className="mt-3 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow"
//         >
//           Save changes
//         </button>
//       </GlassCard>

//       <div>
//         <h3 className="font-bold mb-3">Gift Catalog ({GIFTS.length})</h3>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//           {GIFTS.map((g) => (
//             <GlassCard key={g.id} className="text-center">
//               <div className="text-3xl mb-1">{g.emoji}</div>
//               <p className="font-semibold text-xs">{g.name}</p>
//               <p className="text-[10px] text-muted-foreground capitalize">{g.tier}</p>
//               <p className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-0.5 mt-1">
//                 <Coins className="h-3 w-3" /> {g.price}
//               </p>
//             </GlassCard>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useGifts } from "@/lib/gift-store";
import {
  Coins,
  TrendingUp,
  Gift as GiftIcon,
  Percent,
  Plus,
  X,
  Loader2,
  Pencil,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gifts")({ component: AdminGifts });

const API_BASE_URL = String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");

// Categorized emoji presets for the create modal
const EMOJI_CATEGORIES = [
  {
    label: "Gifts & Bags",
    emojis: ["🎁", "🎀", "🛍️", "🛒", "💝", "📦", "🎈", "🎉"],
  },
  {
    label: "Hearts & Love",
    emojis: ["❤️", "💕", "💖", "💗", "💘", "💞", "💙", "💜"],
  },
  {
    label: "Flowers",
    emojis: ["🌹", "🌸", "🌷", "🌻", "🌺", "💐", "🌼", "🪷"],
  },
  {
    label: "Chocolates & Sweets",
    emojis: ["🍫", "🍬", "🍭", "🍰", "🧁", "🎂", "🍩", "🍪"],
  },
  {
    label: "Jewelry & Luxury",
    emojis: ["💎", "💍", "👑", "💰", "🤑", "💼", "🪙", "💵"],
  },
  {
    label: "Drinks",
    emojis: ["🥂", "🍷", "🍾", "🍹", "🍺", "🍸", "☕", "🧋"],
  },
  {
    label: "Animals",
    emojis: ["🦁", "🦄", "🐰", "🐱", "🐶", "🐼", "🦋", "🐦"],
  },
  {
    label: "Symbols & Fire",
    emojis: ["🔥", "⭐", "✨", "💫", "🏆", "🌟", "⚡", "🌈"],
  },
];

// Live gift type from the API
type ApiGift = {
  id: number;
  catalog_name: string;
  icon: string;
  coins: number;
  status?: boolean;
};

function AdminGifts() {
  const share = useGifts((s) => s.creatorShare);
  const setShare = useGifts((s) => s.setCreatorShare);
  const history = useGifts((s) => s.history);
  const [draft, setDraft] = useState(share);

  // Live gifts from API
  const [gifts, setGifts] = useState<ApiGift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    catalog_name: "",
    icon: "🎁",
    coins: 0,
  });

  // Edit coins modal state
  const [editingGift, setEditingGift] = useState<ApiGift | null>(null);
  const [editCoins, setEditCoins] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalCoins = history.reduce((a, h) => a + h.price, 0);
  const creatorCut = Math.round((totalCoins * share) / 100);
  const platformCut = totalCoins - creatorCut;

  // Fetch gifts from API
  const fetchGifts = useCallback(async () => {
    if (!API_BASE_URL) {
      setGiftsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/gifts`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Failed to load gifts (${response.status})`);
      const data = await response.json();
      setGifts(Array.isArray(data) ? data : (data.gifts ?? data.data ?? []));
    } catch (error) {
      console.error("Fetch gifts error:", error);
      toast.error("Unable to load gift catalog.");
    } finally {
      setGiftsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  // ---------- Create Modal ----------
  const openCreateModal = () => {
    setFormData({ catalog_name: "", icon: "🎁", coins: 0 });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.catalog_name.trim()) return toast.error("Gift name is required.");
    if (!formData.icon.trim()) return toast.error("Gift icon is required.");
    if (formData.coins < 0) return toast.error("Coins must be 0 or greater.");

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          catalog_name: formData.catalog_name.trim(),
          icon: formData.icon.trim(),
          coins: Number(formData.coins),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to create gift (${response.status})`);

      toast.success(`Gift "${formData.catalog_name}" created successfully!`);
      setIsCreateModalOpen(false);
      fetchGifts();
    } catch (error) {
      console.error("Create gift error:", error);
      toast.error(error instanceof Error ? error.message : "Unable to create gift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Edit Coins Modal ----------
  const openEditModal = (gift: ApiGift) => {
    setEditingGift(gift);
    setEditCoins(gift.coins);
  };

  const closeEditModal = () => {
    if (isUpdating) return;
    setEditingGift(null);
  };

  const handleUpdateCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGift) return;
    if (editCoins < 0) return toast.error("Coins must be 0 or greater.");
    if (editCoins === editingGift.coins) {
      toast("Coins value unchanged.");
      setEditingGift(null);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/gifts/${editingGift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ coins: Number(editCoins) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Failed to update gift (${response.status})`);

      toast.success(`"${editingGift.catalog_name}" coins updated to ${editCoins}.`);
      setEditingGift(null);
      fetchGifts();
    } catch (error) {
      console.error("Update gift error:", error);
      toast.error(error instanceof Error ? error.message : "Unable to update gift.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gift Management" subtitle="Configure gift catalog & revenue split" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: GiftIcon, label: "Gifts sent", value: history.length },
          { icon: Coins, label: "Gift revenue", value: totalCoins },
          { icon: TrendingUp, label: "Platform earnings", value: platformCut },
          { icon: Percent, label: "Creator share", value: `${share}%` },
        ].map((s) => (
          <GlassCard key={s.label}>
            <s.icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="font-bold mb-3">Revenue Split</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Creators get <b>{draft}%</b> · Platform keeps {100 - draft}%
        </p>
        <input
          type="range"
          min={5}
          max={80}
          value={draft}
          onChange={(e) => setDraft(+e.target.value)}
          className="w-full"
        />
        <button
          onClick={() => {
            setShare(draft);
            toast.success(`Creator share set to ${draft}%`);
          }}
          className="mt-3 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow"
        >
          Save changes
        </button>
      </GlassCard>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Gift Catalog ({gifts.length})</h3>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold shadow-glow"
          >
            <Plus className="h-4 w-4" />
            Create Gift
          </button>
        </div>

        {giftsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : gifts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No gifts in the catalog yet. Click "Create Gift" to add one.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gifts.map((g) => (
              <GlassCard key={g.id} className="text-center relative">
                <button
                  onClick={() => openEditModal(g)}
                  className="absolute top-1 right-1 rounded-full glass p-1 hover:bg-glass-border transition"
                  aria-label="Edit coins"
                  title="Edit coins"
                >
                  <Pencil className="h-3 w-3" />
                </button>

                <div className="text-3xl mb-1">{g.icon || "🎁"}</div>
                <p className="font-semibold text-xs truncate">{g.catalog_name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {g.status === false ? "inactive" : "active"}
                </p>
                <p className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-0.5 mt-1">
                  <Coins className="h-3 w-3" /> {g.coins}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* Create Gift Modal             */}
      {/* ============================== */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeCreateModal}
        >
          <div
            className="glass-strong rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Create New Gift</h3>
              <button
                onClick={closeCreateModal}
                disabled={isSubmitting}
                className="rounded-full p-1 hover:bg-glass disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Gift Name</label>
                <input
                  type="text"
                  value={formData.catalog_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, catalog_name: e.target.value }))
                  }
                  placeholder="e.g. Diamond Ring"
                  disabled={isSubmitting}
                  className="w-full glass rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Gift Icon (Emoji or short text)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  placeholder="🎁"
                  disabled={isSubmitting}
                  className="w-full glass rounded-xl px-3 py-2 text-sm outline-none text-center text-xl disabled:opacity-50"
                  required
                />

                {/* Categorized emoji picker */}
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto glass rounded-xl p-2">
                  {EMOJI_CATEGORIES.map((category) => (
                    <div key={category.label}>
                      <p className="text-[10px] text-muted-foreground font-semibold mb-1">
                        {category.label}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {category.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                            disabled={isSubmitting}
                            className={`text-xl rounded-lg p-1 transition disabled:opacity-50 ${
                              formData.icon === emoji
                                ? "bg-gradient-primary ring-1 ring-primary"
                                : "glass hover:bg-glass-border"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Coins (Price)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.coins}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coins: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="e.g. 100"
                  disabled={isSubmitting}
                  className="w-full glass rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl glass px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Gift"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* Edit Coins Modal              */}
      {/* ============================== */}
      {editingGift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeEditModal}
        >
          <div
            className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Edit Gift Coins</h3>
              <button
                onClick={closeEditModal}
                disabled={isUpdating}
                className="rounded-full p-1 hover:bg-glass disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="glass rounded-2xl p-4 mb-4 text-center">
              <div className="text-4xl mb-1">{editingGift.icon || "🎁"}</div>
              <p className="font-semibold text-sm">{editingGift.catalog_name}</p>
              <p className="text-[10px] text-muted-foreground">Name and icon cannot be changed</p>
            </div>

            <form onSubmit={handleUpdateCoins} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Coins (Price)</label>
                <input
                  type="number"
                  min={0}
                  value={editCoins}
                  onChange={(e) => setEditCoins(Number(e.target.value) || 0)}
                  placeholder="e.g. 100"
                  disabled={isUpdating}
                  className="w-full glass rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Current: <b>{editingGift.coins}</b> coins
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="flex-1 rounded-xl glass px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Coins"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
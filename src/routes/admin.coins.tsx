import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Search, Loader2, X, Star, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/coins")({ component: AdminCoins });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type QuickPack = {
  id: number;
  coins: number;
  bonus: number;
  mrp: number;
  is_active: boolean;
  display_order: number;
};

function AdminCoins() {
  const [packs, setPacks] = useState<QuickPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPackId, setEditingPackId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    coins: 0,
    bonus: 0,
    mrp: 0,
    display_order: 0,
    is_active: true,
  });

  // Fetch existing coin packs
  const fetchPacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quick-packs/`);
      if (response.ok) {
        const data = await response.json();
        setPacks(Array.isArray(data) ? data : data.data || []);
      } else {
        throw new Error("Failed to fetch coin packs");
      }
    } catch (error) {
      console.error("Error fetching packs:", error);
      toast.error("Failed to load coin packs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingPackId(null);
    setFormData({ coins: 0, bonus: 0, mrp: 0, display_order: 0, is_active: true });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditClick = (pack: QuickPack) => {
    setEditingPackId(pack.id);
    setFormData({
      coins: pack.coins,
      bonus: pack.bonus,
      mrp: pack.mrp,
      display_order: pack.display_order,
      is_active: pack.is_active,
    });
    setIsModalOpen(true);
  };

  // Submit new or edited coin pack
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.coins <= 0 || formData.mrp <= 0) {
      toast.error("Coins and MRP must be greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = editingPackId !== null;
      const url = isEditing 
        ? `${API_BASE_URL}/quick-packs/${editingPackId}` 
        : `${API_BASE_URL}/quick-packs/`;
      
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Failed to ${isEditing ? "update" : "create"} coin pack`);
      }

      toast.success(`Coin pack ${isEditing ? "updated" : "added"} successfully!`);
      setIsModalOpen(false);
      fetchPacks(); // Refresh table
    } catch (error: any) {
      toast.error(error.message || "Failed to save coin pack.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete coin pack
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/quick-packs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete pack");
      }

      toast.success("Coin pack deleted successfully!");
      setPacks((prev) => prev.filter((p) => p.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter packs based on search term
  const filteredPacks = packs.filter((pack) => {
    const term = searchTerm.toLowerCase();
    return (
      pack.coins.toString().includes(term) ||
      pack.bonus.toString().includes(term) ||
      pack.mrp.toString().includes(term)
    );
  });

  return (
    <div>
      <PageHeader title="Coin Packs Management" subtitle="Add and manage quick coin packs" />
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by coins, bonus, or MRP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none"
          />
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" /> Add Coin Pack
        </button>
      </div>

      {/* Table */}
      <GlassCard>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-glass-border">
                <tr className="text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Coins</th>
                  <th className="py-3 px-4 font-medium">Bonus</th>
                  <th className="py-3 px-4 font-medium">MRP (₹)</th>
                  <th className="py-3 px-4 font-medium">Order</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      No coin packs found. Click "Add Coin Pack" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredPacks.map((pack) => (
                    <tr key={pack.id} className="border-b border-glass-border last:border-0 hover:bg-glass transition">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        {pack.coins}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">+ {pack.bonus}</td>
                      <td className="py-3 px-4 font-semibold">₹{pack.mrp}</td>
                      <td className="py-3 px-4 text-muted-foreground">{pack.display_order}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pack.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {pack.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(pack)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(pack.id)}
                            disabled={deletingId === pack.id}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition disabled:opacity-50"
                          >
                            {deletingId === pack.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-strong rounded-3xl p-6 shadow-glow relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-glass transition"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h2 className="text-xl font-bold mb-1">
              {editingPackId ? "Edit Coin Pack" : "Add New Coin Pack"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {editingPackId ? "Update the details for this pack." : "Fill in the details for the new quick pack."}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Coins *</label>
                  <input
                    type="number"
                    name="coins"
                    value={formData.coins}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bonus Coins</label>
                  <input
                    type="number"
                    name="bonus"
                    value={formData.bonus}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">MRP (₹) *</label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 accent-primary rounded"
                />
                <label htmlFor="is_active" className="text-sm cursor-pointer">Is Active?</label>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  editingPackId ? "Update Pack" : "Save Pack"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
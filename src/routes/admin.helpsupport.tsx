import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Loader2, X, HelpCircle, ChevronDown, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/admin/helpsupport")({ component: HelpSupport });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type HelpItem = {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

function HelpSupport() {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const [form, setForm] = useState({
    question: "",
    answer: "",
    is_active: true,
  });

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/help-support/`);
      if (!res.ok) throw new Error("Failed to fetch help items");
      const data = await res.json();
      
      // Handle if API returns "Data not found" gracefully
      if (data?.detail === "Data not found") {
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (err: any) {
      toast.error(err.message || "Unable to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async () => {
    if (!form.question || !form.answer) {
      return toast.error("Question and Answer are required");
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/help-support/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create item");
      }

      const newItem = await res.json();
      setItems([newItem, ...items]);
      toast.success("Help item created successfully");
      
      // Reset form and close modal
      setForm({ question: "", answer: "", is_active: true });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Unable to save item");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader 
        title="Help & Support" 
        subtitle="Manage FAQs and support answers" 
        action={
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add New
          </button>
        } 
      />

      <GlassCard>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <HelpCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No support articles found.</p>
            <p className="text-muted-foreground text-xs">Click "Add New" to create your first article.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((item) => (
              <div key={item.id} className="w-full">
                <button 
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  <div className="flex items-center gap-3 pr-4 min-w-0">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${item.is_active ? "bg-emerald-500" : "bg-slate-500"}`}></span>
                    <span className="font-medium text-sm truncate">{item.question}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] rounded-full px-2 py-0.5 hidden sm:inline-block ${item.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>
                      {item.is_active ? "Active" : "Hidden"}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${openId === item.id ? "rotate-180" : ""}`} />
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {openId === item.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create Modal */}
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
              className="glass rounded-2xl p-6 max-w-lg w-full space-y-4" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">Create Support Article</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Question</label>
                  <input 
                    placeholder="e.g. How do I reset my password?" 
                    value={form.question} 
                    onChange={(e) => setForm({ ...form, question: e.target.value })} 
                    className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Answer</label>
                  <textarea 
                    placeholder="Type the detailed answer here..." 
                    value={form.answer} 
                    onChange={(e) => setForm({ ...form, answer: e.target.value })} 
                    rows={5} 
                    className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none" 
                  />
                </div>

                <div className="flex items-center justify-between glass rounded-xl px-3 py-2.5">
                  <label htmlFor="status" className="text-sm text-muted-foreground cursor-pointer">
                    Visible / Active
                  </label>
                  <input 
                    type="checkbox" 
                    id="status" 
                    checked={form.is_active} 
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })} 
                    className="h-4 w-4 accent-primary cursor-pointer" 
                  />
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={isSaving}
                  className="w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Article"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
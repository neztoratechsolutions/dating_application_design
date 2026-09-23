import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Save, Loader2, Bold, Italic, List, Link as LinkIcon, Heading, 
  Plus, ChevronDown, HelpCircle, Pencil, Trash2, X
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const PAGES = [
  { id: "privacy", title: "Privacy Policy", endpoint: "privacy-policy", hasName: false },
  { id: "terms", title: "Terms & Conditions", endpoint: "terms-and-conditions", hasName: false },
  { id: "refund", title: "Refund Policy", endpoint: "refund-policies", hasName: false },
  { id: "community", title: "Community Guidelines", endpoint: "community-guidelines", hasName: false },
  { id: "creator", title: "Creator Agreement", endpoint: "creator-agreements", hasName: false },
  { id: "safety", title: "Safety Policy", endpoint: "safety-policies", hasName: false },
  { id: "about", title: "About Us", endpoint: "about-us", hasName: true },
  { id: "faq", title: "FAQ", endpoint: "faqs", isFaq: true },
];

type PageItem = {
  id: number;
  question?: string; // For FAQ
  answer?: string;   // For FAQ
  name?: string;     // For About Us
  details?: string;  // For Static Pages
  status: boolean;
};

function Page() {
  const [active, setActive] = useState("privacy");
  const [list, setList] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [openItemId, setOpenItemId] = useState<number | null>(null);
  
  // Unified form state
  const [form, setForm] = useState({
    name: "",
    details: "",
    question: "",
    answer: "",
    status: true,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const activePage = PAGES.find(p => p.id === active);
  const isFaq = activePage?.isFaq;

  // Fetch list whenever active tab changes
  useEffect(() => {
    fetchList();
  }, [active]);

  // Sync WYSIWYG editor HTML ONLY when modal opens or editingId changes
  // This prevents the cursor from jumping while typing
  useEffect(() => {
    if (isModalOpen && !isFaq && editorRef.current) {
      editorRef.current.innerHTML = form.details;
    }
  }, [isModalOpen, editingId, isFaq]);

  // --- API CALLS ---
   // --- API CALLS ---
  const fetchList = async () => {
    setLoading(true);
    if (!activePage) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${activePage.endpoint}/`);
      const data = await res.json();
      
      // If the API returns an error (like 404 "No data found"), 
      // just silently set the list to empty instead of throwing an error.
      if (!res.ok) {
        if (data?.detail === "No data found" || res.status === 404) {
          setList([]);
        } else {
          throw new Error(data?.detail || "Failed to fetch data");
        }
        return;
      }
      
      setList(Array.isArray(data) ? data : (data?.data || []));
    } catch (err: any) {
      toast.error(err.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name: "", details: "", question: "", answer: "", status: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PageItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      details: item.details || "",
      question: item.question || "",
      answer: item.answer || "",
      status: item.status,
    });
    setIsModalOpen(true);
  };

  // --- WYSIWYG Editor Handlers ---
  const handleEditorInput = () => {
    if (editorRef.current) {
      setForm(prev => ({ ...prev, details: editorRef.current!.innerHTML }));
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const addLink = () => {
    const url = window.prompt("Enter the URL (e.g., https://example.com)");
    if (url) applyFormat("createLink", url);
  };

  // --- SAVE (POST / PUT) ---
  const handleSubmit = async () => {
    if (!activePage) return;

    let payload: any = { status: form.status };

    if (isFaq) {
      if (!form.question || !form.answer) return toast.error("Question and Answer are required");
      payload.question = form.question;
      payload.answer = form.answer;
      payload.created_by = 1;
    } else {
      if (!form.details) return toast.error("Content is required");
      payload.details = form.details;
      if (activePage.hasName) {
        payload.name = form.name || "Untitled";
      }
    }

    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_BASE_URL}/${activePage.endpoint}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/${activePage.endpoint}/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save");
      const savedItem = await res.json();
      
      if (editingId) {
        setList(list.map(i => i.id === editingId ? savedItem : i));
        toast.success("Updated successfully");
      } else {
        setList([savedItem, ...list]);
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE ---
  const handleDelete = async (id: number) => {
    const original = [...list];
    setList(list.filter(i => i.id !== id));
    try {
      const res = await fetch(`${API_BASE_URL}/${activePage?.endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deleted successfully");
      if (openItemId === id) setOpenItemId(null);
    } catch {
      setList(original);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Legal & Content Management" subtitle="Edit policies, guidelines, and FAQs" />

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        {/* Sidebar Pages List */}
        <GlassCard className="h-fit">
          <h4 className="text-xs uppercase text-muted-foreground mb-2 px-1">Pages</h4>
          <div className="space-y-1">
            {PAGES.map((p) => (
              <button 
                key={p.id} 
                onClick={() => setActive(p.id)} 
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${active === p.id ? "bg-gradient-primary shadow-glow" : "hover:bg-white/5"}`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />{p.title}
                </span>
                {active === p.id && list.length > 0 && (
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white">
                    {list.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Main Content Area */}
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={openCreateModal} 
              className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add New {isFaq ? "FAQ" : "Entry"}
            </button>
          </div>

          {loading ? (
            <GlassCard className="flex justify-center items-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </GlassCard>
          ) : list.length === 0 ? (
            <GlassCard className="text-center py-24 flex flex-col items-center gap-3">
              <HelpCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No entries found yet.</p>
              <p className="text-muted-foreground text-xs">Click "Add New" to create your first item.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {list.map((item, index) => (
                <GlassCard key={item.id} className="overflow-hidden transition-all">
                  <div className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors">
                    <button 
                      className="flex items-center gap-3 pr-4 flex-1 min-w-0"
                      onClick={() => setOpenItemId(openItemId === item.id ? null : item.id)}
                    >
                      <span className="text-xs font-bold text-muted-foreground w-6 flex-shrink-0">#{index + 1}</span>
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${item.status ? "bg-emerald-500" : "bg-slate-500"}`}></span>
                      <span className="font-medium text-sm truncate">
                        {isFaq ? item.question : (activePage?.hasName ? item.name : `${activePage?.title} Entry`)}
                      </span>
                    </button>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] rounded-full px-2 py-0.5 hidden sm:inline-block ${item.status ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>
                        {item.status ? "Active" : "Hidden"}
                      </span>
                      <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg glass hover:bg-amber-500/20 text-amber-300 transition-colors" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg glass hover:bg-rose-500/20 text-rose-300 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setOpenItemId(openItemId === item.id ? null : item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openItemId === item.id ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {openItemId === item.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5 overflow-hidden"
                      >
                        <div className="p-4 text-sm text-muted-foreground leading-relaxed">
                          {isFaq ? (
                            <p>{item.answer}</p>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: item.details || "" }} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Update Modal */}
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
              className="glass rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between sticky top-0 bg-glass pb-2 z-10">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${editingId ? "bg-amber-500/15 text-amber-300" : "bg-primary/15 text-primary"}`}>
                    {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{editingId ? `Edit ${activePage?.title}` : `Create ${activePage?.title}`}</h3>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 pt-2">
                {/* Conditional Inputs based on Page Type */}
                {isFaq ? (
                  <>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Question</label>
                      <input 
                        placeholder="e.g. How do I purchase coins?" 
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
                  </>
                ) : (
                  <>
                    {activePage?.hasName && (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Company / Page Name</label>
                        <input 
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Enter the name..."
                          className="w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    )}

                    {/* WYSIWYG Toolbar */}
                    <div className="flex gap-1 mb-2 border-b border-white/10 pb-2">
                      <button onClick={() => applyFormat('bold')} className="p-1.5 rounded-lg hover:bg-white/10" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                      <button onClick={() => applyFormat('italic')} className="p-1.5 rounded-lg hover:bg-white/10" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                      <button onClick={() => applyFormat('formatBlock', '<h3>')} className="p-1.5 rounded-lg hover:bg-white/10" title="Heading"><Heading className="h-3.5 w-3.5" /></button>
                      <button onClick={() => applyFormat('insertUnorderedList')} className="p-1.5 rounded-lg hover:bg-white/10" title="Bullet List"><List className="h-3.5 w-3.5" /></button>
                      <button onClick={addLink} className="p-1.5 rounded-lg hover:bg-white/10" title="Insert Link"><LinkIcon className="h-3.5 w-3.5" /></button>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Content</label>
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleEditorInput}
                        className="w-full glass rounded-xl px-4 py-3 text-sm outline-none min-h-[250px] prose prose-invert max-w-none focus:ring-1 focus:ring-primary/50"
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                    </div>
                  </>
                )}

                {/* Status Toggle */}
                <div className="flex items-center justify-between glass rounded-xl px-3 py-2.5">
                  <label htmlFor="status" className="text-sm text-muted-foreground cursor-pointer">
                    Visible / Published
                  </label>
                  <input 
                    type="checkbox" 
                    id="status" 
                    checked={form.status} 
                    onChange={(e) => setForm({ ...form, status: e.target.checked })} 
                    className="h-4 w-4 accent-primary cursor-pointer" 
                  />
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={saving}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity ${
                    editingId ? "bg-amber-500 text-black" : "bg-gradient-primary"
                  }`}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : editingId ? "Update Changes" : "Save New Entry"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/legal")({ component: Page });
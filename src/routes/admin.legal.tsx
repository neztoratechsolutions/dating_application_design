import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Save, Eye, History, RotateCcw, Bold, Italic, List, Link as LinkIcon, Heading } from "lucide-react";

const PAGES = [
  { id: "privacy", title: "Privacy Policy" },
  { id: "terms", title: "Terms & Conditions" },
  { id: "refund", title: "Refund Policy" },
  { id: "community", title: "Community Guidelines" },
  { id: "creator", title: "Creator Agreement" },
  { id: "safety", title: "Safety Policy" },
  { id: "about", title: "About Us" },
  { id: "faq", title: "FAQ" },
];

type Doc = {
  content: string; meta: string; metaDesc: string;
  versions: { date: string; by: string; content: string }[];
  status: "Draft" | "Published";
};

const initial = Object.fromEntries(PAGES.map((p) => [p.id, {
  content: `# ${p.title}\n\nLast updated June 2026.\n\nWelcome to Velora Live. This document explains ${p.title.toLowerCase()}.`,
  meta: `${p.title} | Velora Live`,
  metaDesc: `Read the official ${p.title.toLowerCase()} of Velora Live.`,
  versions: [
    { date: "2026-06-01 10:30", by: "Admin Raj", content: "Initial publish" },
    { date: "2026-05-15 14:20", by: "Admin Priya", content: "Draft v1" },
  ],
  status: "Published",
}])) as Record<string, Doc>;

function Page() {
  const [active, setActive] = useState("privacy");
  const [docs, setDocs] = useState<Record<string, Doc>>(initial);
  const [showVersions, setShowVersions] = useState(false);
  const [preview, setPreview] = useState(false);
  const doc = docs[active];

  function update(patch: Partial<Doc>) { setDocs({ ...docs, [active]: { ...doc, ...patch } }); }

  function saveDraft() {
    update({ status: "Draft", versions: [{ date: new Date().toISOString().slice(0, 16).replace("T", " "), by: "Admin Raj", content: "Draft saved" }, ...doc.versions] });
    toast.success("Draft saved");
  }
  function publish() {
    update({ status: "Published", versions: [{ date: new Date().toISOString().slice(0, 16).replace("T", " "), by: "Admin Raj", content: "Published" }, ...doc.versions] });
    toast.success("Published live");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Legal Pages" subtitle="Content management & version history" />

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <GlassCard className="h-fit">
          <h4 className="text-xs uppercase text-muted-foreground mb-2 px-1">Pages</h4>
          <div className="space-y-1">
            {PAGES.map((p) => (
              <button key={p.id} onClick={() => setActive(p.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${active === p.id ? "bg-gradient-primary shadow-glow" : "hover:bg-white/5"}`}>
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" />{p.title}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${docs[p.id].status === "Published" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{docs[p.id].status}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-bold">{PAGES.find((p) => p.id === active)?.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => setPreview(true)} className="glass rounded-xl px-3 py-1.5 text-xs flex items-center gap-1"><Eye className="h-3.5 w-3.5" />Preview</button>
                <button onClick={() => setShowVersions(true)} className="glass rounded-xl px-3 py-1.5 text-xs flex items-center gap-1"><History className="h-3.5 w-3.5" />Versions</button>
                <button onClick={saveDraft} className="glass rounded-xl px-3 py-1.5 text-xs">Save Draft</button>
                <button onClick={publish} className="rounded-xl bg-gradient-primary px-3 py-1.5 text-xs font-semibold shadow-glow flex items-center gap-1"><Save className="h-3.5 w-3.5" />Publish</button>
              </div>
            </div>

            <div className="flex gap-1 mb-2 border-b border-white/10 pb-2">
              {[Bold, Italic, Heading, List, LinkIcon].map((Icon, i) => (
                <button key={i} className="p-1.5 rounded-lg hover:bg-white/10"><Icon className="h-3.5 w-3.5" /></button>
              ))}
            </div>
            <textarea value={doc.content} onChange={(e) => update({ content: e.target.value })} rows={18}
              className="w-full glass rounded-xl px-4 py-3 text-sm outline-none font-mono" />
          </GlassCard>

          <GlassCard>
            <h4 className="font-semibold mb-2 text-sm">SEO Settings</h4>
            <div className="space-y-2">
              <input value={doc.meta} onChange={(e) => update({ meta: e.target.value })} placeholder="Meta title" className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
              <textarea value={doc.metaDesc} onChange={(e) => update({ metaDesc: e.target.value })} rows={2} placeholder="Meta description" className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {showVersions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setShowVersions(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-3">Version History</h3>
              <div className="space-y-2 max-h-80 overflow-auto">
                {doc.versions.map((v, i) => (
                  <div key={i} className="flex items-center justify-between glass rounded-xl p-3">
                    <div><p className="font-medium text-sm">{v.content}</p><p className="text-xs text-muted-foreground">{v.date} · {v.by}</p></div>
                    <button onClick={() => toast.success(`Rolled back to ${v.date}`)} className="glass rounded-lg px-2 py-1 text-xs flex items-center gap-1"><RotateCcw className="h-3 w-3" />Rollback</button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowVersions(false)} className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 font-semibold">Close</button>
            </motion.div>
          </motion.div>
        )}
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={() => setPreview(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <pre className="whitespace-pre-wrap text-sm font-sans">{doc.content}</pre>
              <button onClick={() => setPreview(false)} className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 font-semibold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/legal")({ component: Page });

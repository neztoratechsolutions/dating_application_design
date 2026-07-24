// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useState, useMemo } from "react";
// import { CREATORS, STATES, LANGUAGES } from "@/lib/mock-data";
// import { GlassCard, OnlineDot, PageHeader } from "@/components/ui-kit";
// import { Filter, X } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// export const Route = createFileRoute("/app/creators")({ component: Creators });

// function Creators() {
//   const [state, setState] = useState<string>("All");
//   const [lang, setLang] = useState<string>("All");
//   const [onlineOnly, setOnlineOnly] = useState(false);
//   const [open, setOpen] = useState(false);

//   const list = useMemo(() => CREATORS.filter((c) =>
//     (state === "All" || c.state === state) &&
//     (lang === "All" || c.language === lang) &&
//     (!onlineOnly || c.online),
//   ), [state, lang, onlineOnly]);

//   return (
//     <div>
//       <PageHeader title="Creators" subtitle={`${list.length} creators available`} action={
//         <button onClick={() => setOpen(true)} className="rounded-full glass px-4 py-2 text-sm flex items-center gap-1.5">
//           <Filter className="h-4 w-4" /> Filters
//         </button>
//       } />

//       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
//         <button onClick={() => setOnlineOnly(!onlineOnly)}
//           className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${onlineOnly ? "bg-gradient-primary shadow-glow" : "glass"}`}>
//           🟢 Online only
//         </button>
//         {["All", ...STATES.slice(0, 6)].map((s) => (
//           <button key={s} onClick={() => setState(s)}
//             className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${state === s ? "bg-gradient-primary shadow-glow" : "glass"}`}>
//             {s}
//           </button>
//         ))}
//       </div>

//       {list.length === 0 ? (
//         <div className="text-center py-16 text-muted-foreground">No creators match these filters</div>
//       ) : (
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           {list.map((c) => (
//             <Link key={c.id} to="/app/creator/$id" params={{ id: c.id }}>
//               <GlassCard hover className="!p-0 overflow-hidden">
//                 <div className="relative aspect-square bg-gradient-accent">
//                   <img src={c.avatar} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
//                   <span className="absolute top-2 right-2"><OnlineDot online={c.online} /></span>
//                 </div>
//                 <div className="p-3">
//                   <p className="font-semibold text-sm truncate">{c.name}</p>
//                   <p className="text-xs text-muted-foreground">⭐ {c.rating} · {c.state}</p>
//                   <p className="text-xs text-primary mt-1">{c.chatPrice} coins/min</p>
//                 </div>
//               </GlassCard>
//             </Link>
//           ))}
//         </div>
//       )}

//       <AnimatePresence>
//         {open && (
//           <motion.div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center"
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
//             <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
//               onClick={(e) => e.stopPropagation()}
//               className="glass-strong rounded-t-3xl md:rounded-3xl p-6 w-full max-w-md">
//               <div className="flex justify-between mb-4">
//                 <h3 className="font-bold">Filters</h3>
//                 <button onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
//               </div>
//               <label className="text-xs text-muted-foreground">State</label>
//               <select value={state} onChange={(e) => setState(e.target.value)} className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 mb-3 outline-none">
//                 <option className="bg-background">All</option>
//                 {STATES.map((s) => <option key={s} className="bg-background">{s}</option>)}
//               </select>
//               <label className="text-xs text-muted-foreground">Language</label>
//               <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 mb-5 outline-none">
//                 <option className="bg-background">All</option>
//                 {LANGUAGES.map((l) => <option key={l} className="bg-background">{l}</option>)}
//               </select>
//               <button onClick={() => setOpen(false)} className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">Apply</button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard, OnlineDot, PageHeader } from "@/components/ui-kit";
import { Filter, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/creators")({ component: Creators });

interface Creator {
  id: string | number;
  display_name: string;
  profile_photo: string | null;
  is_online: boolean;
  state_id?: number | null;
  reviews?: {
    average_rating: number;
    total_reviews: number;
  };
  pricing?: {
    chat_amount: number;
    voice_call_amount: number;
    video_call_amount: number;
  };
}

// Interface for your States API
interface StateData {
  id: number;
  state_name: string;
}

function Creators() {
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [lang, setLang] = useState<string>("All");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [open, setOpen] = useState(false);
  
  const [creators, setCreators] = useState<Creator[]>([]);
  const [states, setStates] = useState<StateData[]>([]); // State for dynamic states
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

  // 1. Fetch States on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/states/`);
        const data = await res.json();
        // Assuming the API returns an array directly. If it returns { data: [...] }, use data.data instead.
        if (Array.isArray(data)) {
          setStates(data);
        } else if (data.data) {
          setStates(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch states:", error);
      }
    };
    fetchStates();
  }, [API_BASE_URL]);

  // 2. Fetch Creators when filters change
  useEffect(() => {
    const fetchCreators = async () => {
      setIsLoading(true);
      try {
        let url = `${API_BASE_URL}/users/filter/?role=creator`;
        
        if (onlineOnly) {
          url += `&is_online=true`;
        }

        if (selectedStateId !== null) {
          url += `&state_id=${selectedStateId}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.status_code === 200) {
          setCreators(data.data);
        } else {
          setCreators([]);
        }
      } catch (error) {
        console.error("Failed to fetch creators:", error);
        setCreators([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreators();
  }, [onlineOnly, selectedStateId, API_BASE_URL]);

  // Helper to fix backend relative image paths
  const getAvatar = (creator: Creator) => {
    if (!creator.profile_photo) {
      return `https://i.pravatar.cc/200?u=${creator.id}`;
    }
    if (creator.profile_photo.startsWith("uploads") || creator.profile_photo.startsWith("/uploads")) {
      const cleanPath = creator.profile_photo.replace(/\\/g, "/");
      return `${API_BASE_URL}/${cleanPath.replace(/^\//, "")}`;
    }
    return creator.profile_photo;
  };

  // Helper to get state name by ID
  const getStateName = (id: number | null | undefined) => {
    if (!id) return "India";
    const state = states.find(s => s.id === id);
    return state ? state.state_name : "India";
  };

  return (
    <div>
      <PageHeader 
        title="Creators" 
        subtitle={`${isLoading ? "Loading..." : `${creators.length} creators available`}`} 
        action={
          <button onClick={() => setOpen(true)} className="rounded-full glass px-4 py-2 text-sm flex items-center gap-1.5">
            <Filter className="h-4 w-4" /> Filters
          </button>
        } 
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
        <button 
          onClick={() => setOnlineOnly(!onlineOnly)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${onlineOnly ? "bg-gradient-primary shadow-glow" : "glass"}`}
        >
          🟢 Online only
        </button>
        
        <button 
          onClick={() => setSelectedStateId(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${selectedStateId === null ? "bg-gradient-primary shadow-glow" : "glass"}`}
        >
          All
        </button>

        {states.map((s) => (
          <button 
            key={s.id} 
            onClick={() => setSelectedStateId(s.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${selectedStateId === s.id ? "bg-gradient-primary shadow-glow" : "glass"}`}
          >
            {s.state_name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No creators match these filters</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {creators.map((c) => (
            <Link key={c.id} to="/app/creator/$id" params={{ id: String(c.id) }}>
              <GlassCard hover className="!p-0 overflow-hidden">
                <div className="relative aspect-square bg-gradient-accent">
                  <img 
                    src={getAvatar(c)} 
                    alt={c.display_name} 
                    className="absolute inset-0 h-full w-full object-cover" 
                  />
                  <span className="absolute top-2 right-2">
                    <OnlineDot online={c.is_online} />
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {c.reviews?.average_rating || "0.0"} · {getStateName(c.state_id)}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {c.pricing?.chat_amount || "0"} coins/min
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-t-3xl md:rounded-3xl p-6 w-full max-w-md">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">Filters</h3>
                <button onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
              </div>
              
              <label className="text-xs text-muted-foreground">State</label>
              <select 
                value={selectedStateId ?? "All"} 
                onChange={(e) => setSelectedStateId(e.target.value === "All" ? null : Number(e.target.value))} 
                className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 mb-3 outline-none"
              >
                <option value="All" className="bg-background">All</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id} className="bg-background">{s.state_name}</option>
                ))}
              </select>

              <label className="text-xs text-muted-foreground">Language</label>
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)} 
                className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 mb-5 outline-none"
              >
                <option className="bg-background">All</option>
                {/* You can also connect a languages API here later if needed */}
              </select>
              
              <button onClick={() => setOpen(false)} className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">
                Apply
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
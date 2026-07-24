import { createFileRoute, Link } from "@tanstack/react-router";
import { CREATORS } from "@/lib/mock-data";
import { GlassCard, OnlineDot, PageHeader } from "@/components/ui-kit";
import { motion } from "framer-motion";
import { Flame, Sparkles, MessageCircle, Phone, Video } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const online = CREATORS.filter((c) => c.online).slice(0, 8);
  const trending = CREATORS.slice(0, 6);

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
        <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Today's pick</p>
        <h2 className="text-2xl font-bold">Connect with creators<br /><span className="gradient-text">live now</span></h2>
        <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-sm">312 creators online. Find your vibe instantly.</p>
        <Link to="/app/creators" className="inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold shadow-glow">
          Browse all
        </Link>
      </motion.section>

      <section>
        <PageHeader title="🔥 Online now" subtitle="Tap to start chatting" action={
          <Link to="/app/creators" className="text-sm text-primary">See all</Link>
        } />
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {online.map((c) => (
            <Link key={c.id} to="/app/creator/$id" params={{ id: c.id }} className="shrink-0 text-center">
              <div className="relative">
                <img src={c.avatar} alt={c.name} className="h-20 w-20 rounded-full ring-2 ring-primary p-0.5" />
                <span className="absolute bottom-1 right-1"><OnlineDot online={c.online} /></span>
              </div>
              <p className="text-xs mt-1.5 max-w-[5rem] truncate">{c.name.split(" ")[0]}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <PageHeader title="Trending creators" action={
          <Link to="/app/creators" className="text-sm text-primary">See all</Link>
        } />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {trending.map((c) => (
            <Link key={c.id} to="/app/creator/$id" params={{ id: c.id }}>
              <GlassCard hover className="!p-0 overflow-hidden">
                <div className="relative aspect-[3/4] bg-gradient-accent">
                  <img src={c.avatar} alt={c.name} className="absolute inset-0 h-full w-full object-cover opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
                    <div className="flex items-center gap-1.5">
                      <OnlineDot online={c.online} />
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">⭐ {c.rating} · {c.state}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="rounded-full bg-glass backdrop-blur-md px-1.5 py-0.5 text-[10px]"><Flame className="inline h-3 w-3 text-warning" /></span>
                  </div>
                </div>
                <div className="p-2 flex items-center justify-around text-xs">
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{c.chatPrice}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.voicePrice}</span>
                  <span className="flex items-center gap-1"><Video className="h-3 w-3" />{c.videoPrice}</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
// import { createFileRoute, Link } from "@tanstack/react-router";
// import { GlassCard, OnlineDot, PageHeader } from "@/components/ui-kit";
// import { motion } from "framer-motion";
// import { Flame, Sparkles, MessageCircle, Phone, Video } from "lucide-react";
// import { useEffect, useState } from "react";

// export const Route = createFileRoute("/app/")({ component: Home });

// // Define the type based on your FastAPI response
// interface Creator {
//   id: string | number;
//   display_name: string;
//   profile_photo: string | null;
//   is_online: boolean;
//   state_id?: number | null;
//   rating?: number;
//   chatPrice?: number;
//   voicePrice?: number;
//   videoPrice?: number;
// }

// function Home() {
//   const [onlineCreators, setOnlineCreators] = useState<Creator[]>([]);
//   const [trendingCreators, setTrendingCreators] = useState<Creator[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const API_BASE_URL = import.meta.env.VITE_BASE_URL;

//   useEffect(() => {
//     const fetchCreators = async () => {
//       try {
//         setIsLoading(true);
        
//         // 1. Fetch online creators (Updated URL path)
//         const onlineRes = await fetch(`${API_BASE_URL}/user-status/online-users?role=creator&is_online=true`);
//         const onlineData = await onlineRes.json();
        
//         if (onlineData.status_code === 200) {
//           setOnlineCreators(onlineData.data.slice(0, 8));
//         }

//         // 2. Fetch all creators for trending (Updated URL path)
//         const trendingRes = await fetch(`${API_BASE_URL}/user-status/online-users?role=creator`);
//         const trendingData = await trendingRes.json();
        
//         if (trendingData.status_code === 200) {
//           setTrendingCreators(trendingData.data.slice(0, 6));
//         }

//       } catch (error) {
//         console.error("Failed to fetch creators:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchCreators();
//   }, [API_BASE_URL]);

//   // Helper to get image with fallback and fix backend relative paths
//   const getAvatar = (creator: Creator) => {
//     if (!creator.profile_photo) {
//       return `https://i.pravatar.cc/200?u=${creator.id}`;
//     }
    
//     // If the path starts with "uploads", prepend the backend URL
//     // This converts "uploads\ Capture.PNG" to "http://127.0.0.1:8000/uploads/Capture.PNG"
//     if (creator.profile_photo.startsWith("uploads") || creator.profile_photo.startsWith("/uploads")) {
//       const cleanPath = creator.profile_photo.replace(/\\/g, "/"); // Replace backslashes with forward slashes
//       return `${API_BASE_URL}/${cleanPath.replace(/^\//, "")}`;
//     }
    
//     // If it's already a full URL (like a Google/Facebook avatar), return it directly
//     return creator.profile_photo;
//   };

//   // Loading state UI
//   if (isLoading) {
//     return (
//       <div className="space-y-8">
//         <div className="glass-strong rounded-3xl p-6 h-40 animate-pulse" />
//         <div className="flex gap-3 overflow-x-auto pb-2">
//           {[...Array(5)].map((_, i) => (
//             <div key={i} className="h-20 w-20 rounded-full bg-glass animate-pulse shrink-0" />
//           ))}
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//           {[...Array(4)].map((_, i) => (
//             <div key={i} className="aspect-[3/4] rounded-xl bg-glass animate-pulse" />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <motion.section 
//         initial={{ opacity: 0, y: 10 }} 
//         animate={{ opacity: 1, y: 0 }}
//         className="glass-strong rounded-3xl p-6 relative overflow-hidden"
//       >
//         <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
//         <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
//           <Sparkles className="h-3.5 w-3.5" /> Today's pick
//         </p>
//         <h2 className="text-2xl font-bold">
//           Connect with creators<br />
//           <span className="gradient-text">live now</span>
//         </h2>
//         <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-sm">
//           {onlineCreators.length} creators online. Find your vibe instantly.
//         </p>
//         <Link 
//           to="/app/creators" 
//           className="inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold shadow-glow"
//         >
//           Browse all
//         </Link>
//       </motion.section>

//       {/* Online Now Section */}
//       <section>
//         <PageHeader 
//           title="🔥 Online now" 
//           subtitle="Tap to start chatting" 
//           action={
//             <Link to="/app/creators" className="text-sm text-primary">See all</Link>
//           } 
//         />
        
//         {onlineCreators.length === 0 ? (
//           <p className="text-sm text-muted-foreground py-4">No creators online right now. Check back later!</p>
//         ) : (
//           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
//             {onlineCreators.map((c) => (
//               <Link 
//                 key={c.id} 
//                 to="/app/creator/$id" 
//                 params={{ id: String(c.id) }} 
//                 className="shrink-0 text-center"
//               >
//                 <div className="relative">
//                   <img 
//                     src={getAvatar(c)} 
//                     alt={c.display_name} 
//                     className="h-20 w-20 rounded-full ring-2 ring-primary p-0.5 object-cover" 
//                   />
//                   <span className="absolute bottom-1 right-1">
//                     <OnlineDot online={c.is_online} />
//                   </span>
//                 </div>
//                 <p className="text-xs mt-1.5 max-w-[5rem] truncate">
//                   {c.display_name.split(" ")[0]}
//                 </p>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Trending Creators Section */}
//       <section>
//         <PageHeader 
//           title="Trending creators" 
//           action={
//             <Link to="/app/creators" className="text-sm text-primary">See all</Link>
//           } 
//         />
        
//         {trendingCreators.length === 0 ? (
//           <p className="text-sm text-muted-foreground py-4">No creators found.</p>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//             {trendingCreators.map((c) => (
//               <Link key={c.id} to="/app/creator/$id" params={{ id: String(c.id) }}>
//                 <GlassCard hover className="!p-0 overflow-hidden">
//                   <div className="relative aspect-[3/4] bg-gradient-accent">
//                     <img 
//                       src={getAvatar(c)} 
//                       alt={c.display_name} 
//                       className="absolute inset-0 h-full w-full object-cover opacity-90" 
//                     />
//                     <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
//                       <div className="flex items-center gap-1.5">
//                         <OnlineDot online={c.is_online} />
//                         <p className="font-semibold text-sm truncate">{c.display_name}</p>
//                       </div>
//                       <p className="text-xs text-muted-foreground flex items-center gap-1">
//                         ⭐ {c.rating || "5.0"} · {c.state_id ? `State ${c.state_id}` : "India"}
//                       </p>
//                     </div>
//                     <div className="absolute top-2 right-2 flex gap-1">
//                       <span className="rounded-full bg-glass backdrop-blur-md px-1.5 py-0.5 text-[10px]">
//                         <Flame className="inline h-3 w-3 text-warning" />
//                       </span>
//                     </div>
//                   </div>
                  
//                   {/* Using fallback values since your API doesn't return pricing yet */}
//                   <div className="p-2 flex items-center justify-around text-xs">
//                     <span className="flex items-center gap-1">
//                       <MessageCircle className="h-3 w-3" /> {c.chatPrice || "10"}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <Phone className="h-3 w-3" /> {c.voicePrice || "20"}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <Video className="h-3 w-3" /> {c.videoPrice || "30"}
//                     </span>
//                   </div>
//                 </GlassCard>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }
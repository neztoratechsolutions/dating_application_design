// import {
//   createFileRoute,
//   useNavigate,
// } from "@tanstack/react-router";
// import {
//   ArrowLeft,
//   Send,
//   Smile,
//   ImagePlus,
//   UserRound,
//   Mail,
// } from "lucide-react";
// import {
//   useState,
//   useRef,
//   useEffect,
//   useCallback,
//   type ChangeEvent,
//   type FormEvent,
//   type KeyboardEvent,
// } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { OnlineDot } from "@/components/ui-kit";
// import { useAuth } from "@/lib/auth-store";

// const API_BASE_URL = String(
//   import.meta.env.VITE_BASE_URL ??
//     import.meta.env.VITE_API_BASE_URL ??
//     ""
// ).replace(/\/+$/, "");

// const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");

// export const Route = createFileRoute("/creator/chat/$id")({
//   component: CreatorChatRoom,
// });

// type UserProfile = {
//   id?: number;
//   user_id?: number;
//   name?: string;
//   full_name?: string;
//   username?: string;
//   email?: string;
//   avatar?: string;
//   profile_image?: string;
//   profile_picture?: string;
//   role?: string;
// };

// type ChatMessage = {
//   message_id: number | string;
//   chat_id?: number | string;
//   sender_id: number | string;
//   receiver_id?: number | string;
//   content: string;
//   message_type?: string;
//   attachment?: string | null;
//   is_read?: boolean;
//   is_delivered?: boolean;
//   created_at?: string | null;
// };

// function getToken() {
//   return (
//     localStorage.getItem("token") ??
//     localStorage.getItem("access_token") ??
//     ""
//   );
// }

// async function apiRequest<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const token = getToken();

//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     ...options,
//     headers: {
//       ...(options.body ? { "Content-Type": "application/json" } : {}),
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...options.headers,
//     },
//   });

//   if (!response.ok) {
//     const body = await response.text();

//     throw new Error(
//       `HTTP ${response.status}: ${body || response.statusText}`
//     );
//   }

//   if (response.status === 204) {
//     return undefined as T;
//   }

//   return response.json() as Promise<T>;
// }

// function normalizeMessage(raw: any): ChatMessage | null {
//   const content = raw?.content ?? raw?.message ?? raw?.text ?? "";
//   const senderId = raw?.sender_id ?? raw?.user_id;

//   if (senderId == null || (!String(content).trim() && !raw?.attachment)) {
//     return null;
//   }

//   return {
//     message_id:
//       raw?.message_id ??
//       raw?.id ??
//       `${senderId}-${raw?.created_at ?? Date.now()}`,
//     chat_id: raw?.chat_id,
//     sender_id: senderId,
//     receiver_id: raw?.receiver_id,
//     content: String(content),
//     message_type: raw?.message_type ?? "text",
//     attachment: raw?.attachment ?? null,
//     is_read: raw?.is_read,
//     is_delivered: raw?.is_delivered,
//     created_at: raw?.created_at ?? raw?.timestamp ?? null,
//   };
// }

// function CreatorChatRoom() {
//   const { id } = Route.useParams();
//   const navigate = useNavigate();

//   // This is the authentication store used by your existing project.
//   const currentUser = useAuth((state) => state.user);

//   const currentUserId = Number(
//     currentUser?.id ?? currentUser?.user_id
//   );
//   const customerId = Number(id);

//   const [customer, setCustomer] = useState<UserProfile | null>(null);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [chatId, setChatId] = useState<number | null>(null);
//   const [text, setText] = useState("");
//   const [connected, setConnected] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState("");
//   const [socketError, setSocketError] = useState("");

//   const socketRef = useRef<WebSocket | null>(null);
//   const connectedRef = useRef(false);
//   const endRef = useRef<HTMLDivElement | null>(null);
//   const inputRef = useRef<HTMLInputElement | null>(null);
//   const fileRef = useRef<HTMLInputElement | null>(null);

//   const updateConnection = useCallback((value: boolean) => {
//     connectedRef.current = value;
//     setConnected(value);
//   }, []);

//   // Load the profile, conversation, and persisted message history.
//   useEffect(() => {
//     let active = true;

//     async function loadChat() {
//       setLoading(true);
//       setError("");
//       setSocketError("");
//       setCustomer(null);
//       setChatId(null);
//       setMessages([]);
//       updateConnection(false);

//       if (!API_BASE_URL) {
//         setError(
//           "Backend URL is missing. Configure VITE_BASE_URL in your .env file."
//         );
//         setLoading(false);
//         return;
//       }

//       if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
//         setError(
//           "Your logged-in user ID is missing. Please log in again."
//         );
//         setLoading(false);
//         return;
//       }

//       if (!Number.isInteger(customerId) || customerId <= 0) {
//         setError("The URL does not contain a valid customer ID.");
//         setLoading(false);
//         return;
//       }

//       try {
//         // 1. Load the customer profile.
//         const usersData = await apiRequest<any>("/users/");

//         const users: UserProfile[] = Array.isArray(usersData)
//           ? usersData
//           : Array.isArray(usersData?.users)
//             ? usersData.users
//             : [];

//         const profile = users.find(
//           (item) =>
//             Number(item.id ?? item.user_id) === customerId
//         );

//         if (!profile) {
//           throw new Error(
//             `Customer ${customerId} was not found in the users API.`
//           );
//         }

//         if (!active) return;
//         setCustomer(profile);

//         // 2. Retrieve or create the conversation.
//         const chatData = await apiRequest<any>(
//           `/chats/with/${customerId}?user_id=${encodeURIComponent(
//             String(currentUserId)
//           )}`,
//           { method: "POST" }
//         );

//         const actualChatId = Number(
//           chatData?.chat_id ??
//             chatData?.id ??
//             chatData?.chat?.chat_id
//         );

//         if (!Number.isInteger(actualChatId) || actualChatId <= 0) {
//           throw new Error(
//             "The backend did not return a valid chat_id."
//           );
//         }

//         if (!active) return;
//         setChatId(actualChatId);

//         // 3. Load the saved messages.
//         const historyData = await apiRequest<any>(
//           `/chats/${actualChatId}/messages?user_id=${encodeURIComponent(
//             String(currentUserId)
//           )}`
//         );

//         const rawMessages: any[] = Array.isArray(historyData)
//           ? historyData
//           : Array.isArray(historyData?.messages)
//             ? historyData.messages
//             : [];

//         const history = rawMessages
//           .map(normalizeMessage)
//           .filter(
//             (message): message is ChatMessage => message !== null
//           );

//         if (!active) return;
//         setMessages(history);

//         // 4. Mark the conversation as read.
//         try {
//           await apiRequest(
//             `/chats/${actualChatId}/read?user_id=${encodeURIComponent(
//               String(currentUserId)
//             )}`,
//             { method: "POST" }
//           );
//         } catch (readError) {
//           console.warn("Could not mark messages as read:", readError);
//         }

//         if (!active) return;

//         // The WebSocket is created in the separate effect below.
//       } catch (err) {
//         console.error("Failed to load chat:", err);

//         if (active) {
//           setError(
//             err instanceof Error
//               ? err.message
//               : "Unable to load the conversation."
//           );
//         }
//       } finally {
//         if (active) setLoading(false);
//       }
//     }

//     void loadChat();

//     return () => {
//       active = false;
//     };
//   }, [customerId, currentUserId, updateConnection]);

//   // Connect to the WebSocket after chatId is available.
//   useEffect(() => {
//     if (!chatId || !currentUserId || !API_BASE_URL) return;

//     let active = true;

//     const wsUrl = new URL(`${WS_BASE_URL}/ws/chat/${chatId}`);
//     wsUrl.searchParams.set("user_id", String(currentUserId));

//     const socket = new WebSocket(wsUrl.toString());
//     socketRef.current = socket;

//     socket.onopen = () => {
//       if (!active) return;

//       console.log("Chat WebSocket opened:", chatId);
//       updateConnection(true);
//       setSocketError("");
//     };

//     socket.onmessage = (event) => {
//       if (!active) return;

//       let data: any;

//       try {
//         data = JSON.parse(event.data);
//       } catch {
//         console.error("Invalid WebSocket response:", event.data);
//         return;
//       }

//       console.log("Chat event:", data);

//       if (
//         data?.type === "connected" ||
//         data?.type === "connection_established"
//       ) {
//         updateConnection(true);
//         return;
//       }

//       if (data?.type === "error") {
//         setSocketError(
//           data.message || data.detail || "The chat server returned an error."
//         );
//         return;
//       }

//       // Support both { type: "message", message: {...} } and
//       // a direct message object from the backend.
//       const rawMessage =
//         data?.message && typeof data.message === "object"
//           ? data.message
//           : data?.data && typeof data.data === "object"
//             ? data.data
//             : data;

//       if (
//         data?.type &&
//         !["message", "new_message"].includes(data.type)
//       ) {
//         return;
//       }

//       const incoming = normalizeMessage(rawMessage);
//       if (!incoming) return;

//       if (
//         incoming.chat_id != null &&
//         Number(incoming.chat_id) !== chatId
//       ) {
//         return;
//       }

//       setMessages((previous) => {
//         const exists = previous.some(
//           (message) =>
//             String(message.message_id) ===
//             String(incoming.message_id)
//         );

//         if (exists) return previous;
//         return [...previous, { ...incoming, chat_id: chatId }];
//       });

//       if (Number(incoming.sender_id) !== currentUserId) {
//         void apiRequest(
//           `/chats/${chatId}/read?user_id=${encodeURIComponent(
//             String(currentUserId)
//           )}`,
//           { method: "POST" }
//         ).catch((err) => {
//           console.warn("Could not mark incoming message as read:", err);
//         });
//       }
//     };

//     socket.onerror = (event) => {
//       console.error("Chat WebSocket error:", event);

//       if (active) {
//         setSocketError(
//           "WebSocket connection failed. Check the backend WebSocket route and server logs."
//         );
//       }
//     };

//     socket.onclose = (event) => {
//       console.log("Chat WebSocket closed:", {
//         code: event.code,
//         reason: event.reason,
//       });

//       if (active) updateConnection(false);
//     };

//     return () => {
//       active = false;

//       if (socketRef.current === socket) {
//         socketRef.current = null;
//       }

//       socket.onopen = null;
//       socket.onmessage = null;
//       socket.onerror = null;
//       socket.onclose = null;

//       if (
//         socket.readyState === WebSocket.OPEN ||
//         socket.readyState === WebSocket.CONNECTING
//       ) {
//         socket.close();
//       }

//       updateConnection(false);
//     };
//   }, [chatId, currentUserId, updateConnection]);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "end",
//     });
//   }, [messages]);

//   const handleSend = useCallback(
//     (event?: FormEvent) => {
//       event?.preventDefault();

//       const content = text.trim();
//       const socket = socketRef.current;

//       if (!content || sending) return;

//       if (
//         !socket ||
//         socket.readyState !== WebSocket.OPEN ||
//         !connectedRef.current
//       ) {
//         setSocketError(
//           "Chat is not connected. Please wait for the connection."
//         );
//         return;
//       }

//       try {
//         setSending(true);
//         setSocketError("");
//         setError("");

//         // Must match the message format expected by your backend.
//         socket.send(
//           JSON.stringify({
//             type: "message",
//             content,
//           })
//         );

//         setText("");
//         inputRef.current?.focus();
//       } catch (err) {
//         console.error("Unable to send message:", err);
//         setSocketError("Unable to send your message.");
//       } finally {
//         setSending(false);
//       }
//     },
//     [text, sending]
//   );

//   function handleImage(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       setError("Please select an image file.");
//     } else if (file.size > 5 * 1024 * 1024) {
//       setError("Image must be smaller than 5 MB.");
//     } else {
//       setError(
//         "Image upload is not connected to the backend yet."
//       );
//     }

//     event.target.value = "";
//   }

//   function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
//     if (
//       event.key === "Enter" &&
//       !event.shiftKey &&
//       !event.nativeEvent.isComposing
//     ) {
//       event.preventDefault();
//       handleSend();
//     }
//   }

//   const displayName = customer
//     ? customer.full_name ||
//       customer.name ||
//       customer.username ||
//       customer.email ||
//       `User ${customer.id ?? customer.user_id}`
//     : `Customer ${customerId}`;

//   const avatar =
//     customer?.avatar ||
//     customer?.profile_image ||
//     customer?.profile_picture;

//   return (
//     <div className="-mx-4 flex h-[calc(100vh-8rem)] min-h-0 flex-col md:mx-0">
//       {/* Customer header */}
//       <div className="glass-strong sticky top-0 z-30 flex shrink-0 items-center gap-3 px-4 py-4">
//         <button
//           type="button"
//           onClick={() => navigate({ to: "/creator/chat" })}
//           aria-label="Back to inbox"
//           className="rounded-full p-2 hover:bg-glass"
//         >
//           <ArrowLeft className="h-5 w-5" />
//         </button>

//         {avatar ? (
//           <img
//             src={avatar}
//             alt={displayName}
//             className="h-12 w-12 rounded-full object-cover"
//           />
//         ) : (
//           <div className="glass flex h-12 w-12 items-center justify-center rounded-full">
//             <UserRound className="h-6 w-6" />
//           </div>
//         )}

//         <div className="min-w-0 flex-1">
//           <p className="truncate text-sm font-semibold">
//             {displayName}
//           </p>

//           {customer?.email && (
//             <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
//               <Mail className="h-3 w-3" />
//               {customer.email}
//             </p>
//           )}

//           <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
//             <OnlineDot online={connected} />
//             {connected ? "Connected" : "Connecting..."}
//           </p>
//         </div>
//       </div>

//       {/* Customer details */}
//       {customer && (
//         <div className="glass mx-3 mt-3 shrink-0 rounded-xl p-3">
//           <p className="mb-2 text-xs font-semibold">Customer details</p>

//           <div className="grid grid-cols-2 gap-3 text-xs">
//             <div>
//               <p className="text-muted-foreground">User ID</p>
//               <p className="mt-1 font-medium">
//                 {customer.id ?? customer.user_id}
//               </p>
//             </div>

//             <div>
//               <p className="text-muted-foreground">Role</p>
//               <p className="mt-1 font-medium">
//                 {customer.role || "Customer"}
//               </p>
//             </div>

//             <div className="col-span-2">
//               <p className="text-muted-foreground">Email</p>
//               <p className="mt-1 break-all font-medium">
//                 {customer.email || "Not available"}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Message history */}
//       <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
//         {loading && (
//           <p className="py-4 text-center text-sm text-muted-foreground">
//             Loading customer and messages...
//           </p>
//         )}

//         {!loading && error && (
//           <div className="glass rounded-xl p-3 text-sm text-red-500">
//             <p className="font-semibold">Unable to load chat</p>
//             <p className="mt-1 break-words">{error}</p>
//           </div>
//         )}

//         {!loading && !error && messages.length === 0 && (
//           <p className="py-6 text-center text-sm text-muted-foreground">
//             No messages yet. Start the conversation!
//           </p>
//         )}

//         <AnimatePresence initial={false}>
//           {messages.map((message) => {
//             const mine =
//               Number(message.sender_id) === currentUserId;

//             return (
//               <motion.div
//                 key={String(message.message_id)}
//                 initial={{ opacity: 0, y: 8 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className={`flex ${
//                   mine ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 <div
//                   className={`max-w-[80%] break-words rounded-2xl px-3 py-2 text-sm ${
//                     mine ? "bg-gradient-primary shadow-glow" : "glass"
//                   }`}
//                 >
//                   {message.attachment && (
//                     <img
//                       src={message.attachment}
//                       alt="Chat attachment"
//                       className="mb-2 max-h-60 rounded-xl object-cover"
//                     />
//                   )}

//                   {message.content && (
//                     <p className="whitespace-pre-wrap">
//                       {message.content}
//                     </p>
//                   )}

//                   {message.created_at && (
//                     <p className="mt-1 text-right text-[10px] opacity-70">
//                       {new Date(message.created_at).toLocaleTimeString(
//                         [],
//                         { hour: "2-digit", minute: "2-digit" }
//                       )}
//                     </p>
//                   )}
//                 </div>
//               </motion.div>
//             );
//           })}
//         </AnimatePresence>

//         <div ref={endRef} />
//       </div>

//       {socketError && (
//         <div className="shrink-0 border-t border-amber-500/30 px-4 py-2 text-xs text-amber-600">
//           {socketError}
//         </div>
//       )}

//       {/* Message input */}
//       <form
//         className="glass-strong sticky bottom-0 flex shrink-0 items-center gap-2 p-3"
//         onSubmit={handleSend}
//       >
//         <button
//           type="button"
//           className="rounded-full p-2 hover:bg-glass"
//           aria-label="Emoji"
//           onClick={() => setText((previous) => `${previous}😊`)}
//         >
//           <Smile className="h-5 w-5 text-muted-foreground" />
//         </button>

//         <button
//           type="button"
//           onClick={() => fileRef.current?.click()}
//           className="rounded-full p-2 hover:bg-glass"
//           aria-label="Attach image"
//         >
//           <ImagePlus className="h-5 w-5 text-muted-foreground" />
//         </button>

//         <input
//           ref={fileRef}
//           type="file"
//           accept="image/*"
//           hidden
//           onChange={handleImage}
//         />

//         <input
//           ref={inputRef}
//           type="text"
//           value={text}
//           onChange={(event) => setText(event.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Reply to your customer..."
//           className="glass min-w-0 flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
//           autoComplete="off"
//           disabled={loading || !!error}
//         />

//         <button
//           type="submit"
//           disabled={
//             !connected ||
//             !text.trim() ||
//             sending ||
//             chatId === null ||
//             !!error
//           }
//           className="rounded-full bg-gradient-primary p-2.5 shadow-glow disabled:opacity-50"
//           aria-label="Send message"
//         >
//           <Send className="h-4 w-4" />
//         </button>
//       </form>
//     </div>
//   );
// }
import {

  createFileRoute,

  useNavigate,

} from "@tanstack/react-router";

import {

  ArrowLeft,

  Send,

  Smile,

  ImagePlus,

  UserRound,

  Mail,

} from "lucide-react";

import {

  Fragment,

  useState,

  useRef,

  useEffect,

  useCallback,

  type ChangeEvent,

  type FormEvent,

  type KeyboardEvent,

} from "react";

import { motion, AnimatePresence } from "framer-motion";

import { OnlineDot } from "@/components/ui-kit";

import { useAuth } from "@/lib/auth-store";



const API_BASE_URL = String(

  import.meta.env.VITE_BASE_URL ??

    import.meta.env.VITE_API_BASE_URL ??

    ""

).replace(/\/+$/, "");



const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");



export const Route = createFileRoute("/creator/chat/$id")({

  component: CreatorChatRoom,

});



type UserProfile = {

  id?: number;

  user_id?: number;

  name?: string;

  full_name?: string;

  username?: string;

  email?: string;

  avatar?: string;

  profile_image?: string;

  profile_picture?: string;

  role?: string;

};



type ChatMessage = {

  message_id: number | string;

  chat_id?: number | string;

  sender_id: number | string;

  receiver_id?: number | string;

  content: string;

  message_type?: string;

  attachment?: string | null;

  is_read?: boolean;

  is_delivered?: boolean;

  created_at?: string | null;

};



function getToken() {

  return (

    localStorage.getItem("token") ??

    localStorage.getItem("access_token") ??

    ""

  );

}



async function apiRequest<T>(

  path: string,

  options: RequestInit = {}

): Promise<T> {

  const token = getToken();



  const response = await fetch(`${API_BASE_URL}${path}`, {

    ...options,

    headers: {

      ...(options.body ? { "Content-Type": "application/json" } : {}),

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...options.headers,

    },

  });



  if (!response.ok) {

    const body = await response.text();



    throw new Error(

      `HTTP ${response.status}: ${body || response.statusText}`

    );

  }



  if (response.status === 204) {

    return undefined as T;

  }



  return response.json() as Promise<T>;

}



function normalizeMessage(raw: any): ChatMessage | null {

  const content = raw?.content ?? raw?.message ?? raw?.text ?? "";

  const senderId = raw?.sender_id ?? raw?.user_id;



  if (senderId == null || (!String(content).trim() && !raw?.attachment)) {

    return null;

  }



  return {

    message_id:

      raw?.message_id ??

      raw?.id ??

      `${senderId}-${raw?.created_at ?? Date.now()}`,

    chat_id: raw?.chat_id,

    sender_id: senderId,

    receiver_id: raw?.receiver_id,

    content: String(content),

    message_type: raw?.message_type ?? "text",

    attachment: raw?.attachment ?? null,

    is_read: raw?.is_read,

    is_delivered: raw?.is_delivered,

    created_at: raw?.created_at ?? raw?.timestamp ?? null,

  };

}



function getLocalDateKey(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateSeparatorLabel(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateKey = getLocalDateKey(value);

  if (dateKey === getLocalDateKey(today.toISOString())) return "Today";
  if (dateKey === getLocalDateKey(yesterday.toISOString())) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CreatorChatRoom() {

  const { id } = Route.useParams();

  const navigate = useNavigate();



  // This is the authentication store used by your existing project.

  const currentUser = useAuth((state) => state.user);



  const currentUserId = Number(

    currentUser?.id ?? currentUser?.user_id

  );

  const customerId = Number(id);



  const [customer, setCustomer] = useState<UserProfile | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [chatId, setChatId] = useState<number | null>(null);

  const [text, setText] = useState("");

  const [connected, setConnected] = useState(false);

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [socketError, setSocketError] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);



  const socketRef = useRef<WebSocket | null>(null);

  const connectedRef = useRef(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);



  const updateConnection = useCallback((value: boolean) => {

    connectedRef.current = value;

    setConnected(value);

  }, []);

  const sendTypingEvent = useCallback((eventType: "typing" | "stop_typing") => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: eventType }));
  }, []);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (!connectedRef.current) return;

    if (!value.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        sendTypingEvent("stop_typing");
      }
      return;
    }

    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      sendTypingEvent("typing");
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      sendTypingEvent("stop_typing");
    }, 1500);
  }, [sendTypingEvent]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      sendTypingEvent("stop_typing");
    }
  }, [sendTypingEvent]);



  // Load the profile, conversation, and persisted message history.

  useEffect(() => {

    let active = true;



    async function loadChat() {

      setLoading(true);

      setError("");

      setSocketError("");

      setCustomer(null);

      setChatId(null);

      setMessages([]);

      updateConnection(false);



      if (!API_BASE_URL) {

        setError(

          "Backend URL is missing. Configure VITE_BASE_URL in your .env file."

        );

        setLoading(false);

        return;

      }



      if (!Number.isInteger(currentUserId) || currentUserId <= 0) {

        setError(

          "Your logged-in user ID is missing. Please log in again."

        );

        setLoading(false);

        return;

      }



      if (!Number.isInteger(customerId) || customerId <= 0) {

        setError("The URL does not contain a valid customer ID.");

        setLoading(false);

        return;

      }



      try {

        // 1. Load the customer profile.

        const usersData = await apiRequest<any>("/users/");



        const users: UserProfile[] = Array.isArray(usersData)

          ? usersData

          : Array.isArray(usersData?.users)

            ? usersData.users

            : [];



        const profile = users.find(

          (item) =>

            Number(item.id ?? item.user_id) === customerId

        );



        if (!profile) {

          throw new Error(

            `Customer ${customerId} was not found in the users API.`

          );

        }



        if (!active) return;

        setCustomer(profile);



        // 2. Retrieve or create the conversation.

        const chatData = await apiRequest<any>(

          `/chats/with/${customerId}?user_id=${encodeURIComponent(

            String(currentUserId)

          )}`,

          { method: "POST" }

        );



        const actualChatId = Number(

          chatData?.chat_id ??

            chatData?.id ??

            chatData?.chat?.chat_id

        );



        if (!Number.isInteger(actualChatId) || actualChatId <= 0) {

          throw new Error(

            "The backend did not return a valid chat_id."

          );

        }



        if (!active) return;

        setChatId(actualChatId);



        // 3. Load the saved messages.

        const historyData = await apiRequest<any>(

          `/chats/${actualChatId}/messages?user_id=${encodeURIComponent(

            String(currentUserId)

          )}`

        );



        const rawMessages: any[] = Array.isArray(historyData)

          ? historyData

          : Array.isArray(historyData?.messages)

            ? historyData.messages

            : [];



        const history = rawMessages
          .map(normalizeMessage)
          .filter(
            (message): message is ChatMessage => message !== null
          )
          .sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
            return aTime - bTime;
          });



        if (!active) return;

        setMessages(history);



        // 4. Mark the conversation as read.

        try {

          await apiRequest(

            `/chats/${actualChatId}/read?user_id=${encodeURIComponent(

              String(currentUserId)

            )}`,

            { method: "POST" }

          );

        } catch (readError) {

          console.warn("Could not mark messages as read:", readError);

        }



        if (!active) return;



        // The WebSocket is created in the separate effect below.

      } catch (err) {

        console.error("Failed to load chat:", err);



        if (active) {

          setError(

            err instanceof Error

              ? err.message

              : "Unable to load the conversation."

          );

        }

      } finally {

        if (active) setLoading(false);

      }

    }



    void loadChat();



    return () => {

      active = false;

    };

  }, [customerId, currentUserId, updateConnection]);



  // Connect to the WebSocket after chatId is available.

  useEffect(() => {

    if (!chatId || !currentUserId || !API_BASE_URL) return;



    let active = true;



    const wsUrl = new URL(`${WS_BASE_URL}/ws/chat/${chatId}`);

    wsUrl.searchParams.set("user_id", String(currentUserId));



    const socket = new WebSocket(wsUrl.toString());

    socketRef.current = socket;



    socket.onopen = () => {

      if (!active) return;



      console.log("Chat WebSocket opened:", chatId);

      updateConnection(true);

      setSocketError("");

    };



    socket.onmessage = (event) => {

      if (!active) return;



      let data: any;



      try {

        data = JSON.parse(event.data);

      } catch {

        console.error("Invalid WebSocket response:", event.data);

        return;

      }



      console.log("Chat event:", data);



      if (

        data?.type === "connected" ||

        data?.type === "connection_established"

      ) {

        updateConnection(true);

        return;

      }



      if (data?.type === "typing" || data?.type === "stop_typing") {
        if (Number(data.user_id) !== currentUserId) {
          const isTyping = data.type === "typing";
          setOtherUserTyping(isTyping);
          if (remoteTypingTimeoutRef.current) {
            clearTimeout(remoteTypingTimeoutRef.current);
            remoteTypingTimeoutRef.current = null;
          }
          if (isTyping) {
            remoteTypingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
            }, 5000);
          }
        }
        return;
      }

      if (data?.type === "error") {

        setSocketError(

          data.message || data.detail || "The chat server returned an error."

        );

        return;

      }



      // Support both { type: "message", message: {...} } and

      // a direct message object from the backend.

      const rawMessage =

        data?.message && typeof data.message === "object"

          ? data.message

          : data?.data && typeof data.data === "object"

            ? data.data

            : data;



      if (

        data?.type &&

        !["message", "new_message"].includes(data.type)

      ) {

        return;

      }



      const incoming = normalizeMessage(rawMessage);

      if (!incoming) return;



      if (

        incoming.chat_id != null &&

        Number(incoming.chat_id) !== chatId

      ) {

        return;

      }



      setMessages((previous) => {

        const exists = previous.some(

          (message) =>

            String(message.message_id) ===

            String(incoming.message_id)

        );



        if (exists) return previous;

        return [...previous, { ...incoming, chat_id: chatId }];

      });



      if (Number(incoming.sender_id) !== currentUserId) {

        void apiRequest(

          `/chats/${chatId}/read?user_id=${encodeURIComponent(

            String(currentUserId)

          )}`,

          { method: "POST" }

        ).catch((err) => {

          console.warn("Could not mark incoming message as read:", err);

        });

      }

    };



    socket.onerror = (event) => {

      console.error("Chat WebSocket error:", event);



      if (active) {

        setSocketError(

          "WebSocket connection failed. Check the backend WebSocket route and server logs."

        );

      }

    };



    socket.onclose = (event) => {

      console.log("Chat WebSocket closed:", {

        code: event.code,

        reason: event.reason,

      });



      if (active) updateConnection(false);

    };



    return () => {

      active = false;



      if (socketRef.current === socket) {

        socketRef.current = null;

      }



      socket.onopen = null;

      socket.onmessage = null;

      socket.onerror = null;

      socket.onclose = null;



      if (

        socket.readyState === WebSocket.OPEN ||

        socket.readyState === WebSocket.CONNECTING

      ) {

        socket.close();

      }



      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
      typingActiveRef.current = false;
      setOtherUserTyping(false);
      updateConnection(false);

    };

  }, [chatId, currentUserId, updateConnection]);



  useEffect(() => {

    endRef.current?.scrollIntoView({

      behavior: "smooth",

      block: "end",

    });

  }, [messages]);



  const handleSend = useCallback(

    (event?: FormEvent) => {

      event?.preventDefault();



      const content = text.trim();

      const socket = socketRef.current;



      if (!content || sending) return;



      if (

        !socket ||

        socket.readyState !== WebSocket.OPEN ||

        !connectedRef.current

      ) {

        setSocketError(

          "Chat is not connected. Please wait for the connection."

        );

        return;

      }



      try {

        stopTyping();
        setOtherUserTyping(false);
        setSending(true);

        setSocketError("");

        setError("");



        // Must match the message format expected by your backend.

        socket.send(

          JSON.stringify({

            type: "message",

            content,

          })

        );



        setText("");

        inputRef.current?.focus();

      } catch (err) {

        console.error("Unable to send message:", err);

        setSocketError("Unable to send your message.");

      } finally {

        setSending(false);

      }

    },

    [text, sending, stopTyping]

  );



  function handleImage(event: ChangeEvent<HTMLInputElement>) {

    const file = event.target.files?.[0];

    if (!file) return;



    if (!file.type.startsWith("image/")) {

      setError("Please select an image file.");

    } else if (file.size > 5 * 1024 * 1024) {

      setError("Image must be smaller than 5 MB.");

    } else {

      setError(

        "Image upload is not connected to the backend yet."

      );

    }



    event.target.value = "";

  }



  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {

    if (

      event.key === "Enter" &&

      !event.shiftKey &&

      !event.nativeEvent.isComposing

    ) {

      event.preventDefault();

      handleSend();

    }

  }



  const displayName = customer

    ? customer.full_name ||

      customer.name ||

      customer.username ||

      customer.email ||

      `User ${customer.id ?? customer.user_id}`

    : `Customer ${customerId}`;



  const avatar =

    customer?.avatar ||

    customer?.profile_image ||

    customer?.profile_picture;



  return (

    <div className="-mx-4 flex h-[calc(100vh-8rem)] min-h-0 flex-col md:mx-0">

      {/* Customer header */}

      <div className="glass-strong sticky top-0 z-30 flex shrink-0 items-center gap-3 px-4 py-4">

        <button

          type="button"

          onClick={() => navigate({ to: "/creator/chat" })}

          aria-label="Back to inbox"

          className="rounded-full p-2 hover:bg-glass"

        >

          <ArrowLeft className="h-5 w-5" />

        </button>



        {avatar ? (

          <img

            src={avatar}

            alt={displayName}

            className="h-12 w-12 rounded-full object-cover"

          />

        ) : (

          <div className="glass flex h-12 w-12 items-center justify-center rounded-full">

            <UserRound className="h-6 w-6" />

          </div>

        )}



        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-semibold">

            {displayName}

          </p>



          {customer?.email && (

            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">

              <Mail className="h-3 w-3" />

              {customer.email}

            </p>

          )}



          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">

            <OnlineDot online={connected} />

            {connected ? "Connected" : "Connecting..."}

          </p>

        </div>

      </div>



      {/* Customer details */}

      {customer && (

        <div className="glass mx-3 mt-3 shrink-0 rounded-xl p-3">

          <p className="mb-2 text-xs font-semibold">Customer details</p>



          <div className="grid grid-cols-2 gap-3 text-xs">

            <div>

              <p className="text-muted-foreground">User ID</p>

              <p className="mt-1 font-medium">

                {customer.id ?? customer.user_id}

              </p>

            </div>



            <div>

              <p className="text-muted-foreground">Role</p>

              <p className="mt-1 font-medium">

                {customer.role || "Customer"}

              </p>

            </div>



            <div className="col-span-2">

              <p className="text-muted-foreground">Email</p>

              <p className="mt-1 break-all font-medium">

                {customer.email || "Not available"}

              </p>

            </div>

          </div>

        </div>

      )}



      {/* Message history */}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">

        {loading && (

          <p className="py-4 text-center text-sm text-muted-foreground">

            Loading customer and messages...

          </p>

        )}



        {!loading && error && (

          <div className="glass rounded-xl p-3 text-sm text-red-500">

            <p className="font-semibold">Unable to load chat</p>

            <p className="mt-1 break-words">{error}</p>

          </div>

        )}



        {!loading && !error && messages.length === 0 && (

          <p className="py-6 text-center text-sm text-muted-foreground">

            No messages yet. Start the conversation!

          </p>

        )}



        <AnimatePresence initial={false}>

          {messages.map((message, index) => {
            const mine = Number(message.sender_id) === currentUserId;
            const currentDateKey = getLocalDateKey(message.created_at);
            const previousDateKey = index > 0
              ? getLocalDateKey(messages[index - 1].created_at)
              : "";
            const showDateSeparator =
              Boolean(currentDateKey) && currentDateKey !== previousDateKey;

            return (
              <Fragment key={String(message.message_id)}>
                {showDateSeparator && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-muted/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {getDateSeparatorLabel(message.created_at)}
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] break-words rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-gradient-primary shadow-glow" : "glass"
                    }`}
                  >
                    {message.attachment && (
                      <img
                        src={message.attachment}
                        alt="Chat attachment"
                        className="mb-2 max-h-60 rounded-xl object-cover"
                      />
                    )}

                    {message.content && (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                    {message.created_at && (
                      <p className="mt-1 text-right text-[10px] opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Fragment>
            );
          })}

        </AnimatePresence>



        {otherUserTyping && (
          <div className="flex justify-start py-1">
            <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-muted-foreground">
              <span>Customer is typing</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />

      </div>



      {socketError && (

        <div className="shrink-0 border-t border-amber-500/30 px-4 py-2 text-xs text-amber-600">

          {socketError}

        </div>

      )}



      {/* Message input */}

      <form

        className="glass-strong sticky bottom-0 flex shrink-0 items-center gap-2 p-3"

        onSubmit={handleSend}

      >

        <button

          type="button"

          className="rounded-full p-2 hover:bg-glass"

          aria-label="Emoji"

          onClick={() => setText((previous) => `${previous}😊`)}

        >

          <Smile className="h-5 w-5 text-muted-foreground" />

        </button>



        <button

          type="button"

          onClick={() => fileRef.current?.click()}

          className="rounded-full p-2 hover:bg-glass"

          aria-label="Attach image"

        >

          <ImagePlus className="h-5 w-5 text-muted-foreground" />

        </button>



        <input

          ref={fileRef}

          type="file"

          accept="image/*"

          hidden

          onChange={handleImage}

        />



        <input

          ref={inputRef}

          type="text"

          value={text}

          onChange={(event) => handleTextChange(event.target.value)}

          onBlur={stopTyping}

          onKeyDown={handleKeyDown}

          placeholder="Reply to your customer..."

          className="glass min-w-0 flex-1 rounded-full px-4 py-2.5 text-sm outline-none"

          autoComplete="off"

          disabled={loading || !!error}

        />



        <button

          type="submit"

          disabled={

            !connected ||

            !text.trim() ||

            sending ||

            chatId === null ||

            !!error

          }

          className="rounded-full bg-gradient-primary p-2.5 shadow-glow disabled:opacity-50"

          aria-label="Send message"

        >

          <Send className="h-4 w-4" />

        </button>

      </form>

    </div>

  );

}

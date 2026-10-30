
// import {
//   createFileRoute,
//   notFound,
//   Link,
//   useNavigate,
// } from "@tanstack/react-router";
// import { useState, useEffect, useRef, useCallback } from "react";
// import type { ChangeEvent, KeyboardEvent } from "react";
// import {
//   ArrowLeft,
//   Send,
//   Phone,
//   Video,
//   Smile,
//   Coins,
//   ImagePlus,
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { OnlineDot } from "@/components/ui-kit";
// import { useAuth } from "@/lib/auth-store";
// import { GiftButton } from "@/components/gift-picker";
// import { toast } from "sonner";

// const API_BASE_URL = String(
//   import.meta.env.VITE_BASE_URL ?? ""
// ).replace(/\/+$/, "");

// const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");

// type Creator = {
//   id: string;
//   name: string;
//   avatar: string;
//   online: boolean;
//   chatPrice: number;
// };

// type ApiMessage = {
//   message_id?: number | string;
//   id?: number | string;
//   chat_id?: number | string;
//   sender_id: number | string;
//   receiver_id?: number | string;
//   content?: string;
//   message?: string;
//   message_text?: string;
//   created_at?: string;
// };

// type ChatMessage = {
//   id: string;
//   from: "customer" | "creator";
//   text?: string;
//   image?: string;
//   createdAt?: string;
// };

// type WebSocketEvent = {
//   type?: string;
//   message_id?: number | string;
//   id?: number | string;
//   chat_id?: number | string;
//   sender_id?: number | string;
//   content?: string;
//   message?: string;
//   message_text?: string;
//   created_at?: string;
//   is_typing?: boolean;
//   detail?: string;
//   error?: string;
// };

// function getAuthToken(): string | null {
//   if (typeof window === "undefined") return null;

//   return (
//     localStorage.getItem("access_token") ||
//     localStorage.getItem("token")
//   );
// }

// function getAuthHeaders(): Record<string, string> {
//   const token = getAuthToken();

//   return {
//     Accept: "application/json",
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };
// }

// export const Route = createFileRoute("/app/chat/$id")({
//   component: ChatRoom,

//   loader: async ({ params }) => {
//     if (!API_BASE_URL) {
//       throw new Error("VITE_BASE_URL is not configured.");
//     }

//     const token =
//       typeof window !== "undefined" ? getAuthToken() : null;

//     const response = await fetch(`${API_BASE_URL}/users/`, {
//       headers: {
//         Accept: "application/json",
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to load users: ${response.status}`);
//     }

//     const result = await response.json();

//     const users = Array.isArray(result)
//       ? result
//       : result.users ?? result.items ?? result.data ?? [];

//     const user = users.find(
//       (item: {
//         id: number | string;
//         role?: string;
//       }) =>
//         String(item.id) === params.id &&
//         item.role?.toLowerCase() === "creator"
//     );

//     if (!user) throw notFound();

//     const profilePhoto = String(
//       user.profile_photo ?? ""
//     ).replace(/\\/g, "/");

//     const avatar = profilePhoto
//       ? /^https?:\/\//i.test(profilePhoto)
//         ? profilePhoto
//         : `${API_BASE_URL}/${profilePhoto.replace(/^\/+/, "")}`
//       : "";

//     return {
//       creator: {
//         id: String(user.id),
//         name: user.display_name || user.username || "Creator",
//         avatar,
//         online: false,
//         chatPrice: 10,
//       } satisfies Creator,
//     };
//   },
// });

// function ChatRoom() {
//   const { creator } = Route.useLoaderData();
//   const navigate = useNavigate();
//   const currentUser = useAuth((state) => state.user);

//   const currentUserId = Number(
//     currentUser?.id ?? currentUser?.user_id
//   );

//   const [chatId, setChatId] = useState<number | null>(null);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [text, setText] = useState("");
//   const [connectionStatus, setConnectionStatus] =
//     useState("Connecting...");
//   const [historyLoading, setHistoryLoading] = useState(true);
//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);
//   const [isCreatorTyping, setIsCreatorTyping] = useState(false);

//   const socketRef = useRef<WebSocket | null>(null);
//   const connectedRef = useRef(false);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const fileRef = useRef<HTMLInputElement>(null);
//   const endRef = useRef<HTMLDivElement>(null);

//   // Create/retrieve the conversation, load history, and connect.
//   useEffect(() => {
//     if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
//       setConnectionStatus("Please log in to chat");
//       setHistoryLoading(false);
//       return;
//     }

//     if (!API_BASE_URL || !WS_BASE_URL) {
//       setConnectionStatus("API URL is missing");
//       setHistoryLoading(false);
//       return;
//     }

//     const token = getAuthToken();

//     if (!token) {
//       setConnectionStatus("Please log in again");
//       setHistoryLoading(false);
//       return;
//     }

//     let cancelled = false;
//     let socket: WebSocket | null = null;

//     async function connectChat() {
//       try {
//         setHistoryLoading(true);
//         setConnectionStatus("Connecting...");
//         setIsCreatorTyping(false);
//         connectedRef.current = false;

//         // Create or retrieve the conversation.
//         const chatResponse = await fetch(
//           `${API_BASE_URL}/chats/with/${creator.id}?user_id=${currentUserId}`,
//           {
//             method: "POST",
//             headers: getAuthHeaders(),
//           }
//         );

//         if (!chatResponse.ok) {
//           const errorData = await chatResponse
//             .json()
//             .catch(() => ({}));

//           throw new Error(
//             errorData.detail ||
//               `Unable to retrieve conversation (${chatResponse.status})`
//           );
//         }

//         const chatData = await chatResponse.json();
//         const actualChatId = Number(chatData.chat_id);

//         if (!Number.isInteger(actualChatId) || actualChatId <= 0) {
//           throw new Error("Backend did not return a valid chat_id.");
//         }

//         if (cancelled) return;

//         setChatId(actualChatId);

//         // Load conversation history.
//         const historyResponse = await fetch(
//           `${API_BASE_URL}/chats/${actualChatId}/messages?user_id=${currentUserId}`,
//           {
//             headers: getAuthHeaders(),
//           }
//         );

//         if (!historyResponse.ok) {
//           const errorData = await historyResponse
//             .json()
//             .catch(() => ({}));

//           throw new Error(
//             errorData.detail ||
//               `Unable to load message history (${historyResponse.status})`
//           );
//         }

//         const historyData = await historyResponse.json();

//         if (cancelled) return;

//         const history: ApiMessage[] = Array.isArray(historyData)
//           ? historyData
//           : historyData.messages ??
//             historyData.items ??
//             historyData.data ??
//             [];

//         setMessages(
//           history.map((message, index) => ({
//             id: String(
//               message.message_id ??
//                 message.id ??
//                 `history-${actualChatId}-${index}`
//             ),
//             from:
//               Number(message.sender_id) === currentUserId
//                 ? "customer"
//                 : "creator",
//             text: String(
//               message.content ??
//                 message.message ??
//                 message.message_text ??
//                 ""
//             ),
//             createdAt: message.created_at,
//           }))
//         );

//         setHistoryLoading(false);

//         // Connect to the actual chat ID returned by the API.
//         const wsUrl = new URL(
//           `/ws/chat/${actualChatId}`,
//           WS_BASE_URL
//         );

//         // Required by the currently supplied FastAPI route.
//         wsUrl.searchParams.set("user_id", String(currentUserId));

//         socket = new WebSocket(wsUrl.toString());
//         socketRef.current = socket;

//         socket.onopen = () => {
//           if (cancelled) {
//             socket?.close();
//             return;
//           }

//           // The supplied backend accepts the connection immediately
//           // and sends a "connected" event. Do not wait for an
//           // authentication event it does not implement.
//           setConnectionStatus("Waiting for server...");
//         };

//         socket.onmessage = (event: MessageEvent<string>) => {
//           if (cancelled) return;

//           let data: WebSocketEvent;

//           try {
//             data = JSON.parse(event.data);
//           } catch {
//             console.error("Invalid WebSocket response:", event.data);
//             return;
//           }

//           console.log("WebSocket event:", data);

//           if (data.type === "connected") {
//             connectedRef.current = true;
//             setConnectionStatus("Connected");
//             inputRef.current?.focus();
//             return;
//           }

//           if (
//             data.type === "error" ||
//             data.type === "authentication_error"
//           ) {
//             connectedRef.current = false;
//             setConnectionStatus("Connection failed");

//             toast.error(
//               data.detail ??
//                 data.message ??
//                 data.error ??
//                 "Chat connection failed."
//             );
//             return;
//           }

//           if (data.type === "message") {
//             const content =
//               data.content ?? data.message ?? data.message_text;

//             if (content == null) return;

//             const rawId = data.message_id ?? data.id;

//             const incoming: ChatMessage = {
//               id:
//                 rawId != null
//                   ? String(rawId)
//                   : `ws-${Date.now()}-${Math.random()
//                       .toString(36)
//                       .slice(2)}`,
//               from:
//                 Number(data.sender_id) === currentUserId
//                   ? "customer"
//                   : "creator",
//               text: String(content),
//               createdAt: data.created_at,
//             };

//             setMessages((previous) => {
//               if (
//                 rawId != null &&
//                 previous.some((item) => item.id === String(rawId))
//               ) {
//                 return previous;
//               }

//               // Avoid showing a duplicate when the server echoes
//               // the message back to the sender.
//               if (
//                 Number(data.sender_id) === currentUserId &&
//                 previous.some(
//                   (item) =>
//                     item.from === "customer" &&
//                     item.text === incoming.text &&
//                     item.id.startsWith("pending-")
//                 )
//               ) {
//                 return previous.map((item) =>
//                   item.from === "customer" &&
//                   item.text === incoming.text &&
//                   item.id.startsWith("pending-")
//                     ? incoming
//                     : item
//                 );
//               }

//               return [...previous, incoming];
//             });

//             setIsCreatorTyping(false);
//             return;
//           }

//           if (data.type === "typing") {
//             setIsCreatorTyping(
//               Number(data.sender_id ?? data.chat_id) !== currentUserId &&
//                 Boolean(data.is_typing ?? true)
//             );
//             return;
//           }

//           if (
//             data.type === "stop_typing" ||
//             data.type === "typing_stopped"
//           ) {
//             setIsCreatorTyping(false);
//           }
//         };

//         socket.onerror = (event) => {
//           console.error("WebSocket error:", event);

//           if (!cancelled) {
//             connectedRef.current = false;
//             setConnectionStatus("Connection error");
//           }
//         };

//         socket.onclose = (event) => {
//           connectedRef.current = false;

//           if (socketRef.current === socket) {
//             socketRef.current = null;
//           }

//           console.log("WebSocket closed:", {
//             code: event.code,
//             reason: event.reason,
//           });

//           if (!cancelled) {
//             setConnectionStatus(
//               event.reason
//                 ? `Disconnected: ${event.reason}`
//                 : `Disconnected (${event.code})`
//             );
//             setIsCreatorTyping(false);
//           }
//         };
//       } catch (error) {
//         if (cancelled) return;

//         console.error("Chat connection failed:", error);
//         setHistoryLoading(false);
//         setConnectionStatus("Unable to connect");

//         toast.error(
//           error instanceof Error
//             ? error.message
//             : "Unable to connect to chat."
//         );
//       }
//     }

//     void connectChat();

//     return () => {
//       cancelled = true;
//       connectedRef.current = false;

//       if (socket) {
//         socket.onopen = null;
//         socket.onmessage = null;
//         socket.onerror = null;
//         socket.onclose = null;

//         if (
//           socket.readyState === WebSocket.OPEN ||
//           socket.readyState === WebSocket.CONNECTING
//         ) {
//           socket.close();
//         }
//       }

//       if (socketRef.current === socket) {
//         socketRef.current = null;
//       }
//     };
//   }, [creator.id, currentUserId]);

//   // Scroll to the latest message.
//   useEffect(() => {
//     endRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "end",
//     });
//   }, [messages.length]);

//   // Send messages through the active WebSocket.
 

// const handleSend = useCallback(() => {
//   const content = text.trim();
//   const socket = socketRef.current;

//   if (!content) return;

//   if (
//     !chatId ||
//     !socket ||
//     socket.readyState !== WebSocket.OPEN ||
//     !connectedRef.current
//   ) {
//     toast.error("Chat is not connected. Please try again.");
//     return;
//   }

//   try {
//     socket.send(
//       JSON.stringify({
//         type: "message",
//         content,
//       })
//     );

//     setText("");
//     inputRef.current?.focus();
//   } catch (error) {
//     console.error("Failed to send message:", error);
//     toast.error("Unable to send message.");
//   }
// }, [chatId, text]);



//   const handleKeyDown = (
//     event: KeyboardEvent<HTMLInputElement>
//   ) => {
//     if (
//       event.key === "Enter" &&
//       !event.shiftKey &&
//       !event.nativeEvent.isComposing
//     ) {
//       event.preventDefault();
//       handleSend();
//     }
//   };

//   // Voice call.
//   const handleVoiceCall = async () => {
//     if (isInitiatingCall) return;

//     if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
//       toast.error("Please log in to make a call.");
//       return;
//     }

//     if (!getAuthToken()) {
//       toast.error("Login token not found. Please log in again.");
//       return;
//     }

//     setIsInitiatingCall(true);

//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/voice-calls/initiate`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...getAuthHeaders(),
//           },
//           body: JSON.stringify({
//             caller_id: currentUserId,
//             receiver_id: Number(creator.id),
//           }),
//         }
//       );

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(data.detail || "Failed to initiate call.");
//       }

//       if (!data.call_id) {
//         throw new Error("Backend did not return a valid call_id.");
//       }

//       toast.success("Call initiated! Connecting...");

//       navigate({
//         to: "/app/call/voice/$id",
//         params: { id: String(creator.id) },
//       });
//     } catch (error) {
//       console.error("Voice call error:", error);

//       toast.error(
//         error instanceof Error
//           ? error.message
//           : "Unable to start call."
//       );
//     } finally {
//       setIsInitiatingCall(false);
//     }
//   };

//   // Image uploads are not supported by the current chat API.
//   const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];

//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       toast.error("Please select an image file.");
//     } else {
//       toast.error(
//         "Image messaging is not supported by the current chat API."
//       );
//     }

//     event.target.value = "";
//   };

//   const canSend =
//     connectionStatus === "Connected" &&
//     connectedRef.current &&
//     Boolean(text.trim());

//   return (
//     <div className="flex flex-col h-[calc(100vh-12rem)] min-h-0 -mx-4 md:mx-0">
//       {/* Header */}
//       <div className="glass-strong px-4 py-3 flex items-center gap-3 sticky top-16 z-30 shrink-0">
//         <button
//           type="button"
//           onClick={() => navigate({ to: "/app/chat" })}
//           aria-label="Back to chats"
//         >
//           <ArrowLeft className="h-5 w-5" />
//         </button>

//         {creator.avatar ? (
//           <img
//             src={creator.avatar}
//             className="h-10 w-10 rounded-full object-cover"
//             alt={creator.name}
//           />
//         ) : (
//           <div className="h-10 w-10 rounded-full glass flex items-center justify-center">
//             {creator.name.charAt(0).toUpperCase()}
//           </div>
//         )}

//         <div className="flex-1 min-w-0">
//           <p className="font-semibold text-sm">{creator.name}</p>

//           <p className="text-[10px] text-muted-foreground flex items-center gap-1">
//             <OnlineDot online={connectionStatus === "Connected"} />
//             {isCreatorTyping
//               ? "Creator is typing..."
//               : connectionStatus}
//           </p>
//         </div>

//         <GiftButton
//           creatorId={creator.id}
//           creatorName={creator.name}
//         />

//         <button
//           type="button"
//           onClick={handleVoiceCall}
//           disabled={isInitiatingCall}
//           className="rounded-full glass p-2 disabled:opacity-50"
//           aria-label="Voice call"
//         >
//           <Phone className="h-4 w-4" />
//         </button>

//         <Link
//           to="/app/call/video/$id"
//           params={{ id: creator.id }}
//           className="rounded-full glass p-2"
//           aria-label="Video call"
//         >
//           <Video className="h-4 w-4" />
//         </Link>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
//         {historyLoading && (
//           <p className="text-center text-sm text-muted-foreground">
//             Loading messages...
//           </p>
//         )}

//         {!historyLoading && messages.length === 0 && (
//           <p className="text-center text-sm text-muted-foreground">
//             Start a conversation with {creator.name}.
//           </p>
//         )}

//         <AnimatePresence initial={false}>
//           {messages.map((message) => {
//             const mine = message.from === "customer";

//             return (
//               <motion.div
//                 key={message.id}
//                 initial={{ opacity: 0, y: 8 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className={`flex ${
//                   mine ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 <div
//                   className={`max-w-[75%] break-words rounded-2xl px-3 py-2 text-sm ${
//                     mine
//                       ? "bg-gradient-primary shadow-glow"
//                       : "glass"
//                   }`}
//                 >
//                   {message.image && (
//                     <img
//                       src={message.image}
//                       alt="Shared image"
//                       className="rounded-xl mb-1 max-h-60 object-cover"
//                     />
//                   )}

//                   {message.text && (
//                     <p className="whitespace-pre-wrap break-words">
//                       {message.text}
//                     </p>
//                   )}
//                 </div>
//               </motion.div>
//             );
//           })}
//         </AnimatePresence>

//         <div ref={endRef} />
//       </div>

//       {/* Message input */}
//       <form
//         className="glass-strong p-3 flex items-center gap-2 sticky bottom-0 shrink-0"
//         onSubmit={(event) => {
//           event.preventDefault();
//           handleSend();
//         }}
//       >
//         <button
//           type="button"
//           className="rounded-full p-2 hover:bg-glass"
//           aria-label="Emoji"
//           onClick={() =>
//             toast.info("Emoji picker is not connected yet.")
//           }
//         >
//           <Smile className="h-5 w-5 text-muted-foreground" />
//         </button>

//         <button
//           type="button"
//           onClick={() => fileRef.current?.click()}
//           className="rounded-full p-2 hover:bg-glass"
//           aria-label="Send image"
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
//           placeholder={
//             connectionStatus === "Connected"
//               ? `${creator.chatPrice} coins/msg`
//               : connectionStatus
//           }
//           className="flex-1 min-w-0 glass rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
//           disabled={connectionStatus !== "Connected"}
//           autoComplete="off"
//           aria-label="Type your message"
//         />

//         <button
//           type="submit"
//           disabled={!canSend}
//           className="rounded-full bg-gradient-primary p-2.5 shadow-glow disabled:opacity-50"
//           aria-label="Send message"
//         >
//           <Send className="h-4 w-4" />
//         </button>
//       </form>

//       <p className="text-center text-[10px] text-muted-foreground py-1 flex items-center justify-center gap-1">
//         <Coins className="h-3 w-3" />
//         {creator.chatPrice} coins/msg ·{" "}
//         {creator.chatPrice * 2} coins/image
//       </p>
//     </div>
//   );
// }


// import {

//   createFileRoute,

//   notFound,

//   Link,

//   useNavigate,

// } from "@tanstack/react-router";

// import { Fragment, useState, useEffect, useRef, useCallback } from "react";

// import type { ChangeEvent, KeyboardEvent } from "react";

// import {

//   ArrowLeft,

//   Send,

//   Phone,

//   Video,

//   Smile,

//   Coins,

//   ImagePlus,

// } from "lucide-react";

// import { motion, AnimatePresence } from "framer-motion";

// import { OnlineDot } from "@/components/ui-kit";

// import { useAuth } from "@/lib/auth-store";

// import { GiftButton } from "@/components/gift-picker";

// import { toast } from "sonner";



// const API_BASE_URL = String(

//   import.meta.env.VITE_BASE_URL ?? ""

// ).replace(/\/+$/, "");



// const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");



// type Creator = {

//   id: string;

//   name: string;

//   avatar: string;

//   online: boolean;

//   chatPrice: number;

// };



// type ApiMessage = {

//   message_id?: number | string;

//   id?: number | string;

//   chat_id?: number | string;

//   sender_id: number | string;

//   receiver_id?: number | string;

//   content?: string;

//   message?: string;

//   message_text?: string;

//   created_at?: string;

// };



// type ChatMessage = {

//   id: string;

//   from: "customer" | "creator";

//   text?: string;

//   image?: string;

//   createdAt?: string;

// };



// type WebSocketEvent = {

//   type?: string;

//   message_id?: number | string;

//   id?: number | string;

//   chat_id?: number | string;

//   sender_id?: number | string;

//   user_id?: number | string;

//   content?: string;

//   message?: string;

//   message_text?: string;

//   created_at?: string;

//   is_typing?: boolean;

//   detail?: string;

//   error?: string;

// };



// function getDateKey(value?: string): string {
//   if (!value) return "unknown";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "unknown";
//   return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
// }

// function getDateLabel(value?: string): string {
//   if (!value) return "Earlier";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "Earlier";

//   const today = new Date();
//   const yesterday = new Date();
//   yesterday.setDate(today.getDate() - 1);
//   const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
//   const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

//   if (getDateKey(value) === todayKey) return "Today";
//   if (getDateKey(value) === yesterdayKey) return "Yesterday";

//   return date.toLocaleDateString(undefined, {
//     day: "numeric",
//     month: "short",
//     year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
//   });
// }

// function getAuthToken(): string | null {

//   if (typeof window === "undefined") return null;



//   return (

//     localStorage.getItem("access_token") ||

//     localStorage.getItem("token")

//   );

// }



// function getAuthHeaders(): Record<string, string> {

//   const token = getAuthToken();



//   return {

//     Accept: "application/json",

//     ...(token ? { Authorization: `Bearer ${token}` } : {}),

//   };

// }



// export const Route = createFileRoute("/app/chat/$id")({

//   component: ChatRoom,



//   loader: async ({ params }) => {

//     if (!API_BASE_URL) {

//       throw new Error("VITE_BASE_URL is not configured.");

//     }



//     const token =

//       typeof window !== "undefined" ? getAuthToken() : null;



//     const response = await fetch(`${API_BASE_URL}/users/`, {

//       headers: {

//         Accept: "application/json",

//         ...(token ? { Authorization: `Bearer ${token}` } : {}),

//       },

//     });



//     if (!response.ok) {

//       throw new Error(`Failed to load users: ${response.status}`);

//     }



//     const result = await response.json();



//     const users = Array.isArray(result)

//       ? result

//       : result.users ?? result.items ?? result.data ?? [];



//     const user = users.find(

//       (item: {

//         id: number | string;

//         role?: string;

//       }) =>

//         String(item.id) === params.id &&

//         item.role?.toLowerCase() === "creator"

//     );



//     if (!user) throw notFound();



//     const profilePhoto = String(

//       user.profile_photo ?? ""

//     ).replace(/\\/g, "/");



//     const avatar = profilePhoto

//       ? /^https?:\/\//i.test(profilePhoto)

//         ? profilePhoto

//         : `${API_BASE_URL}/${profilePhoto.replace(/^\/+/, "")}`

//       : "";



//     return {

//       creator: {

//         id: String(user.id),

//         name: user.display_name || user.username || "Creator",

//         avatar,

//         online: false,

//         chatPrice: 10,

//       } satisfies Creator,

//     };

//   },

// });



// function ChatRoom() {

//   const { creator } = Route.useLoaderData();

//   const navigate = useNavigate();

//   const currentUser = useAuth((state) => state.user);



//   const currentUserId = Number(

//     currentUser?.id ?? currentUser?.user_id

//   );



//   const [chatId, setChatId] = useState<number | null>(null);

//   const [messages, setMessages] = useState<ChatMessage[]>([]);

//   const [text, setText] = useState("");

//   const [connectionStatus, setConnectionStatus] =

//     useState("Connecting...");

//   const [historyLoading, setHistoryLoading] = useState(true);

//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);

//   const [isCreatorTyping, setIsCreatorTyping] = useState(false);
//   const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sentTypingRef = useRef(false);



//   const socketRef = useRef<WebSocket | null>(null);

//   const connectedRef = useRef(false);

//   const inputRef = useRef<HTMLInputElement>(null);

//   const fileRef = useRef<HTMLInputElement>(null);

//   const endRef = useRef<HTMLDivElement>(null);



//   // Create/retrieve the conversation, load history, and connect.

//   useEffect(() => {

//     if (!Number.isInteger(currentUserId) || currentUserId <= 0) {

//       setConnectionStatus("Please log in to chat");

//       setHistoryLoading(false);

//       return;

//     }



//     if (!API_BASE_URL || !WS_BASE_URL) {

//       setConnectionStatus("API URL is missing");

//       setHistoryLoading(false);

//       return;

//     }



//     const token = getAuthToken();



//     if (!token) {

//       setConnectionStatus("Please log in again");

//       setHistoryLoading(false);

//       return;

//     }



//     let cancelled = false;

//     let socket: WebSocket | null = null;



//     async function connectChat() {

//       try {

//         setHistoryLoading(true);

//         setConnectionStatus("Connecting...");

//         setIsCreatorTyping(false);

//         connectedRef.current = false;



//         // Create or retrieve the conversation.

//         const chatResponse = await fetch(

//           `${API_BASE_URL}/chats/with/${creator.id}?user_id=${currentUserId}`,

//           {

//             method: "POST",

//             headers: getAuthHeaders(),

//           }

//         );



//         if (!chatResponse.ok) {

//           const errorData = await chatResponse

//             .json()

//             .catch(() => ({}));



//           throw new Error(

//             errorData.detail ||

//               `Unable to retrieve conversation (${chatResponse.status})`

//           );

//         }



//         const chatData = await chatResponse.json();

//         const actualChatId = Number(chatData.chat_id);



//         if (!Number.isInteger(actualChatId) || actualChatId <= 0) {

//           throw new Error("Backend did not return a valid chat_id.");

//         }



//         if (cancelled) return;



//         setChatId(actualChatId);



//         // Load conversation history.

//         const historyResponse = await fetch(

//           `${API_BASE_URL}/chats/${actualChatId}/messages?user_id=${currentUserId}`,

//           {

//             headers: getAuthHeaders(),

//           }

//         );



//         if (!historyResponse.ok) {

//           const errorData = await historyResponse

//             .json()

//             .catch(() => ({}));



//           throw new Error(

//             errorData.detail ||

//               `Unable to load message history (${historyResponse.status})`

//           );

//         }



//         const historyData = await historyResponse.json();



//         if (cancelled) return;



//         const history: ApiMessage[] = Array.isArray(historyData)

//           ? historyData

//           : historyData.messages ??

//             historyData.items ??

//             historyData.data ??

//             [];



//         const sortedHistory = [...history].sort((a, b) => {
//           const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
//           const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
//           return aTime - bTime;
//         });

//         setMessages(

//           sortedHistory.map((message, index) => ({

//             id: String(

//               message.message_id ??

//                 message.id ??

//                 `history-${actualChatId}-${index}`

//             ),

//             from:

//               Number(message.sender_id) === currentUserId

//                 ? "customer"

//                 : "creator",

//             text: String(

//               message.content ??

//                 message.message ??

//                 message.message_text ??

//                 ""

//             ),

//             createdAt: message.created_at,

//           }))

//         );



//         setHistoryLoading(false);



//         // Connect to the actual chat ID returned by the API.

//         const wsUrl = new URL(

//           `/ws/chat/${actualChatId}`,

//           WS_BASE_URL

//         );



//         // Required by the currently supplied FastAPI route.

//         wsUrl.searchParams.set("user_id", String(currentUserId));



//         socket = new WebSocket(wsUrl.toString());

//         socketRef.current = socket;



//         socket.onopen = () => {

//           if (cancelled) {

//             socket?.close();

//             return;

//           }



//           // The supplied backend accepts the connection immediately

//           // and sends a "connected" event. Do not wait for an

//           // authentication event it does not implement.

//           setConnectionStatus("Waiting for server...");

//         };



//         socket.onmessage = (event: MessageEvent<string>) => {

//           if (cancelled) return;



//           let data: WebSocketEvent;



//           try {

//             data = JSON.parse(event.data);

//           } catch {

//             console.error("Invalid WebSocket response:", event.data);

//             return;

//           }



//           console.log("WebSocket event:", data);



//           if (data.type === "connected") {

//             connectedRef.current = true;

//             setConnectionStatus("Connected");

//             inputRef.current?.focus();

//             return;

//           }



//           if (

//             data.type === "error" ||

//             data.type === "authentication_error"

//           ) {

//             connectedRef.current = false;

//             setConnectionStatus("Connection failed");



//             toast.error(

//               data.detail ??

//                 data.message ??

//                 data.error ??

//                 "Chat connection failed."

//             );

//             return;

//           }



//           if (data.type === "message") {

//             const content =

//               data.content ?? data.message ?? data.message_text;



//             if (content == null) return;



//             const rawId = data.message_id ?? data.id;



//             const incoming: ChatMessage = {

//               id:

//                 rawId != null

//                   ? String(rawId)

//                   : `ws-${Date.now()}-${Math.random()

//                       .toString(36)

//                       .slice(2)}`,

//               from:

//                 Number(data.sender_id) === currentUserId

//                   ? "customer"

//                   : "creator",

//               text: String(content),

//               createdAt: data.created_at,

//             };



//             setMessages((previous) => {

//               if (

//                 rawId != null &&

//                 previous.some((item) => item.id === String(rawId))

//               ) {

//                 return previous;

//               }



//               // Avoid showing a duplicate when the server echoes

//               // the message back to the sender.

//               if (

//                 Number(data.sender_id) === currentUserId &&

//                 previous.some(

//                   (item) =>

//                     item.from === "customer" &&

//                     item.text === incoming.text &&

//                     item.id.startsWith("pending-")

//                 )

//               ) {

//                 return previous.map((item) =>

//                   item.from === "customer" &&

//                   item.text === incoming.text &&

//                   item.id.startsWith("pending-")

//                     ? incoming

//                     : item

//                 );

//               }



//               return [...previous, incoming];

//             });



//             setIsCreatorTyping(false);

//             return;

//           }



//           if (data.type === "typing") {
//             const typingUserId = Number(data.user_id ?? data.sender_id);
//             if (typingUserId !== currentUserId) {
//               setIsCreatorTyping(true);
//               if (remoteTypingTimeoutRef.current) {
//                 clearTimeout(remoteTypingTimeoutRef.current);
//               }
//               remoteTypingTimeoutRef.current = setTimeout(() => {
//                 setIsCreatorTyping(false);
//               }, 4000);
//             }
//             return;
//           }

//           if (
//             data.type === "stop_typing" ||
//             data.type === "typing_stopped"
//           ) {
//             const typingUserId = Number(data.user_id ?? data.sender_id);
//             if (typingUserId !== currentUserId) {
//               setIsCreatorTyping(false);
//               if (remoteTypingTimeoutRef.current) {
//                 clearTimeout(remoteTypingTimeoutRef.current);
//                 remoteTypingTimeoutRef.current = null;
//               }
//             }
//             return;
//           }
//         };

//         socket.onerror = (event) => {

//           console.error("WebSocket error:", event);



//           if (!cancelled) {

//             connectedRef.current = false;

//             setConnectionStatus("Connection error");

//           }

//         };



//         socket.onclose = (event) => {

//           connectedRef.current = false;



//           if (socketRef.current === socket) {

//             socketRef.current = null;

//           }



//           console.log("WebSocket closed:", {

//             code: event.code,

//             reason: event.reason,

//           });



//           if (!cancelled) {

//             setConnectionStatus(

//               event.reason

//                 ? `Disconnected: ${event.reason}`

//                 : `Disconnected (${event.code})`

//             );

//             setIsCreatorTyping(false);

//           }

//         };

//       } catch (error) {

//         if (cancelled) return;



//         console.error("Chat connection failed:", error);

//         setHistoryLoading(false);

//         setConnectionStatus("Unable to connect");



//         toast.error(

//           error instanceof Error

//             ? error.message

//             : "Unable to connect to chat."

//         );

//       }

//     }



//     void connectChat();



//     return () => {

//       cancelled = true;

//       connectedRef.current = false;
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
//       sentTypingRef.current = false;

//       if (socket) {

//         socket.onopen = null;

//         socket.onmessage = null;

//         socket.onerror = null;

//         socket.onclose = null;



//         if (

//           socket.readyState === WebSocket.OPEN ||

//           socket.readyState === WebSocket.CONNECTING

//         ) {

//           socket.close();

//         }

//       }



//       if (socketRef.current === socket) {

//         socketRef.current = null;

//       }

//     };

//   }, [creator.id, currentUserId]);



//   // Scroll to the latest message.

//   useEffect(() => {

//     endRef.current?.scrollIntoView({

//       behavior: "smooth",

//       block: "end",

//     });

//   }, [messages.length]);



//   // Notify the creator while the customer is typing.
//   const handleTextChange = (value: string) => {
//     setText(value);
//     const socket = socketRef.current;

//     if (!value.trim()) {
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       if (sentTypingRef.current && socket?.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify({ type: "stop_typing" }));
//       }
//       sentTypingRef.current = false;
//       return;
//     }

//     if (socket?.readyState === WebSocket.OPEN && connectedRef.current) {
//       socket.send(JSON.stringify({ type: "typing" }));
//       sentTypingRef.current = true;
//     }

//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     typingTimeoutRef.current = setTimeout(() => {
//       const activeSocket = socketRef.current;
//       if (sentTypingRef.current && activeSocket?.readyState === WebSocket.OPEN) {
//         activeSocket.send(JSON.stringify({ type: "stop_typing" }));
//       }
//       sentTypingRef.current = false;
//     }, 1300);
//   };

//   // Send messages through the active WebSocket.





// const handleSend = useCallback(() => {

//   const content = text.trim();

//   const socket = socketRef.current;



//   if (!content) return;



//   if (

//     !chatId ||

//     !socket ||

//     socket.readyState !== WebSocket.OPEN ||

//     !connectedRef.current

//   ) {

//     toast.error("Chat is not connected. Please try again.");

//     return;

//   }



//   try {

//     // Stop the typing indicator immediately when the customer sends.
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//       typingTimeoutRef.current = null;
//     }
//     if (sentTypingRef.current) {
//       socket.send(JSON.stringify({ type: "stop_typing" }));
//       sentTypingRef.current = false;
//     }

//     socket.send(
//       JSON.stringify({
//         type: "message",
//         content,
//       })
//     );

//     setText("");

//     inputRef.current?.focus();

//   } catch (error) {

//     console.error("Failed to send message:", error);

//     toast.error("Unable to send message.");

//   }

// }, [chatId, text]);







//   const handleKeyDown = (

//     event: KeyboardEvent<HTMLInputElement>

//   ) => {

//     if (

//       event.key === "Enter" &&

//       !event.shiftKey &&

//       !event.nativeEvent.isComposing

//     ) {

//       event.preventDefault();

//       handleSend();

//     }

//   };



//   // Voice call.

//   const handleVoiceCall = async () => {

//     if (isInitiatingCall) return;



//     if (!Number.isInteger(currentUserId) || currentUserId <= 0) {

//       toast.error("Please log in to make a call.");

//       return;

//     }



//     if (!getAuthToken()) {

//       toast.error("Login token not found. Please log in again.");

//       return;

//     }



//     setIsInitiatingCall(true);



//     try {

//       const response = await fetch(

//         `${API_BASE_URL}/voice-calls/initiate`,

//         {

//           method: "POST",

//           headers: {

//             "Content-Type": "application/json",

//             ...getAuthHeaders(),

//           },

//           body: JSON.stringify({

//             caller_id: currentUserId,

//             receiver_id: Number(creator.id),

//           }),

//         }

//       );



//       const data = await response.json().catch(() => ({}));



//       if (!response.ok) {

//         throw new Error(data.detail || "Failed to initiate call.");

//       }



//       if (!data.call_id) {

//         throw new Error("Backend did not return a valid call_id.");

//       }



//       toast.success("Call initiated! Connecting...");



//       navigate({

//         to: "/app/call/voice/$id",

//         params: { id: String(creator.id) },

//       });

//     } catch (error) {

//       console.error("Voice call error:", error);



//       toast.error(

//         error instanceof Error

//           ? error.message

//           : "Unable to start call."

//       );

//     } finally {

//       setIsInitiatingCall(false);

//     }

//   };



//   // Image uploads are not supported by the current chat API.

//   const handleImage = (event: ChangeEvent<HTMLInputElement>) => {

//     const file = event.target.files?.[0];



//     if (!file) return;



//     if (!file.type.startsWith("image/")) {

//       toast.error("Please select an image file.");

//     } else {

//       toast.error(

//         "Image messaging is not supported by the current chat API."

//       );

//     }



//     event.target.value = "";

//   };



//   const canSend =

//     connectionStatus === "Connected" &&

//     connectedRef.current &&

//     Boolean(text.trim());



//   return (

//     <div className="flex flex-col h-[calc(100vh-12rem)] min-h-0 -mx-4 md:mx-0">

//       {/* Header */}

//       <div className="glass-strong px-4 py-3 flex items-center gap-3 sticky top-16 z-30 shrink-0">

//         <button

//           type="button"

//           onClick={() => navigate({ to: "/app/chat" })}

//           aria-label="Back to chats"

//         >

//           <ArrowLeft className="h-5 w-5" />

//         </button>



//         {creator.avatar ? (

//           <img

//             src={creator.avatar}

//             className="h-10 w-10 rounded-full object-cover"

//             alt={creator.name}

//           />

//         ) : (

//           <div className="h-10 w-10 rounded-full glass flex items-center justify-center">

//             {creator.name.charAt(0).toUpperCase()}

//           </div>

//         )}



//         <div className="flex-1 min-w-0">

//           <p className="font-semibold text-sm">{creator.name}</p>



//           <p className="text-[10px] text-muted-foreground flex items-center gap-1">

//             <OnlineDot online={connectionStatus === "Connected"} />

//             {isCreatorTyping

//               ? "Creator is typing..."

//               : connectionStatus}

//           </p>

//         </div>



//         <GiftButton

//           creatorId={creator.id}

//           creatorName={creator.name}

//         />



//         <button

//           type="button"

//           onClick={handleVoiceCall}

//           disabled={isInitiatingCall}

//           className="rounded-full glass p-2 disabled:opacity-50"

//           aria-label="Voice call"

//         >

//           <Phone className="h-4 w-4" />

//         </button>



//         <Link

//           to="/app/call/video/$id"

//           params={{ id: creator.id }}

//           className="rounded-full glass p-2"

//           aria-label="Video call"

//         >

//           <Video className="h-4 w-4" />

//         </Link>

//       </div>



//       {/* Messages */}

//       <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">

//         {historyLoading && (

//           <p className="text-center text-sm text-muted-foreground">

//             Loading messages...

//           </p>

//         )}



//         {!historyLoading && messages.length === 0 && (

//           <p className="text-center text-sm text-muted-foreground">

//             Start a conversation with {creator.name}.

//           </p>

//         )}



//         <AnimatePresence initial={false}>

//           {messages.map((message, index) => {
//             const mine = message.from === "customer";
//             const currentDateKey = getDateKey(message.createdAt);
//             const previousDateKey = index > 0
//               ? getDateKey(messages[index - 1].createdAt)
//               : null;
//             const showDateSeparator = index === 0 || currentDateKey !== previousDateKey;

//             return (
//               <Fragment key={message.id}>
//                 {showDateSeparator && (
//                   <div className="flex justify-center py-3">
//                     <span className="rounded-full glass px-3 py-1 text-[11px] text-muted-foreground">
//                       {getDateLabel(message.createdAt)}
//                     </span>
//                   </div>
//                 )}
//               <motion.div
//                 initial={{ opacity: 0, y: 8 }}

//                 animate={{ opacity: 1, y: 0 }}

//                 className={`flex ${

//                   mine ? "justify-end" : "justify-start"

//                 }`}

//               >

//                 <div

//                   className={`max-w-[75%] break-words rounded-2xl px-3 py-2 text-sm ${

//                     mine

//                       ? "bg-gradient-primary shadow-glow"

//                       : "glass"

//                   }`}

//                 >

//                   {message.image && (

//                     <img

//                       src={message.image}

//                       alt="Shared image"

//                       className="rounded-xl mb-1 max-h-60 object-cover"

//                     />

//                   )}



//                   {message.text && (

//                     <p className="whitespace-pre-wrap break-words">

//                       {message.text}

//                     </p>

//                   )}

//                 </div>

//               </motion.div>
//               </Fragment>
//             );
//           })}

//         {isCreatorTyping && (
//           <div className="flex justify-start">
//             <div className="glass rounded-2xl px-4 py-2 text-sm text-muted-foreground">
//               <span className="inline-flex items-center gap-1">
//                 Creator is typing
//                 <span className="animate-bounce">.</span>
//                 <span className="animate-bounce [animation-delay:150ms]">.</span>
//                 <span className="animate-bounce [animation-delay:300ms]">.</span>
//               </span>
//             </div>
//           </div>
//         )}

//         </AnimatePresence>



//         <div ref={endRef} />

//       </div>



//       {/* Message input */}

//       <form

//         className="glass-strong p-3 flex items-center gap-2 sticky bottom-0 shrink-0"

//         onSubmit={(event) => {

//           event.preventDefault();

//           handleSend();

//         }}

//       >

//         <button

//           type="button"

//           className="rounded-full p-2 hover:bg-glass"

//           aria-label="Emoji"

//           onClick={() =>

//             toast.info("Emoji picker is not connected yet.")

//           }

//         >

//           <Smile className="h-5 w-5 text-muted-foreground" />

//         </button>



//         <button

//           type="button"

//           onClick={() => fileRef.current?.click()}

//           className="rounded-full p-2 hover:bg-glass"

//           aria-label="Send image"

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

//           onChange={(event) => handleTextChange(event.target.value)}

//           onKeyDown={handleKeyDown}

//           placeholder={

//             connectionStatus === "Connected"

//               ? `${creator.chatPrice} coins/msg`

//               : connectionStatus

//           }

//           className="flex-1 min-w-0 glass rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"

//           disabled={connectionStatus !== "Connected"}

//           autoComplete="off"

//           aria-label="Type your message"

//         />



//         <button

//           type="submit"

//           disabled={!canSend}

//           className="rounded-full bg-gradient-primary p-2.5 shadow-glow disabled:opacity-50"

//           aria-label="Send message"

//         >

//           <Send className="h-4 w-4" />

//         </button>

//       </form>



//       <p className="text-center text-[10px] text-muted-foreground py-1 flex items-center justify-center gap-1">

//         <Coins className="h-3 w-3" />

//         {creator.chatPrice} coins/msg ·{" "}

//         {creator.chatPrice * 2} coins/image

//       </p>

//     </div>

//   );

// }


import {
  createFileRoute,
  notFound,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";

import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  Smile,
  Coins,
  ImagePlus,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { OnlineDot } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { GiftButton } from "@/components/gift-picker";
import { toast } from "sonner";

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ?? ""
).replace(/\/+$/, "");

const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");

type Creator = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  chatPrice: number;
};

type ApiMessage = {
  message_id?: number | string;
  id?: number | string;
  chat_id?: number | string;
  sender_id: number | string;
  receiver_id?: number | string;
  content?: string;
  message?: string;
  message_text?: string;
  created_at?: string;
};

type ChatMessage = {
  id: string;
  from: "customer" | "creator";
  text?: string;
  image?: string;
  createdAt?: string;
};

type WebSocketEvent = {
  type?: string;
  message_id?: number | string;
  id?: number | string;
  chat_id?: number | string;
  sender_id?: number | string;
  receiver_id?: number | string;
  user_id?: number | string;
  content?: string;
  message?: string;
  message_text?: string;
  created_at?: string;
  is_typing?: boolean;
  detail?: string;
  error?: string;
};

type UserApiResponse = {
  id?: number | string;
  user_id?: number | string;
  role?: string;
  display_name?: string;
  username?: string;
  profile_photo?: string;
};

type PricingApiResponse = {
  id?: number;
  user_id?: number | string;
  chat_amount?: string | number;
  voice_call_amount?: string | number;
  video_call_amount?: string | number;
};

function getDateKey(value?: string): string {
  if (!value) return "unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDateLabel(value?: string): string {
  if (!value) return "Earlier";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const todayKey = getDateKey(today.toISOString());
  const yesterdayKey = getDateKey(yesterday.toISOString());
  const messageDateKey = getDateKey(value);

  if (messageDateKey === todayKey) return "Today";
  if (messageDateKey === yesterdayKey) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() === today.getFullYear()
        ? undefined
        : "numeric",
  });
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  return {
    Accept: "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

function getApiList<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (result && typeof result === "object") {
    const data = result as {
      users?: T[];
      items?: T[];
      data?: T[];
      messages?: T[];
    };

    return (
      data.users ??
      data.items ??
      data.messages ??
      data.data ??
      []
    );
  }

  return [];
}

export const Route = createFileRoute("/app/chat/$id")({
  component: ChatRoom,

  loader: async ({ params }) => {
    if (!API_BASE_URL) {
      throw new Error("VITE_BASE_URL is not configured.");
    }

    // ================================================
    // 1. CREATOR ID FROM URL
    // ================================================
    // Example: /app/chat/15
    // Here 15 is the creator ID being chatted with.
    // It is NOT the logged-in customer's ID.
    // ================================================

    const creatorId = Number(params.id);

    if (!Number.isInteger(creatorId) || creatorId <= 0) {
      throw new Error("Invalid creator ID in chat URL.");
    }

    const token =
      typeof window !== "undefined"
        ? getAuthToken()
        : null;

    const headers = {
      Accept: "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    };

    // ================================================
    // 2. FETCH USERS
    // ================================================

    const usersResponse = await fetch(
      `${API_BASE_URL}/users/`,
      { headers }
    );

    if (!usersResponse.ok) {
      throw new Error(
        `Failed to load users: ${usersResponse.status}`
      );
    }

    const usersResult = await usersResponse.json();

    const users = getApiList<UserApiResponse>(
      usersResult
    );

    // Find the creator using the URL ID.
    // Support both id and user_id response fields.

    const user = users.find((item) => {
      const apiUserId = Number(
        item.id ?? item.user_id
      );

      return (
        apiUserId === creatorId &&
        item.role?.toLowerCase() === "creator"
      );
    });

    if (!user) {
      throw notFound();
    }

    // Always use the ID from the matched creator record.
    const actualCreatorId = Number(
      user.id ?? user.user_id
    );

    if (
      !Number.isInteger(actualCreatorId) ||
      actualCreatorId !== creatorId
    ) {
      throw new Error(
        "Creator ID does not match the chat URL."
      );
    }

    // ================================================
    // 3. CREATOR PROFILE IMAGE
    // ================================================

    const profilePhoto = String(
      user.profile_photo ?? ""
    ).replace(/\\/g, "/");

    const avatar = profilePhoto
      ? /^https?:\/\//i.test(profilePhoto)
        ? profilePhoto
        : `${API_BASE_URL}/${profilePhoto.replace(/^\/+/, "")}`
      : "";

    // ================================================
    // 4. FETCH PRICING USING CREATOR ID
    // ================================================
    // IMPORTANT:
    // Do NOT use the logged-in customer ID here.
    //
    // Correct:
    // GET /pricing-details/user/{creatorId}
    //
    // Wrong:
    // GET /pricing-details/user/{currentUserId}
    // ================================================

    const pricingUserId = actualCreatorId;

    let chatPrice = 0;

    try {
      const pricingUrl =
        `${API_BASE_URL}/pricing-details/user/` +
        encodeURIComponent(String(pricingUserId));

      console.log("PRICING REQUEST:", {
        creatorId: actualCreatorId,
        pricingUserId,
        pricingUrl,
      });

      const pricingResponse = await fetch(
        pricingUrl,
        {
          method: "GET",
          headers,
        }
      );

      if (!pricingResponse.ok) {
        const errorData = await pricingResponse
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.detail ||
            `Pricing API failed: ${pricingResponse.status}`
        );
      }

      const pricing: PricingApiResponse =
        await pricingResponse.json();

      // Verify that backend returned pricing
      // belonging to the creator being chatted with.

      if (
        pricing.user_id == null ||
        Number(pricing.user_id) !== actualCreatorId
      ) {
        throw new Error(
          `Pricing ID mismatch. Expected creator ID ${actualCreatorId}, received ${pricing.user_id}.`
        );
      }

      const parsedPrice = Number(
        pricing.chat_amount
      );

      if (
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0
      ) {
        throw new Error(
          "Invalid creator chat amount."
        );
      }

      chatPrice = parsedPrice;

      console.log("CREATOR PRICING SUCCESS:", {
        creatorId: actualCreatorId,
        pricingUserId: pricing.user_id,
        chatPrice: pricing.chat_amount,
        voiceCallPrice: pricing.voice_call_amount,
        videoCallPrice: pricing.video_call_amount,
      });
    } catch (error) {
      console.error(
        "CREATOR PRICING ERROR:",
        error
      );

      // Do not silently treat a missing pricing record
      // as a free chat. The UI will show zero until
      // the pricing record is configured.
      chatPrice = 0;
    }

    // ================================================
    // 5. RETURN CREATOR DATA
    // ================================================

    return {
      creator: {
        id: String(actualCreatorId),
        name:
          user.display_name ||
          user.username ||
          "Creator",
        avatar,
        online: false,
        chatPrice,
      } satisfies Creator,
    };
  },
});

function ChatRoom() {
  const { creator } = Route.useLoaderData();

  const navigate = useNavigate();

  // ================================================
  // LOGGED-IN CUSTOMER ID
  // ================================================

  const currentUser = useAuth(
    (state) => state.user
  );

  const currentUserId = Number(
    currentUser?.id ?? currentUser?.user_id
  );

  // The creator ID comes from the loader.
  const creatorId = Number(creator.id);

  const [chatId, setChatId] =
    useState<number | null>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [text, setText] = useState("");

  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [isInitiatingCall, setIsInitiatingCall] =
    useState(false);

  const [isCreatorTyping, setIsCreatorTyping] =
    useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const remoteTypingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const sentTypingRef = useRef(false);

  const socketRef = useRef<WebSocket | null>(null);

  const connectedRef = useRef(false);

  const lastSentMessageRef =
    useRef<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // ================================================
  // CREATE CHAT AND LOAD HISTORY
  // ================================================

  useEffect(() => {
    if (
      !Number.isInteger(currentUserId) ||
      currentUserId <= 0
    ) {
      setConnectionStatus("Please log in to chat");
      setHistoryLoading(false);
      return;
    }

    if (
      !Number.isInteger(creatorId) ||
      creatorId <= 0
    ) {
      setConnectionStatus("Invalid creator ID");
      setHistoryLoading(false);
      return;
    }

    if (!API_BASE_URL || !WS_BASE_URL) {
      setConnectionStatus("API URL is missing");
      setHistoryLoading(false);
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setConnectionStatus("Please log in again");
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    let socket: WebSocket | null = null;

    async function connectChat() {
      try {
        setHistoryLoading(true);
        setConnectionStatus("Connecting...");
        setIsCreatorTyping(false);
        setIsSending(false);

        lastSentMessageRef.current = null;
        connectedRef.current = false;

        // ==========================================
        // 1. CREATE OR RETRIEVE CONVERSATION
        // ==========================================
        // Logged-in customer = currentUserId
        // Chatting creator = creatorId
        // ==========================================

        console.log("CREATE CHAT:", {
          loggedInCustomerId: currentUserId,
          chattingCreatorId: creatorId,
        });

        const chatResponse = await fetch(
          `${API_BASE_URL}/chats/with/${creatorId}?user_id=${encodeURIComponent(
            String(currentUserId)
          )}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );

        if (!chatResponse.ok) {
          const errorData = await chatResponse
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.detail ||
              `Unable to retrieve conversation (${chatResponse.status})`
          );
        }

        const chatData = await chatResponse.json();

        const actualChatId = Number(
          chatData.chat_id ??
            chatData.id ??
            chatData.chat?.chat_id
        );

        if (
          !Number.isInteger(actualChatId) ||
          actualChatId <= 0
        ) {
          throw new Error(
            "Backend did not return a valid chat_id."
          );
        }

        if (cancelled) return;

        setChatId(actualChatId);

        // ==========================================
        // 2. LOAD CONVERSATION HISTORY
        // ==========================================

        const historyResponse = await fetch(
          `${API_BASE_URL}/chats/${actualChatId}/messages?user_id=${encodeURIComponent(
            String(currentUserId)
          )}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!historyResponse.ok) {
          const errorData = await historyResponse
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.detail ||
              `Unable to load message history (${historyResponse.status})`
          );
        }

        const historyData =
          await historyResponse.json();

        if (cancelled) return;

        const history = getApiList<ApiMessage>(
          historyData
        );

        const sortedHistory = [...history].sort(
          (a, b) => {
            const aTime = a.created_at
              ? new Date(a.created_at).getTime()
              : 0;

            const bTime = b.created_at
              ? new Date(b.created_at).getTime()
              : 0;

            return aTime - bTime;
          }
        );

        setMessages(
          sortedHistory.map((message, index) => ({
            id: String(
              message.message_id ??
                message.id ??
                `history-${actualChatId}-${index}`
            ),

            from:
              Number(message.sender_id) ===
              currentUserId
                ? "customer"
                : "creator",

            text: String(
              message.content ??
                message.message ??
                message.message_text ??
                ""
            ),

            createdAt: message.created_at,
          }))
        );

        setHistoryLoading(false);

        // ==========================================
        // 3. CONNECT WEBSOCKET
        // ==========================================

        const wsUrl = new URL(
          `/ws/chat/${actualChatId}`,
          WS_BASE_URL
        );

        // WebSocket user_id is the logged-in customer.
        wsUrl.searchParams.set(
          "user_id",
          String(currentUserId)
        );

        socket = new WebSocket(
          wsUrl.toString()
        );

        socketRef.current = socket;

        socket.onopen = () => {
          if (cancelled) {
            socket?.close();
            return;
          }

          setConnectionStatus(
            "Waiting for server..."
          );
        };

        socket.onmessage = (
          event: MessageEvent<string>
        ) => {
          if (cancelled) return;

          let data: WebSocketEvent;

          try {
            data = JSON.parse(event.data);
          } catch {
            console.error(
              "Invalid WebSocket response:",
              event.data
            );
            return;
          }

          console.log("WebSocket event:", data);

          // ======================================
          // CONNECTION SUCCESS
          // ======================================

          if (
            data.type === "connected" ||
            data.type === "connection_established"
          ) {
            connectedRef.current = true;
            setConnectionStatus("Connected");
            inputRef.current?.focus();
            return;
          }

          // ======================================
          // BACKEND MESSAGE ERROR
          // ======================================

          if (
            data.type === "error" ||
            data.type === "authentication_error"
          ) {
            const errorMessage =
              data.detail ??
              data.message ??
              data.error ??
              "Unable to send message.";

            if (lastSentMessageRef.current !== null) {
              const failedMessage =
                lastSentMessageRef.current;

              lastSentMessageRef.current = null;

              setText((previous) =>
                previous.trim()
                  ? previous
                  : failedMessage
              );

              setIsSending(false);
            }

            toast.error(errorMessage);
            return;
          }

          // ======================================
          // MESSAGE SENT CONFIRMATION
          // ======================================

          if (data.type === "message_sent") {
            lastSentMessageRef.current = null;
            setIsSending(false);

            console.log(
              "Message saved:",
              data.message_id
            );

            return;
          }

          // ======================================
          // INCOMING MESSAGE
          // ======================================

          if (data.type === "message") {
            const content =
              data.content ??
              data.message ??
              data.message_text;

            if (content == null) return;

            const rawId =
              data.message_id ?? data.id;

            const senderId = Number(
              data.sender_id ?? data.user_id
            );

            const incoming: ChatMessage = {
              id:
                rawId != null
                  ? String(rawId)
                  : `ws-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2)}`,

              from:
                senderId === currentUserId
                  ? "customer"
                  : "creator",

              text: String(content),

              createdAt: data.created_at,
            };

            setMessages((previous) => {
              if (
                rawId != null &&
                previous.some(
                  (item) =>
                    item.id === String(rawId)
                )
              ) {
                return previous;
              }

              return [...previous, incoming];
            });

            if (senderId === currentUserId) {
              lastSentMessageRef.current = null;
              setIsSending(false);
            }

            setIsCreatorTyping(false);

            if (remoteTypingTimeoutRef.current) {
              clearTimeout(
                remoteTypingTimeoutRef.current
              );

              remoteTypingTimeoutRef.current = null;
            }

            return;
          }

          // ======================================
          // CREATOR TYPING
          // ======================================

          if (data.type === "typing") {
            const typingUserId = Number(
              data.user_id ?? data.sender_id
            );

            if (typingUserId !== currentUserId) {
              setIsCreatorTyping(true);

              if (remoteTypingTimeoutRef.current) {
                clearTimeout(
                  remoteTypingTimeoutRef.current
                );
              }

              remoteTypingTimeoutRef.current =
                setTimeout(() => {
                  setIsCreatorTyping(false);
                }, 4000);
            }

            return;
          }

          // ======================================
          // CREATOR STOPPED TYPING
          // ======================================

          if (
            data.type === "stop_typing" ||
            data.type === "typing_stopped"
          ) {
            const typingUserId = Number(
              data.user_id ?? data.sender_id
            );

            if (typingUserId !== currentUserId) {
              setIsCreatorTyping(false);

              if (remoteTypingTimeoutRef.current) {
                clearTimeout(
                  remoteTypingTimeoutRef.current
                );

                remoteTypingTimeoutRef.current = null;
              }
            }

            return;
          }

          if (data.type === "pong") {
            return;
          }
        };

        socket.onerror = (event) => {
          console.error(
            "WebSocket error:",
            event
          );

          if (!cancelled) {
            connectedRef.current = false;

            setConnectionStatus(
              "Connection error"
            );
          }
        };

        socket.onclose = (event) => {
          connectedRef.current = false;

          if (socketRef.current === socket) {
            socketRef.current = null;
          }

          console.log("WebSocket closed:", {
            code: event.code,
            reason: event.reason,
          });

          if (!cancelled) {
            setConnectionStatus(
              event.reason
                ? `Disconnected: ${event.reason}`
                : `Disconnected (${event.code})`
            );

            setIsCreatorTyping(false);

            if (lastSentMessageRef.current !== null) {
              const failedMessage =
                lastSentMessageRef.current;

              lastSentMessageRef.current = null;

              setText((previous) =>
                previous.trim()
                  ? previous
                  : failedMessage
              );

              setIsSending(false);
            }
          }
        };
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Chat connection failed:",
          error
        );

        setHistoryLoading(false);

        setConnectionStatus(
          "Unable to connect"
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to connect to chat."
        );
      }
    }

    void connectChat();

    return () => {
      cancelled = true;

      connectedRef.current = false;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (remoteTypingTimeoutRef.current) {
        clearTimeout(
          remoteTypingTimeoutRef.current
        );
      }

      sentTypingRef.current = false;

      if (socket) {
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
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [creatorId, currentUserId]);

  // ================================================
  // SCROLL TO LATEST MESSAGE
  // ================================================

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, isCreatorTyping]);

  // ================================================
  // CUSTOMER TYPING INDICATOR
  // ================================================

  const handleTextChange = (value: string) => {
    setText(value);

    const socket = socketRef.current;

    if (!value.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (
        sentTypingRef.current &&
        socket?.readyState === WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "stop_typing",
          })
        );
      }

      sentTypingRef.current = false;
      return;
    }

    if (
      socket?.readyState === WebSocket.OPEN &&
      connectedRef.current &&
      !sentTypingRef.current
    ) {
      socket.send(
        JSON.stringify({
          type: "typing",
        })
      );

      sentTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      const activeSocket = socketRef.current;

      if (
        sentTypingRef.current &&
        activeSocket?.readyState === WebSocket.OPEN
      ) {
        activeSocket.send(
          JSON.stringify({
            type: "stop_typing",
          })
        );
      }

      sentTypingRef.current = false;
    }, 1300);
  };

  // ================================================
  // SEND CUSTOMER MESSAGE
  // ================================================

  const handleSend = useCallback(() => {
    const content = text.trim();

    const socket = socketRef.current;

    if (!content) return;

    if (
      !chatId ||
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !connectedRef.current
    ) {
      toast.error(
        "Chat is not connected. Please try again."
      );
      return;
    }

    if (lastSentMessageRef.current !== null) {
      toast.error(
        "Please wait for the previous message."
      );
      return;
    }

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (sentTypingRef.current) {
        socket.send(
          JSON.stringify({
            type: "stop_typing",
          })
        );

        sentTypingRef.current = false;
      }

      lastSentMessageRef.current = content;
      setIsSending(true);

      // Backend handles customer wallet deduction.
      socket.send(
        JSON.stringify({
          type: "message",
          content,
          message_type: "text",
        })
      );

      setText("");
      inputRef.current?.focus();
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );

      lastSentMessageRef.current = null;
      setIsSending(false);
      setText(content);

      toast.error("Unable to send message.");
    }
  }, [chatId, text]);

  // ================================================
  // ENTER KEY
  // ================================================

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  // ================================================
  // VOICE CALL
  // ================================================

  const handleVoiceCall = async () => {
    if (isInitiatingCall) return;

    if (
      !Number.isInteger(currentUserId) ||
      currentUserId <= 0
    ) {
      toast.error(
        "Please log in to make a call."
      );
      return;
    }

    if (!getAuthToken()) {
      toast.error(
        "Login token not found. Please log in again."
      );
      return;
    }

    setIsInitiatingCall(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/voice-calls/initiate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },

          body: JSON.stringify({
            caller_id: currentUserId,
            receiver_id: creatorId,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to initiate call."
        );
      }

      if (!data.call_id) {
        throw new Error(
          "Backend did not return a valid call_id."
        );
      }

      toast.success(
        "Call initiated! Connecting..."
      );

      navigate({
        to: "/app/call/voice/$id",
        params: {
          id: String(creatorId),
        },
      });
    } catch (error) {
      console.error(
        "Voice call error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start call."
      );
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // ================================================
  // IMAGE UPLOAD
  // ================================================

  const handleImage = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Please select an image file."
      );
    } else {
      toast.error(
        "Image messaging is not supported by the current chat API."
      );
    }

    event.target.value = "";
  };

  // ================================================
  // SEND BUTTON STATUS
  // ================================================

  const canSend =
    connectionStatus === "Connected" &&
    connectedRef.current &&
    Boolean(text.trim()) &&
    !isSending;

  // ================================================
  // UI
  // ================================================

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-0 -mx-4 md:mx-0">

      {/* HEADER */}

      <div className="glass-strong px-4 py-3 flex items-center gap-3 sticky top-16 z-30 shrink-0">

        <button
          type="button"
          onClick={() =>
            navigate({ to: "/app/chat" })
          }
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {creator.avatar ? (
          <img
            src={creator.avatar}
            className="h-10 w-10 rounded-full object-cover"
            alt={creator.name}
          />
        ) : (
          <div className="h-10 w-10 rounded-full glass flex items-center justify-center">
            {creator.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {creator.name}
          </p>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <OnlineDot
              online={
                connectionStatus === "Connected"
              }
            />

            {isCreatorTyping
              ? "Creator is typing..."
              : connectionStatus}
          </p>
        </div>

        <GiftButton
          creatorId={creator.id}
          creatorName={creator.name}
        />

        <button
          type="button"
          onClick={handleVoiceCall}
          disabled={isInitiatingCall}
          className="rounded-full glass p-2 disabled:opacity-50"
          aria-label="Voice call"
        >
          <Phone className="h-4 w-4" />
        </button>

        <Link
          to="/app/call/video/$id"
          params={{ id: creator.id }}
          className="rounded-full glass p-2"
          aria-label="Video call"
        >
          <Video className="h-4 w-4" />
        </Link>
      </div>

      {/* MESSAGES */}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">

        {historyLoading && (
          <p className="text-center text-sm text-muted-foreground">
            Loading messages...
          </p>
        )}

        {!historyLoading &&
          messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Start a conversation with{" "}
              {creator.name}.
            </p>
          )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const mine =
              message.from === "customer";

            const currentDateKey =
              getDateKey(message.createdAt);

            const previousDateKey =
              index > 0
                ? getDateKey(
                    messages[index - 1].createdAt
                  )
                : null;

            const showDateSeparator =
              index === 0 ||
              currentDateKey !== previousDateKey;

            return (
              <Fragment key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center py-3">
                    <span className="rounded-full glass px-3 py-1 text-[11px] text-muted-foreground">
                      {getDateLabel(
                        message.createdAt
                      )}
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className={`flex ${
                    mine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] break-words rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-gradient-primary shadow-glow"
                        : "glass"
                    }`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Shared image"
                        className="rounded-xl mb-1 max-h-60 object-cover"
                      />
                    )}

                    {message.text && (
                      <p className="whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Fragment>
            );
          })}

          {isCreatorTyping && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl px-4 py-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  Creator is typing
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </div>
            </div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* MESSAGE INPUT */}

      <form
        className="glass-strong p-3 flex items-center gap-2 sticky bottom-0 shrink-0"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <button
          type="button"
          className="rounded-full p-2 hover:bg-glass"
          aria-label="Emoji"
          onClick={() =>
            toast.info(
              "Emoji picker is not connected yet."
            )
          }
        >
          <Smile className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() =>
            fileRef.current?.click()
          }
          className="rounded-full p-2 hover:bg-glass"
          aria-label="Send image"
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
          onChange={(event) =>
            handleTextChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder={
            connectionStatus === "Connected"
              ? `${creator.chatPrice} coins/msg`
              : connectionStatus
          }
          className="flex-1 min-w-0 glass rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          disabled={
            connectionStatus !== "Connected" ||
            isSending
          }
          autoComplete="off"
          aria-label="Type your message"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="rounded-full bg-gradient-primary p-2.5 shadow-glow disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* CHAT PRICE */}

      <p className="text-center text-[10px] text-muted-foreground py-1 flex items-center justify-center gap-1">
        <Coins className="h-3 w-3" />
        {creator.chatPrice} coins/msg
      </p>
    </div>
  );
}

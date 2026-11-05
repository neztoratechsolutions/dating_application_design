import {
  createFileRoute,
  notFound,
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
  Gift,
  X,
  Loader2,
  Check,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { OnlineDot } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

// ================================================
// ALL FUNCTIONALITY IN THIS SINGLE FILE:
//   - Chat room (WebSocket, history, typing, calls)
//   - Emoji picker (categorized, inserts into input)
//   - Gift picker (fetches /gifts, shows coins)
//   - Send gift + deduct coins via /gift-details (single call)
// No external GiftButton component needed.
// ================================================

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ?? ""
).replace(/\/+$/, "");

const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");

// ================================================
// EMOJI CATEGORIES (free emojis inserted into text)
// ================================================

const EMOJI_CATEGORIES = [
  {
    label: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
      "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
    ],
  },
  {
    label: "Hearts & Love",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "💌", "💋", "👄", "💍", "💑",
    ],
  },
  {
    label: "Gifts & Bags",
    emojis: [
      "🎁", "🎀", "🛍️", "🛒", "💝", "📦", "🎈", "🎉",
      "🎊", "🪅", "🧧", "👝", "👛", "👜", "🎒", "🧵",
    ],
  },
  {
    label: "Flowers",
    emojis: [
      "🌹", "🌸", "🌷", "🌻", "🌺", "💐", "🌼", "🪷",
      "🏵️", "🎋", "🌴", "🌵", "🍀", "☘️", "🍁", "🍃",
    ],
  },
  {
    label: "Chocolates & Sweets",
    emojis: [
      "🍫", "🍬", "🍭", "🍰", "🧁", "🎂", "🍩", "🍪",
      "🍦", "🍨", "🍧", "🥧", "🍮", "🍯", "🥛", "☕",
    ],
  },
  {
    label: "Jewelry & Luxury",
    emojis: [
      "💎", "💍", "👑", "💰", "🤑", "💼", "🪙", "💵",
      "💸", "💳", "🏦", "🏆", "🥇", "🎖️", "🏅", "🎀",
    ],
  },
  {
    label: "Drinks",
    emojis: [
      "🥂", "🍷", "🍾", "🍹", "🍺", "🍸", "☕", "🧋",
      "🍵", "🥤", "🧃", "🥛", "🍻", "🥃", "🍶", "🧉",
    ],
  },
  {
    label: "Animals",
    emojis: [
      "🦁", "🦄", "🐰", "🐱", "🐶", "🐼", "🦋", "🐦",
      "🦊", "🐻", "🐨", "🐯", "🦓", "🦒", "🐘", "🐢",
    ],
  },
  {
    label: "Symbols & Fire",
    emojis: [
      "🔥", "⭐", "✨", "💫", "🏆", "🌟", "⚡", "🌈",
      "💥", "☄️", "🌞", "🌙", "⛅", "☁️", "❄️", "💧",
    ],
  },
];

// ================================================
// GIFT TYPE (from /gifts API — paid emojis with coins)
// ================================================

type ApiGift = {
  id: number;
  catalog_name: string;
  icon: string;
  coins: number;
  status?: boolean;
};

function getGiftList(result: unknown): ApiGift[] {
  if (Array.isArray(result)) return result as ApiGift[];
  if (result && typeof result === "object") {
    const data = result as {
      gifts?: ApiGift[];
      items?: ApiGift[];
      data?: ApiGift[];
    };
    return data.gifts ?? data.items ?? data.data ?? [];
  }
  return [];
}

// ================================================
// DOMAIN TYPES
// ================================================

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
  message_type?: string;
  attachment?: string | null;
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
  message_type?: string;
  attachment?: string | null;
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

// A message whose visible content is only emoji (e.g. a gift
// icon such as 🌹). These are rendered larger and centered so
// they read as a sticker rather than tiny inline text. We
// strip whitespace plus the emoji variation-selector (U+FE0F)
// and ZWJ joiner (U+200D), then check that no ASCII letter or
// digit remains.
function isEmojiOnly(text?: string): boolean {
  if (!text) return false;

  const stripped = text.replace(/[\s\uFE0F\u200D]/g, "");

  if (!stripped) return false;

  return !/[a-zA-Z0-9]/.test(stripped);
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

// Allowed image MIME types and max size for chat image
// uploads — kept in sync with the /chats/{chat_id}/send-image
// backend so we can reject obviously-invalid files before
// the round-trip.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// The backend stores image attachments as relative paths
// (e.g. "/uploads/chat_images/chat_15_....png"). Prefix
// relative paths with the API base URL so <img src> resolves;
// absolute http(s) URLs and data: URIs pass through.
function normalizeImageUrl(path?: string | null): string {
  if (!path) return "";

  const cleaned = String(path).replace(/\\/g, "/");

  if (
    /^https?:\/\//i.test(cleaned) ||
    cleaned.startsWith("data:")
  ) {
    return cleaned;
  }

  return `${API_BASE_URL}/${cleaned.replace(/^\/+/, "")}`;
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

  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  const [callStatus, setCallStatus] = useState<
    "idle" | "ringing" | "ongoing" | "incoming" | "rejected" | "ended"
  >("idle");

  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const [callKind, setCallKind] = useState<"voice" | "video" | null>(null);

  // Mirror activeCallId into a ref so the WebSocket
  // onmessage handler (which keeps a stable closure) can
  // read the latest value without reconnecting the socket.
  const activeCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  // Auto-dismiss the call screen a moment after a call is
  // declined or ended. This also covers backend-driven ends
  // (e.g. the 2-second free-call auto-cut) that arrive over
  // the WebSocket.
  useEffect(() => {
    if (callStatus !== "rejected" && callStatus !== "ended") {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveCallId(null);
      setCallStatus("idle");
      setCallKind(null);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [callStatus]);

  // ================================================
  // EMOJI + GIFT PICKER STATE (unified)
  // ================================================
  // One picker serves both the Smile button (opens on
  // the Emojis tab) and the header Gift button (opens
  // on the Gifts tab). No external component needed.
  // ================================================

  const [isPickerOpen, setIsPickerOpen] =
    useState(false);

  const [pickerTab, setPickerTab] = useState<
    "emojis" | "gifts"
  >("emojis");

  const [gifts, setGifts] = useState<ApiGift[]>([]);
  const [giftsLoading, setGiftsLoading] =
    useState(false);
  const [giftsFetched, setGiftsFetched] =
    useState(false);

  const [selectedGift, setSelectedGift] =
    useState<ApiGift | null>(null);

  const [sendingGiftId, setSendingGiftId] = useState<
    number | null
  >(null);

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
  // FETCH GIFTS (GET /gifts)
  // ================================================

  const fetchGifts = useCallback(async () => {
    if (!API_BASE_URL) return;

    setGiftsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/gifts`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load gifts (${response.status})`
        );
      }

      const data = await response.json();
      const list = getGiftList(data);
      // Only show active gifts when status field exists
      const visible = list.filter(
        (g) => g.status === undefined || g.status === true
      );
      setGifts(visible);
    } catch (error) {
      console.error("Fetch gifts error:", error);
      toast.error("Unable to load gifts.");
    } finally {
      setGiftsLoading(false);
    }
  }, []);

  // ================================================
  // REFRESH WALLET (after a backend coin deduction)
  // ================================================
  // The backend deducts coins atomically inside
  // /gift-details. After it succeeds we re-fetch the
  // sender's wallet so any UI showing the coin balance
  // (e.g. the global header) updates immediately.
  // Assumes useAuth is a Zustand store (exposes setState)
  // and the user object carries a `coins` field; if your
  // store uses a different field/action, adjust here.
  // ================================================

  const refreshWallet = useCallback(async () => {
    if (!API_BASE_URL) return;
    if (!Number.isInteger(currentUserId) || currentUserId <= 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/wallets/user/${currentUserId}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) return;

      const wallet = await response.json();
      const freshCoins = Number(wallet?.coins);

      if (!Number.isFinite(freshCoins)) return;

      const api = useAuth as unknown as {
        setState?: (
          updater: (
            state: Record<string, unknown>
          ) => Record<string, unknown>
        ) => void;
      };

      if (typeof api.setState === "function") {
        api.setState((state) => ({
          ...state,
          user: state.user
            ? { ...(state.user as object), coins: freshCoins }
            : state.user,
        }));
      }
    } catch (error) {
      console.error("Wallet refresh error:", error);
    }
  }, [currentUserId]);

  // ================================================
  // PICKER HANDLERS
  // ================================================

  const openPicker = (tab: "emojis" | "gifts" = "emojis") => {
    setPickerTab(tab);
    setIsPickerOpen(true);
    setSelectedGift(null);
    if (!giftsFetched) {
      setGiftsFetched(true);
      fetchGifts();
    }
  };

  const closePicker = () => {
    if (sendingGiftId !== null) return;
    setIsPickerOpen(false);
    setSelectedGift(null);
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // ================================================
  // SEND GIFT (POST /gift-details only)
  // ================================================
  // There is no /gifts/send endpoint — /gift-details is
  // the single API that both sends the gift and deducts
  // the coins from the sender's wallet atomically.
  //
  // Payload:
  //   user_id   = creator receiving the gift (earner)
  //   sender_id = logged-in customer sending (payer)
  //   gift_id   = the gift's id
  //   earnings  = the gift's coin value (amount deducted)
  //
  // If /gift-details fails (e.g. insufficient coins), the
  // gift did NOT complete — surface the backend error.
  // ================================================

  const handleSendGift = async (gift: ApiGift) => {
    if (!API_BASE_URL) {
      toast.error("API URL is not configured.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in to send a gift.");
      return;
    }

    setSendingGiftId(gift.id);
    try {
      // Single call: /gift-details sends the gift AND
      // deducts the coins atomically on the backend.
      const response = await fetch(
        `${API_BASE_URL}/gift-details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            user_id: creatorId,
            sender_id: currentUserId,
            gift_id: gift.id,
            earnings: Number(gift.coins),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Failed to send gift (${response.status})`
        );
      }

      // Deduction succeeded — refresh the local wallet
      // balance so the UI reflects the new coin total.
      void refreshWallet();

      // Deliver the gift icon to the creator as a chat
      // message over the same WebSocket used for text. The
      // backend stores it and broadcasts it to the creator;
      // our own echo is added to the local message list by
      // the onmessage handler (deduped by message_id), so we
      // do NOT add it optimistically here — that would
      // duplicate the echo.
      const giftSocket = socketRef.current;
      if (
        giftSocket &&
        giftSocket.readyState === WebSocket.OPEN &&
        connectedRef.current
      ) {
        try {
          giftSocket.send(
            JSON.stringify({
              type: "message",
              content: gift.icon,
              message_type: "gift",
            })
          );
        } catch (wsError) {
          // Non-fatal: the gift transaction already
          // succeeded via /gift-details. The icon just
          // won't appear as a chat message right now.
          console.error(
            "Gift icon WebSocket send failed:",
            wsError
          );
        }
      } else {
        // Chat offline — still show the icon locally so the
        // sender sees what they sent. The creator will not
        // receive it until reconnected.
        setMessages((previous) => [
          ...previous,
          {
            id: `gift-${Date.now()}-${gift.id}`,
            from: "customer",
            text: gift.icon,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      toast.success(
        `Sent ${gift.icon} ${gift.catalog_name} to ${creator.name}!`
      );

      setSelectedGift(null);
      setIsPickerOpen(false);
    } catch (error) {
      console.error("Send gift error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send gift."
      );
    } finally {
      setSendingGiftId(null);
    }
  };

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
          sortedHistory.map((message, index) => {
            const isImage =
              message.message_type === "image" ||
              Boolean(message.attachment);

            return {
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

              image: isImage
                ? normalizeImageUrl(message.attachment)
                : undefined,

              text: isImage
                ? undefined
                : String(
                    message.content ??
                      message.message ??
                      message.message_text ??
                      ""
                  ),

              createdAt: message.created_at,
            };
          })
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
          // VOICE CALL EVENT
          // ======================================

          if (data.type === "voice_call") {
            const callId =
              data.call_id != null
                ? String(data.call_id)
                : null;
            const status = data.status;
            const isReceiver =
              Number(data.receiver_id) === currentUserId;
            const isCaller =
              Number(data.caller_id) === currentUserId;

            // Incoming ringing call addressed to me.
            if (isReceiver && status === "ringing") {
              setActiveCallId(callId);
              setCallKind("voice");
              setCallStatus("incoming");
              return;
            }

            // Lifecycle updates for a call I'm involved in.
            if (
              (isCaller || isReceiver) &&
              callId &&
              callId === activeCallIdRef.current
            ) {
              if (status === "ongoing") setCallStatus("ongoing");
              else if (status === "rejected") setCallStatus("rejected");
              else if (status === "ended") setCallStatus("ended");
            }

            return;
          }

          if (data.type === "video_call") {
            const callId =
              data.call_id != null
                ? String(data.call_id)
                : null;
            const status = data.status;
            const isReceiver =
              Number(data.receiver_id) === currentUserId;
            const isCaller =
              Number(data.caller_id) === currentUserId;

            // Incoming ringing video call addressed to me.
            if (isReceiver && status === "ringing") {
              setActiveCallId(callId);
              setCallKind("video");
              setCallStatus("incoming");
              return;
            }

            // Lifecycle updates for a video call I'm involved in.
            if (
              (isCaller || isReceiver) &&
              callId &&
              callId === activeCallIdRef.current
            ) {
              if (status === "ongoing") setCallStatus("ongoing");
              else if (status === "rejected") setCallStatus("rejected");
              else if (status === "ended") setCallStatus("ended");
            }

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

            const isImage =
              data.message_type === "image" ||
              Boolean(data.attachment);

            // Image messages carry an attachment URL instead
            // of text, so an empty content is expected there.
            // For text messages, drop empty/null content.
            if (
              !isImage &&
              (content == null || content === "")
            ) {
              return;
            }

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

              image: isImage
                ? normalizeImageUrl(data.attachment)
                : undefined,

              text: isImage
                ? undefined
                : String(content),

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
    setCallKind("voice");

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

      setActiveCallId(
        data.call_id != null ? String(data.call_id) : null
      );
      setCallStatus("ringing");
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
  // VIDEO CALL (initiate)
  // ================================================

  
const handleVideoCall = async () => {
    if (isInitiatingCall) return;

    if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
        toast.error("Please log in to make a call.");
        return;
    }

    if (!getAuthToken()) {
        toast.error("Login token not found. Please log in again.");
        return;
    }

    setIsInitiatingCall(true);
    setCallKind("video");

    try {
        const response = await fetch(
            `${API_BASE_URL}/video-calls/initiate`,
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage =
                typeof data.detail === "string"
                    ? data.detail
                    : data.detail?.message ||
                      "Failed to initiate video call.";

            throw new Error(errorMessage);
        }

        const call = data.call;

        const callId =
            call?.call_id ||
            call?.video_call_id ||
            data.call_id ||
            data.video_call_id;

        if (!callId) {
            throw new Error(
                "Backend did not return a valid call_id."
            );
        }

        setActiveCallId(String(callId));

        setCallStatus("ringing");

        toast.success("Video call initiated successfully.");

    } catch (error) {

        console.error("Video call error:", error);

        toast.error(
            error instanceof Error
                ? error.message
                : "Unable to start video call."
        );

    } finally {

        setIsInitiatingCall(false);
    }
};

  // ================================================
  // INCOMING CALL (accept / decline)
  // ================================================

  const handleAcceptCall = async () => {
    if (!activeCallId) return;

    const callId = activeCallId;

    try {
      await fetch(
        `${API_BASE_URL}/${(callKind ?? "voice") === "video" ? "video-calls" : "voice-calls"}/${encodeURIComponent(
          callId
        )}/accept`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
      setCallStatus("ongoing");
    } catch (err) {
      console.error("Unable to accept call:", err);
      toast.error("Unable to accept the call.");
    }
  };

  const handleRejectCall = async () => {
    if (!activeCallId) return;

    const callId = activeCallId;

    try {
      await fetch(
        `${API_BASE_URL}/${(callKind ?? "voice") === "video" ? "video-calls" : "voice-calls"}/${encodeURIComponent(
          callId
        )}/reject`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
    } catch (err) {
      console.error("Unable to reject call:", err);
    } finally {
      setCallStatus("rejected");
    }
  };

  const handleEndCall = async () => {
    if (!activeCallId) return;

    const callId = activeCallId;

    try {
      await fetch(
        `${API_BASE_URL}/${(callKind ?? "voice") === "video" ? "video-calls" : "voice-calls"}/${encodeURIComponent(
          callId
        )}/end`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
    } catch (err) {
      console.error("Unable to end call:", err);
    } finally {
      setCallStatus("ended");
    }
  };

  // ================================================
  // IMAGE UPLOAD
  // ================================================

  const handleImage = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Always reset the input so the same file can be
    // re-selected later.
    event.target.value = "";

    if (!file) return;

    // ---- client-side validation (mirrors the backend) ----

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error(
        "Only JPG, PNG and WEBP images are allowed."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(
        "Image size must not exceed 5 MB."
      );
      return;
    }

    if (
      !chatId ||
      !Number.isInteger(currentUserId) ||
      currentUserId <= 0
    ) {
      toast.error("Chat is not ready yet.");
      return;
    }

    // ---- optimistic local preview ----
    // Show the image immediately via an object URL, then
    // swap in the server URL when the upload resolves.

    const previewUrl = URL.createObjectURL(file);
    const tempId = `img-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    setMessages((previous) => [
      ...previous,
      {
        id: tempId,
        from: "customer",
        image: previewUrl,
        createdAt: new Date().toISOString(),
      },
    ]);

    setIsUploadingImage(true);

    try {
      const form = new FormData();
      form.append("sender_id", String(currentUserId));
      form.append("image", file);

      // Do NOT set Content-Type — the browser sets the
      // multipart boundary automatically. getAuthHeaders()
      // only adds Accept + Authorization.
      const response = await fetch(
        `${API_BASE_URL}/chats/${chatId}/send-image`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: form,
        }
      );

      const body = await response
        .json()
        .catch(() => ({}));

      const payload = body?.data ?? {};

      if (!response.ok) {
        throw new Error(
          body?.detail ||
            body?.message ||
            payload?.detail ||
            `Failed to send image (${response.status})`
        );
      }

      const serverId =
        payload.message_id ?? payload.id;
      const serverIdStr =
        serverId != null ? String(serverId) : tempId;
      const attachment = payload.attachment
        ? normalizeImageUrl(payload.attachment)
        : previewUrl;

      setMessages((previous) => {
        // Drop the optimistic temp bubble.
        const withoutTemp = previous.filter(
          (item) => item.id !== tempId
        );

        // The REST endpoint also broadcasts the saved image
        // over the chat WebSocket. If that broadcast already
        // landed (matched by server id), don't re-add it —
        // otherwise we'd render a duplicate bubble.
        const alreadyDelivered = withoutTemp.some(
          (item) => item.id === serverIdStr
        );

        if (alreadyDelivered) {
          return withoutTemp;
        }

        return [
          ...withoutTemp,
          {
            id: serverIdStr,
            from: "customer",
            image: attachment,
            createdAt:
              payload.created_at ??
              new Date().toISOString(),
          },
        ];
      });

      // The server URL now backs the <img>; release the
      // local object URL only if we swapped it out.
      if (attachment !== previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (error) {
      console.error("Image upload failed:", error);

      // Drop the optimistic bubble.
      setMessages((previous) =>
        previous.filter(
          (item) => item.id !== tempId
        )
      );

      URL.revokeObjectURL(previewUrl);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send image."
      );
    } finally {
      setIsUploadingImage(false);
    }
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

        {/* Inline gift button — opens the picker on the Gifts tab */}
        <button
          type="button"
          onClick={() => openPicker("gifts")}
          className="rounded-full glass p-2 hover:bg-glass-border transition"
          aria-label="Send gift"
          title="Send gift"
        >
          <Gift className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleVoiceCall}
          disabled={isInitiatingCall || callStatus !== "idle"}
          className="rounded-full glass p-2 disabled:opacity-50"
          aria-label="Voice call"
        >
          <Phone className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleVideoCall}
          disabled={isInitiatingCall || callStatus !== "idle"}
          className="rounded-full glass p-2 disabled:opacity-50"
          aria-label="Video call"
        >
          <Video className="h-4 w-4" />
        </button>
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

            const emojiOnly = isEmojiOnly(message.text);

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
                      <p
                        className={`whitespace-pre-wrap break-words ${
                          emojiOnly
                            ? "text-4xl leading-none text-center"
                            : ""
                        }`}
                      >
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

      {callStatus !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-strong w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary">
              {callKind === "video" ? (
                <Video className="h-7 w-7" />
              ) : (
                <Phone className="h-7 w-7" />
              )}
            </div>
            <p className="text-lg font-semibold">
              {creator?.name || "Creator"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {callStatus === "incoming" && (callKind === "video" ? "Incoming video call" : "Incoming voice call")}
              {callStatus === "ringing" && "Calling…"}
              {callStatus === "ongoing" && "Connected"}
              {callStatus === "rejected" && "Call declined"}
              {callStatus === "ended" && "Call ended"}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {callStatus === "incoming" && (
                <>
                  <button
                    type="button"
                    onClick={handleRejectCall}
                    className="flex items-center gap-2 rounded-full bg-red-500/80 px-5 py-2 text-sm"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptCall}
                    className="flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-sm"
                  >
                    {callKind === "video" ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    Accept
                  </button>
                </>
              )}
              {(callStatus === "ringing" || callStatus === "ongoing") && (
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="flex items-center gap-2 rounded-full bg-red-500/80 px-5 py-2 text-sm"
                >
                  <X className="h-4 w-4" />
                  End call
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE INPUT */}

      <form
        className="glass-strong p-3 flex items-center gap-2 sticky bottom-0 shrink-0 relative"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        {/* Smile button — opens picker on Emojis tab */}
        <button
          type="button"
          className="rounded-full p-2 hover:bg-glass"
          aria-label="Emoji"
          onClick={() => openPicker("emojis")}
        >
          <Smile className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() =>
            fileRef.current?.click()
          }
          disabled={isUploadingImage}
          className="rounded-full p-2 hover:bg-glass disabled:opacity-50"
          aria-label="Send image"
          title="Send image"
        >
          {isUploadingImage ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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

        {/* ============================================ */}
        {/* UNIFIED EMOJI + GIFT PICKER                  */}
        {/* (popup above the input — single source)     */}
        {/* ============================================ */}

        <AnimatePresence>
          {isPickerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={closePicker}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-16 left-2 right-2 md:left-auto md:right-4 md:w-96 glass-strong rounded-2xl shadow-glow overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Tabs */}
                <div className="flex border-b border-glass-border">
                  <button
                    type="button"
                    onClick={() => setPickerTab("emojis")}
                    className={`flex-1 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      pickerTab === "emojis"
                        ? "text-primary border-b-2 border-primary bg-glass"
                        : "text-muted-foreground hover:bg-glass"
                    }`}
                  >
                    <Smile className="h-3.5 w-3.5" />
                    Emojis
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerTab("gifts")}
                    className={`flex-1 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      pickerTab === "gifts"
                        ? "text-primary border-b-2 border-primary bg-glass"
                        : "text-muted-foreground hover:bg-glass"
                    }`}
                  >
                    <Gift className="h-3.5 w-3.5" />
                    Gifts
                    {gifts.length > 0 && (
                      <span className="ml-1 rounded-full bg-glass px-1.5 py-0.5 text-[9px]">
                        {gifts.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closePicker}
                    disabled={sendingGiftId !== null}
                    className="px-3 text-muted-foreground hover:bg-glass disabled:opacity-50"
                    aria-label="Close picker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Tab content */}
                <div className="max-h-64 overflow-y-auto p-3">
                  {pickerTab === "emojis" ? (
                    /* ---- EMOJIS TAB ---- */
                    <div className="space-y-3">
                      {EMOJI_CATEGORIES.map((category) => (
                        <div key={category.label}>
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                            {category.label}
                          </p>
                          <div className="grid grid-cols-8 gap-1">
                            {category.emojis.map((emoji, i) => (
                              <button
                                key={`${category.label}-${i}-${emoji}`}
                                type="button"
                                onClick={() =>
                                  handleInsertEmoji(emoji)
                                }
                                className="text-xl rounded-lg hover:bg-glass p-1 transition active:scale-90"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ---- GIFTS TAB ---- */
                    giftsLoading ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-2">
                          Loading gifts...
                        </p>
                      </div>
                    ) : gifts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Gift className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          No gifts available.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground">
                          Tap a gift to select, then send. Coins are deducted from your wallet and earnings are recorded.
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                          {gifts.map((gift) => {
                            const isSelected =
                              selectedGift?.id === gift.id;
                            const isSending =
                              sendingGiftId === gift.id;
                            return (
                              <button
                                key={gift.id}
                                type="button"
                                onClick={() =>
                                  setSelectedGift(gift)
                                }
                                disabled={sendingGiftId !== null}
                                className={`relative rounded-xl p-2 text-center transition disabled:opacity-60 ${
                                  isSelected
                                    ? "bg-gradient-primary ring-2 ring-primary"
                                    : "glass hover:bg-glass-border"
                                }`}
                              >
                                {isSending && (
                                  <div className="absolute inset-0 rounded-xl bg-black/30 flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                  </div>
                                )}

                                <div className="text-2xl mb-0.5">
                                  {gift.icon || "🎁"}
                                </div>
                                <p className="font-semibold text-[10px] truncate">
                                  {gift.catalog_name}
                                </p>
                                <p className="text-amber-400 text-[10px] font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                                  <Coins className="h-2.5 w-2.5" />
                                  {gift.coins}
                                </p>

                                {isSelected && !isSending && (
                                  <div className="absolute top-0.5 right-0.5 rounded-full bg-primary p-0.5">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected gift send bar */}
                        <AnimatePresence>
                          {selectedGift && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              className="glass rounded-xl p-2 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xl">
                                  {selectedGift.icon || "🎁"}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">
                                    {selectedGift.catalog_name}
                                  </p>
                                  <p className="text-amber-400 text-[10px] font-semibold flex items-center gap-0.5">
                                    <Coins className="h-2.5 w-2.5" />
                                    {selectedGift.coins} coins
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleSendGift(selectedGift)
                                }
                                disabled={sendingGiftId !== null}
                                className="shrink-0 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold shadow-glow disabled:opacity-50 flex items-center gap-1"
                              >
                                {sendingGiftId === selectedGift.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Gift className="h-3 w-3" />
                                    Send
                                  </>
                                )}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* CHAT PRICE */}

      <p className="text-center text-[10px] text-muted-foreground py-1 flex items-center justify-center gap-1">
        <Coins className="h-3 w-3" />
        {creator.chatPrice} coins/msg
      </p>
    </div>
  );
}
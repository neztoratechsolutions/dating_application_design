import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  from: "customer" | "creator";
  text?: string;
  image?: string;
  time: number;
}

interface ChatState {
  threads: Record<string, ChatMessage[]>;
  send: (creatorId: string, msg: Omit<ChatMessage, "id" | "time">) => void;
  get: (creatorId: string) => ChatMessage[];
  clear: (creatorId: string) => void;
}

const seed = (creatorId: string): ChatMessage[] => [
  { id: "s1", from: "creator", text: "Hey! How are you? 😊", time: Date.now() - 60000 },
  { id: "s2", from: "customer", text: "Hi! I'm good, you?", time: Date.now() - 40000 },
  { id: "s3", from: "creator", text: `Doing great! (chat ${creatorId.slice(-2)})`, time: Date.now() - 20000 },
];

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},
      send: (creatorId, msg) =>
        set((state) => {
          const existing = state.threads[creatorId] ?? seed(creatorId);
          return {
            threads: {
              ...state.threads,
              [creatorId]: [...existing, { ...msg, id: crypto.randomUUID(), time: Date.now() }],
            },
          };
        }),
      get: (creatorId) => {
        const t = get().threads[creatorId];
        if (t) return t;
        const s = seed(creatorId);
        set((state) => ({ threads: { ...state.threads, [creatorId]: s } }));
        return s;
      },
      clear: (creatorId) =>
        set((state) => {
          const { [creatorId]: _, ...rest } = state.threads;
          return { threads: rest };
        }),
    }),
    { name: "velora-chat" },
  ),
);

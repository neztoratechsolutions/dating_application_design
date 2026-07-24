import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  price: number;
  tier: "starter" | "popular" | "premium";
}

export const GIFTS: Gift[] = [
  { id: "rose", name: "Rose", emoji: "🌹", price: 10, tier: "starter" },
  { id: "heart", name: "Heart", emoji: "💖", price: 20, tier: "starter" },
  { id: "choco", name: "Chocolate", emoji: "🍫", price: 30, tier: "starter" },
  { id: "coffee", name: "Coffee", emoji: "☕", price: 50, tier: "starter" },
  { id: "teddy", name: "Teddy Bear", emoji: "🧸", price: 75, tier: "starter" },
  { id: "cake", name: "Cake", emoji: "🎂", price: 100, tier: "popular" },
  { id: "perfume", name: "Perfume", emoji: "🧴", price: 150, tier: "popular" },
  { id: "bouquet", name: "Bouquet", emoji: "💐", price: 200, tier: "popular" },
  { id: "crown", name: "Crown", emoji: "👑", price: 300, tier: "popular" },
  { id: "ring", name: "Diamond Ring", emoji: "💍", price: 500, tier: "popular" },
  { id: "bag", name: "Luxury Handbag", emoji: "👜", price: 1000, tier: "premium" },
  { id: "goldcrown", name: "Gold Crown", emoji: "🏆", price: 2000, tier: "premium" },
  { id: "car", name: "Sports Car", emoji: "🏎️", price: 5000, tier: "premium" },
  { id: "jet", name: "Private Jet", emoji: "✈️", price: 10000, tier: "premium" },
];

export interface GiftSend {
  id: string;
  giftId: string;
  creatorId: string;
  creatorName: string;
  price: number;
  time: number;
}

interface GiftState {
  /** Default % share to creator (rest goes to platform) */
  creatorShare: number;
  setCreatorShare: (n: number) => void;
  history: GiftSend[];
  send: (s: Omit<GiftSend, "id" | "time">) => void;
}

export const useGifts = create<GiftState>()(
  persist(
    (set) => ({
      creatorShare: 20,
      setCreatorShare: (n) => set({ creatorShare: n }),
      history: [],
      send: (s) =>
        set((state) => ({
          history: [{ ...s, id: crypto.randomUUID(), time: Date.now() }, ...state.history],
        })),
    }),
    { name: "velora-gifts" },
  ),
);

export const giftById = (id: string) => GIFTS.find((g) => g.id === id);

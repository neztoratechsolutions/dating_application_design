// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// export type Role = "customer" | "creator" | "admin";

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   mobile: string;
//   role: Role;
//   state?: string;
//   avatar?: string;
//   coins?: number;
//   earnings?: number;
//   kycVerified?: boolean;
//   online?: boolean;
// }

// interface AuthState {
//   user: User | null;
//   loading: boolean;
//   hasHydrated: boolean;
//   setHasHydrated: (v: boolean) => void;
//   login: (role: Role, partial?: Partial<User>) => void;
//   signup: (data: Partial<User> & { role: Role }) => void;
//   logout: () => void;
//   updateUser: (data: Partial<User>) => void;
//   addCoins: (n: number) => void;
//   spendCoins: (n: number) => boolean;
// }

// // Per-email coin grants for specific logins (demo accounts)
// const COIN_GRANTS: Record<string, number> = {
//   "vip@velora.live": 10000,
//   "premium@velora.live": 5000,
//   "gold@velora.live": 2500,
//   "silver@velora.live": 1500,
//   "demo@velora.live": 1000,
//   "customer@velora.live": 500,
// };

// const coinsForLogin = (role: Role, email?: string): number => {
//   if (role !== "customer") return 0;
//   if (email && COIN_GRANTS[email.toLowerCase()] != null) return COIN_GRANTS[email.toLowerCase()];
//   return 500;
// };

// const seedUser = (role: Role, partial?: Partial<User>): User => ({
//   id: crypto.randomUUID(),
//   name: partial?.name || (role === "admin" ? "Admin" : role === "creator" ? "Riya Creator" : "Aarav User"),
//   email: partial?.email || `${role}@velora.live`,
//   mobile: partial?.mobile || "+91 98765 43210",
//   role,
//   state: partial?.state || "Maharashtra",
//   avatar: partial?.avatar || `https://i.pravatar.cc/200?u=${encodeURIComponent(partial?.email || role)}`,
//   coins: coinsForLogin(role, partial?.email),
//   earnings: role === "creator" ? 12450 : 0,
//   kycVerified: role === "creator" ? false : true,
//   online: true,
//   ...partial,
// });

// export const useAuth = create<AuthState>()(
//   persist(
//     (set, get) => ({
//       user: null,
//       loading: false,
//       hasHydrated: false,
//       setHasHydrated: (v) => set({ hasHydrated: v }),
//       login: (role, partial) => set({ user: seedUser(role, partial) }),
//       signup: (data) => set({ user: seedUser(data.role, data) }),
//       logout: () => set({ user: null }),
//       updateUser: (data) => set({ user: get().user ? { ...get().user!, ...data } : null }),
//       addCoins: (n) => {
//         const u = get().user;
//         if (u) set({ user: { ...u, coins: (u.coins ?? 0) + n } });
//       },
//       spendCoins: (n) => {
//         const u = get().user;
//         if (!u || (u.coins ?? 0) < n) return false;
//         set({ user: { ...u, coins: (u.coins ?? 0) - n } });
//         return true;
//       },
//     }),
//     {
//       name: "velora-auth",
//       onRehydrateStorage: () => (state) => {
//         state?.setHasHydrated(true);
//       },
//     },
//   ),
// );
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "customer" | "creator" | "admin";

export interface User {
  id: string | number;
  user_id?: string | number;

  name: string;
  email: string;
  mobile: string;
  role: Role;

  state?: string;
  avatar?: string;
  coins?: number;
  earnings?: number;
  kycVerified?: boolean;
  online?: boolean;
  referral_code?: string;
}
interface AuthState {
  user: User | null;
  loading: boolean;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (role: Role, partial?: Partial<User> & { user_id?: string | number }) => void; // Accept user_id
  signup: (data: Partial<User> & { role: Role }) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
}

// Per-email coin grants for specific logins (demo accounts)
const COIN_GRANTS: Record<string, number> = {
  "vip@velora.live": 10000,
  "premium@velora.live": 5000,
  "gold@velora.live": 2500,
  "silver@velora.live": 1500,
  "demo@velora.live": 1000,
  "customer@velora.live": 500,
};

const coinsForLogin = (role: Role, email?: string): number => {
  if (role !== "customer") return 0;
  if (email && COIN_GRANTS[email.toLowerCase()] != null) return COIN_GRANTS[email.toLowerCase()];
  return 500;
};
const seedUser = (
  role: Role,
  partial?: Partial<User> & {
    user_id?: string | number;
    referral_code?: string;
  }
): User => ({
  id: partial?.user_id || partial?.id || crypto.randomUUID(),

  // Add these
  user_id: partial?.user_id,
  referral_code: partial?.referral_code,

  name:
    partial?.name ||
    (role === "admin"
      ? "Admin"
      : role === "creator"
      ? "Riya Creator"
      : "Aarav User"),

  email: partial?.email || `${role}@velora.live`,
  mobile: partial?.mobile || "+91 98765 43210",
  role,

  state: partial?.state || "Maharashtra",
  avatar:
    partial?.avatar ||
    `https://i.pravatar.cc/200?u=${encodeURIComponent(partial?.email || role)}`,

  coins: coinsForLogin(role, partial?.email),
  earnings: role === "creator" ? 12450 : 0,
  kycVerified: role === "creator" ? false : true,
  online: false,

  ...partial,
});
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      
      // Updated login function
      login: (role, partial) => set({ user: seedUser(role, partial) }),
      
      signup: (data) => set({ user: seedUser(data.role, data) }),
      logout: () => set({ user: null }),
      
      updateUser: (data) => set({ user: get().user ? { ...get().user!, ...data } : null }),
      
      addCoins: (n) => {
        const u = get().user;
        if (u) set({ user: { ...u, coins: (u.coins ?? 0) + n } });
      },
      spendCoins: (n) => {
        const u = get().user;
        if (!u || (u.coins ?? 0) < n) return false;
        set({ user: { ...u, coins: (u.coins ?? 0) - n } });
        return true;
      },
    }),
    {
      name: "velora-auth", // This is the key used in localStorage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
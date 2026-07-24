export const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat",
  "Rajasthan", "West Bengal", "Punjab", "Kerala", "Telangana", "Uttar Pradesh",
];

export const LANGUAGES = ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Bengali", "Punjabi", "Gujarati"];

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  state: string;
  language: string;
  online: boolean;
  rating: number;
  followers: number;
  chatPrice: number;
  voicePrice: number;
  videoPrice: number;
  bio: string;
  tags: string[];
}

const avatars = (seed: string) => `https://i.pravatar.cc/400?u=${encodeURIComponent(seed)}`;

const names = [
  "Priya Sharma", "Ananya Kapoor", "Riya Verma", "Sneha Iyer", "Kavya Reddy",
  "Aisha Khan", "Diya Patel", "Nisha Singh", "Pooja Mehta", "Tanya Roy",
  "Meera Joshi", "Ishita Das", "Saanvi Rao", "Aarohi Nair", "Zara Ali",
  "Neha Gupta", "Simran Kaur", "Anjali Pillai", "Radhika Bose", "Mahi Jain",
];

export const CREATORS: Creator[] = names.map((name, i) => ({
  id: `c${i + 1}`,
  name,
  avatar: avatars(name),
  state: STATES[i % STATES.length],
  language: LANGUAGES[i % LANGUAGES.length],
  online: Math.random() > 0.35,
  rating: +(4 + Math.random()).toFixed(1),
  followers: Math.floor(500 + Math.random() * 50000),
  chatPrice: 5 + (i % 5) * 2,
  voicePrice: 15 + (i % 4) * 5,
  videoPrice: 30 + (i % 6) * 10,
  bio: "Let's vibe! I love talking about movies, music & late-night thoughts ✨",
  tags: ["Friendly", "Funny", "Music"].slice(0, 1 + (i % 3)),
}));

export const TRANSACTIONS = [
  { id: "t1", type: "recharge", amount: 500, coins: 500, date: "2026-05-24", status: "success" },
  { id: "t2", type: "spend", amount: 0, coins: -45, date: "2026-05-23", status: "success", note: "Voice call · Priya" },
  { id: "t3", type: "spend", amount: 0, coins: -20, date: "2026-05-22", status: "success", note: "Chat · Ananya" },
  { id: "t4", type: "recharge", amount: 1000, coins: 1100, date: "2026-05-20", status: "success" },
  { id: "t5", type: "game", amount: 0, coins: 200, date: "2026-05-19", status: "success", note: "Scratch reward" },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "Priya is online!", body: "Your favourite creator just came online", time: "2m" },
  { id: "n2", title: "Coins added 🎉", body: "1000 coins added to your wallet", time: "1h" },
  { id: "n3", title: "Daily bonus", body: "Spin the scratch card for ₹200", time: "3h" },
  { id: "n4", title: "New follower", body: "Ananya started following you", time: "1d" },
];

export const CHATS = CREATORS.slice(0, 8).map((c, i) => ({
  id: `chat-${c.id}`,
  creator: c,
  lastMessage: ["Hey! 👋", "Call me na", "haha 😂", "Tomorrow?", "Online?"][i % 5],
  time: ["now", "2m", "10m", "1h", "yesterday"][i % 5],
  unread: i < 3 ? i + 1 : 0,
}));

export const COIN_PACKS = [
  { coins: 100, price: 99, bonus: 0 },
  { coins: 500, price: 449, bonus: 50, popular: true },
  { coins: 1000, price: 849, bonus: 150 },
  { coins: 2500, price: 1999, bonus: 500 },
  { coins: 5000, price: 3799, bonus: 1200, best: true },
];

export const EARNINGS_DATA = [
  { day: "Mon", earnings: 1200 },
  { day: "Tue", earnings: 1900 },
  { day: "Wed", earnings: 1500 },
  { day: "Thu", earnings: 2400 },
  { day: "Fri", earnings: 3100 },
  { day: "Sat", earnings: 4200 },
  { day: "Sun", earnings: 3800 },
];

export const ADMIN_STATS = {
  totalUsers: 184_320,
  totalCreators: 4_812,
  liveNow: 312,
  revenueToday: 248_400,
  pendingKyc: 42,
  pendingWithdrawals: 18,
};

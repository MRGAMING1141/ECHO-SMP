import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Key,
  MapPin,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Volume2,
  VolumeX,
  User,
  LogOut,
  Copy,
  Check,
  Server,
  Users,
  Activity,
  Award,
  Sparkles,
  Trash2,
  X,
  HelpCircle,
  ShieldCheck,
  Package,
  Bell,
  Zap,
  Flame,
  Crown,
  Music,
  Pause,
  Play
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, updateProfile, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface Product {
  id: string;
  category: "ranks" | "keys" | "claims" | "items";
  name: string;
  price: number;
  description: string;
  badge?: string;
  features: string[];
}

interface Order {
  id: string;
  username: string;
  discord?: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  paymentMethod: string;
  status: "Pending" | "Paid" | "Delivered" | "Cancelled";
  cancelRequested?: boolean;
  createdAt: string;
}

interface Toast {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
}

const MinecraftIcon: React.FC<{ id: string; className?: string }> = ({ id, className = "w-8 h-8" }) => {
  if (id.includes("rank") || id.includes("master") || id.includes("elite") || id.includes("founder")) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-600 to-cyan-400 rounded-lg p-1.5 shadow-lg flex items-center justify-center text-white ring-2 ring-cyan-300/50`}>
        <Crown className="w-full h-full drop-shadow" />
      </div>
    );
  }
  if (id.includes("key")) {
    return (
      <div className={`${className} bg-gradient-to-br from-purple-600 to-indigo-500 rounded-lg p-1.5 shadow-lg flex items-center justify-center text-white ring-2 ring-purple-300/50`}>
        <Key className="w-full h-full drop-shadow" />
      </div>
    );
  }
  if (id.includes("claim")) {
    return (
      <div className={`${className} bg-gradient-to-br from-emerald-600 to-green-400 rounded-lg p-1.5 shadow-lg flex items-center justify-center text-white ring-2 ring-emerald-300/50`}>
        <Shield className="w-full h-full drop-shadow" />
      </div>
    );
  }
  return (
    <div className={`${className} bg-gradient-to-br from-amber-600 to-yellow-500 rounded-lg p-1.5 shadow-lg flex items-center justify-center text-white ring-2 ring-yellow-300/50`}>
      <Package className="w-full h-full drop-shadow" />
    </div>
  );
};

const PRODUCTS: Product[] = [
  {
    id: "rank_vortex",
    category: "ranks",
    name: "Vortex Rank (30D)",
    price: 10.00,
    description: "Unlock intermediate survival kits, /fly in claims, and special chat tags.",
    badge: "Popular",
    features: ["/fly in claims", "3 Homes limit", "Vortex Prefix", "Monthly Crate Key"]
  },
  {
    id: "rank_viper",
    category: "ranks",
    name: "Viper Rank (30D)",
    price: 15.00,
    description: "Advanced rank with auction house perks, multi-home storage, and cosmetics.",
    badge: "Best Value",
    features: ["/feed & /heal (5m cooldown)", "6 Homes limit", "Viper Kit", "Sell multipliers 1.5x"]
  },
  {
    id: "rank_echo_lord",
    category: "ranks",
    name: "Echo Lord (Permanent)",
    price: 25.00,
    description: "Ultimate permanent rank granting absolute prestige and exclusive server commands.",
    badge: "Ultimate",
    features: ["Permanent VIP Status", "15 Homes limit", "Echo Lord Kit", "Custom particle effects"]
  },
  {
    id: "key_common",
    category: "keys",
    name: "Common Crate Key (x3)",
    price: 2.50,
    description: "Open common crates at spawn for starting tools, iron armor, and food.",
    features: ["Guaranteed Iron gear", "Chance for diamonds", "Instant delivery"]
  },
  {
    id: "key_legendary",
    category: "keys",
    name: "Legendary Key (x2)",
    price: 7.00,
    description: "Unlocks rare enchanted gear, golden apples, and valuable ore blocks.",
    badge: "Hot",
    features: ["Enchanted Diamond tools", "God apples", "Rare spawn eggs"]
  },
  {
    id: "key_mythic",
    category: "keys",
    name: "Mythic Crate Key (x1)",
    price: 10.00,
    description: "The rarest key on Echo SMP. Guarantees netherite pieces or custom armor.",
    badge: "Rare",
    features: ["Netherite ingot bundle", "Custom enchant books", "Unique title voucher"]
  },
  {
    id: "claim_small",
    category: "claims",
    name: "Claim Block Pack (5,000)",
    price: 5.00,
    description: "Expand your land protection to keep your base and valuables safe from griefers.",
    features: ["5,000 claim blocks", "Instant automatic claim", "Transferrable"]
  },
  {
    id: "claim_medium",
    category: "claims",
    name: "Claim Block Pack (15,000)",
    price: 12.00,
    description: "Generous claim block bundle for expanding town borders and farms.",
    badge: "Recommended",
    features: ["15,000 claim blocks", "+5 Max claims limit", "Priority support"]
  },
  {
    id: "claim_mega",
    category: "claims",
    name: "Mega Empire Pack (40,000)",
    price: 22.00,
    description: "Massive block bundle for large clans, cities, and megabuilds.",
    features: ["40,000 claim blocks", "Empire protection badge", "Bonus golden shovel"]
  },
  {
    id: "item_gapple",
    category: "items",
    name: "God Apple Bundle (x16)",
    price: 4.00,
    description: "Enchanted Golden Apples for PvP advantage and tough boss fights.",
    features: ["16x Enchanted golden apples", "Instant delivery to inventory"]
  },
  {
    id: "item_sword",
    category: "items",
    name: "Netherite Blade (Sharp V)",
    price: 8.00,
    description: "Fully enchanted Netherite sword ready for combat and raids.",
    features: ["Sharpness V, Unbreaking III", "Mending, Fire Aspect II"]
  },
  {
    id: "item_elytra",
    category: "items",
    name: "Pre-Enchanted Elytra",
    price: 18.00,
    description: "Fly across the Echo SMP world instantly with Unbreaking III & Mending wings.",
    badge: "Must Have",
    features: ["Elytra with Mending", "Free Firework rockets (x64)", "Fast travel"]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"shop" | "orders" | "wiki" | "admin">("shop");
  const [category, setCategory] = useState<"all" | "ranks" | "keys" | "claims" | "items">("all");
  const [username, setUsername] = useState<string>(() => localStorage.getItem("echo_username") || "");
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [tempUsername, setTempUsername] = useState<string>("");
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [showLinkIgnModal, setShowLinkIgnModal] = useState<boolean>(false);
  const [linkIgnInput, setLinkIgnInput] = useState<string>("");
  const [isStaffGoogleUser, setIsStaffGoogleUser] = useState<boolean>(false);
  
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [coupon, setCoupon] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string>("");

  const [checkoutModal, setCheckoutModal] = useState<boolean>(false);
  const [discordInput, setDiscordInput] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminSearch, setAdminSearch] = useState<string>("");
  const [adminFilter, setAdminFilter] = useState<string>("all");

  const [serverStatus, setServerStatus] = useState<any>(null);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [copiedIp, setCopiedIp] = useState<boolean>(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersRef = useRef<Order[]>([]);

  // Draggable Music Player state
  const [musicPos, setMusicPos] = useState({ x: 24, y: typeof window !== 'undefined' ? window.innerHeight - 140 : 500 });
  const [isDraggingMusic, setIsDraggingMusic] = useState(false);
  const musicDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingMusic) return;
      const dx = e.clientX - musicDragRef.current.startX;
      const dy = e.clientY - musicDragRef.current.startY;
      setMusicPos({
        x: Math.max(10, Math.min(window.innerWidth - 300, musicDragRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 100, musicDragRef.current.initialY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingMusic(false);
    };

    if (isDraggingMusic) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMusic]);

  // Persistent toast (stays until dismissed with X)
  const addToast = (title: string, message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  // Listen to Firebase Auth state without UI flickering
  // Listen to Firebase Auth state to correctly set app state and update UI, ensuring username is stored in Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        setGoogleUser(user);
        const email = (user.email || "").toLowerCase();
        const isStaff = ["lasthope.mr@gmail.com", "zxbrar1@gmail.com", "ayushbhaktistudio@gmail.com", "janvirajpurohit491@gmail.com"].includes(email);
        if (isStaff) {
          setIsStaffGoogleUser(true);
          setIsAdminLoggedIn(true);
        } else {
          setIsStaffGoogleUser(false);
          setIsAdminLoggedIn(false);
          setActiveTab(prev => (prev === "admin" ? "shop" : prev));
        }

        let name = "";
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            name = data.minecraftUsername || data.username || "";
          }
        } catch (err) {
          console.warn("Error fetching user document from Firestore:", err);
        }

        if (!name) {
          const localUser = localStorage.getItem("echo_username");
          if (localUser) {
            name = localUser;
          }
        }

        if (name) {
          setUsername(name);
          localStorage.setItem("echo_username", name);
          try {
            await setDoc(doc(db, "users", user.uid), {
              username: name,
              minecraftUsername: name,
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || name,
              photoURL: user.photoURL || "",
              role: isStaff ? "staff" : "player",
              updatedAt: Date.now()
            }, { merge: true });
          } catch (err) {
            console.warn("Error persisting username in Firestore:", err);
          }
        } else if (user.email) {
          // Logged into Google, prompt to link Minecraft IGN
          setShowLinkIgnModal(true);
        }
      } else {
        setGoogleUser(null);
        setIsStaffGoogleUser(false);
        const localUser = localStorage.getItem("echo_username");
        if (localUser) {
          setUsername(localUser);
        } else {
          setUsername("");
        }
      }
      setAuthLoading(false);
    });

    fetch("/api/server-status")
      .then(res => res.json())
      .then(data => setServerStatus(data))
      .catch(() => {});

    fetch("/api/login-stats")
      .then(res => res.json())
      .then(data => setLoginStats(data))
      .catch(() => {});

    return () => unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      setShowLoginModal(false);
      addToast("Signed in with Google", `Welcome ${user.displayName || user.email}!`, "success");
      const email = (user.email || "").toLowerCase();
      if (["lasthope.mr@gmail.com", "zxbrar1@gmail.com", "ayushbhaktistudio@gmail.com", "janvirajpurohit491@gmail.com"].includes(email)) {
        setIsStaffGoogleUser(true);
        setIsAdminLoggedIn(true);
        addToast("Staff Verified", "Staff Sales Log unlocked automatically.", "success");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        addToast("Popup Blocked", "Please allow popups for Google Sign-In.", "warning");
      } else if (err.code !== "auth/popup-closed-by-user") {
        addToast("Sign In Failed", err.message || "Failed to sign in with Google.", "warning");
      }
    }
  };

  // Handle Link Minecraft In-Game Name (IGN) to Google Account
  const handleLinkIgnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkIgnInput.trim()) return;
    const cleanName = linkIgnInput.trim().replace(/\s+/g, "_");
    if (cleanName.length < 3 || cleanName.length > 16) {
      addToast("Invalid Username", "Minecraft username must be 3–16 characters.", "warning");
      return;
    }
    const user = googleUser || auth.currentUser;
    const uid = user ? user.uid : `mc_${cleanName.toLowerCase()}`;
    const isStaff = user && ["lasthope.mr@gmail.com", "zxbrar1@gmail.com", "ayushbhaktistudio@gmail.com", "janvirajpurohit491@gmail.com"].includes((user.email || "").toLowerCase());

    setUsername(cleanName);
    localStorage.setItem("echo_username", cleanName);
    setShowLinkIgnModal(false);
    setLinkIgnInput("");
    addToast("Minecraft IGN Linked!", `Successfully linked ${cleanName} to ${user?.email || "account"}`, "success");

    try {
      if (user) {
        await updateProfile(user, { displayName: cleanName });
      }
      await setDoc(doc(db, "users", uid), {
        username: cleanName,
        minecraftUsername: cleanName,
        uid: uid,
        email: user?.email || "",
        displayName: user?.displayName || cleanName,
        photoURL: user?.photoURL || "",
        role: isStaff ? "staff" : "player",
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err: any) {
      console.warn("Firestore link note:", err);
    }
  };

  // Handle Login with instant local success and background Firestore sync
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUsername.trim()) return;
    const cleanName = tempUsername.trim().replace(/\s+/g, "_");
    
    // Instant local login success
    setUsername(cleanName);
    localStorage.setItem("echo_username", cleanName);
    setShowLoginModal(false);
    setTempUsername("");
    addToast("Welcome Player!", `Signed in as ${cleanName}`, "success");

    // Persist username in Firestore
    try {
      const user = auth.currentUser;
      const docId = user ? user.uid : `mc_${cleanName.toLowerCase()}`;
      if (user) {
        await updateProfile(user, { displayName: cleanName });
      }
      await setDoc(doc(db, "users", docId), {
        username: cleanName,
        minecraftUsername: cleanName,
        uid: docId,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err: any) {
      console.warn("Firestore background sync note:", err?.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setGoogleUser(null);
      setIsStaffGoogleUser(false);
      setIsAdminLoggedIn(false);
      setActiveTab(prev => (prev === "admin" ? "shop" : prev));
      setUsername("");
      localStorage.removeItem("echo_username");
      addToast("Signed out", "You have signed out of your session.", "info");
    } catch {
      setUsername("");
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {
        addToast("Audio Error", "Unable to play theme music.", "warning");
      });
    }
  };

  const copyServerIp = () => {
    navigator.clipboard.writeText("play.echocore.fun:19132");
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2500);
    addToast("IP Copied!", "Server address copied to clipboard.", "success");
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    addToast("Added to Cart", `${product.name} added to your cart.`, "info");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const disc = sub * appliedDiscount;
    return Math.max(0, sub - disc);
  };

  const applyCoupon = () => {
    setCouponError("");
    if (coupon.trim().toUpperCase() === "ECHO10") {
      setAppliedDiscount(0.10);
      addToast("Coupon Applied", "10% discount activated!", "success");
    } else {
      setCouponError("Invalid coupon code (Try ECHO10)");
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setShowLoginModal(true);
      return;
    }
    if (cart.length === 0) return;

    setSubmittingOrder(true);
    try {
      const payload = {
        username,
        discord: discordInput,
        items: cart.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
        paymentMethod,
        coupon: appliedDiscount > 0 ? "ECHO10" : ""
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Order Placed Successfully! 🛒", `Order ${data.id} created. Complete payment to receive items.`, "success");
        setCart([]);
        setCheckoutModal(false);
        setActiveTab("orders");
      } else {
        addToast("Error", data.error || "Failed to place order", "warning");
      }
    } catch {
      addToast("Network Error", "Could not connect to server.", "warning");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      const res = await fetch("/api/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action, username })
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Success", data.message, "success");
        const ordRes = await fetch(`/api/orders?username=${encodeURIComponent(username)}`);
        const ordData = await ordRes.json();
        setOrders(ordData);
      } else {
        addToast("Action Failed", data.error, "warning");
      }
    } catch {
      addToast("Error", "Request failed.", "warning");
    }
  };

  const updateAdminStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Status Updated", `Order ${id} is now ${status}`, "success");
        const allRes = await fetch("/api/orders");
        const allData = await allRes.json();
        setAdminOrders(allData);
      }
    } catch {
      addToast("Error", "Failed to update status", "warning");
    }
  };

  const filteredProducts = category === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === category);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <audio ref={audioRef} src="/musiecho-theme.mp3" loop />

      {/* Draggable Floating Music Player Widget */}
      <div
        style={{ left: `${musicPos.x}px`, top: `${musicPos.y}px` }}
        className="fixed z-50 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md p-3.5 flex flex-col gap-2.5 w-72 select-none ring-1 ring-emerald-500/20"
      >
        <div
          onMouseDown={(e) => {
            setIsDraggingMusic(true);
            musicDragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              initialX: musicPos.x,
              initialY: musicPos.y
            };
          }}
          className="flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-slate-800 pb-2"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-white">Echo SMP Theme</h5>
              <span className="text-[10px] text-emerald-400">musiecho-theme.mp3</span>
            </div>
          </div>
          <div className="text-slate-500 hover:text-slate-300 text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 rounded">
            Drag ⠿
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={toggleMusic}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              isPlayingMusic
                ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isPlayingMusic ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingMusic ? "Playing" : "Play Theme"}</span>
          </button>
          
          <button
            onClick={toggleMusic}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            title={isPlayingMusic ? "Mute / Pause" : "Unmute / Play"}
          >
            {isPlayingMusic ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Persistent Toasts (stys until closed with X) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/95 border border-emerald-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3 animate-slide-in ring-1 ring-emerald-500/20"
          >
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-sm text-emerald-300">{toast.title}</h5>
              <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <header className="sticky top-0 z-40 bg-slate-900/85 border-b border-slate-800 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap">ECHO-SMP</h1>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">Survival & Economy</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button onClick={() => setActiveTab("shop")} className={`transition-colors whitespace-nowrap shrink-0 ${activeTab === "shop" ? "text-emerald-400 font-semibold" : "hover:text-white"}`}>
            Shop & Ranks
          </button>
          <button onClick={() => setActiveTab("orders")} className={`transition-colors whitespace-nowrap shrink-0 ${activeTab === "orders" ? "text-emerald-400 font-semibold" : "hover:text-white"}`}>
            My Orders
          </button>
          <button onClick={() => setActiveTab("wiki")} className={`transition-colors whitespace-nowrap shrink-0 ${activeTab === "wiki" ? "text-emerald-400 font-semibold" : "hover:text-white"}`}>
            Server Wiki & Rules
          </button>
          {isStaffGoogleUser && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === "admin" ? "text-amber-400 font-semibold" : "text-amber-300/80 hover:text-amber-300"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Sales Log (Staff)</span>
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleMusic}
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-medium ${isPlayingMusic ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}
            title="Toggle Theme Music"
          >
            {isPlayingMusic ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPlayingMusic ? "Theme: On" : "Music"}</span>
          </button>

          {!authLoading && (
            username ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium">
                {googleUser?.photoURL ? (
                  <img src={googleUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-lg object-cover ring-1 ring-emerald-400" />
                ) : (
                  <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-[11px]">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-semibold">{username}</span>
                    {isStaffGoogleUser && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold">Staff</span>
                    )}
                  </div>
                  {googleUser?.email && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]">{googleUser.email}</span>
                  )}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 ml-1 p-1" title="Sign Out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )
          )}

          <button
            onClick={copyServerIp}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-900/40 whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
            <span>{copiedIp ? "IP Copied!" : "play.echocore.fun"}</span>
          </button>
        </div>
      </header>

      <section className="relative px-6 py-12 md:py-16 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Season 4 Active • Java & Bedrock Compatible
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Official Echo SMP <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Store & Portal</span>
            </h2>
            <p className="text-sm md:text-base text-slate-400 mb-6 leading-relaxed">
              Support the server, unlock custom ranks, crate keys, and claim blocks instantly. Fully secured checkout with UPI & QR support.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{serverStatus ? `${serverStatus.players.online}/${serverStatus.players.max} Online` : "58/200 Online"}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>TPS: {serverStatus ? serverStatus.tps : "19.95"}</span>
              </div>
              {loginStats && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Total Logins: {loginStats.totalLogins.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-4 min-w-[320px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Server Direct IP</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-between font-mono text-sm text-emerald-300">
              <span>play.echocore.fun:19132</span>
              <button onClick={copyServerIp} className="text-slate-400 hover:text-white transition-colors">
                {copiedIp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setActiveTab("shop")}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Shop Categories
            </button>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {activeTab === "shop" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
                {(["all", "ranks", "keys", "claims", "items"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${category === cat ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 px-4 py-2 rounded-xl flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-200">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
                  </div>
                  <span className="font-bold text-emerald-300">${calculateTotal().toFixed(2)}</span>
                  <button
                    onClick={() => {
                      if (!username) setShowLoginModal(true);
                      else setCheckoutModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    Checkout Now
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <MinecraftIcon id={product.id} className="w-12 h-12" />
                      {product.badge && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      {product.description}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {product.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Price</span>
                      <span className="text-lg font-extrabold text-emerald-400">${product.price.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all border border-slate-700 hover:border-emerald-500 flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl mt-12">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" /> Your Shopping Cart
                </h3>
                <div className="divide-y divide-slate-800 mb-6">
                  {cart.map(item => (
                    <div key={item.product.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <MinecraftIcon id={item.product.id} className="w-10 h-10" />
                        <div>
                          <h4 className="font-semibold text-sm text-white">{item.product.name}</h4>
                          <span className="text-xs text-slate-400">${item.product.price.toFixed(2)} each</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="px-3 py-1 text-slate-400 hover:text-white">-</button>
                          <span className="px-3 py-1 text-xs font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="px-3 py-1 text-slate-400 hover:text-white">+</button>
                        </div>
                        <span className="font-bold text-emerald-400 w-16 text-right">${(item.product.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-slate-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. ECHO10)"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white uppercase tracking-wider focus:outline-none focus:border-emerald-500"
                    />
                    <button onClick={applyCoupon} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl border border-slate-700">
                      Apply
                    </button>
                    {couponError && <span className="text-xs text-red-400 ml-2">{couponError}</span>}
                  </div>

                  <div className="w-full md:w-auto text-right">
                    <div className="text-xs text-slate-400 mb-1">Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                    {appliedDiscount > 0 && <div className="text-xs text-emerald-400 mb-1">Discount (10%): -${(calculateSubtotal() * appliedDiscount).toFixed(2)}</div>}
                    <div className="text-xl font-extrabold text-white mb-4">Total: <span className="text-emerald-400">${calculateTotal().toFixed(2)}</span></div>
                    <button
                      onClick={() => {
                        if (!username) setShowLoginModal(true);
                        else setCheckoutModal(true);
                      }}
                      className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" /> Proceed to Secure Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-400" /> My Orders & Purchase History
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Logged in as <strong className="text-emerald-300">{username || "Guest (Please login)"}</strong>
                  </p>
                </div>
                {!username && (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
                  >
                    Login with Minecraft Name
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No orders found for this account. Visit the shop to make your first purchase!
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono font-bold text-sm text-white">{order.id}</span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                            order.status === "Delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                            order.status === "Paid" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                            order.status === "Cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/30" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 space-y-1">
                          {order.items.map((it, i) => (
                            <div key={i}>• {it.quantity}x {it.name} (${(it.price * it.quantity).toFixed(2)})</div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-4 md:pt-0 border-t md:border-t-0 border-slate-900">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block">Total</span>
                          <span className="font-extrabold text-emerald-400 text-sm">${order.total.toFixed(2)}</span>
                        </div>

                        {order.status === "Pending" && !order.cancelRequested && (
                          <button
                            onClick={() => handleOrderAction(order.id, "cancel_request")}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium rounded-lg transition-colors"
                          >
                            Request Cancel
                          </button>
                        )}
                        {order.cancelRequested && (
                          <span className="text-xs text-amber-400 font-medium italic">Cancellation Pending</span>
                        )}
                        {(order.status === "Cancelled" || order.status === "Delivered") && (
                          <button
                            onClick={() => handleOrderAction(order.id, "delete_local")}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Remove from history"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "wiki" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-400" /> Echo SMP Community Wiki & Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h4 className="font-bold text-sm text-emerald-300">Server Connection Info</h4>
                  <p><strong>Java Address:</strong> play.echocore.fun:19132</p>
                  <p><strong>Bedrock Address:</strong> play.echocore.fun / Port: 19132</p>
                  <p><strong>Version:</strong> 1.20 - 1.21+</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h4 className="font-bold text-sm text-emerald-300">Core Rules</h4>
                  <p>1. No griefing or stealing in claimed land.</p>
                  <p>2. No hacked clients, X-ray packs, or unfair exploits.</p>
                  <p>3. Respect staff and fellow players in global chat.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-6">
            {!isStaffGoogleUser ? (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-5">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Staff Sales Log Restricted</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The Sales Log is exclusively restricted to authorized server staff. Only signing in with the authorized staff Google account can access this tab.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const provider = new GoogleAuthProvider();
                      provider.setCustomParameters({ prompt: "select_account" });
                      const res = await signInWithPopup(auth, provider);
                      const email = (res.user.email || "").toLowerCase();
                      if (["lasthope.mr@gmail.com", "zxbrar1@gmail.com", "ayushbhaktistudio@gmail.com", "janvirajpurohit491@gmail.com"].includes(email)) {
                        setIsStaffGoogleUser(true);
                        setIsAdminLoggedIn(true);
                        addToast("Staff Verified", `Welcome Admin (${email})!`, "success");
                      } else {
                        setIsStaffGoogleUser(false);
                        setIsAdminLoggedIn(false);
                        addToast("Access Denied", `${email} is not authorized for staff access. Only authorized staff Gmail accounts are permitted.`, "warning");
                      }
                    } catch (err: any) {
                      if (err.code !== "auth/popup-closed-by-user") {
                        addToast("Sign In Failed", err.message || "Failed to authenticate.", "warning");
                      }
                    }
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with staff Google account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("shop")}
                  className="text-xs text-slate-400 hover:text-white transition-colors block mx-auto pt-1 cursor-pointer"
                >
                  ← Return to Shop
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" /> Staff Sales Log & Order Ledger
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Manage payment status, deliveries, and cancellations.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {loginStats && (
                      <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-xs font-medium text-emerald-400 rounded-xl">
                        Total Logins: {loginStats.totalLogins}
                      </span>
                    )}
                    <button onClick={() => setIsAdminLoggedIn(false)} className="px-3 py-1.5 bg-slate-800 text-xs text-slate-400 hover:text-white rounded-xl">
                      Logout Staff
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <input
                    type="text"
                    placeholder="Search by Order ID or Username..."
                    value={adminSearch}
                    onChange={e => setAdminSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white w-full md:w-80 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    {(["all", "Pending", "Paid", "Delivered", "Cancelled"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setAdminFilter(f)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${adminFilter === f ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                        <th className="py-3 px-4 font-semibold">Order ID</th>
                        <th className="py-3 px-4 font-semibold">Player</th>
                        <th className="py-3 px-4 font-semibold">Items</th>
                        <th className="py-3 px-4 font-semibold">Total</th>
                        <th className="py-3 px-4 font-semibold">Method</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Staff Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {adminOrders
                        .filter(ord => {
                          const matchSearch = ord.id.toLowerCase().includes(adminSearch.toLowerCase()) || ord.username.toLowerCase().includes(adminSearch.toLowerCase());
                          const matchFilter = adminFilter === "all" || ord.status === adminFilter;
                          return matchSearch && matchFilter;
                        })
                        .map(ord => (
                          <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">{ord.id}</td>
                            <td className="py-3 px-4 font-semibold text-emerald-300">{ord.username}</td>
                            <td className="py-3 px-4 text-slate-300">
                              {ord.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-400">${ord.total.toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-400">{ord.paymentMethod}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                                ord.status === "Delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                                ord.status === "Paid" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                                ord.status === "Cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/30" :
                                "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}>
                                {ord.status} {ord.cancelRequested && "(Cancel Req)"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              {ord.status !== "Paid" && (
                                <button onClick={() => updateAdminStatus(ord.id, "Paid")} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                                  Mark Paid
                                </button>
                              )}
                              {ord.status !== "Delivered" && (
                                <button onClick={() => updateAdminStatus(ord.id, "Delivered")} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                                  Mark Delivered
                                </button>
                              )}
                              {ord.status !== "Cancelled" && (
                                <button onClick={() => updateAdminStatus(ord.id, "Cancelled")} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg">
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 Echo SMP. Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</p>
      </footer>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" /> Sign In to Echo SMP
            </h3>
            <p className="text-xs text-slate-400 mb-5">Sign in with your Google account or continue directly with your Minecraft username.</p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2.5 mb-4"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Or enter Minecraft username</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. Steve_MC"
                value={tempUsername}
                onChange={e => setTempUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                autoFocus
              />
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors">
                Continue as Player
              </button>
            </form>
          </div>
        </div>
      )}

      {showLinkIgnModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" /> Link Minecraft Username
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl mb-4">
              {googleUser?.photoURL ? (
                <img src={googleUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                  {googleUser?.email?.charAt(0).toUpperCase() || "G"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{googleUser?.displayName || "Google Account"}</div>
                <div className="text-[11px] text-slate-400 truncate">{googleUser?.email}</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Link your in-game Minecraft character name so ranks, crate keys, and claim blocks purchased in the shop are automatically credited to you on Echo SMP.
            </p>

            <form onSubmit={handleLinkIgnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Minecraft Java / Bedrock IGN:</label>
                <input
                  type="text"
                  placeholder="e.g. Steve_MC"
                  value={linkIgnInput}
                  onChange={e => setLinkIgnInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    signOut(auth);
                    setShowLinkIgnModal(false);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Switch Account
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40"
                >
                  Link & Save IGN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setCheckoutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Secure Order Checkout
            </h3>
            <p className="text-xs text-slate-400 mb-6">Confirm your items, payment method, and complete payment.</p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Player Account:</span>
                  <strong className="text-emerald-300">{username}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Items:</span>
                  <strong className="text-white">{cart.reduce((s, i) => s + i.quantity, 0)} items</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Final Total:</span>
                  <strong className="text-emerald-400 text-sm">${calculateTotal().toFixed(2)} USD</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Discord Username (Optional for support):</label>
                <input
                  type="text"
                  placeholder="e.g. username#1234"
                  value={discordInput}
                  onChange={e => setDiscordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Payment Method:</label>
                <div className="grid grid-cols-2 gap-3">
                  {["UPI", "QR Code", "PayPal", "Crypto"].map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-semibold transition-all ${paymentMethod === method ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-3">
                <span className="text-xs font-medium text-emerald-400 block">Scan QR or Transfer via {paymentMethod}</span>
                <div className="w-36 h-36 bg-white mx-auto rounded-lg p-2 flex items-center justify-center text-slate-900 font-bold text-xs shadow-inner">
                  [UPI / QR CODE]
                </div>
                <p className="text-[11px] text-slate-400">Send exactly <strong className="text-emerald-300">${calculateTotal().toFixed(2)}</strong> to <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">echosmp@upi</code></p>
              </div>

              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
              >
                {submittingOrder ? "Placing Order..." : "Confirm & Place Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

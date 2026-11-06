// import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { useAuth, type Role } from "@/lib/auth-store";
// import { toast } from "sonner";
// import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

// export const Route = createFileRoute("/login")({ component: LoginPage });

// function LoginPage() {
//   const [role, setRole] = useState<Role>("customer");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   const login = useAuth((s) => s.login);
//   const navigate = useNavigate();

//   const API_BASE_URL = import.meta.env.VITE_BASE_URL;

//   const submit = async (e: React.FormEvent) => {
//   e.preventDefault();

//   if (!email || !password) {
//     toast.error("Please fill in all fields");
//     return;
//   }

//   setIsSubmitting(true);

//   try {
//     const response = await fetch(`${API_BASE_URL}/auth/login`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email,
//         password,
//       }),
//     });

//     const data = await response.json();

//     console.log("Login Response:", data);

//     if (!response.ok) {
//       throw new Error(data.detail || "Invalid email or password");
//     }

//     const {
//       user_id,
//       role: backendRole,
//       email: backendEmail,
//       referral_code,
//       name,
//       display_name,
//       mobile,
//       phone,
//     } = data;

//     // Prevent incorrect role login
//     if (backendRole !== role) {
//       toast.error(
//         `This account is registered as '${backendRole}'. Please select '${backendRole}' to login.`
//       );
//       return;
//     }

//     // Save everything in Zustand
//     login(backendRole, {
//       id: user_id,
//       user_id: user_id,
//       email: backendEmail,
//       name: display_name || name || "",
//       mobile: phone || mobile || "",
//       referral_code,
//       online: false,
//     });

//     toast.success(data.message || "Login successful");

//     navigate({
//       to:
//         backendRole === "admin"
//           ? "/admin"
//           : backendRole === "creator"
//           ? "/creator"
//           : "/app",
//     });
//   } catch (error: any) {
//     toast.error(error.message || "Login failed");
//   } finally {
//     setIsSubmitting(false);
//   }
// };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-10">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }} 
//         animate={{ opacity: 1, y: 0 }}
//         className="glass-strong rounded-3xl p-8 w-full max-w-md"
//       >
//         <Link to="/" className="flex items-center gap-2 mb-6">
//           <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-glow" />
//           <span className="font-bold">Velora<span className="gradient-text">Live</span></span>
//         </Link>
//         <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
//         <p className="text-sm text-muted-foreground mb-6">Sign in to continue your journey</p>

//         <div className="grid grid-cols-3 gap-1 glass rounded-full p-1 mb-6 text-sm">
//           {(["customer", "creator", "admin"] as Role[]).map((r) => (
//             <button
//               key={r}
//               type="button"
//               onClick={() => setRole(r)}
//               className={`rounded-full py-2 font-medium capitalize transition ${role === r ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}
//             >{r}</button>
//           ))}
//         </div>

//         <form onSubmit={submit} className="space-y-4">
//           <div className="relative">
//             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input
//               type="email" 
//               placeholder="Email" 
//               value={email} 
//               onChange={(e) => setEmail(e.target.value)}
//               disabled={isSubmitting}
//               className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
//             />
//           </div>
//           <div className="relative">
//             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input
//               type="password" 
//               placeholder="Password" 
//               value={password} 
//               onChange={(e) => setPassword(e.target.value)}
//               disabled={isSubmitting}
//               className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
//             />
//           </div>
//           <Link to="/forgot-password" className="block text-right text-xs text-primary hover:underline">
//             Forgot password?
//           </Link>
          
//           <button 
//             type="submit" 
//             disabled={isSubmitting}
//             className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
//               </>
//             ) : (
//               <>
//                 Sign in <ArrowRight className="h-4 w-4" />
//               </>
//             )}
//           </button>
//         </form>

//         <p className="mt-6 text-center text-sm text-muted-foreground">
//           New here? <Link to="/signup" className="text-primary font-medium">Create account</Link>
//         </p>
//       </motion.div>
//     </div>
//   );
// }
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, type Role } from "@/lib/auth-store";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

// --------------------------------------------------
// ROUTE
// --------------------------------------------------

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// --------------------------------------------------
// LOGIN RESPONSE TYPE
// --------------------------------------------------

interface LoginResponse {
  status_code: number;
  message: string;

  access_token: string;
  token_type: string;

  user_id: number;

  email: string;
  role: Role;

  referral_code?: string;

  name?: string;
  display_name?: string;

  mobile?: string;
  phone?: string;
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

function LoginPage() {
  const [role, setRole] = useState<Role>("customer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useAuth((s) => s.login);

  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  // --------------------------------------------------
  // LOGIN SUBMIT
  // --------------------------------------------------

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields.
    if (!email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!API_BASE_URL) {
      toast.error("API base URL is not configured");
      return;
    }

    setIsSubmitting(true);

    try {
      // --------------------------------------------------
      // LOGIN API
      // --------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      console.log("Login Response:", data);

      // --------------------------------------------------
      // API ERROR
      // --------------------------------------------------

      if (!response.ok) {
        throw new Error(
          (data as any).detail ||
            data.message ||
            "Invalid email or password"
        );
      }

      // --------------------------------------------------
      // VALIDATE LOGIN RESPONSE
      // --------------------------------------------------

      if (!data.access_token) {
        throw new Error(
          "Access token not received from login API"
        );
      }

      if (!data.user_id) {
        throw new Error(
          "User ID not received from login API"
        );
      }

      if (!data.role) {
        throw new Error(
          "User role not received from login API"
        );
      }

      const {
        user_id,
        role: backendRole,
        email: backendEmail,
        referral_code,
        name,
        display_name,
        mobile,
        phone,
        access_token,
        token_type,
      } = data;

      // --------------------------------------------------
      // PREVENT INCORRECT ROLE LOGIN
      // --------------------------------------------------

      if (backendRole !== role) {
        toast.error(
          `This account is registered as '${backendRole}'. Please select '${backendRole}' to login.`
        );

        return;
      }

      // --------------------------------------------------
      // PREPARE USER DETAILS
      // --------------------------------------------------

      const userData = {
        id: user_id,

        user_id: user_id,

        email: backendEmail,

        role: backendRole,

        name: display_name || name || "",

        mobile: phone || mobile || "",

        referral_code: referral_code || "",

        online: false,
      };

      // --------------------------------------------------
      // SAVE AUTHENTICATION TOKEN
      // --------------------------------------------------

      localStorage.setItem(
        "access_token",
        access_token
      );

      localStorage.setItem(
        "token_type",
        token_type || "bearer"
      );

      // --------------------------------------------------
      // SAVE USER DETAILS
      // --------------------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      // --------------------------------------------------
      // SAVE CUSTOMER / GIFT SENDER ID
      // --------------------------------------------------

      if (backendRole === "customer") {
        // Your login response:
        // user_id = 3
        // role = customer

        const customerId = Number(user_id);

        if (
          !Number.isInteger(customerId) ||
          customerId <= 0
        ) {
          throw new Error(
            "Invalid customer ID received from login API"
          );
        }

        // Main sender ID used by /app/gifts.
        localStorage.setItem(
          "sender_id",
          String(customerId)
        );

        // Compatibility with other customer ID keys.
        localStorage.setItem(
          "customer_id",
          String(customerId)
        );

        localStorage.setItem(
          "customer_user_id",
          String(customerId)
        );

        console.log(
          "Customer sender ID saved:",
          customerId
        );
      } else {
        // Prevent old customer ID from being used
        // when creator/admin logs into this browser.

        localStorage.removeItem("sender_id");

        localStorage.removeItem("customer_id");

        localStorage.removeItem("customer_user_id");
      }

      // --------------------------------------------------
      // ZUSTAND LOGIN
      // --------------------------------------------------

      login(backendRole, userData);

      // --------------------------------------------------
      // LOGIN SUCCESS
      // --------------------------------------------------

      toast.success(
        data.message || "Login successful"
      );

      console.log("Login successful");

      console.log(
        "Stored user:",
        localStorage.getItem("user")
      );

      console.log(
        "Stored sender ID:",
        localStorage.getItem("sender_id")
      );

      // --------------------------------------------------
      // NAVIGATION
      // --------------------------------------------------

      navigate({
        to:
          backendRole === "admin"
            ? "/admin"
            : backendRole === "creator"
            ? "/creator"
            : "/app",
      });
    } catch (error: any) {
      console.error("Login error:", error);

      toast.error(
        error.message || "Login failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="glass-strong rounded-3xl p-8 w-full max-w-md"
      >

        {/* LOGO */}

        <Link
          to="/"
          className="flex items-center gap-2 mb-6"
        >

          <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-glow" />

          <span className="font-bold">
            Velora
            <span className="gradient-text">
              Live
            </span>
          </span>

        </Link>

        {/* PAGE TITLE */}

        <h1 className="text-2xl font-bold mb-1">
          Welcome back
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          Sign in to continue your journey
        </p>

        {/* ROLE SELECTION */}

        <div className="grid grid-cols-3 gap-1 glass rounded-full p-1 mb-6 text-sm">

          {(
            ["customer", "creator", "admin"] as Role[]
          ).map((r) => (

            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              disabled={isSubmitting}
              className={`rounded-full py-2 font-medium capitalize transition ${
                role === r
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground"
              }`}
            >
              {r}
            </button>

          ))}

        </div>

        {/* LOGIN FORM */}

        <form
          onSubmit={submit}
          className="space-y-4"
        >

          {/* EMAIL */}

          <div className="relative">

            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={isSubmitting}
              required
              className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />

          </div>

          {/* PASSWORD */}

          <div className="relative">

            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={isSubmitting}
              required
              className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />

          </div>

          {/* FORGOT PASSWORD */}

          <Link
            to="/forgot-password"
            className="block text-right text-xs text-primary hover:underline"
          >
            Forgot password?
          </Link>

          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
          >

            {isSubmitting ? (

              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Signing in...
              </>

            ) : (

              <>
                Sign in

                <ArrowRight className="h-4 w-4" />
              </>

            )}

          </button>

        </form>

        {/* SIGNUP */}

        <p className="mt-6 text-center text-sm text-muted-foreground">

          New here?{" "}

          <Link
            to="/signup"
            className="text-primary font-medium"
          >
            Create account
          </Link>

        </p>

      </motion.div>

    </div>
  );
}

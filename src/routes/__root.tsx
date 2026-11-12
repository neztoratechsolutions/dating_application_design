// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import {
//   Outlet, Link, createRootRouteWithContext, useRouter,
//   HeadContent, Scripts,
// } from "@tanstack/react-router";
// import { Toaster } from "@/components/ui/sonner";
// import appCss from "../styles.css?url";

// function NotFoundComponent() {
//   return (
//     <div className="flex min-h-screen items-center justify-center px-4">
//       <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
//         <h1 className="text-7xl font-bold gradient-text">404</h1>
//         <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
//         <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
//         <Link to="/" className="mt-6 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold shadow-glow">
//           Go home
//         </Link>
//       </div>
//     </div>
//   );
// }

// function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
//   const router = useRouter();
//   return (
//     <div className="flex min-h-screen items-center justify-center px-4">
//       <div className="glass-strong rounded-3xl p-8 max-w-md text-center">
//         <h1 className="text-xl font-semibold">Something went wrong</h1>
//         <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
//         <div className="mt-5 flex justify-center gap-2">
//           <button
//             onClick={() => { router.invalidate(); reset(); }}
//             className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold"
//           >Try again</button>
//           <Link to="/" className="rounded-full glass px-5 py-2 text-sm">Home</Link>
//         </div>
//       </div>
//     </div>
//   );
// }

// export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
//   head: () => ({
//     meta: [
//       { charSet: "utf-8" },
//       { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
//       { title: "Velora Live — Connect with India's top creators" },
//       { name: "description", content: "Chat, voice & video calls with verified creators across India. Premium realtime app experience." },
//       { name: "theme-color", content: "#1a0e2a" },
//     ],
//     links: [{ rel: "stylesheet", href: appCss }],
//   }),
//   shellComponent: RootShell,
//   component: RootComponent,
//   notFoundComponent: NotFoundComponent,
//   errorComponent: ErrorComponent,
// });

// function RootShell({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" className="dark">
//       <head><HeadContent /></head>
//       <body>{children}<Scripts /></body>
//     </html>
//   );
// }

// function RootComponent() {
//   const { queryClient } = Route.useRouteContext();
//   return (
//     <QueryClientProvider client={queryClient}>
//       <Outlet />
//       <Toaster position="top-center" theme="dark" richColors />
//     </QueryClientProvider>
//   );
// }
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

// =========================================================
// App setting (singleton) — drives <title> + favicon from the API
// =========================================================
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// Backend stores favicon/logo as relative paths, e.g.
// "uploads/app_settings/<uuid>_logo.png". Turn them into absolute URLs
// that hit the FastAPI static mount (/uploads).
const buildImageUrl = (path?: string | null): string => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL.replace(/\/+$/, "")}/${normalized}`;
};

const DEFAULT_APP_NAME = "Velora Live";
const DEFAULT_TAGLINE = "Connect with India's top creators";

type AppSettingHead = {
  appName: string | null;
  favicon: string | null;
  logo: string | null;
};

const EMPTY_HEAD: AppSettingHead = { appName: null, favicon: null, logo: null };

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold shadow-glow">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold"
          >Try again</button>
          <Link to="/" className="rounded-full glass px-5 py-2 text-sm">Home</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // ---------------------------------------------------------
  // Load the singleton app setting once on initial load
  // (SSR for TanStack Start, client otherwise). Drives <title>
  // + favicon via head(), and is exposed to any component via
  // Route.useLoaderData() (e.g. a header can read .logo).
  // A 2.5s timeout + try/catch guarantees the loader never
  // blocks the page if the backend is slow or down — it just
  // falls back to the defaults below.
  // ---------------------------------------------------------
  loader: async (): Promise<AppSettingHead> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`${API_BASE_URL}/app-settings/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return EMPTY_HEAD;
      const data = await res.json();
      return {
        appName: data.app_name || null,
        favicon: data.favicon || null,
        logo: data.logo || null,
      };
    } catch {
      clearTimeout(timeout);
      return EMPTY_HEAD;
    }
  },
  head: (opts: any) => {
    const loaderData: AppSettingHead | undefined = opts?.loaderData;
    const appName = loaderData?.appName || DEFAULT_APP_NAME;
    const favicon = loaderData?.favicon;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: `${appName} — ${DEFAULT_TAGLINE}` },
        { name: "description", content: "Chat, voice & video calls with verified creators across India. Premium realtime app experience." },
        { name: "theme-color", content: "#1a0e2a" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        ...(favicon ? [{ rel: "icon", href: buildImageUrl(favicon) }] : []),
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" theme="dark" richColors />
    </QueryClientProvider>
  );
}

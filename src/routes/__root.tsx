import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";
import { FinanceSync } from "@/components/finance-sync";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Akwɛ — Gestion financière Bénin";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Azaka Group — recettes, cotisations, investissements et fiscalité au Bénin, en F CFA et en euros.",
      },
      { name: "theme-color", content: "#1e4a3a" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700&display=swap",
      },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="fr" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <RootBody />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "font-sans",
              style: {
                background: "#faf8f3",
                color: "#1c1915",
                border: "1px solid #ddd6c8",
              },
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootBody() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/login") return <Outlet />;
  return (
    <AuthGate>
      <FinanceSync>
        <AppShell>
          <Outlet />
        </AppShell>
      </FinanceSync>
    </AuthGate>
  );
}

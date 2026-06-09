import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { CryptoInitProvider } from "@/components/crypto/crypto-init-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { IncomingBanner } from "@/components/notifications/incoming-banner";
import { ToastContainer } from "@/components/ui/toast-container";
import { E2EGlobalDialog } from "@/components/chat/e2e-global-dialog";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Hiên nhà",
  description: "Chuyện nhà trên hiên — nhắn tin riêng cho gia đình",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hiên nhà",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ff6b9d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${nunito.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full bg-background text-text-primary antialiased">
        <AuthProvider>
          <CryptoInitProvider>
            <ThemeProvider>
              {children}
              <IncomingBanner />
              <ToastContainer />
              <E2EGlobalDialog />
            </ThemeProvider>
          </CryptoInitProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { CryptoInitProvider } from "@/components/crypto/crypto-init-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastContainer } from "@/components/ui/toast-container";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { E2EGlobalDialog } from "@/components/chat/e2e-global-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-background text-text-primary antialiased">
        <AuthProvider>
          <CryptoInitProvider>
            <ThemeProvider>
              {children}
              <ToastContainer />
              <ServiceWorkerRegister />
              <E2EGlobalDialog />
            </ThemeProvider>
          </CryptoInitProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

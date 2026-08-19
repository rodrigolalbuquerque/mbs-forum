import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import VersionWatcher from "@/components/VersionWatcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MBS Fórum",
  description: "Fórum do MBS Digital para debater questões e chegar a decisões em grupo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MBS Fórum",
  },
};

export const viewport: Viewport = {
  themeColor: "#008069",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-wa-panel">
        {children}
        <ServiceWorkerRegister />
        <VersionWatcher />
      </body>
    </html>
  );
}

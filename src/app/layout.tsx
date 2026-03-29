import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carmy — AI Chef & Nutritionist",
  description: "Weekly pescatarian meal prep. High protein. Lactose-free.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-surface-1 text-foreground">
        <ConvexClientProvider>
          <Sidebar />
          <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 py-8">
              {children}
            </div>
          </main>
          <BottomNav />
        </ConvexClientProvider>
      </body>
    </html>
  );
}

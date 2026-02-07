import type { Metadata } from "next";
import "./globals.css";
import { AdminSidebar } from "@/components/admin-sidebar";

export const metadata: Metadata = {
  title: "Thamel Admin",
  description: "Admin app for Thamel Bar & Karaoke",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-stone-950 text-stone-100 antialiased">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 pl-64">
            <div className="mx-auto max-w-5xl min-h-screen py-8 px-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

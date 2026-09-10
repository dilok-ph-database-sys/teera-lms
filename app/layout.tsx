import type { Metadata } from "next";
import "./globals.css";
import { DevBar } from "@/components/DevBar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "TEERA Learn — เรียนสนุก เก่งขึ้น ได้ทุกที่",
  description: "แพลตฟอร์มเรียนออนไลน์ — Next.js + Prisma",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="th">
      <body className="bg-cream text-ink">
        <DevBar userName={user?.fullName ?? null} role={user?.role ?? null} />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

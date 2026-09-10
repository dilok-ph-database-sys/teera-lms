// lib/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// เวอร์ชัน DEV: อ่าน session จาก cookie "uid" (ตั้งค่าผ่าน /api/dev/login)
// เพื่อให้รันได้ทันทีโดยไม่ต้องต่อ Supabase
//
// ตอนขึ้นจริง: แทนที่ getCurrentUser ด้วยการอ่าน session จาก Supabase Auth
//   import { createServerClient } from "@supabase/ssr";
//   const { data } = await supabase.auth.getUser(); ... map เป็น AppUser
// ─────────────────────────────────────────────────────────────────────────────
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const uid = cookies().get("uid")?.value;
  if (!uid) return null;

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { id: true, email: true, fullName: true, role: true },
  });
  return user ?? null;
}

// app/api/auth/google/route.ts — เริ่มขั้นตอน "เข้าสู่ระบบด้วย Google"
// พาผู้ใช้ไปหน้ายินยอมของ Google แล้ว Google จะส่งกลับมาที่ /api/auth/google/callback
//
// ต้องตั้งค่าตัวแปรใน Vercel ก่อน:
//   GOOGLE_CLIENT_ID      — จาก Google Cloud Console
//   GOOGLE_CLIENT_SECRET  — จาก Google Cloud Console (ความลับ ห้ามเปิดเผย)
//   GOOGLE_REDIRECT_URI   — เช่น https://teera-lms.vercel.app/api/auth/google/callback
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** ที่อยู่ปลายทางที่ Google จะส่งผู้ใช้กลับมา */
export function redirectUri(req: Request) {
  return process.env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", req.url).toString();
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // ยังไม่ได้ตั้งค่า — กลับไปหน้าล็อกอินพร้อมข้อความบอกสาเหตุ
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  // หน้าที่จะพากลับไปหลังเข้าสู่ระบบสำเร็จ
  const nextPath = new URL(req.url).searchParams.get("next");
  const safeNext = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";

  // ค่าสุ่มกัน CSRF — เก็บไว้ในคุกกี้ แล้วเทียบตอน Google ส่งกลับมา
  const state = randomBytes(16).toString("hex");

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri(req));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(auth.toString());
  const opts = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 นาที
  };
  res.cookies.set("g_state", state, opts);
  res.cookies.set("g_next", safeNext, opts);
  return res;
}

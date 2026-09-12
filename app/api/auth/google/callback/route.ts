// app/api/auth/google/callback/route.ts — Google ส่งผู้ใช้กลับมาที่นี่หลังกดยินยอม
// ขั้นตอน:
//   1. ตรวจ state ให้ตรงกับคุกกี้ (กัน CSRF)
//   2. เอา code ไปแลก token กับ Google (ทำฝั่งเซิร์ฟเวอร์ ความลับไม่รั่ว)
//   3. อ่านอีเมล/ชื่อ/รูป จาก id_token
//   4. มีบัญชีอยู่แล้ว → เข้าสู่ระบบ / ยังไม่มี → สร้างบัญชีนักเรียนใหม่
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function back(req: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
}

/** อ่านส่วนข้อมูลของ id_token (JWT) — token นี้รับมาจาก Google โดยตรงผ่าน HTTPS จึงเชื่อถือได้ */
function readIdToken(idToken: string) {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    aud?: string;
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // ผู้ใช้กดยกเลิกที่หน้า Google
  if (url.searchParams.get("error")) return back(req, "google_cancelled");
  if (!code) return back(req, "google_no_code");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return back(req, "google_not_configured");

  // ── 1) ตรวจ state ──
  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("g_state="))
    ?.slice("g_state=".length);
  if (!state || !cookieState || state !== cookieState) return back(req, "google_state_mismatch");

  const nextPath = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("g_next="))
    ?.slice("g_next=".length);
  const go = nextPath && nextPath.startsWith("/") ? decodeURIComponent(nextPath) : "/dashboard";

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", req.url).toString();

  // ── 2) แลก code เป็น token ──
  let idToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = (await tokenRes.json()) as { id_token?: string };
    if (!tokenRes.ok || !tokenJson.id_token) return back(req, "google_token_failed");
    idToken = tokenJson.id_token;
  } catch {
    return back(req, "google_token_failed");
  }

  // ── 3) อ่านข้อมูลผู้ใช้ ──
  const claims = readIdToken(idToken);
  if (!claims?.email || claims.aud !== clientId) return back(req, "google_bad_token");
  if (claims.email_verified === false) return back(req, "google_email_unverified");

  const email = claims.email.toLowerCase();
  const fullName = claims.name?.trim() || email.split("@")[0];
  const picture = claims.picture;

  // ── 4) หาบัญชีเดิม หรือสร้างใหม่ ──
  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, avatarUrl: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        fullName,
        role: "STUDENT",
        ...(picture ? { avatarUrl: picture } : {}),
      },
      select: { id: true, role: true, avatarUrl: true },
    });
  } else if (picture && !user.avatarUrl) {
    // มีบัญชีอยู่แล้วแต่ยังไม่มีรูป — เติมรูปจาก Google ให้
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: picture } });
  }

  await prisma.loginEvent.create({ data: { userId: user.id, method: "GOOGLE" } }).catch(() => {});

  const res = NextResponse.redirect(new URL(go, req.url));
  res.cookies.set("uid", user.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  // ล้างคุกกี้ชั่วคราว
  res.cookies.delete("g_state");
  res.cookies.delete("g_next");
  return res;
}

// app/api/auth/login/route.ts — เข้าสู่ระบบ (dev mode)
// dev: ตรวจแค่ว่ามีอีเมลนี้ในระบบ แล้วตั้ง cookie (ยังไม่เช็ครหัสผ่านจริง)
// ตอนขึ้นจริง: ใช้ Supabase Auth signInWithPassword ตรวจรหัสผ่านฝั่งเซิร์ฟเวอร์
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  remember: z.boolean().optional(), // "จำฉันไว้"
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } }, { status: 422 });
  }
  const { email, remember } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "ไม่พบบัญชีนี้ ลองสมัครสมาชิกก่อน" } }, { status: 401 });
  }

  const res = NextResponse.json({ data: { id: user.id, role: user.role } });
  res.cookies.set("uid", user.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    // จำฉันไว้ = คุกกี้อยู่ 30 วัน / ไม่จำ = คุกกี้ session (หายเมื่อปิดเบราว์เซอร์)
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  return res;
}

// app/api/auth/login/route.ts — เข้าสู่ระบบ (ตรวจรหัสผ่านจริงด้วย scrypt)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  remember: z.boolean().optional(), // "จำฉันไว้"
});

/** ข้อความเดียวกันเสมอเมื่อเข้าไม่ได้ — ไม่บอกว่าอีเมลผิดหรือรหัสผิด (กันการไล่เดาอีเมล) */
const INVALID = NextResponse.json(
  { error: { code: "INVALID_CREDENTIALS", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" } },
  { status: 401 },
);

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
      { status: 422 },
    );
  }
  const { email, password, remember } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true, passwordHash: true },
  });
  if (!user) return INVALID;

  if (user.passwordHash) {
    // เส้นทางปกติ — ตรวจรหัสผ่านที่เข้ารหัสไว้
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return INVALID;
  } else {
    // ── เส้นทางชั่วคราว สำหรับบัญชีที่สมัครไว้ "ก่อน" ระบบรหัสผ่านจะเปิดใช้ ──
    // บัญชีเหล่านี้ยังไม่มีรหัสผ่านในระบบ จึงตั้งรหัสจากการเข้าสู่ระบบครั้งแรกให้เลย
    // 🔒 เมื่อผู้ใช้เดิมตั้งรหัสครบแล้ว ควรลบบล็อกนี้ทิ้ง
    if (password.length < 8) {
      return NextResponse.json(
        {
          error: {
            code: "PASSWORD_TOO_SHORT",
            message: "บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน — กรุณาตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร",
          },
        },
        { status: 422 },
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  // บันทึกการเข้าใช้งาน (ใช้ในหน้าผู้ดูแล) — ถ้าบันทึกไม่ได้ก็ไม่ขวางการล็อกอิน
  await prisma.loginEvent.create({ data: { userId: user.id, method: "PASSWORD" } }).catch(() => {});

  const res = NextResponse.json({ data: { id: user.id, role: user.role } });
  res.cookies.set("uid", user.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // จำฉันไว้ = คุกกี้อยู่ 30 วัน / ไม่จำ = คุกกี้ session (หายเมื่อปิดเบราว์เซอร์)
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  return res;
}

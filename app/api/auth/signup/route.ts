// app/api/auth/signup/route.ts — สมัครสมาชิก
// เก็บรหัสผ่านแบบเข้ารหัส (scrypt) เท่านั้น — ไม่เก็บรหัสผ่านจริงลงฐานข้อมูล
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  fullName: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(60),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `รหัสผ่านอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`)
    .max(72, "รหัสผ่านยาวเกินไป"),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
      { status: 422 },
    );
  }
  const { fullName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "อีเมลนี้ถูกใช้แล้ว ลองเข้าสู่ระบบแทน" } },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      role: "STUDENT",
      passwordHash: await hashPassword(password),
    },
    select: { id: true, role: true },
  });

  await prisma.loginEvent.create({ data: { userId: user.id, method: "SIGNUP" } }).catch(() => {});

  const res = NextResponse.json({ data: { id: user.id, role: user.role } });
  res.cookies.set("uid", user.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

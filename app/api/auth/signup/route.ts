// app/api/auth/signup/route.ts — สมัครสมาชิก (dev mode)
// สร้าง User ใหม่ (role STUDENT) แล้วตั้ง cookie ให้เข้าระบบเลย
// ตอนขึ้นจริง: ใช้ Supabase Auth signUp + เก็บรหัสผ่านแบบ hash (อย่าเก็บ plain)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  fullName: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(60),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.success ? "" : parsed.error.issues[0]?.message;
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: first } }, { status: 422 });
  }
  const { fullName, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: { code: "EMAIL_TAKEN", message: "อีเมลนี้ถูกใช้แล้ว ลองเข้าสู่ระบบแทน" } }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { fullName, email: email.toLowerCase(), role: "STUDENT" },
    select: { id: true, role: true },
  });

  const res = NextResponse.json({ data: { id: user.id, role: user.role } });
  res.cookies.set("uid", user.id, { httpOnly: true, path: "/", sameSite: "lax" });
  return res;
}

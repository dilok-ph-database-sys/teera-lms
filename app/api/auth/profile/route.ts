// app/api/auth/profile/route.ts — อ่าน / แก้ไขข้อมูลส่วนตัวของผู้ใช้ที่ล็อกอินอยู่
//   GET   → ดึงข้อมูลปัจจุบัน
//   PATCH → บันทึกข้อมูลที่แก้ไข
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อน" } },
  { status: 401 },
);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  return NextResponse.json({ data: user });
}

const PatchSchema = z.object({
  fullName: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(60, "ชื่อยาวเกินไป"),
  phone: z
    .string()
    .trim()
    .max(20, "เบอร์โทรยาวเกินไป")
    .regex(/^[0-9+\-\s()]*$/, "เบอร์โทรใส่ได้เฉพาะตัวเลขและเครื่องหมาย + - ( )")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(300, "แนะนำตัวได้ไม่เกิน 300 ตัวอักษร").optional().or(z.literal("")),
  avatarEmoji: z.string().trim().min(1).max(8).optional(),
});

export async function PATCH(req: Request) {
  const current = await getCurrentUser();
  if (!current) return UNAUTHORIZED;

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" } },
      { status: 422 },
    );
  }

  const { fullName, phone, bio, avatarEmoji } = parsed.data;

  const user = await prisma.user.update({
    where: { id: current.id },
    data: {
      fullName,
      phone: phone ? phone : null,
      bio: bio ? bio : null,
      ...(avatarEmoji ? { avatarEmoji } : {}),
    },
    select: {
      id: true, email: true, fullName: true, role: true,
      phone: true, bio: true, avatarEmoji: true, createdAt: true,
    },
  });

  return NextResponse.json({ data: user });
}

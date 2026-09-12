// app/api/schedule/route.ts — ตารางงาน/ตารางสอนรายวันของผู้ใช้ที่ล็อกอินอยู่
//   GET    → ดึงรายการทั้งหมดของตัวเอง
//   POST   → เพิ่มรายการใหม่
//   PATCH  → แก้ไขรายการ (รวมถึงติ๊กว่าเสร็จแล้ว)
//   DELETE → ลบรายการ  (?id=...)
// ทุกคำสั่งทำได้เฉพาะรายการของตัวเองเท่านั้น
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

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

const ItemSchema = z.object({
  date: z.string().regex(DATE, "รูปแบบวันที่ไม่ถูกต้อง"),
  startTime: z.string().regex(TIME, "รูปแบบเวลาไม่ถูกต้อง"),
  endTime: z.string().regex(TIME, "รูปแบบเวลาไม่ถูกต้อง"),
  title: z.string().trim().min(1, "กรุณากรอกชื่อรายการ").max(120),
  place: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

function fail(message: string, status = 422) {
  return NextResponse.json({ error: { code: "ERROR", message } }, { status });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const items = await prisma.scheduleItem.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 500,
  });
  return NextResponse.json({ data: items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const p = ItemSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = p.data;
  if (d.endTime < d.startTime) return fail("เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่ม");

  const item = await prisma.scheduleItem.create({
    data: {
      userId: user.id,
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      title: d.title,
      place: d.place || null,
      note: d.note || null,
    },
  });
  return NextResponse.json({ data: item });
}

const PatchSchema = ItemSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(["PENDING", "DONE"]).optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const p = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const { id, place, note, ...rest } = p.data;

  // ต้องเป็นรายการของตัวเองเท่านั้น
  const owned = await prisma.scheduleItem.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return fail("ไม่พบรายการนี้", 404);

  const item = await prisma.scheduleItem.update({
    where: { id },
    data: {
      ...rest,
      ...(place === undefined ? {} : { place: place || null }),
      ...(note === undefined ? {} : { note: note || null }),
    },
  });
  return NextResponse.json({ data: item });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("ไม่ได้ระบุรายการที่จะลบ");

  const owned = await prisma.scheduleItem.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return fail("ไม่พบรายการนี้", 404);

  await prisma.scheduleItem.delete({ where: { id } });
  return NextResponse.json({ data: { ok: true } });
}

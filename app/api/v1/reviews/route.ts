// app/api/v1/reviews/route.ts — รีวิวและให้ดาวคอร์ส
//   GET    ?courseId=...  → รายการรีวิว + คะแนนเฉลี่ย + รีวิวของฉัน (ถ้ามี)
//   POST                  → เขียน/แก้รีวิวของตัวเอง (ต้องลงทะเบียนคอร์สนั้นก่อน)
//   DELETE ?courseId=...  → ลบรีวิวของตัวเอง
//
// ทุกครั้งที่มีการเปลี่ยนแปลง ระบบจะคำนวณคะแนนเฉลี่ยของคอร์สใหม่ทันที
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(message: string, status = 422) {
  return NextResponse.json({ error: { code: "ERROR", message } }, { status });
}

const REVIEW_SELECT = {
  id: true, rating: true, comment: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, fullName: true, avatarEmoji: true, avatarUrl: true } },
} as const;

/** คำนวณคะแนนเฉลี่ยของคอร์สใหม่ แล้วบันทึกกลับ */
async function recalcRating(courseId: string) {
  const agg = await prisma.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.course.update({
    where: { id: courseId },
    data: {
      ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, // ปัดเหลือทศนิยม 1 ตำแหน่ง
      ratingCount: agg._count._all,
    },
  });
}

export async function GET(req: Request) {
  const courseId = new URL(req.url).searchParams.get("courseId");
  if (!courseId) return fail("ไม่ได้ระบุคอร์ส");

  const user = await getCurrentUser();

  const [reviews, agg, enrollment, mine] = await Promise.all([
    prisma.review.findMany({
      where: { courseId },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: REVIEW_SELECT,
    }),
    prisma.review.groupBy({ by: ["rating"], where: { courseId }, _count: { _all: true } }),
    user
      ? prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } },
          select: { status: true },
        })
      : Promise.resolve(null),
    user
      ? prisma.review.findUnique({
          where: { courseId_userId: { courseId, userId: user.id } },
          select: REVIEW_SELECT,
        })
      : Promise.resolve(null),
  ]);

  // จำนวนรีวิวแยกตามจำนวนดาว (ใช้วาดกราฟแท่ง)
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of agg) breakdown[g.rating] = g._count._all;

  const total = reviews.length;
  const sum = reviews.reduce((n, r) => n + r.rating, 0);

  return NextResponse.json({
    data: {
      reviews,
      breakdown,
      average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
      count: total,
      mine,
      canReview: !!enrollment, // ต้องลงทะเบียนคอร์สนี้ก่อนถึงจะรีวิวได้
      isAuthenticated: !!user,
    },
  });
}

const BodySchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1, "กรุณาให้ดาว").max(5),
  comment: z.string().trim().max(1000, "ความเห็นยาวเกินไป").optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("กรุณาเข้าสู่ระบบก่อน", 401);

  const p = BodySchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const { courseId, rating, comment } = p.data;

  // รีวิวได้เฉพาะคอร์สที่ลงทะเบียนแล้ว — กันรีวิวปลอมจากคนที่ไม่ได้เรียน
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true },
  });
  if (!enrolled) return fail("ต้องลงทะเบียนเรียนคอร์สนี้ก่อนจึงจะรีวิวได้", 403);

  const review = await prisma.review.upsert({
    where: { courseId_userId: { courseId, userId: user.id } },
    create: { courseId, userId: user.id, rating, comment: comment || null },
    update: { rating, comment: comment || null },
    select: REVIEW_SELECT,
  });

  await recalcRating(courseId);
  return NextResponse.json({ data: review });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("กรุณาเข้าสู่ระบบก่อน", 401);

  const courseId = new URL(req.url).searchParams.get("courseId");
  if (!courseId) return fail("ไม่ได้ระบุคอร์ส");

  await prisma.review.deleteMany({ where: { courseId, userId: user.id } });
  await recalcRating(courseId);
  return NextResponse.json({ data: { ok: true } });
}

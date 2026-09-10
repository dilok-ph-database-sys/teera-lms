// app/api/v1/learn/lessons/[id]/progress/route.ts
// บันทึกความคืบหน้าบทเรียน + คำนวณ % ใหม่ (ตรวจสิทธิ์ก่อนเสมอ)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertCourseAccessApi } from "@/lib/access";

const BodySchema = z.object({
  isCompleted: z.boolean(),
  lastPositionSec: z.number().int().min(0).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 422 });
  }
  const { isCompleted, lastPositionSec } = parsed.data;
  const lessonId = params.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "ไม่พบบทเรียน" } }, { status: 404 });
  }

  // ตรวจสิทธิ์: ต้องลงทะเบียนคอร์สนี้ (โยน 401/403 อัตโนมัติถ้าไม่ผ่าน)
  let access;
  try {
    access = await assertCourseAccessApi(lesson.module.courseId);
  } catch (res) {
    return res as Response;
  }
  const enrollmentId = access.enrollment!.id;

  const result = await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId, isCompleted, lastPositionSec: lastPositionSec ?? 0, completedAt: isCompleted ? new Date() : null },
      update: { isCompleted, ...(lastPositionSec !== undefined ? { lastPositionSec } : {}), completedAt: isCompleted ? new Date() : null },
    });

    const totalLessons = await tx.lesson.count({ where: { module: { courseId: lesson.module.courseId } } });
    const doneLessons = await tx.lessonProgress.count({ where: { enrollmentId, isCompleted: true } });
    const percent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

    const updated = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { progressPercent: percent, status: percent === 100 ? "COMPLETED" : "ACTIVE", completedAt: percent === 100 ? new Date() : null },
      select: { progressPercent: true, status: true },
    });
    return updated;
  });

  return NextResponse.json({ data: { lessonId, isCompleted, progressPercent: result.progressPercent, status: result.status } });
}

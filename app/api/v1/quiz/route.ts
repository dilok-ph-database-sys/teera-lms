// app/api/v1/quiz/route.ts — แบบทดสอบฝั่งนักเรียน
//   GET  ?lessonId=... → ดึงคำถามและตัวเลือก (ไม่ส่งเฉลยออกไปเด็ดขาด)
//   POST               → ส่งคำตอบ → ตรวจฝั่งเซิร์ฟเวอร์ แล้วคืนคะแนน + เฉลย
//
// 🔒 หลักสำคัญ: เฉลย (correctIndex) ห้ามหลุดไปฝั่งเบราว์เซอร์ก่อนส่งคำตอบ
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertCourseAccessApi } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(message: string, status = 422) {
  return NextResponse.json({ error: { code: "ERROR", message } }, { status });
}

/** แปลง choices ที่เก็บเป็น JSON กลับเป็น array (กันข้อมูลเพี้ยน) */
function parseChoices(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** ตรวจว่าผู้ใช้มีสิทธิ์เข้าบทเรียนนี้ — คืน courseId ถ้าผ่าน */
async function checkAccess(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, type: true, isPreview: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return { error: fail("ไม่พบบทเรียนนี้", 404) };
  if (lesson.type !== "QUIZ") return { error: fail("บทเรียนนี้ไม่ใช่แบบทดสอบ") };

  if (!lesson.isPreview) {
    try {
      await assertCourseAccessApi(lesson.module.courseId);
    } catch (res) {
      return { error: res as Response };
    }
  }
  return { courseId: lesson.module.courseId };
}

export async function GET(req: Request) {
  const lessonId = new URL(req.url).searchParams.get("lessonId");
  if (!lessonId) return fail("ไม่ได้ระบุบทเรียน");

  const check = await checkAccess(lessonId);
  if (check.error) return check.error;

  const user = await getCurrentUser();

  const [rows, best] = await Promise.all([
    prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { position: "asc" },
      select: { id: true, text: true, choices: true, position: true },
    }),
    user
      ? prisma.quizAttempt.findFirst({
          where: { lessonId, userId: user.id },
          orderBy: { score: "desc" },
          select: { score: true, total: true, createdAt: true },
        })
      : Promise.resolve(null),
  ]);

  const questions = rows.map((q) => ({
    id: q.id,
    text: q.text,
    choices: parseChoices(q.choices),
  }));

  return NextResponse.json({ data: { questions, best } });
}

const SubmitSchema = z.object({
  lessonId: z.string().min(1),
  // { questionId: ลำดับตัวเลือกที่เลือก }
  answers: z.record(z.string(), z.number().int().min(0).max(9)),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("กรุณาเข้าสู่ระบบก่อน", 401);

  const p = SubmitSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail("ข้อมูลคำตอบไม่ถูกต้อง");
  const { lessonId, answers } = p.data;

  const check = await checkAccess(lessonId);
  if (check.error) return check.error;

  const questions = await prisma.quizQuestion.findMany({
    where: { lessonId },
    orderBy: { position: "asc" },
    select: { id: true, correctIndex: true, explain: true, choices: true },
  });
  if (questions.length === 0) return fail("แบบทดสอบนี้ยังไม่มีคำถาม");

  // ── ตรวจคำตอบฝั่งเซิร์ฟเวอร์ ──
  let score = 0;
  const result = questions.map((q) => {
    const picked = answers[q.id];
    const correct = picked === q.correctIndex;
    if (correct) score++;
    return {
      questionId: q.id,
      picked: picked ?? null,
      correctIndex: q.correctIndex,
      correct,
      explain: q.explain,
      choices: parseChoices(q.choices),
    };
  });

  const total = questions.length;
  const percent = Math.round((score / total) * 100);

  await prisma.quizAttempt.create({
    data: { lessonId, userId: user.id, score, total },
  });

  return NextResponse.json({
    data: { score, total, percent, passed: percent >= 60, result },
  });
}

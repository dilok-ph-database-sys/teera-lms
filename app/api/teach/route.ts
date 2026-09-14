// app/api/teach/route.ts — จัดการเนื้อหาบทเรียน (สำหรับผู้สอนและผู้ดูแลระบบ)
//   GET  → ดึงคอร์สที่ตัวเองดูแล พร้อมบท (Module) และบทเรียน (Lesson) ทั้งหมด
//   POST → เพิ่ม / แก้ไข / ลบ / สลับลำดับ ผ่านฟิลด์ "action"
//
// สิทธิ์:
//   ADMIN      → จัดการได้ทุกคอร์ส
//   INSTRUCTOR → จัดการได้เฉพาะคอร์สที่ชื่อผู้สอนตรงกับชื่อตัวเอง
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(message: string, status = 422) {
  return NextResponse.json({ error: { code: "ERROR", message } }, { status });
}

/** ต้องเป็นผู้สอนหรือผู้ดูแลระบบเท่านั้น */
async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) return fail("กรุณาเข้าสู่ระบบก่อน", 401);
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return fail("หน้านี้สำหรับผู้สอนและผู้ดูแลระบบเท่านั้น", 403);
  }
  return user;
}

/** เงื่อนไขว่าคอร์สไหนที่ผู้ใช้คนนี้แตะได้ */
function scopeOf(user: { role: string; fullName: string }) {
  return user.role === "ADMIN" ? {} : { instructorName: user.fullName };
}

/** ตรวจว่าคอร์สนี้เป็นของเราจริง (กันคนแก้คอร์สคนอื่น) */
async function assertOwnsCourse(user: { role: string; fullName: string }, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, ...scopeOf(user) },
    select: { id: true },
  });
  return course?.id ?? null;
}

/** ตรวจว่าบทนี้อยู่ในคอร์สของเรา — คืน courseId ถ้าผ่าน */
async function assertOwnsModule(user: { role: string; fullName: string }, moduleId: string) {
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, course: scopeOf(user) },
    select: { courseId: true },
  });
  return mod?.courseId ?? null;
}

/** ตรวจว่าบทเรียนนี้อยู่ในคอร์สของเรา — คืน courseId ถ้าผ่าน */
async function assertOwnsLesson(user: { role: string; fullName: string }, lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { course: scopeOf(user) } },
    select: { module: { select: { courseId: true } } },
  });
  return lesson?.module.courseId ?? null;
}

/** คำนวณจำนวนบทเรียนและชั่วโมงรวมใหม่ แล้วบันทึกกลับที่คอร์ส */
async function recountCourse(courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId } },
    select: { durationSec: true },
  });
  const totalSec = lessons.reduce((n, l) => n + l.durationSec, 0);
  await prisma.course.update({
    where: { id: courseId },
    data: {
      totalLessons: lessons.length,
      totalHours: Math.max(1, Math.round(totalSec / 3600)),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const user = await requireStaff();
  if (user instanceof NextResponse) return user;

  const courses = await prisma.course.findMany({
    where: scopeOf(user),
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: {
      id: true, slug: true, title: true, subtitle: true, category: true,
      icon: true, instructorName: true, level: true, priceCents: true,
      status: true, totalLessons: true, totalHours: true,
      _count: { select: { enrollments: true } },
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true, title: true, position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true, title: true, type: true, videoUrl: true, videoKind: true,
              overviewHtml: true, durationSec: true, position: true, isPreview: true,
              questions: {
                orderBy: { position: "asc" },
                select: { id: true, text: true, choices: true, correctIndex: true, explain: true, position: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ data: { courses, role: user.role, name: user.fullName } });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────────────
const ModuleCreate = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(1, "กรุณากรอกชื่อบท").max(120),
});
const ModuleUpdate = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "กรุณากรอกชื่อบท").max(120),
});

const LessonFields = z.object({
  title: z.string().trim().min(1, "กรุณากรอกชื่อบทเรียน").max(160),
  type: z.enum(["VIDEO", "ARTICLE", "FILE", "QUIZ"]),
  videoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  videoKind: z.enum(["mp4", "hls", "embed"]).optional().or(z.literal("")),
  overviewHtml: z.string().trim().max(5000).optional().or(z.literal("")),
  durationMin: z.number().int().min(0).max(600),
  isPreview: z.boolean().optional(),
});

const LessonCreate = LessonFields.extend({ moduleId: z.string().min(1) });
const LessonUpdate = LessonFields.extend({ id: z.string().min(1) });

const IdOnly = z.object({ id: z.string().min(1) });
const MoveSchema = z.object({ id: z.string().min(1), direction: z.enum(["up", "down"]) });

export async function POST(req: Request) {
  const user = await requireStaff();
  if (user instanceof NextResponse) return user;

  const raw = await req.json().catch(() => null);
  const head = z.object({ action: z.string() }).passthrough().safeParse(raw);
  if (!head.success) return fail("คำสั่งไม่ถูกต้อง");
  const body = raw as Record<string, unknown>;

  switch (head.data.action) {
    // ── บท (Module) ────────────────────────────────────────────────────────
    case "module.create": {
      const p = ModuleCreate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      if (!(await assertOwnsCourse(user, p.data.courseId))) return fail("ไม่มีสิทธิ์แก้คอร์สนี้", 403);

      const last = await prisma.module.findFirst({
        where: { courseId: p.data.courseId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const mod = await prisma.module.create({
        data: { courseId: p.data.courseId, title: p.data.title, position: (last?.position ?? 0) + 1 },
        select: { id: true },
      });
      return NextResponse.json({ data: mod });
    }

    case "module.update": {
      const p = ModuleUpdate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      if (!(await assertOwnsModule(user, p.data.id))) return fail("ไม่มีสิทธิ์แก้บทนี้", 403);

      await prisma.module.update({ where: { id: p.data.id }, data: { title: p.data.title } });
      return NextResponse.json({ data: { ok: true } });
    }

    case "module.delete": {
      const p = IdOnly.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      const courseId = await assertOwnsModule(user, p.data.id);
      if (!courseId) return fail("ไม่มีสิทธิ์ลบบทนี้", 403);

      await prisma.module.delete({ where: { id: p.data.id } }); // บทเรียนข้างในลบตาม cascade
      await recountCourse(courseId);
      return NextResponse.json({ data: { ok: true } });
    }

    case "module.move": {
      const p = MoveSchema.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      const courseId = await assertOwnsModule(user, p.data.id);
      if (!courseId) return fail("ไม่มีสิทธิ์แก้บทนี้", 403);

      const list = await prisma.module.findMany({
        where: { courseId },
        orderBy: { position: "asc" },
        select: { id: true },
      });
      const i = list.findIndex((m) => m.id === p.data.id);
      const j = p.data.direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= list.length) return NextResponse.json({ data: { ok: true } });

      [list[i], list[j]] = [list[j], list[i]];
      await prisma.$transaction(
        list.map((m, idx) => prisma.module.update({ where: { id: m.id }, data: { position: idx + 1 } })),
      );
      return NextResponse.json({ data: { ok: true } });
    }

    // ── บทเรียน (Lesson) ───────────────────────────────────────────────────
    case "lesson.create": {
      const p = LessonCreate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const courseId = await assertOwnsModule(user, p.data.moduleId);
      if (!courseId) return fail("ไม่มีสิทธิ์เพิ่มบทเรียนในบทนี้", 403);

      const last = await prisma.lesson.findFirst({
        where: { moduleId: p.data.moduleId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const lesson = await prisma.lesson.create({
        data: {
          moduleId: p.data.moduleId,
          title: p.data.title,
          type: p.data.type,
          videoUrl: p.data.videoUrl || null,
          videoKind: p.data.videoKind || null,
          overviewHtml: p.data.overviewHtml || null,
          durationSec: p.data.durationMin * 60,
          isPreview: p.data.isPreview ?? false,
          position: (last?.position ?? 0) + 1,
        },
        select: { id: true },
      });
      await recountCourse(courseId);
      return NextResponse.json({ data: lesson });
    }

    case "lesson.update": {
      const p = LessonUpdate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const courseId = await assertOwnsLesson(user, p.data.id);
      if (!courseId) return fail("ไม่มีสิทธิ์แก้บทเรียนนี้", 403);

      await prisma.lesson.update({
        where: { id: p.data.id },
        data: {
          title: p.data.title,
          type: p.data.type,
          videoUrl: p.data.videoUrl || null,
          videoKind: p.data.videoKind || null,
          overviewHtml: p.data.overviewHtml || null,
          durationSec: p.data.durationMin * 60,
          isPreview: p.data.isPreview ?? false,
        },
      });
      await recountCourse(courseId);
      return NextResponse.json({ data: { ok: true } });
    }

    case "lesson.delete": {
      const p = IdOnly.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      const courseId = await assertOwnsLesson(user, p.data.id);
      if (!courseId) return fail("ไม่มีสิทธิ์ลบบทเรียนนี้", 403);

      await prisma.lesson.delete({ where: { id: p.data.id } });
      await recountCourse(courseId);
      return NextResponse.json({ data: { ok: true } });
    }

    case "lesson.move": {
      const p = MoveSchema.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      if (!(await assertOwnsLesson(user, p.data.id))) return fail("ไม่มีสิทธิ์แก้บทเรียนนี้", 403);

      const target = await prisma.lesson.findUnique({
        where: { id: p.data.id },
        select: { moduleId: true },
      });
      if (!target) return fail("ไม่พบบทเรียนนี้", 404);

      const list = await prisma.lesson.findMany({
        where: { moduleId: target.moduleId },
        orderBy: { position: "asc" },
        select: { id: true },
      });
      const i = list.findIndex((l) => l.id === p.data.id);
      const j = p.data.direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= list.length) return NextResponse.json({ data: { ok: true } });

      [list[i], list[j]] = [list[j], list[i]];
      await prisma.$transaction(
        list.map((l, idx) => prisma.lesson.update({ where: { id: l.id }, data: { position: idx + 1 } })),
      );
      return NextResponse.json({ data: { ok: true } });
    }

    // ── เผยแพร่ / ซ่อนคอร์ส ────────────────────────────────────────────────
    case "course.status": {
      const p = z.object({
        id: z.string().min(1),
        status: z.enum(["PUBLISHED", "DRAFT"]),
      }).safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      if (!(await assertOwnsCourse(user, p.data.id))) return fail("ไม่มีสิทธิ์แก้คอร์สนี้", 403);

      await prisma.course.update({ where: { id: p.data.id }, data: { status: p.data.status } });
      return NextResponse.json({ data: { ok: true } });
    }

    // ── คำถามแบบทดสอบ (Quiz) ───────────────────────────────────────────────
    case "question.create":
    case "question.update": {
      const isNew = head.data.action === "question.create";
      const schema = z.object({
        ...(isNew ? { lessonId: z.string().min(1) } : { id: z.string().min(1) }),
        text: z.string().trim().min(1, "กรุณากรอกคำถาม").max(500),
        choices: z.array(z.string().trim().min(1, "ตัวเลือกห้ามว่าง").max(200)).min(2, "ต้องมีอย่างน้อย 2 ตัวเลือก").max(6),
        correctIndex: z.number().int().min(0).max(5),
        explain: z.string().trim().max(500).optional().or(z.literal("")),
      });
      const p = schema.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const d = p.data as {
        lessonId?: string; id?: string;
        text: string; choices: string[]; correctIndex: number; explain?: string;
      };
      if (d.correctIndex >= d.choices.length) return fail("ข้อที่เลือกเป็นคำตอบถูก ไม่มีอยู่ในตัวเลือก");

      if (isNew) {
        if (!(await assertOwnsLesson(user, d.lessonId!))) return fail("ไม่มีสิทธิ์แก้บทเรียนนี้", 403);
        const last = await prisma.quizQuestion.findFirst({
          where: { lessonId: d.lessonId! },
          orderBy: { position: "desc" },
          select: { position: true },
        });
        const q = await prisma.quizQuestion.create({
          data: {
            lessonId: d.lessonId!,
            text: d.text,
            choices: JSON.stringify(d.choices),
            correctIndex: d.correctIndex,
            explain: d.explain || null,
            position: (last?.position ?? 0) + 1,
          },
          select: { id: true },
        });
        return NextResponse.json({ data: q });
      }

      const owned = await prisma.quizQuestion.findFirst({
        where: { id: d.id!, lesson: { module: { course: scopeOf(user) } } },
        select: { id: true },
      });
      if (!owned) return fail("ไม่มีสิทธิ์แก้คำถามนี้", 403);

      await prisma.quizQuestion.update({
        where: { id: d.id! },
        data: {
          text: d.text,
          choices: JSON.stringify(d.choices),
          correctIndex: d.correctIndex,
          explain: d.explain || null,
        },
      });
      return NextResponse.json({ data: { ok: true } });
    }

    case "question.delete": {
      const p = IdOnly.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      const owned = await prisma.quizQuestion.findFirst({
        where: { id: p.data.id, lesson: { module: { course: scopeOf(user) } } },
        select: { id: true },
      });
      if (!owned) return fail("ไม่มีสิทธิ์ลบคำถามนี้", 403);

      await prisma.quizQuestion.delete({ where: { id: p.data.id } });
      return NextResponse.json({ data: { ok: true } });
    }

    default:
      return fail("ไม่รู้จักคำสั่งนี้", 400);
  }
}

// app/api/admin/route.ts — API สำหรับหน้าผู้ดูแลระบบ (เข้าถึงได้เฉพาะ role = ADMIN)
//   GET  → ดึงข้อมูลทั้งหมดที่หน้าผู้ดูแลต้องใช้ (ผู้สอน / นักเรียน / คอร์ส / ประวัติการเข้าใช้)
//   POST → สั่งงานต่าง ๆ ผ่านฟิลด์ "action" (รวมไว้เส้นเดียวเพื่อให้ดูแลง่าย)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** ตรวจสิทธิ์ — คืน user ถ้าเป็นแอดมิน, คืน NextResponse ถ้าไม่ผ่าน */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อน" } },
      { status: 401 },
    );
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "หน้านี้สำหรับผู้ดูแลระบบเท่านั้น" } },
      { status: 403 },
    );
  }
  return user;
}

const USER_FIELDS = {
  id: true, fullName: true, email: true, role: true,
  phone: true, bio: true, avatarEmoji: true, avatarUrl: true, createdAt: true,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// GET — ข้อมูลทั้งหมดของหน้าผู้ดูแล
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [instructors, students, admins, courses, activity] = await Promise.all([
    prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: USER_FIELDS,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { ...USER_FIELDS, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: USER_FIELDS,
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        id: true, slug: true, title: true, subtitle: true, category: true,
        icon: true, instructorName: true, level: true, priceCents: true,
        status: true, totalLessons: true, totalHours: true,
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
    prisma.loginEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, method: true, createdAt: true,
        user: { select: { id: true, fullName: true, email: true, role: true, avatarEmoji: true, avatarUrl: true } },
      },
    }),
  ]);

  // สรุปครั้งล่าสุด + จำนวนครั้งของแต่ละคน
  const grouped = await prisma.loginEvent.groupBy({
    by: ["userId"],
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const summary = Object.fromEntries(
    grouped.map((g) => [g.userId, { count: g._count._all, lastAt: g._max.createdAt }]),
  );

  const categories = Array.from(new Set(courses.map((c) => c.category))).sort();

  return NextResponse.json({
    data: {
      instructors, students, admins, courses, categories, activity, summary,
      stats: {
        instructors: instructors.length,
        students: students.length,
        courses: courses.length,
        categories: categories.length,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — คำสั่งต่าง ๆ
// ─────────────────────────────────────────────────────────────────────────────
const ActionSchema = z.object({ action: z.string() }).passthrough();

const InstructorCreate = z.object({
  fullName: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(60),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(MIN_PASSWORD_LENGTH, `รหัสผ่านอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`).max(72),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
});

const InstructorUpdate = z.object({
  id: z.string().min(1),
  fullName: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(60),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  newPassword: z.string().max(72).optional().or(z.literal("")),
});

const CourseCreate = z.object({
  title: z.string().trim().min(2, "กรุณากรอกชื่อวิชา").max(120),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.string().trim().min(1, "กรุณาระบุหมวดวิชา").max(60),
  instructorName: z.string().trim().min(1, "กรุณาระบุชื่อผู้สอน").max(60),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  level: z.string().trim().max(30).optional().or(z.literal("")),
  priceBaht: z.number().int().min(0).max(1_000_000),
});

const CourseUpdate = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1).max(60),
  instructorName: z.string().trim().min(1).max(60),
  priceBaht: z.number().int().min(0).max(1_000_000),
  status: z.enum(["PUBLISHED", "DRAFT"]),
});

const IdOnly = z.object({ id: z.string().min(1) });

function fail(message: string, status = 422) {
  return NextResponse.json({ error: { code: "ERROR", message } }, { status });
}

/** สร้าง slug จากชื่อวิชา — ถ้าเป็นภาษาไทยล้วนจะใช้รหัสสุ่มแทน */
async function makeSlug(title: string) {
  const base =
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "course";
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const exists = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return `${base}-${Date.now()}`;
}

/** ลบผู้ใช้พร้อมข้อมูลที่ผูกอยู่ (คำสั่งซื้อ/การชำระเงิน ไม่ได้ตั้ง cascade ไว้) */
async function deleteUserDeep(userId: string) {
  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({ where: { userId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length) {
      await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    await tx.user.delete({ where: { id: userId } }); // enrollment / progress / loginEvent ลบตาม cascade
  });
}

/** ลบคอร์สพร้อมข้อมูลที่ผูกอยู่ */
async function deleteCourseDeep(courseId: string) {
  await prisma.$transaction(async (tx) => {
    const enrolls = await tx.enrollment.findMany({ where: { courseId }, select: { id: true } });
    const ids = enrolls.map((e) => e.id);
    if (ids.length) {
      await tx.lessonProgress.deleteMany({ where: { enrollmentId: { in: ids } } });
      await tx.certificate.deleteMany({ where: { enrollmentId: { in: ids } } });
      await tx.enrollment.deleteMany({ where: { id: { in: ids } } });
    }
    await tx.course.delete({ where: { id: courseId } }); // module / lesson ลบตาม cascade
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const raw = await req.json().catch(() => null);
  const head = ActionSchema.safeParse(raw);
  if (!head.success) return fail("คำสั่งไม่ถูกต้อง");

  const body = raw as Record<string, unknown>;

  switch (head.data.action) {
    // ── ผู้สอน ──────────────────────────────────────────────────────────────
    case "instructor.create": {
      const p = InstructorCreate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const { fullName, email, password, phone, bio } = p.data;

      const dup = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (dup) return fail("อีเมลนี้ถูกใช้แล้วในระบบ", 409);

      const user = await prisma.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          role: "INSTRUCTOR",
          phone: phone || null,
          bio: bio || null,
          passwordHash: await hashPassword(password),
        },
        select: USER_FIELDS,
      });
      return NextResponse.json({ data: user });
    }

    case "instructor.update": {
      const p = InstructorUpdate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const { id, fullName, phone, bio, newPassword } = p.data;

      const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (!target) return fail("ไม่พบผู้สอนคนนี้", 404);
      if (target.role !== "INSTRUCTOR") return fail("แก้ไขได้เฉพาะบัญชีผู้สอน", 403);

      if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
        return fail(`รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          fullName,
          phone: phone || null,
          bio: bio || null,
          ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
        },
        select: USER_FIELDS,
      });
      return NextResponse.json({ data: user });
    }

    case "instructor.delete": {
      const p = IdOnly.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");

      const target = await prisma.user.findUnique({ where: { id: p.data.id }, select: { role: true } });
      if (!target) return fail("ไม่พบผู้สอนคนนี้", 404);
      if (target.role !== "INSTRUCTOR") return fail("ลบได้เฉพาะบัญชีผู้สอน", 403);

      await deleteUserDeep(p.data.id);
      return NextResponse.json({ data: { ok: true } });
    }

    // ── คอร์ส / วิชา ────────────────────────────────────────────────────────
    case "course.create": {
      const p = CourseCreate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const { title, subtitle, category, instructorName, icon, level, priceBaht } = p.data;

      const course = await prisma.course.create({
        data: {
          slug: await makeSlug(title),
          title,
          subtitle: subtitle || "ยังไม่มีคำอธิบาย",
          category,
          instructorName,
          icon: icon || "📘",
          level: level || "ระดับต้น",
          priceCents: priceBaht * 100,
          status: "PUBLISHED",
        },
        select: { id: true, slug: true, title: true, category: true },
      });
      return NextResponse.json({ data: course });
    }

    case "course.update": {
      const p = CourseUpdate.safeParse(body);
      if (!p.success) return fail(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      const { id, title, category, instructorName, priceBaht, status } = p.data;

      const course = await prisma.course.update({
        where: { id },
        data: { title, category, instructorName, priceCents: priceBaht * 100, status },
        select: { id: true, title: true, category: true, status: true },
      });
      return NextResponse.json({ data: course });
    }

    case "course.delete": {
      const p = IdOnly.safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      const exists = await prisma.course.findUnique({ where: { id: p.data.id }, select: { id: true } });
      if (!exists) return fail("ไม่พบวิชานี้", 404);

      await deleteCourseDeep(p.data.id);
      return NextResponse.json({ data: { ok: true } });
    }

    // ── หมวดวิชา (เปลี่ยนชื่อหมวดทั้งกลุ่ม / ย้ายวิชาออกจากหมวด) ─────────────
    case "category.rename": {
      const p = z.object({
        from: z.string().trim().min(1),
        to: z.string().trim().min(1).max(60),
      }).safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");

      const res = await prisma.course.updateMany({
        where: { category: p.data.from },
        data: { category: p.data.to },
      });
      return NextResponse.json({ data: { updated: res.count } });
    }

    case "category.delete": {
      // ลบหมวด = ย้ายทุกวิชาในหมวดนั้นไปไว้ที่ "ทั่วไป" (ไม่ลบตัววิชาทิ้ง)
      const p = z.object({ name: z.string().trim().min(1) }).safeParse(body);
      if (!p.success) return fail("ข้อมูลไม่ถูกต้อง");
      if (p.data.name === "ทั่วไป") return fail("หมวด “ทั่วไป” เป็นหมวดพื้นฐาน ลบไม่ได้");

      const res = await prisma.course.updateMany({
        where: { category: p.data.name },
        data: { category: "ทั่วไป" },
      });
      return NextResponse.json({ data: { moved: res.count } });
    }

    default:
      return fail("ไม่รู้จักคำสั่งนี้", 400);
  }
}

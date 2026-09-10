// prisma/seed.ts — ใส่ข้อมูลตัวอย่างให้ระบบมีของให้ดูทันที
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // ล้างของเดิม (เรียงตาม FK)
  await db.lessonProgress.deleteMany();
  await db.certificate.deleteMany();
  await db.enrollment.deleteMany();
  await db.payment.deleteMany();
  await db.order.deleteMany();
  await db.lesson.deleteMany();
  await db.module.deleteMany();
  await db.course.deleteMany();
  await db.user.deleteMany();

  // ── ผู้ใช้ (บัญชี dev) ──
  const student = await db.user.create({
    data: { id: "u_student", email: "student@teera.dev", fullName: "ธีรา บุญมี", role: "STUDENT" },
  });
  await db.user.create({
    data: { id: "u_instructor", email: "teacher@teera.dev", fullName: "อ.สมชาย วงศ์", role: "INSTRUCTOR" },
  });
  await db.user.create({
    data: { id: "u_admin", email: "admin@teera.dev", fullName: "ธีรา ผู้ดูแล", role: "ADMIN" },
  });

  // ── คอร์ส 1: Next.js (มีบทเรียนเต็ม + ผู้เรียนคนนี้กำลังเรียน) ──
  const next = await db.course.create({
    data: {
      slug: "nextjs-foundation", title: "พื้นฐาน Next.js สร้างเว็บสมัยใหม่",
      subtitle: "เรียนรู้ App Router, Server Components และการเชื่อมฐานข้อมูล ตั้งแต่ศูนย์จนขึ้นโปรดักชัน",
      icon: "⚡", gradient: "from-orange-500 to-amber-600", instructorName: "อ.สมชาย วงศ์",
      level: "ระดับต้น", priceCents: 129000, totalLessons: 6, totalHours: 9,
      ratingAvg: 4.8, ratingCount: 342, studentCount: 2841, status: "PUBLISHED",
      modules: {
        create: [
          {
            title: "เริ่มต้นกับ Next.js", position: 1,
            lessons: {
              create: [
                { title: "ทำความรู้จัก Next.js และ App Router", type: "VIDEO", videoKind: "mp4", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", durationSec: 750, position: 1, isPreview: true, overviewHtml: "<p>บทนำสู่ Next.js และแนวคิด App Router</p>" },
                { title: "ติดตั้งโปรเจกต์และโครงโฟลเดอร์", type: "VIDEO", videoKind: "mp4", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", durationSec: 555, position: 2, overviewHtml: "<p>วิธีติดตั้งและโครงสร้างโฟลเดอร์มาตรฐาน</p>" },
                { title: "หน้าแรกและระบบ Routing", type: "VIDEO", videoKind: "mp4", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", durationSec: 880, position: 3 },
              ],
            },
          },
          {
            title: "Server & Client Components", position: 2,
            lessons: {
              create: [
                { title: "ความต่างของ Server กับ Client Component", type: "VIDEO", videoKind: "mp4", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", durationSec: 980, position: 1, overviewHtml: "<p>เมื่อไหร่ควรใช้อะไร</p>" },
                { title: "บทความ: รูปแบบการจัดวางข้อมูล", type: "ARTICLE", durationSec: 360, position: 2, overviewHtml: "<h3>รูปแบบการจัดวางข้อมูล</h3><p>เนื้อหาบทความประกอบ...</p>" },
                { title: "งานมอบหมาย: สร้าง API แรกของคุณ", type: "FILE", durationSec: 0, position: 3 },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // ── คอร์ส 2: ฟรี ──
  await db.course.create({
    data: {
      slug: "git-github", title: "Git & GitHub สำหรับทำงานเป็นทีม",
      subtitle: "จัดการเวอร์ชันโค้ดและทำงานร่วมกันอย่างมือโปร",
      icon: "🌿", gradient: "from-orange-500 to-amber-600", instructorName: "อ.สมชาย วงศ์",
      level: "ระดับต้น", priceCents: 0, totalLessons: 3, totalHours: 5,
      ratingAvg: 4.9, ratingCount: 612, studentCount: 7240,
      modules: { create: [{ title: "พื้นฐาน Git", position: 1, lessons: { create: [
        { title: "Git คืออะไร ทำไมต้องใช้", type: "VIDEO", videoKind: "mp4", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", durationSec: 480, position: 1, isPreview: true },
        { title: "commit และ branch", type: "VIDEO", durationSec: 750, position: 2 },
        { title: "แก้ conflict ตอน merge", type: "VIDEO", durationSec: 820, position: 3 },
      ] } }] },
    },
  });

  // ── คอร์ส 3: เสียเงิน (ยังไม่ซื้อ — ไว้ทดสอบ checkout) ──
  await db.course.create({
    data: {
      slug: "postgresql-dev", title: "PostgreSQL สำหรับนักพัฒนา",
      subtitle: "ออกแบบตาราง เขียน query ให้เร็ว และใช้ index อย่างเข้าใจ",
      icon: "🐘", gradient: "from-blue-500 to-indigo-600", instructorName: "อ.วิภา การุณ",
      level: "ระดับกลาง", priceCents: 159000, totalLessons: 3, totalHours: 11,
      ratingAvg: 4.7, ratingCount: 198, studentCount: 1520,
      modules: { create: [{ title: "พื้นฐานฐานข้อมูล", position: 1, lessons: { create: [
        { title: "ทำความรู้จัก PostgreSQL", type: "VIDEO", durationSec: 680, position: 1, isPreview: true },
        { title: "ตาราง คอลัมน์ และชนิดข้อมูล", type: "VIDEO", durationSec: 910, position: 2 },
        { title: "เขียน Query แรก", type: "VIDEO", durationSec: 800, position: 3 },
      ] } }] },
    },
  });

  // ── ผู้เรียนคนนี้ลงคอร์ส Next.js + เรียนจบไป 2 บทแรก (progress ~33%) ──
  const allLessons = next.modules.flatMap((m) => m.lessons).sort((a, b) => a.position - b.position);
  const enrollment = await db.enrollment.create({
    data: { userId: student.id, courseId: next.id, status: "ACTIVE", progressPercent: 33 },
  });
  await db.lessonProgress.createMany({
    data: allLessons.slice(0, 2).map((l) => ({
      enrollmentId: enrollment.id, lessonId: l.id, isCompleted: true, completedAt: new Date(),
    })),
  });

  // ── ผู้เรียนคนนี้เรียน Git จบแล้ว + ได้ certificate ──
  const git = await db.course.findUnique({ where: { slug: "git-github" } });
  const gitEnroll = await db.enrollment.create({
    data: { userId: student.id, courseId: git!.id, status: "COMPLETED", progressPercent: 100, completedAt: new Date() },
  });
  await db.certificate.create({
    data: { enrollmentId: gitEnroll.id, serial: "TEERA-2026-000042", pdfUrl: "#", issuedAt: new Date() },
  });

  console.log("✓ Seed สำเร็จ: ผู้ใช้ 3 คน, คอร์ส 3 คอร์ส, การลงทะเบียน 2 รายการ, ใบรับรอง 1 ใบ");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());

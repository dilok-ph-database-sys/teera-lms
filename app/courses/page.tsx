// app/courses/page.tsx — แคตตาล็อกคอร์ส (ดึงข้อมูลฝั่งเซิร์ฟเวอร์ แล้วส่งให้ตัวกรองทำงานฝั่งเบราว์เซอร์)
import { prisma } from "@/lib/prisma";
import { CourseCatalog, type CatalogCourse } from "@/components/CourseCatalog";

export const dynamic = "force-dynamic";

const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

export default async function CoursesPage() {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { studentCount: "desc" },
    select: {
      id: true, slug: true, title: true, subtitle: true, category: true,
      icon: true, gradient: true, instructorName: true, level: true,
      priceCents: true, ratingAvg: true, ratingCount: true,
      studentCount: true, totalLessons: true, totalHours: true,
    },
  });

  const courses: CatalogCourse[] = rows;

  return (
    <div className="overflow-x-hidden">
      {/* หัวหน้าเพจ */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-12 -top-8 h-56 w-56 bg-sun opacity-40 blur-sm" style={blob} />
        <div className="pointer-events-none absolute right-0 top-10 h-48 w-48 bg-berry opacity-30 blur-sm" style={blob} />
        <div className="relative mx-auto max-w-6xl px-5 pb-2 pt-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand shadow-card">
            🎒 คอร์สทั้งหมดของเรา
          </span>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">เลือกคอร์สที่ใช่สำหรับคุณ 🌈</h1>
          <p className="mx-auto mt-3 max-w-md text-ink/65">
            มีให้เลือกหลากหลายหมวด ทุกระดับ เริ่มเรียนได้ทันทีหลังสมัคร
          </p>
        </div>
      </section>

      {/* ค้นหา + กรอง + กริดคอร์ส */}
      <CourseCatalog courses={courses} />
    </div>
  );
}

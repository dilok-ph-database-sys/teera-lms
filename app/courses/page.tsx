// app/courses/page.tsx — แคตตาล็อกคอร์ส (โฉมใหม่ เข้าชุดกับหน้าแรก)
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const baht = (c: number) => (c / 100).toLocaleString("th-TH");
const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { studentCount: "desc" },
  });

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

      {/* กริดคอร์ส */}
      <section className="mx-auto max-w-6xl px-5 pb-4 pt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="group overflow-hidden rounded-[28px] bg-white shadow-card transition hover:-translate-y-1.5"
            >
              <div className={`relative grid aspect-[16/10] place-items-center bg-gradient-to-br text-6xl text-white ${c.gradient}`}>
                <span className="transition group-hover:scale-110">{c.icon}</span>
                {c.priceCents === 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-green-600">ฟรี</span>
                )}
              </div>
              <div className="p-5">
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">{c.level}</span>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-brand-dark">{c.title}</h3>
                <p className="mt-2 text-sm text-ink/60">👨‍🏫 {c.instructorName}</p>
                <div className="mt-4 flex items-center justify-between border-t border-orange-100 pt-3">
                  <span className="text-sm font-semibold text-amber-500">★ {c.ratingAvg} <span className="text-ink/40">({c.ratingCount})</span></span>
                  <span className={`font-display text-xl font-extrabold ${c.priceCents === 0 ? "text-green-600" : "text-brand"}`}>
                    {c.priceCents === 0 ? "ฟรี" : `฿${baht(c.priceCents)}`}
                  </span>
                </div>
                <span className="mt-4 block rounded-2xl bg-brand py-2.5 text-center font-bold text-white shadow-soft transition group-hover:bg-brand-dark">
                  {c.priceCents === 0 ? "เรียนฟรี" : "ดูคอร์ส"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

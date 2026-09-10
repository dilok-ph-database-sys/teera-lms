// app/page.tsx — หน้าแรก (Landing) โทนส้ม/เหลืองสไตล์เด็ก–ติวเตอร์
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const baht = (c: number) => (c / 100).toLocaleString("th-TH");
const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

export default async function Home() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { studentCount: "desc" },
    take: 3,
  });

  const cats = [
    { icon: "💻", name: "เว็บ & โค้ด", n: 24, bg: "bg-brand/15" },
    { icon: "🎨", name: "ออกแบบ", n: 16, bg: "bg-sky/20" },
    { icon: "📊", name: "ข้อมูล", n: 12, bg: "bg-berry/20" },
    { icon: "📱", name: "แอปมือถือ", n: 9, bg: "bg-sun/25" },
    { icon: "🔐", name: "ความปลอดภัย", n: 8, bg: "bg-brand/15" },
    { icon: "🗂️", name: "ระบบ/เครือข่าย", n: 11, bg: "bg-sky/20" },
  ];
  const steps = [
    { n: 1, icon: "🎒", t: "เลือกคอร์ส", d: "เลือกจากหมวดที่สนใจ มีตัวอย่างให้ดูฟรีก่อนตัดสินใจ", c: "bg-brand" },
    { n: 2, icon: "▶️", t: "เรียนตามจังหวะ", d: "ดูวิดีโอ ทำแบบทดสอบ ระบบจำความคืบหน้าให้อัตโนมัติ", c: "bg-sun" },
    { n: 3, icon: "🏆", t: "รับใบประกาศ", d: "เรียนครบทุกบทและผ่านการวัดผล รับใบประกาศได้เลย", c: "bg-berry" },
  ];
  const reviews = [
    { st: "★★★★★", tx: "อธิบายเข้าใจง่ายมาก จากที่ไม่เคยเขียนโค้ดเลย ตอนนี้ทำเว็บเองได้แล้ว!", nm: "ปิยะ ม.", who: "นักเรียน ม.ปลาย", init: "ปย", bg: "bg-brand/15" },
    { st: "★★★★★", tx: "ชอบที่มีตัวอย่างจริงให้ทำตามทุกบท เรียนสนุกไม่น่าเบื่อเลยค่ะ", nm: "กนกวรรณ ท.", who: "นักศึกษา", init: "กว", bg: "bg-sky/20" },
    { st: "★★★★★", tx: "เรียนจบแล้วเอาไปใช้กับงานจริงได้ทันที คุ้มค่ามากครับ แนะนำเลย", nm: "เอกชัย พ.", who: "พนักงานบริษัท", init: "อช", bg: "bg-berry/20" },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-10 -top-10 h-72 w-72 bg-sun opacity-50 blur-sm" style={blob} />
        <div className="pointer-events-none absolute -right-16 top-40 h-64 w-64 bg-berry opacity-40 blur-sm" style={blob} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-8 pt-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand shadow-card">
              ⭐ แพลตฟอร์มเรียนออนไลน์สำหรับทุกวัย
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[56px]">
              เรียนสนุก เก่งขึ้น<br />
              <span className="text-brand">ได้ทุกที่ทุกเวลา</span> 🚀
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/70">
              คอร์สคุณภาพจากติวเตอร์ตัวจริง เรียนตามจังหวะของตัวเอง มีแบบทดสอบ
              ติดตามความคืบหน้า และรับใบประกาศเมื่อเรียนจบ
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/courses" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-lg font-bold text-white shadow-soft transition hover:bg-brand-dark">เริ่มเรียนเลย →</Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-lg font-bold text-ink shadow-card transition hover:-translate-y-0.5">▶ ดูวิธีเรียน</a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div><div className="font-display text-2xl font-extrabold text-brand">96+</div><div className="text-ink/60">คอร์สเรียน</div></div>
              <div className="h-8 w-px bg-orange-200" />
              <div><div className="font-display text-2xl font-extrabold text-brand">15,000+</div><div className="text-ink/60">ผู้เรียน</div></div>
              <div className="h-8 w-px bg-orange-200" />
              <div><div className="font-display text-2xl font-extrabold text-brand">4.9 ★</div><div className="text-ink/60">คะแนนเฉลี่ย</div></div>
            </div>
          </div>

          <div className="relative hidden h-[380px] lg:block">
            <div className="absolute inset-6 rounded-[40px] bg-gradient-to-br from-sun/40 to-brand/30" />
            <div className="animate-floaty absolute left-6 top-8 w-60 rounded-3xl bg-white p-4 shadow-card">
              <div className="grid aspect-video place-items-center rounded-2xl bg-gradient-to-br from-brand to-sun text-5xl">⚡</div>
              <div className="mt-3 font-display font-bold">พื้นฐาน Next.js</div>
              <div className="mt-0.5 text-xs text-ink/60">อ.สมชาย · 9 ชั่วโมง</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100"><div className="h-full w-2/3 rounded-full bg-brand" /></div>
            </div>
            <div className="animate-floaty absolute right-4 top-24 w-52 rounded-3xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky/20 text-xl">🏆</span>
                <div><div className="font-display text-sm font-bold leading-tight">ได้ใบประกาศ!</div><div className="text-[11px] text-ink/55">เรียนจบ Git & GitHub</div></div></div>
            </div>
            <div className="absolute bottom-6 right-10 text-6xl">🧑‍🎓</div>
          </div>
        </div>

        {/* trust strip */}
        <div className="relative mx-auto max-w-6xl px-5 pb-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-3xl bg-white px-6 py-5 text-sm font-semibold text-ink/70 shadow-card">
            <span>✅ เรียนได้ตลอดชีพ</span><span>📱 เรียนบนมือถือ/คอม</span>
            <span>📝 แบบทดสอบท้ายบท</span><span>🏅 ใบประกาศเมื่อจบ</span><span>💬 ถาม–ตอบกับผู้สอน</span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">เลือกหมวดที่ชอบ 🎨</h2>
          <p className="mt-3 text-ink/65">มีให้เลือกหลากหลาย ตั้งแต่พื้นฐานจนถึงระดับมือโปร</p>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((c) => (
            <Link key={c.name} href="/courses" className="group rounded-3xl bg-white p-5 text-center shadow-card transition hover:-translate-y-1">
              <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${c.bg} text-3xl transition group-hover:scale-110`}>{c.icon}</div>
              <div className="mt-3 font-display text-sm font-bold">{c.name}</div>
              <div className="text-[11px] text-ink/55">{c.n} คอร์ส</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED COURSES (จาก DB จริง) */}
      <section className="bg-gradient-to-b from-transparent to-orange-50/60 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">คอร์สยอดนิยม 🔥</h2>
              <p className="mt-2 text-ink/65">ผู้เรียนเลือกมากที่สุดในเดือนนี้</p>
            </div>
            <Link href="/courses" className="hidden rounded-xl bg-white px-4 py-2 font-semibold shadow-card transition hover:-translate-y-0.5 sm:inline-flex">ดูทั้งหมด →</Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="overflow-hidden rounded-[28px] bg-white shadow-card transition hover:-translate-y-1.5">
                <div className={`relative grid aspect-[16/10] place-items-center bg-gradient-to-br text-6xl text-white ${c.gradient}`}>
                  {c.icon}
                  {c.priceCents === 0 && <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-green-600">ฟรี</span>}
                </div>
                <div className="p-5">
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">{c.level}</span>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug">{c.title}</h3>
                  <div className="mt-2 text-sm text-ink/60">👨‍🏫 {c.instructorName}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-500">★ {c.ratingAvg} <span className="text-ink/40">({c.ratingCount})</span></span>
                    <span className={`font-display text-xl font-extrabold ${c.priceCents === 0 ? "text-green-600" : "text-brand"}`}>{c.priceCents === 0 ? "ฟรี" : `฿${baht(c.priceCents)}`}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">เริ่มเรียนง่าย ๆ 3 ขั้น</h2>
          <p className="mt-3 text-ink/65">ไม่ต้องมีพื้นฐานก็เริ่มได้เลย</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-3xl bg-white p-7 text-center shadow-card">
              <div className={`absolute -top-4 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full ${s.c} font-display font-extrabold text-white shadow-soft`}>{s.n}</div>
              <div className="mt-3 text-5xl">{s.icon}</div>
              <h3 className="mt-3 font-display text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-ink/65">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-orange-50/60 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">เสียงจากผู้เรียน 💬</h2>
            <p className="mt-3 text-ink/65">กว่า 15,000 คนเลือกเรียนกับเรา</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.nm} className="rounded-3xl bg-white p-6 shadow-card">
                <div className="text-lg text-amber-400">{r.st}</div>
                <p className="mt-3 text-ink/75">&ldquo;{r.tx}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full font-bold ${r.bg}`}>{r.init}</span>
                  <div><div className="font-bold">{r.nm}</div><div className="text-xs text-ink/55">{r.who}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-[40px] px-8 py-14 text-center text-white shadow-soft" style={{ background: "linear-gradient(135deg,#FB923C,#F97316 55%,#EA580C)" }}>
          <div className="absolute -left-8 -top-8 text-8xl opacity-20">🎈</div>
          <div className="absolute -bottom-10 -right-6 text-9xl opacity-20">📚</div>
          <h2 className="relative text-3xl font-extrabold sm:text-4xl">พร้อมเริ่มเรียนแล้วหรือยัง? 🌟</h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/90">สมัครวันนี้ เริ่มเรียนคอร์สฟรีได้ทันที ไม่มีค่าใช้จ่ายแอบแฝง</p>
          <Link href="/courses" className="relative mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-extrabold text-brand-dark shadow-card transition hover:-translate-y-0.5">สมัครเรียนฟรี →</Link>
        </div>
      </section>
    </div>
  );
}

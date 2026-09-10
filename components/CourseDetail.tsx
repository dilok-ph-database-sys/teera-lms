"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, CreditCard, QrCode, ShieldCheck, Lock } from "lucide-react";

export interface CourseDetailData {
  id: string; slug: string; title: string; subtitle: string; icon: string; gradient: string;
  instructorName: string; priceCents: number; currency: string; level: string;
  totalLessons: number; totalHours: number; rating: number; ratingCount: number;
}
interface Props { course: CourseDetailData; hasAccess: boolean; isAuthenticated: boolean; }

const baht = (c: number) => (c / 100).toLocaleString("th-TH");

export function CourseDetail({ course, hasAccess, isAuthenticated }: Props) {
  const isFree = course.priceCents === 0;
  const [method, setMethod] = useState<"card" | "promptpay">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (!isAuthenticated) { window.location.href = "/login?next=/courses/" + course.slug; return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, method }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "เริ่มการชำระเงินไม่สำเร็จ");
      if (json.data?.enrolled) { window.location.href = `/learn/${course.slug}`; return; }
      throw new Error("โหมด Stripe จริง: ต่อ clientSecret กับ Stripe Elements (ดูไฟล์ checkout.route.ts)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setLoading(false); }
  }

  const perks = ["เข้าเรียนได้ตลอดชีพ", "เรียนบนมือถือและคอมพิวเตอร์", "แบบทดสอบและงานมอบหมาย", "ใบประกาศเมื่อเรียนจบ"];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/courses" className="mb-4 inline-flex text-sm text-ink/50 hover:text-brand">‹ กลับไปหน้าคอร์สทั้งหมด</Link>

      {/* แบนเนอร์ */}
      <div className={`mb-8 grid aspect-[21/7] place-items-center rounded-[32px] bg-gradient-to-br text-white shadow-card ${course.gradient}`}>
        <span className="text-7xl drop-shadow-lg">{course.icon}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* เนื้อหาซ้าย */}
        <div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">{course.level}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
          <p className="mt-3 text-lg text-ink/70">{course.subtitle}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {[
              `⭐ ${course.rating} (${course.ratingCount})`,
              `📚 ${course.totalLessons} บทเรียน`,
              `⏱️ ${course.totalHours} ชั่วโมง`,
              `👨‍🏫 ${course.instructorName}`,
            ].map((t) => (
              <span key={t} className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-ink/70 shadow-card">{t}</span>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">สิ่งที่คุณจะได้ 🎁</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-ink/70"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand" />{p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* การ์ดซื้อ/เข้าเรียน (sticky) */}
        <aside className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-card">
            <div className={`grid aspect-[16/9] place-items-center bg-gradient-to-br text-white ${course.gradient}`}><span className="text-6xl drop-shadow">{course.icon}</span></div>
            <div className="p-6">
              <div className="mb-4 font-display text-3xl font-extrabold">
                {isFree ? <span className="text-green-600">ฟรี</span> : <>฿{baht(course.priceCents)} <span className="text-sm font-medium text-ink/50">บาท</span></>}
              </div>

              {hasAccess ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-2xl bg-brand/10 px-3 py-2.5 text-sm font-semibold text-brand"><CheckCircle2 className="h-4 w-4" />คุณมีสิทธิ์เข้าเรียนแล้ว</div>
                  <Link href={`/learn/${course.slug}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 font-bold text-white shadow-soft transition hover:bg-brand-dark">▶ เข้าเรียนต่อ</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {!isFree && (
                    <div className="grid grid-cols-2 gap-2">
                      {([{ key: "card", label: "บัตรเครดิต", icon: CreditCard }, { key: "promptpay", label: "PromptPay", icon: QrCode }] as const).map((m) => (
                        <button key={m.key} type="button" onClick={() => setMethod(m.key)}
                          className={"flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition " + (method === m.key ? "border-brand bg-brand/10 text-brand" : "border-orange-200 text-ink/60 hover:bg-orange-50")}>
                          <m.icon className="h-4 w-4" />{m.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={checkout} disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-60">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {loading ? "กำลังดำเนินการ..." : isFree ? "ลงเรียนฟรีทันที" : `ชำระเงิน ฿${baht(course.priceCents)}`}
                  </button>
                  {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
                  {!isFree && <p className="text-center text-xs text-ink/40"><Lock className="mr-1 inline h-3 w-3" />โหมดสาธิต: จ่ายแล้วปลดล็อกทันที</p>}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Award, PlayCircle, Download, CheckCircle2 } from "lucide-react";

export interface EnrolledCourse {
  id: string; slug: string; title: string; icon: string; gradient: string;
  instructorName: string; progressPercent: number; completedLessons: number;
  totalLessons: number; lastLessonId?: string; completedAt?: string;
}
export interface CertificateItem {
  id: string; courseTitle: string; serial: string; issuedAtLabel: string; pdfUrl?: string;
}
interface Props {
  studentName: string;
  inProgress: EnrolledCourse[];
  completed: EnrolledCourse[];
  certificates: CertificateItem[];
}

function cn(...c: Array<string | false | null | undefined>) { return c.filter(Boolean).join(" "); }
const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

function ProgressBar({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand to-sun transition-[width] duration-500" style={{ width: `${p}%` }} />
    </div>
  );
}

function Thumb({ icon, gradient, className }: { icon: string; gradient: string; className?: string }) {
  return <div className={cn("grid place-items-center bg-gradient-to-br text-white", gradient, className)}><span className="text-3xl drop-shadow">{icon}</span></div>;
}

export function StudentDashboard({ studentName, inProgress, completed, certificates }: Props) {
  const hasAny = inProgress.length + completed.length > 0;

  const tiles = [
    { icon: BookOpen, label: "กำลังเรียน", value: inProgress.length, tone: "bg-brand/15 text-brand" },
    { icon: GraduationCap, label: "เรียนจบแล้ว", value: completed.length, tone: "bg-sky/20 text-sky-600" },
    { icon: Award, label: "ใบรับรอง", value: certificates.length, tone: "bg-sun/25 text-amber-600" },
  ];

  return (
    <div className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 bg-sun opacity-30 blur-sm" style={blob} />

      <div className="relative mx-auto max-w-6xl px-5 py-10">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-wider text-brand">แดชบอร์ดของฉัน</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">สวัสดี {studentName} 👋</h1>
          <p className="mt-1 text-ink/60">มาเรียนต่อจากที่ค้างไว้กันเลย</p>
        </header>

        {/* stat tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.label} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
              <span className={cn("grid h-12 w-12 flex-none place-items-center rounded-2xl", t.tone)}><t.icon className="h-6 w-6" /></span>
              <div>
                <div className="font-display text-2xl font-extrabold tabular-nums">{t.value}</div>
                <div className="text-sm text-ink/60">{t.label}</div>
              </div>
            </div>
          ))}
        </div>

        {!hasAny && (
          <div className="mt-10 rounded-[28px] border border-dashed border-orange-200 bg-white/60 py-16 text-center">
            <div className="text-5xl">📚</div>
            <p className="mt-3 text-ink/60">ยังไม่มีคอร์สที่ลงเรียน</p>
            <Link href="/courses" className="mt-4 inline-block rounded-2xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark">สำรวจคอร์ส</Link>
          </div>
        )}

        {/* กำลังเรียน */}
        {inProgress.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold">กำลังเรียนอยู่ <span className="text-sm font-normal text-ink/40">({inProgress.length})</span></h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inProgress.map((c) => (
                <article key={c.id} className="overflow-hidden rounded-[28px] bg-white shadow-card transition hover:-translate-y-1">
                  <Thumb icon={c.icon} gradient={c.gradient} className="aspect-[16/7] w-full" />
                  <div className="flex flex-col gap-3 p-5">
                    <div>
                      <h3 className="font-display font-bold leading-snug">{c.title}</h3>
                      <p className="mt-0.5 text-sm text-ink/55">👨‍🏫 {c.instructorName}</p>
                    </div>
                    <ProgressBar percent={c.progressPercent} />
                    <div className="flex items-center justify-between text-sm text-ink/55">
                      <span className="font-semibold tabular-nums text-brand">{c.progressPercent}% สำเร็จ</span>
                      <span>{c.completedLessons}/{c.totalLessons} บทเรียน</span>
                    </div>
                    <Link href={`/learn/${c.slug}${c.lastLessonId ? `?lesson=${c.lastLessonId}` : ""}`} className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-2.5 font-bold text-white shadow-soft transition hover:bg-brand-dark">
                      <PlayCircle className="h-4 w-4" />{c.progressPercent === 0 ? "เริ่มเรียน" : "เรียนต่อ"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* เรียนจบแล้ว */}
        {completed.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold">เรียนจบแล้ว <span className="text-sm font-normal text-ink/40">({completed.length})</span></h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {completed.map((c) => (
                <article key={c.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
                  <Thumb icon={c.icon} gradient={c.gradient} className="h-14 w-14 flex-none rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display font-bold">{c.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brand"><CheckCircle2 className="h-4 w-4" />เรียนจบแล้ว{c.completedAt ? ` · ${c.completedAt}` : ""}</p>
                  </div>
                  <Link href={`/learn/${c.slug}`} className="flex-none rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-orange-50">ทบทวน</Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ใบรับรอง */}
        {certificates.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold">ใบรับรองที่ได้รับ <span className="text-sm font-normal text-ink/40">({certificates.length})</span></h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((c) => (
                <article key={c.id} className="relative overflow-hidden rounded-[28px] border-2 border-amber-200 bg-gradient-to-br from-sun/20 to-white p-5 shadow-card">
                  <Award className="absolute -right-3 -top-3 h-24 w-24 text-amber-300/40" />
                  <div className="relative">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-amber-600">🏆 ใบรับรอง</p>
                    <h3 className="mt-1 font-display font-bold">{c.courseTitle}</h3>
                    <p className="mt-2 font-mono text-xs text-ink/50">เลขที่ {c.serial} · {c.issuedAtLabel}</p>
                    <a href={c.pdfUrl ?? "#"} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50"><Download className="h-4 w-4" />ดาวน์โหลด PDF</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

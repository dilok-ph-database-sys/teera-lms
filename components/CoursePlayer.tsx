"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, PlayCircle, Lock, FileText, PenLine, Paperclip, ChevronDown,
  ChevronRight, X, ListVideo, AlertCircle, Check, Loader2, RotateCcw,
} from "lucide-react";

/* ---------- types ---------- */
export interface Lesson { id: string; title: string; type: string; durationSec: number; videoUrl?: string | null; videoKind?: string | null; overviewHtml?: string | null; isPreview?: boolean; }
export interface Module { id: string; title: string; lessons: Lesson[]; }
export interface Course { id: string; slug: string; title: string; modules: Module[]; }
interface Props { course: Course; initialLessonId?: string; completedLessonIds: string[]; }

/* ---------- utils ---------- */
const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
function fmt(s: number) { const m = Math.floor(s / 60), ss = String(s % 60).padStart(2, "0"); return `${m}:${ss}`; }
const TYPE_ICON: Record<string, typeof FileText> = { VIDEO: PlayCircle, ARTICLE: FileText, QUIZ: PenLine, FILE: Paperclip };

/* ---------- video ---------- */
function VideoPlayer({ lesson, onEnded }: { lesson: Lesson; onEnded?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || lesson.videoKind !== "hls" || !lesson.videoUrl) return;
    // เบราว์เซอร์ที่รองรับ HLS ในตัว (Safari / iOS) เล่นได้เลย
    if (v.canPlayType("application/vnd.apple.mpegurl")) v.src = lesson.videoUrl;
    // ถ้าต้องรองรับ HLS บนเบราว์เซอร์อื่นด้วย: ติดตั้งเพิ่ม `npm i hls.js`
    // แล้วค่อยเพิ่มโค้ดโหลด hls.js ตรงนี้ (ตอนนี้วิดีโอตัวอย่างเป็น mp4 จึงยังไม่จำเป็น)
  }, [lesson.videoUrl, lesson.videoKind]);

  if (lesson.videoKind === "embed" && lesson.videoUrl)
    return <div className="relative aspect-video w-full bg-black"><iframe src={lesson.videoUrl} title={lesson.title} className="absolute inset-0 h-full w-full" allowFullScreen /></div>;
  if (!lesson.videoUrl)
    return <div className="flex aspect-video w-full items-center justify-center bg-slate-900 text-slate-400"><div className="text-center"><PlayCircle className="mx-auto mb-2 h-12 w-12 opacity-40" /><p className="text-sm">บทเรียนนี้เป็นเนื้อหาแบบอ่าน ดูรายละเอียดด้านล่าง</p></div></div>;
  return <div className="relative aspect-video w-full bg-black"><video ref={ref} className="h-full w-full" controls playsInline preload="metadata" src={lesson.videoKind === "mp4" ? lesson.videoUrl : undefined} onEnded={onEnded}>เบราว์เซอร์ไม่รองรับวิดีโอ</video></div>;
}

/* ---------- tabs ---------- */
function Tabs({ lesson }: { lesson: Lesson }) {
  const [tab, setTab] = useState<"overview" | "resources" | "discussion">("overview");
  const tabs = [{ k: "overview", l: "เนื้อหาบทเรียน" }, { k: "resources", l: "ไฟล์ดาวน์โหลด" }, { k: "discussion", l: "ถาม–ตอบ" }] as const;
  return (
    <section>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cn("relative whitespace-nowrap px-4 py-3 text-sm font-medium", tab === t.k ? "text-orange-600" : "text-slate-500 hover:text-slate-800")}>
            {t.l}{tab === t.k && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-orange-500" />}
          </button>
        ))}
      </div>
      <div className="py-5 text-sm text-slate-600">
        {tab === "overview" && (lesson.overviewHtml ? <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.overviewHtml }} /> : <p className="text-slate-400">ยังไม่มีรายละเอียดสำหรับบทเรียนนี้</p>)}
        {tab === "resources" && <p className="text-slate-400">บทเรียนนี้ยังไม่มีไฟล์ประกอบ (เดโม)</p>}
        {tab === "discussion" && <p className="text-slate-400">ช่องถาม–ตอบ (เดโม) — ต่อ API /comments ในระบบจริง</p>}
      </div>
    </section>
  );
}

/* ---------- main ---------- */
export function CoursePlayer({ course, initialLessonId, completedLessonIds }: Props) {
  const lessons = useMemo(() => course.modules.flatMap((m) => m.lessons), [course]);
  const [currentId, setCurrentId] = useState(initialLessonId ?? lessons[0]?.id);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedLessonIds));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);

  const current = lessons.find((l) => l.id === currentId) ?? lessons[0];
  const idx = lessons.findIndex((l) => l.id === current.id);
  const next = lessons[idx + 1];
  const doneCount = lessons.filter((l) => completed.has(l.id)).length;
  const percent = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  async function toggle(id: string) {
    const wantDone = !completed.has(id);
    setError(null); setSavingId(id);
    setCompleted((p) => { const s = new Set(p); wantDone ? s.add(id) : s.delete(id); return s; });
    try {
      const res = await fetch(`/api/v1/learn/lessons/${id}/progress`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isCompleted: wantDone }),
      });
      if (!res.ok) throw new Error((await res.json())?.error?.message ?? "บันทึกไม่สำเร็จ");
    } catch (e) {
      setCompleted((p) => { const s = new Set(p); wantDone ? s.delete(id) : s.add(id); return s; });
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSavingId(null); }
  }

  function select(id: string) { setCurrentId(id); setDrawer(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">เนื้อหาคอร์ส</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500">เรียนไปแล้ว {doneCount}/{lessons.length} บทเรียน</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-[width] duration-500" style={{ width: `${percent}%` }} /></div>
        </div>
        {onClose && <button onClick={onClose} aria-label="ปิด" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"><X className="h-5 w-5" /></button>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {course.modules.map((m, i) => (
          <div key={m.id} className="border-b border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="font-mono text-xs text-orange-600">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-sm font-semibold">{m.title}</span>
            </div>
            {m.lessons.map((l) => {
              const done = completed.has(l.id); const on = l.id === current.id;
              const Icon = TYPE_ICON[l.type] ?? PlayCircle;
              return (
                <button key={l.id} onClick={() => select(l.id)} className={cn("flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm", on ? "border-orange-500 bg-orange-50 font-medium text-orange-700" : "border-transparent text-slate-700 hover:bg-slate-100")}>
                  <span className="flex-none">{done ? <CheckCircle2 className="h-[18px] w-[18px] text-orange-500" /> : <Icon className="h-[18px] w-[18px] text-slate-400" />}</span>
                  <span className="flex-1 leading-snug">{l.title}</span>
                  <span className="font-mono text-[11px] text-slate-400">{l.type === "QUIZ" ? "ควิซ" : l.durationSec ? fmt(l.durationSec) : "—"}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-orange-600">‹ แดชบอร์ด</Link>
        <div className="min-w-0 flex-1"><p className="truncate text-xs text-slate-500">{course.title}</p><h1 className="truncate text-sm font-semibold">{current.title}</h1></div>
        <button onClick={() => setDrawer(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 lg:hidden"><ListVideo className="h-4 w-4" />สารบัญ</button>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <VideoPlayer lesson={current} onEnded={() => { if (!completed.has(current.id)) toggle(current.id); }} />
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-semibold">{current.title}</h2><p className="mt-1 text-sm text-slate-500">บทเรียนที่ {idx + 1} จาก {lessons.length}</p></div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(current.id)} disabled={savingId === current.id}
                  className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-70", completed.has(current.id) ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50" : "bg-orange-600 text-white hover:bg-orange-700")}>
                  {savingId === current.id ? <Loader2 className="h-4 w-4 animate-spin" /> : completed.has(current.id) ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  {savingId === current.id ? "กำลังบันทึก..." : completed.has(current.id) ? "เรียนจบแล้ว — กดเพื่อยกเลิก" : "ทำเครื่องหมายว่าเรียนจบ"}
                </button>
                {next && <button onClick={() => select(next.id)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">บทถัดไป<ChevronRight className="h-4 w-4" /></button>}
              </div>
            </div>
            {error && <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div>}
            <div className="mt-5"><Tabs lesson={current} /></div>
          </div>
        </main>
        <div className="hidden border-l border-slate-200 lg:block"><div className="sticky top-[57px] h-[calc(100vh-57px)]"><Sidebar /></div></div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm shadow-xl"><Sidebar onClose={() => setDrawer(false)} /></div>
        </div>
      )}
    </div>
  );
}

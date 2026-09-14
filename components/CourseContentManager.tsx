// components/CourseContentManager.tsx — หน้าจัดการบทเรียน (ผู้สอน / ผู้ดูแลระบบ)
//   เลือกคอร์ส → เพิ่มบท → เพิ่มบทเรียนในบท → เรียงลำดับ / แก้ไข / ลบ
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, CheckCircle2, Plus, Pencil, Trash2, X,
  ChevronUp, ChevronDown, Layers, PlayCircle, FileText, Paperclip,
  HelpCircle, Eye, EyeOff, ExternalLink,
} from "lucide-react";

type Lesson = {
  id: string; title: string; type: string;
  videoUrl: string | null; videoKind: string | null; overviewHtml: string | null;
  durationSec: number; position: number; isPreview: boolean;
};
type Module = { id: string; title: string; position: number; lessons: Lesson[] };
type Course = {
  id: string; slug: string; title: string; subtitle: string; category: string;
  icon: string; instructorName: string; level: string; priceCents: number;
  status: string; totalLessons: number; totalHours: number;
  _count: { enrollments: number };
  modules: Module[];
};

const TYPE_TH: Record<string, { label: string; Icon: typeof PlayCircle }> = {
  VIDEO: { label: "วิดีโอ", Icon: PlayCircle },
  ARTICLE: { label: "บทความ", Icon: FileText },
  FILE: { label: "ไฟล์/งานมอบหมาย", Icon: Paperclip },
  QUIZ: { label: "แบบทดสอบ", Icon: HelpCircle },
};

const inputCls =
  "w-full rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-2.5 text-[15px] outline-none transition focus:border-brand focus:bg-white";

const emptyLesson = {
  title: "", type: "VIDEO", videoUrl: "", videoKind: "mp4",
  overviewHtml: "", durationMin: "10", isPreview: false,
};

const mmss = (sec: number) => `${Math.round(sec / 60)} นาที`;

export function CourseContentManager({ staffName, role }: { staffName: string; role: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);

  // ฟอร์มต่าง ๆ
  const [newModule, setNewModule] = useState("");
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [lessonFormFor, setLessonFormFor] = useState<string | null>(null); // moduleId
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLesson);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/teach");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setCourses(json.data.courses);
      setError(null);
      setActiveId((cur) => cur ?? json.data.courses[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(payload: Record<string, unknown>, okText?: string) {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "ทำรายการไม่สำเร็จ");
      await load();
      if (okText) { setToast(okText); setTimeout(() => setToast(null), 3000); }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ทำรายการไม่สำเร็จ");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const active = courses.find((c) => c.id === activeId) ?? null;

  // ── ฟอร์มบทเรียน ──
  function openNewLesson(moduleId: string) {
    setEditLessonId(null);
    setLessonFormFor(moduleId);
    setForm(emptyLesson);
  }
  function openEditLesson(l: Lesson, moduleId: string) {
    setLessonFormFor(moduleId);
    setEditLessonId(l.id);
    setForm({
      title: l.title,
      type: l.type,
      videoUrl: l.videoUrl ?? "",
      videoKind: l.videoKind ?? "mp4",
      overviewHtml: l.overviewHtml ?? "",
      durationMin: String(Math.round(l.durationSec / 60)),
      isPreview: l.isPreview,
    });
  }
  function closeLessonForm() {
    setLessonFormFor(null); setEditLessonId(null); setForm(emptyLesson);
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      type: form.type,
      videoUrl: form.videoUrl,
      videoKind: form.type === "VIDEO" ? form.videoKind : "",
      overviewHtml: form.overviewHtml,
      durationMin: Number(form.durationMin) || 0,
      isPreview: form.isPreview,
    };
    const ok = editLessonId
      ? await run({ action: "lesson.update", id: editLessonId, ...payload }, "บันทึกบทเรียนแล้ว")
      : await run({ action: "lesson.create", moduleId: lessonFormFor, ...payload }, "เพิ่มบทเรียนแล้ว");
    if (ok) closeLessonForm();
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-6xl place-items-center px-5">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-7">
        <p className="flex items-center gap-1.5 text-sm font-bold text-brand">
          <Layers className="h-4 w-4" /> จัดการบทเรียน
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">เนื้อหาคอร์ส</h1>
        <p className="mt-1 text-ink/60">
          {role === "ADMIN"
            ? "คุณเป็นผู้ดูแลระบบ จึงแก้ไขได้ทุกคอร์ส"
            : `แสดงเฉพาะคอร์สที่ระบุชื่อผู้สอนว่า “${staffName}”`}
        </p>
      </header>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 flex-none" />{error}
        </p>
      )}
      {toast && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />{toast}
        </p>
      )}

      {courses.length === 0 ? (
        <div className="grid place-items-center rounded-[28px] bg-white p-14 text-center shadow-card">
          <div className="mb-3 text-5xl">📚</div>
          <p className="font-bold">ยังไม่มีคอร์สที่คุณดูแล</p>
          <p className="mt-1 text-sm text-ink/55">
            {role === "ADMIN"
              ? "ไปสร้างคอร์สที่หน้าตั้งค่าระบบ → แท็บ “วิชาและหมวด” ก่อน"
              : "ให้ผู้ดูแลระบบสร้างคอร์สและระบุชื่อคุณเป็นผู้สอนก่อนครับ"}
          </p>
        </div>
      ) : (
        <>
          {/* เลือกคอร์ส */}
          <div className="mb-6 flex flex-wrap gap-2">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActiveId(c.id); closeLessonForm(); setEditModuleId(null); }}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[15px] font-bold transition ${
                  activeId === c.id ? "bg-brand text-white shadow-soft" : "bg-white text-ink/65 shadow-soft hover:bg-orange-50"
                }`}
              >
                <span>{c.icon}</span>
                <span className="max-w-[220px] truncate">{c.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${activeId === c.id ? "bg-white/25" : "bg-orange-100"}`}>
                  {c.totalLessons}
                </span>
              </button>
            ))}
          </div>

          {active && (
            <>
              {/* สรุปคอร์ส */}
              <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[28px] bg-white p-6 shadow-card">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-100 text-3xl">{active.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-extrabold">{active.title}</p>
                  <p className="mt-0.5 truncate text-sm text-ink/55">
                    {active.category} · {active.instructorName} · {active.modules.length} บท ·{" "}
                    {active.totalLessons} บทเรียน · ผู้เรียน {active._count.enrollments} คน
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/courses/${active.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-ink/70 hover:bg-orange-50"
                  >
                    <ExternalLink className="h-4 w-4" /> ดูหน้าคอร์ส
                  </Link>
                  <button
                    onClick={() =>
                      run(
                        { action: "course.status", id: active.id, status: active.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
                        active.status === "PUBLISHED" ? "ซ่อนคอร์สแล้ว" : "เผยแพร่คอร์สแล้ว",
                      )
                    }
                    disabled={busy}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
                      active.status === "PUBLISHED"
                        ? "border border-orange-200 text-ink/70 hover:bg-orange-50"
                        : "bg-brand text-white shadow-soft hover:bg-brand-dark"
                    }`}
                  >
                    {active.status === "PUBLISHED" ? <><EyeOff className="h-4 w-4" /> ซ่อนคอร์ส</> : <><Eye className="h-4 w-4" /> เผยแพร่</>}
                  </button>
                </div>
              </div>

              {/* เพิ่มบทใหม่ */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newModule.trim()) return;
                  const ok = await run({ action: "module.create", courseId: active.id, title: newModule }, "เพิ่มบทแล้ว");
                  if (ok) setNewModule("");
                }}
                className="mb-6 flex flex-wrap gap-2 rounded-[24px] bg-white p-5 shadow-soft"
              >
                <input
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                  placeholder="ชื่อบทใหม่ เช่น บทที่ 1 — ความรู้พื้นฐาน"
                  className={`${inputCls} min-w-[240px] flex-1`}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" /> เพิ่มบท
                </button>
              </form>

              {/* รายการบท */}
              {active.modules.length === 0 ? (
                <div className="grid place-items-center rounded-[28px] border-2 border-dashed border-orange-200 p-14 text-center">
                  <Layers className="mb-3 h-10 w-10 text-orange-300" />
                  <p className="font-bold">คอร์สนี้ยังไม่มีบทเรียน</p>
                  <p className="mt-1 text-sm text-ink/55">เริ่มจากพิมพ์ชื่อบทในช่องด้านบน แล้วกด “เพิ่มบท”</p>
                </div>
              ) : (
                <div className="grid gap-5">
                  {active.modules.map((m, mi) => (
                    <div key={m.id} className="rounded-[28px] bg-white p-6 shadow-card">
                      {/* หัวบท */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 font-display font-extrabold text-brand">
                          {mi + 1}
                        </span>

                        {editModuleId === m.id ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const ok = await run({ action: "module.update", id: m.id, title: editModuleTitle }, "บันทึกชื่อบทแล้ว");
                              if (ok) setEditModuleId(null);
                            }}
                            className="flex min-w-[240px] flex-1 gap-2"
                          >
                            <input value={editModuleTitle} onChange={(e) => setEditModuleTitle(e.target.value)} className={inputCls} />
                            <button type="submit" disabled={busy} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60">บันทึก</button>
                            <button type="button" onClick={() => setEditModuleId(null)} className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-ink/60">ยกเลิก</button>
                          </form>
                        ) : (
                          <>
                            <p className="min-w-0 flex-1 truncate font-display text-lg font-extrabold">{m.title}</p>
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-brand-dark">
                              {m.lessons.length} บทเรียน
                            </span>
                            <div className="flex gap-1.5">
                              <button onClick={() => run({ action: "module.move", id: m.id, direction: "up" })} disabled={busy || mi === 0}
                                title="เลื่อนขึ้น" className="grid h-9 w-9 place-items-center rounded-xl border border-orange-200 text-ink/60 hover:bg-orange-50 disabled:opacity-30">
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button onClick={() => run({ action: "module.move", id: m.id, direction: "down" })} disabled={busy || mi === active.modules.length - 1}
                                title="เลื่อนลง" className="grid h-9 w-9 place-items-center rounded-xl border border-orange-200 text-ink/60 hover:bg-orange-50 disabled:opacity-30">
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setEditModuleId(m.id); setEditModuleTitle(m.title); }}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-orange-200 text-ink/60 hover:bg-orange-50">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`ลบบท “${m.title}”?\n\nบทเรียนทั้งหมดในบทนี้จะถูกลบไปด้วย`)) {
                                    run({ action: "module.delete", id: m.id }, "ลบบทแล้ว");
                                  }
                                }}
                                disabled={busy}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 disabled:opacity-60">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* บทเรียนในบท */}
                      <ul className="mt-4 grid gap-2">
                        {m.lessons.map((l, li) => {
                          const t = TYPE_TH[l.type] ?? TYPE_TH.VIDEO;
                          const Icon = t.Icon;
                          return (
                            <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-orange-50/50 p-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-soft">
                                <Icon className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">
                                  {li + 1}. {l.title}
                                  {l.isPreview && (
                                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                                      ดูฟรีได้
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-xs text-ink/45">{t.label} · {mmss(l.durationSec)}</p>
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => run({ action: "lesson.move", id: l.id, direction: "up" })} disabled={busy || li === 0}
                                  className="grid h-8 w-8 place-items-center rounded-lg border border-orange-200 bg-white text-ink/60 hover:bg-orange-50 disabled:opacity-30">
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => run({ action: "lesson.move", id: l.id, direction: "down" })} disabled={busy || li === m.lessons.length - 1}
                                  className="grid h-8 w-8 place-items-center rounded-lg border border-orange-200 bg-white text-ink/60 hover:bg-orange-50 disabled:opacity-30">
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => openEditLesson(l, m.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-ink/70 hover:bg-orange-50">
                                  <Pencil className="h-3.5 w-3.5" /> แก้ไข
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`ลบบทเรียน “${l.title}”?`)) run({ action: "lesson.delete", id: l.id }, "ลบบทเรียนแล้ว");
                                  }}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                                  <Trash2 className="h-3.5 w-3.5" /> ลบ
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* ฟอร์มบทเรียน */}
                      {lessonFormFor === m.id ? (
                        <form onSubmit={saveLesson} className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
                          <h4 className="mb-4 font-display text-base font-extrabold">
                            {editLessonId ? "แก้ไขบทเรียน" : `เพิ่มบทเรียนใน “${m.title}”`}
                          </h4>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-sm font-bold text-ink/70">ชื่อบทเรียน *</label>
                              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className={`${inputCls} bg-white`} placeholder="เช่น แนะนำเนื้อหาและวิธีเรียน" />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-bold text-ink/70">ประเภท</label>
                              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${inputCls} bg-white`}>
                                <option value="VIDEO">วิดีโอ</option>
                                <option value="ARTICLE">บทความ</option>
                                <option value="FILE">ไฟล์ / งานมอบหมาย</option>
                                <option value="QUIZ">แบบทดสอบ</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-bold text-ink/70">ความยาว (นาที)</label>
                              <input type="number" min={0} value={form.durationMin}
                                onChange={(e) => setForm({ ...form, durationMin: e.target.value })} className={`${inputCls} bg-white`} />
                            </div>

                            {form.type === "VIDEO" && (
                              <>
                                <div className="sm:col-span-2">
                                  <label className="mb-1.5 block text-sm font-bold text-ink/70">ลิงก์วิดีโอ</label>
                                  <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                                    className={`${inputCls} bg-white`} placeholder="https://.../video.mp4" />
                                  <p className="mt-1 text-xs text-ink/45">วางลิงก์ไฟล์วิดีโอโดยตรง (.mp4) หรือลิงก์ HLS (.m3u8)</p>
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-sm font-bold text-ink/70">ชนิดวิดีโอ</label>
                                  <select value={form.videoKind} onChange={(e) => setForm({ ...form, videoKind: e.target.value })} className={`${inputCls} bg-white`}>
                                    <option value="mp4">ไฟล์ MP4</option>
                                    <option value="hls">สตรีม HLS (.m3u8)</option>
                                    <option value="embed">ฝังจากเว็บอื่น (YouTube ฯลฯ)</option>
                                  </select>
                                </div>
                              </>
                            )}

                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-sm font-bold text-ink/70">คำอธิบาย / เนื้อหา</label>
                              <textarea value={form.overviewHtml} onChange={(e) => setForm({ ...form, overviewHtml: e.target.value })}
                                rows={4} className={`${inputCls} resize-none bg-white`}
                                placeholder="สรุปสั้น ๆ ว่าบทเรียนนี้เรียนอะไร (ใส่แท็ก HTML ง่าย ๆ ได้ เช่น <p> <ul> <b>)" />
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink/70 sm:col-span-2">
                              <input type="checkbox" checked={form.isPreview}
                                onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
                                className="h-4 w-4 rounded border-orange-300 accent-brand" />
                              ให้คนที่ยังไม่ซื้อดูบทเรียนนี้ได้ฟรี (ตัวอย่างคอร์ส)
                            </label>
                          </div>

                          <div className="mt-5 flex gap-2">
                            <button type="submit" disabled={busy}
                              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
                              {busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
                            </button>
                            <button type="button" onClick={closeLessonForm}
                              className="rounded-xl border border-orange-200 bg-white px-6 py-2.5 font-bold text-ink/60 hover:bg-orange-50">
                              ยกเลิก
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => openNewLesson(m.id)}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-orange-200 px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-orange-50">
                          <Plus className="h-4 w-4" /> เพิ่มบทเรียนในบทนี้
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

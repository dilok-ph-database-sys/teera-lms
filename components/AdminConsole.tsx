// components/AdminConsole.tsx — แผงควบคุมของผู้ดูแลระบบ (3 เมนู)
//   1. ผู้สอน            — เพิ่ม / แก้ไข / ลบ
//   2. การเข้าใช้งาน      — ดูว่าใครเข้าระบบเมื่อไหร่ กี่ครั้ง
//   3. วิชาและหมวด        — เพิ่ม / แก้ไข / ลบวิชา และจัดการหมวด
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, Users, Activity, BookOpen,
  Plus, Pencil, Trash2, X, Search, ShieldCheck,
} from "lucide-react";

// ── ชนิดข้อมูล ───────────────────────────────────────────────────────────────
type Person = {
  id: string; fullName: string; email: string; role: string;
  phone: string | null; bio: string | null;
  avatarEmoji: string; avatarUrl: string | null; createdAt: string;
  _count?: { enrollments: number };
};

type Course = {
  id: string; slug: string; title: string; subtitle: string; category: string;
  icon: string; instructorName: string; level: string; priceCents: number;
  status: string; totalLessons: number; totalHours: number;
  _count: { enrollments: number; modules: number };
};

type Event = {
  id: string; method: string; createdAt: string;
  user: { id: string; fullName: string; email: string; role: string; avatarEmoji: string; avatarUrl: string | null };
};

type AdminData = {
  instructors: Person[];
  students: Person[];
  admins: Person[];
  courses: Course[];
  categories: string[];
  activity: Event[];
  summary: Record<string, { count: number; lastAt: string | null }>;
  stats: { instructors: number; students: number; courses: number; categories: number };
};

const ROLE_TH: Record<string, string> = { ADMIN: "ผู้ดูแลระบบ", INSTRUCTOR: "ผู้สอน", STUDENT: "นักเรียน" };
const METHOD_TH: Record<string, string> = { PASSWORD: "รหัสผ่าน", SIGNUP: "สมัครสมาชิก", DEV: "ปุ่มทดสอบ" };

const baht = (cents: number) => (cents === 0 ? "ฟรี" : `฿${(cents / 100).toLocaleString("th-TH")}`);

function thaiDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

/** รูปโปรไฟล์วงกลม — ใช้รูปจริงถ้ามี ไม่งั้นใช้อีโมจิ */
function Avatar({ p, size = "h-10 w-10" }: { p: { avatarEmoji: string; avatarUrl: string | null }; size?: string }) {
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-orange-100 text-lg`}>
      {p.avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
        : p.avatarEmoji}
    </span>
  );
}

const inputCls =
  "w-full rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-2.5 text-[15px] outline-none transition focus:border-brand focus:bg-white";

// ═════════════════════════════════════════════════════════════════════════════
export function AdminConsole({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState<"instructors" | "activity" | "courses">("instructors");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setData(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** ส่งคำสั่งไปที่ API แล้วโหลดข้อมูลใหม่ */
  async function run(payload: Record<string, unknown>, okText: string) {
    setError(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error?.message ?? "ทำรายการไม่สำเร็จ");
      return false;
    }
    await load();
    setToast(okText);
    setTimeout(() => setToast(null), 3000);
    return true;
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-6xl place-items-center px-5">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </main>
    );
  }

  const TABS = [
    { key: "instructors", label: "ผู้สอน", icon: Users, count: data?.stats.instructors },
    { key: "activity", label: "การเข้าใช้งาน", icon: Activity, count: data?.activity.length },
    { key: "courses", label: "วิชาและหมวด", icon: BookOpen, count: data?.stats.courses },
  ] as const;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      {/* หัวหน้า */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-brand">
            <ShieldCheck className="h-4 w-4" /> ผู้ดูแลระบบ
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">ตั้งค่าระบบ</h1>
          <p className="mt-1 text-ink/60">สวัสดี {adminName} — จัดการผู้สอน ตรวจการเข้าใช้งาน และดูแลวิชาได้ที่นี่</p>
        </div>
        <div className="flex gap-3 text-center">
          {[
            { n: data?.stats.instructors ?? 0, l: "ผู้สอน" },
            { n: data?.stats.students ?? 0, l: "นักเรียน" },
            { n: data?.stats.courses ?? 0, l: "วิชา" },
            { n: data?.stats.categories ?? 0, l: "หมวด" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white px-5 py-3 shadow-soft">
              <p className="font-display text-2xl font-extrabold text-brand">{s.n}</p>
              <p className="text-xs text-ink/55">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* แท็บ */}
      <div className="mt-7 flex flex-wrap gap-2 border-b border-orange-100 pb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-t-2xl px-5 py-3 text-[15px] font-bold transition ${
                active ? "bg-white text-brand shadow-soft" : "text-ink/55 hover:bg-orange-100/60"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
              {typeof t.count === "number" && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-orange-100" : "bg-orange-100/70"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ข้อความแจ้งผล */}
      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 flex-none" />{error}
        </p>
      )}
      {toast && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />{toast}
        </p>
      )}

      <div className="mt-6">
        {tab === "instructors" && <InstructorsTab data={data!} run={run} />}
        {tab === "activity" && <ActivityTab data={data!} />}
        {tab === "courses" && <CoursesTab data={data!} run={run} />}
      </div>
    </main>
  );
}

type RunFn = (payload: Record<string, unknown>, okText: string) => Promise<boolean>;

// ═════════════════════════════════════════════════════════════════════════════
// 1) ผู้สอน
// ═════════════════════════════════════════════════════════════════════════════
function InstructorsTab({ data, run }: { data: AdminData; run: RunFn }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", bio: "" });
  const [edit, setEdit] = useState({ fullName: "", phone: "", bio: "", newPassword: "" });

  function openEdit(p: Person) {
    setEditing(p);
    setEdit({ fullName: p.fullName, phone: p.phone ?? "", bio: p.bio ?? "", newPassword: "" });
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await run({ action: "instructor.create", ...form }, "เพิ่มผู้สอนเรียบร้อยแล้ว");
    setBusy(false);
    if (ok) { setAdding(false); setForm({ fullName: "", email: "", password: "", phone: "", bio: "" }); }
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    const ok = await run({ action: "instructor.update", id: editing.id, ...edit }, "บันทึกข้อมูลผู้สอนแล้ว");
    setBusy(false);
    if (ok) setEditing(null);
  }

  async function remove(p: Person) {
    if (!window.confirm(`ลบผู้สอน “${p.fullName}” ออกจากระบบ?\n\nข้อมูลบัญชีนี้จะถูกลบถาวร กู้คืนไม่ได้`)) return;
    setBusy(true);
    await run({ action: "instructor.delete", id: p.id }, "ลบผู้สอนเรียบร้อยแล้ว");
    setBusy(false);
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">รายชื่อผู้สอน</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {adding ? "ยกเลิก" : "เพิ่มผู้สอน"}
        </button>
      </div>

      {/* ฟอร์มเพิ่ม */}
      {adding && (
        <form onSubmit={create} className="mb-5 rounded-[24px] bg-white p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-extrabold">เพิ่มผู้สอนใหม่</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">ชื่อ–นามสกุล *</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} placeholder="เช่น อ.สมชาย วงศ์" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">อีเมล *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="teacher@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">รหัสผ่านเริ่มต้น *</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="อย่างน้อย 8 ตัวอักษร" />
              <p className="mt-1 text-xs text-ink/45">แจ้งรหัสนี้ให้ผู้สอน แล้วให้เขาเปลี่ยนเองที่หน้าข้อมูลส่วนตัว</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">เบอร์โทร</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="081-234-5678" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-bold text-ink/70">ประวัติ / ความถนัด</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={300} className={`${inputCls} resize-none`} placeholder="เช่น สอนคณิตศาสตร์ ม.ปลาย ประสบการณ์ 10 ปี" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึกผู้สอน
          </button>
        </form>
      )}

      {/* รายการ */}
      {data.instructors.length === 0 ? (
        <EmptyBox text="ยังไม่มีผู้สอนในระบบ — กดปุ่ม “เพิ่มผู้สอน” เพื่อเริ่มต้น" />
      ) : (
        <div className="grid gap-3">
          {data.instructors.map((p) => (
            <div key={p.id} className="rounded-[24px] bg-white p-5 shadow-soft">
              {editing?.id === p.id ? (
                <form onSubmit={update}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-ink/70">ชื่อ–นามสกุล</label>
                      <input value={edit.fullName} onChange={(e) => setEdit({ ...edit, fullName: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-ink/70">เบอร์โทร</label>
                      <input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-bold text-ink/70">ประวัติ / ความถนัด</label>
                      <textarea value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} rows={3} maxLength={300} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-bold text-ink/70">ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
                      <input value={edit.newPassword} onChange={(e) => setEdit({ ...edit, newPassword: e.target.value })} className={inputCls} placeholder="อย่างน้อย 8 ตัวอักษร" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-orange-200 px-5 py-2 font-bold text-ink/60 hover:bg-orange-50">
                      ยกเลิก
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar p={p} size="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.fullName}</p>
                    <p className="truncate text-sm text-ink/55">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
                    {p.bio && <p className="mt-1 line-clamp-2 text-sm text-ink/50">{p.bio}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-ink/70 hover:bg-orange-50">
                      <Pencil className="h-4 w-4" /> แก้ไข
                    </button>
                    <button onClick={() => remove(p)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                      <Trash2 className="h-4 w-4" /> ลบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 2) การเข้าใช้งาน
// ═════════════════════════════════════════════════════════════════════════════
function ActivityTab({ data }: { data: AdminData }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"ALL" | "INSTRUCTOR" | "STUDENT">("ALL");

  const people = [...data.instructors, ...data.students];
  const filtered = people.filter((p) => {
    if (role !== "ALL" && p.role !== role) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return p.fullName.toLowerCase().includes(s) || p.email.toLowerCase().includes(s);
  });

  const events = data.activity.filter((e) => role === "ALL" || e.user.role === role);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* สรุปรายคน */}
      <div>
        <h2 className="mb-4 font-display text-xl font-extrabold">สรุปรายคน</h2>

        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-300" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" className={`${inputCls} pl-10`} />
          </div>
          {(["ALL", "INSTRUCTOR", "STUDENT"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                role === r ? "bg-brand text-white shadow-soft" : "border border-orange-200 text-ink/60 hover:bg-orange-50"
              }`}
            >
              {r === "ALL" ? "ทั้งหมด" : ROLE_TH[r]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyBox text="ไม่พบผู้ใช้ที่ค้นหา" />
        ) : (
          <div className="overflow-hidden rounded-[24px] bg-white shadow-soft">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-orange-50 text-left text-xs text-ink/60">
                  <tr>
                    <th className="px-4 py-3 font-bold">ผู้ใช้</th>
                    <th className="px-4 py-3 font-bold">บทบาท</th>
                    <th className="px-4 py-3 text-right font-bold">เข้าระบบ</th>
                    <th className="px-4 py-3 font-bold">ล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const s = data.summary[p.id];
                    return (
                      <tr key={p.id} className="border-t border-orange-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar p={p} size="h-8 w-8" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{p.fullName}</p>
                              <p className="truncate text-xs text-ink/45">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-brand-dark">
                            {ROLE_TH[p.role] ?? p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{s?.count ?? 0} ครั้ง</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink/60">{thaiDateTime(s?.lastAt ?? null)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ประวัติล่าสุด */}
      <div>
        <h2 className="mb-4 font-display text-xl font-extrabold">ประวัติการเข้าใช้ล่าสุด</h2>
        {events.length === 0 ? (
          <EmptyBox text="ยังไม่มีบันทึกการเข้าใช้งาน — ลองให้ผู้ใช้เข้าสู่ระบบสักครั้ง" />
        ) : (
          <div className="max-h-[600px] overflow-y-auto rounded-[24px] bg-white p-2 shadow-soft">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-orange-50/60">
                <Avatar p={e.user} size="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {e.user.fullName}
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                      {ROLE_TH[e.user.role] ?? e.user.role}
                    </span>
                  </p>
                  <p className="truncate text-xs text-ink/45">
                    เข้าระบบด้วย {METHOD_TH[e.method] ?? e.method}
                  </p>
                </div>
                <p className="whitespace-nowrap text-xs text-ink/50">{thaiDateTime(e.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 3) วิชาและหมวด
// ═════════════════════════════════════════════════════════════════════════════
function CoursesTab({ data, run }: { data: AdminData; run: RunFn }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: "", subtitle: "", category: "", instructorName: "", icon: "📘", level: "ระดับต้น", priceBaht: "0",
  });
  const [edit, setEdit] = useState({ title: "", category: "", instructorName: "", priceBaht: "0", status: "PUBLISHED" });

  function openEdit(c: Course) {
    setEditingId(c.id);
    setEdit({
      title: c.title, category: c.category, instructorName: c.instructorName,
      priceBaht: String(Math.round(c.priceCents / 100)), status: c.status,
    });
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await run(
      { action: "course.create", ...form, priceBaht: Number(form.priceBaht) || 0 },
      "เพิ่มวิชาเรียบร้อยแล้ว",
    );
    setBusy(false);
    if (ok) { setAdding(false); setForm({ title: "", subtitle: "", category: "", instructorName: "", icon: "📘", level: "ระดับต้น", priceBaht: "0" }); }
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    const ok = await run(
      { action: "course.update", id: editingId, ...edit, priceBaht: Number(edit.priceBaht) || 0 },
      "บันทึกวิชาแล้ว",
    );
    setBusy(false);
    if (ok) setEditingId(null);
  }

  async function remove(c: Course) {
    if (!window.confirm(`ลบวิชา “${c.title}”?\n\nบทเรียนและข้อมูลการลงทะเบียนของวิชานี้จะถูกลบไปด้วย กู้คืนไม่ได้`)) return;
    setBusy(true);
    await run({ action: "course.delete", id: c.id }, "ลบวิชาเรียบร้อยแล้ว");
    setBusy(false);
  }

  async function renameCategory(name: string) {
    const to = window.prompt(`เปลี่ยนชื่อหมวด “${name}” เป็น:`, name);
    if (!to || to.trim() === name) return;
    setBusy(true);
    await run({ action: "category.rename", from: name, to: to.trim() }, "เปลี่ยนชื่อหมวดแล้ว");
    setBusy(false);
  }

  async function deleteCategory(name: string) {
    if (!window.confirm(`ลบหมวด “${name}”?\n\nวิชาในหมวดนี้จะถูกย้ายไปหมวด “ทั่วไป” (ไม่ถูกลบทิ้ง)`)) return;
    setBusy(true);
    await run({ action: "category.delete", name }, "ลบหมวดแล้ว — ย้ายวิชาไปหมวดทั่วไป");
    setBusy(false);
  }

  // จัดกลุ่มวิชาตามหมวด
  const byCategory = data.courses.reduce<Record<string, Course[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">วิชาทั้งหมด</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {adding ? "ยกเลิก" : "เพิ่มวิชา"}
        </button>
      </div>

      {/* ฟอร์มเพิ่มวิชา */}
      {adding && (
        <form onSubmit={create} className="mb-5 rounded-[24px] bg-white p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-extrabold">เพิ่มวิชาใหม่</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-bold text-ink/70">ชื่อวิชา *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="เช่น คณิตศาสตร์ ม.4 เทอม 1" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-bold text-ink/70">คำอธิบายสั้น ๆ</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} placeholder="เรียนอะไรบ้างในวิชานี้" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">หมวดวิชา *</label>
              <input list="cat-list" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="เช่น คณิตศาสตร์" />
              <datalist id="cat-list">
                {data.categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <p className="mt-1 text-xs text-ink/45">พิมพ์ชื่อใหม่ได้เลย หรือเลือกจากหมวดที่มีอยู่</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">ผู้สอน *</label>
              <input list="teacher-list" value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} className={inputCls} placeholder="ชื่อผู้สอน" />
              <datalist id="teacher-list">
                {data.instructors.map((t) => <option key={t.id} value={t.fullName} />)}
              </datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">ไอคอน</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputCls} placeholder="📘" maxLength={4} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink/70">ราคา (บาท) — ใส่ 0 = ฟรี</label>
              <input type="number" min={0} value={form.priceBaht} onChange={(e) => setForm({ ...form, priceBaht: e.target.value })} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึกวิชา
          </button>
        </form>
      )}

      {/* หมวดวิชา */}
      <div className="mb-6 rounded-[24px] bg-white p-5 shadow-soft">
        <h3 className="mb-3 font-display text-lg font-extrabold">หมวดวิชา</h3>
        {data.categories.length === 0 ? (
          <p className="text-sm text-ink/50">ยังไม่มีหมวด — หมวดจะถูกสร้างอัตโนมัติเมื่อเพิ่มวิชา</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.categories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 py-1.5 pl-4 pr-2 text-sm font-bold">
                {c}
                <span className="text-xs font-normal text-ink/45">({byCategory[c]?.length ?? 0})</span>
                <button onClick={() => renameCategory(c)} title="เปลี่ยนชื่อหมวด" className="grid h-6 w-6 place-items-center rounded-full hover:bg-orange-200">
                  <Pencil className="h-3 w-3" />
                </button>
                {c !== "ทั่วไป" && (
                  <button onClick={() => deleteCategory(c)} title="ลบหมวด" className="grid h-6 w-6 place-items-center rounded-full text-rose-500 hover:bg-rose-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* รายการวิชา แยกตามหมวด */}
      {data.courses.length === 0 ? (
        <EmptyBox text="ยังไม่มีวิชาในระบบ — กดปุ่ม “เพิ่มวิชา” เพื่อเริ่มต้น" />
      ) : (
        Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat} className="mb-6">
            <h3 className="mb-2.5 flex items-center gap-2 font-display text-lg font-extrabold">
              <span className="h-2 w-2 rounded-full bg-brand" /> {cat}
              <span className="text-sm font-normal text-ink/45">({list.length} วิชา)</span>
            </h3>
            <div className="grid gap-3">
              {list.map((c) => (
                <div key={c.id} className="rounded-[24px] bg-white p-5 shadow-soft">
                  {editingId === c.id ? (
                    <form onSubmit={update}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-sm font-bold text-ink/70">ชื่อวิชา</label>
                          <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-bold text-ink/70">หมวดวิชา</label>
                          <input list="cat-list" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-bold text-ink/70">ผู้สอน</label>
                          <input list="teacher-list" value={edit.instructorName} onChange={(e) => setEdit({ ...edit, instructorName: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-bold text-ink/70">ราคา (บาท)</label>
                          <input type="number" min={0} value={edit.priceBaht} onChange={(e) => setEdit({ ...edit, priceBaht: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-bold text-ink/70">สถานะ</label>
                          <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={inputCls}>
                            <option value="PUBLISHED">เผยแพร่ (คนเห็นได้)</option>
                            <option value="DRAFT">ฉบับร่าง (ซ่อนไว้)</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
                          {busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-orange-200 px-5 py-2 font-bold text-ink/60 hover:bg-orange-50">
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-100 text-2xl">{c.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">
                          {c.title}
                          {c.status === "DRAFT" && (
                            <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-bold text-ink/60">ฉบับร่าง</span>
                          )}
                        </p>
                        <p className="truncate text-sm text-ink/55">
                          {c.instructorName} · {baht(c.priceCents)} · {c._count.modules} บท · ผู้เรียน {c._count.enrollments} คน
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-ink/70 hover:bg-orange-50">
                          <Pencil className="h-4 w-4" /> แก้ไข
                        </button>
                        <button onClick={() => remove(c)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                          <Trash2 className="h-4 w-4" /> ลบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-[24px] bg-white p-12 text-center shadow-soft">
      <p className="text-ink/50">{text}</p>
    </div>
  );
}

// components/StaffDashboard.tsx — แดชบอร์ดของผู้สอน และผู้ดูแลระบบ
//   • ป้ายสถิติ 3 ช่อง เปลี่ยนข้อความ/ไอคอนตามบทบาท
//   • ตารางงานรายวัน เพิ่ม–แก้ไข–ลบ–ติ๊กเสร็จ ได้เอง
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, AlertCircle, Plus, Pencil, Trash2, X, Check,
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin,
  Presentation, GraduationCap, ClipboardList, CheckCircle2,
} from "lucide-react";

type Item = {
  id: string; date: string; startTime: string; endTime: string;
  title: string; place: string | null; note: string | null; status: string;
};

type Role = "INSTRUCTOR" | "ADMIN";

/** ข้อความและไอคอนของแต่ละบทบาท */
const COPY = {
  INSTRUCTOR: {
    subtitle: "ดูคิวสอนของวันนี้ และจัดตารางสอนของคุณได้ที่นี่",
    tiles: [
      { key: "pending", label: "กำลังสอน", Icon: Presentation, tone: "bg-brand/15 text-brand" },
      { key: "done", label: "สอนจบ", Icon: GraduationCap, tone: "bg-sky/20 text-sky-600" },
      { key: "today", label: "คิวการสอนของวันนี้", Icon: CalendarDays, tone: "bg-sun/25 text-amber-600" },
    ],
    boardTitle: "ตารางสอนรายวัน",
    addLabel: "เพิ่มคาบสอน",
    itemName: "คาบสอน",
    emptyText: "วันนี้ยังไม่มีคาบสอน — กดปุ่ม “เพิ่มคาบสอน” เพื่อจัดตารางได้เลย",
    titlePlaceholder: "เช่น คณิตศาสตร์ ม.4 — บทที่ 3",
  },
  ADMIN: {
    subtitle: "ดูคิวปฏิบัติงานของวันนี้ และจัดตารางงานของคุณได้ที่นี่",
    tiles: [
      { key: "pending", label: "รอปฏิบัติงาน", Icon: ClipboardList, tone: "bg-brand/15 text-brand" },
      { key: "done", label: "ปฏิบัติงานจบ", Icon: CheckCircle2, tone: "bg-sky/20 text-sky-600" },
      { key: "today", label: "คิวการปฏิบัติงานของวันนี้", Icon: CalendarDays, tone: "bg-sun/25 text-amber-600" },
    ],
    boardTitle: "ตารางปฏิบัติงานรายวัน",
    addLabel: "เพิ่มงาน",
    itemName: "งาน",
    emptyText: "วันนี้ยังไม่มีงานในตาราง — กดปุ่ม “เพิ่มงาน” เพื่อจัดตารางได้เลย",
    titlePlaceholder: "เช่น ตรวจสอบรายชื่อผู้สมัครใหม่",
  },
} as const;

const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

/** วันที่วันนี้ในรูปแบบ YYYY-MM-DD (อิงเวลาเครื่องผู้ใช้) */
function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function shiftDate(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function thaiDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const emptyForm = { startTime: "09:00", endTime: "10:00", title: "", place: "", note: "" };

const inputCls =
  "w-full rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-2.5 text-[15px] outline-none transition focus:border-brand focus:bg-white";

export function StaffDashboard({ staffName, role }: { staffName: string; role: Role }) {
  const copy = COPY[role];

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [day, setDay] = useState(todayStr());
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "โหลดตารางไม่สำเร็จ");
      setItems(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดตารางไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send(method: "POST" | "PATCH", body: Record<string, unknown>) {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/schedule", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "บันทึกไม่สำเร็จ");
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const ok = await send("POST", { date: day, ...form });
    if (ok) { setAdding(false); setForm(emptyForm); }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const ok = await send("PATCH", { id: editingId, date: day, ...form });
    if (ok) { setEditingId(null); setForm(emptyForm); }
  }

  async function toggleDone(it: Item) {
    await send("PATCH", { id: it.id, status: it.status === "DONE" ? "PENDING" : "DONE" });
  }

  async function remove(it: Item) {
    if (!window.confirm(`ลบ${copy.itemName} “${it.title}” ออกจากตาราง?`)) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/schedule?id=${encodeURIComponent(it.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "ลบไม่สำเร็จ");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(it: Item) {
    setAdding(false);
    setEditingId(it.id);
    setForm({
      startTime: it.startTime, endTime: it.endTime, title: it.title,
      place: it.place ?? "", note: it.note ?? "",
    });
  }

  // ── ตัวเลขในป้ายสถิติ ──
  const today = todayStr();
  const counts = {
    pending: items.filter((i) => i.status === "PENDING").length,
    done: items.filter((i) => i.status === "DONE").length,
    today: items.filter((i) => i.date === today).length,
  };

  const dayItems = items
    .filter((i) => i.date === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 bg-sun opacity-30 blur-sm" style={blob} />

      <div className="relative mx-auto max-w-6xl px-5 py-10">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-wider text-brand">แดชบอร์ดของฉัน</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">สวัสดี {staffName} 👋</h1>
          <p className="mt-1 text-ink/60">{copy.subtitle}</p>
        </header>

        {/* ── ป้ายสถิติ 3 ช่อง ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {copy.tiles.map((t) => {
            const Icon = t.Icon;
            return (
              <div key={t.key} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${t.tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-2xl font-extrabold leading-none">
                    {loading ? "–" : counts[t.key as keyof typeof counts]}
                  </p>
                  <p className="mt-1 text-sm text-ink/55">{t.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── ตารางรายวัน ── */}
        <section className="mt-8 rounded-[28px] bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
              <CalendarDays className="h-5 w-5 text-brand" /> {copy.boardTitle}
            </h2>
            <button
              onClick={() => { setAdding((v) => !v); setEditingId(null); setForm(emptyForm); }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-bold text-white shadow-soft transition hover:bg-brand-dark"
            >
              {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {adding ? "ยกเลิก" : copy.addLabel}
            </button>
          </div>

          {/* เลือกวัน */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={() => setDay(shiftDate(day, -1))} aria-label="วันก่อนหน้า"
              className="grid h-10 w-10 place-items-center rounded-xl border border-orange-200 text-ink/60 hover:bg-orange-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value || todayStr())}
              className="rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-2.5 text-[15px] outline-none focus:border-brand focus:bg-white" />
            <button onClick={() => setDay(shiftDate(day, 1))} aria-label="วันถัดไป"
              className="grid h-10 w-10 place-items-center rounded-xl border border-orange-200 text-ink/60 hover:bg-orange-50">
              <ChevronRight className="h-5 w-5" />
            </button>
            {day !== today && (
              <button onClick={() => setDay(today)}
                className="rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-ink/60 hover:bg-orange-50">
                กลับมาวันนี้
              </button>
            )}
            <span className="ml-1 text-sm font-bold text-ink/70">{thaiDate(day)}</span>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 flex-none" />{error}
            </p>
          )}

          {/* ฟอร์มเพิ่ม / แก้ไข */}
          {(adding || editingId) && (
            <form onSubmit={editingId ? saveEdit : create} className="mt-5 rounded-3xl bg-orange-50/60 p-5">
              <h3 className="mb-4 font-display text-lg font-extrabold">
                {editingId ? `แก้ไข${copy.itemName}` : copy.addLabel}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-ink/70">ชื่อรายการ *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`${inputCls} bg-white`} placeholder={copy.titlePlaceholder} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink/70">เวลาเริ่ม</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={`${inputCls} bg-white`} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink/70">เวลาสิ้นสุด</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={`${inputCls} bg-white`} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink/70">สถานที่ / ห้อง</label>
                  <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className={`${inputCls} bg-white`} placeholder="เช่น ห้อง 201 หรือ ออนไลน์" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink/70">บันทึกเพิ่มเติม</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${inputCls} bg-white`} placeholder="รายละเอียดสั้น ๆ" />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button type="submit" disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
                </button>
                <button type="button" onClick={() => { setAdding(false); setEditingId(null); setForm(emptyForm); }}
                  className="rounded-xl border border-orange-200 bg-white px-6 py-2.5 font-bold text-ink/60 hover:bg-orange-50">
                  ยกเลิก
                </button>
              </div>
            </form>
          )}

          {/* รายการของวันที่เลือก */}
          <div className="mt-6">
            {loading ? (
              <div className="grid place-items-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand" /></div>
            ) : dayItems.length === 0 ? (
              <div className="grid place-items-center rounded-3xl border-2 border-dashed border-orange-200 py-14 text-center">
                <CalendarDays className="mb-3 h-10 w-10 text-orange-300" />
                <p className="text-ink/50">{copy.emptyText}</p>
              </div>
            ) : (
              <ul className="grid gap-3">
                {dayItems.map((it) => {
                  const done = it.status === "DONE";
                  return (
                    <li key={it.id}
                      className={`flex flex-wrap items-center gap-4 rounded-3xl border p-4 transition ${
                        done ? "border-green-200 bg-green-50/60" : "border-orange-100 bg-orange-50/40"
                      }`}>
                      {/* ปุ่มติ๊กเสร็จ */}
                      <button
                        onClick={() => toggleDone(it)}
                        disabled={busy}
                        title={done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition ${
                          done ? "border-green-400 bg-green-400 text-white" : "border-orange-300 text-transparent hover:border-brand hover:text-orange-200"
                        }`}
                      >
                        <Check className="h-5 w-5" />
                      </button>

                      {/* เวลา */}
                      <div className="w-[92px] shrink-0 text-center">
                        <p className="font-display text-lg font-extrabold leading-tight">{it.startTime}</p>
                        <p className="text-xs text-ink/45">ถึง {it.endTime}</p>
                      </div>

                      {/* รายละเอียด */}
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-bold ${done ? "text-ink/45 line-through" : ""}`}>{it.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/55">
                          {it.place && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{it.place}</span>}
                          {it.note && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{it.note}</span>}
                        </p>
                      </div>

                      {/* ปุ่มจัดการ */}
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(it)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-ink/70 hover:bg-orange-50">
                          <Pencil className="h-4 w-4" /> แก้ไข
                        </button>
                        <button onClick={() => remove(it)} disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                          <Trash2 className="h-4 w-4" /> ลบ
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

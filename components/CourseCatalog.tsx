// components/CourseCatalog.tsx — รายการคอร์ส พร้อมค้นหา / กรองหมวด / กรองราคา / เรียงลำดับ
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, SlidersHorizontal } from "lucide-react";

export type CatalogCourse = {
  id: string; slug: string; title: string; subtitle: string; category: string;
  icon: string; gradient: string; instructorName: string; level: string;
  priceCents: number; ratingAvg: number; ratingCount: number;
  studentCount: number; totalLessons: number; totalHours: number;
};

const baht = (c: number) => (c / 100).toLocaleString("th-TH");

type Price = "ALL" | "FREE" | "PAID";
type Sort = "POPULAR" | "RATING" | "PRICE_LOW" | "PRICE_HIGH" | "NEWEST";

const SORTS: { key: Sort; label: string }[] = [
  { key: "POPULAR", label: "ยอดนิยม" },
  { key: "RATING", label: "คะแนนสูงสุด" },
  { key: "PRICE_LOW", label: "ราคาน้อย→มาก" },
  { key: "PRICE_HIGH", label: "ราคามาก→น้อย" },
  { key: "NEWEST", label: "มาใหม่" },
];

export function CourseCatalog({ courses }: { courses: CatalogCourse[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [price, setPrice] = useState<Price>("ALL");
  const [sort, setSort] = useState<Sort>("POPULAR");

  // รายการหมวดและระดับ — ดึงจากคอร์สจริงที่มีอยู่
  const categories = useMemo(
    () => Array.from(new Set(courses.map((c) => c.category))).sort(),
    [courses],
  );
  const levels = useMemo(
    () => Array.from(new Set(courses.map((c) => c.level))).sort(),
    [courses],
  );

  // จำนวนคอร์สในแต่ละหมวด (แสดงข้างชื่อหมวด)
  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of courses) m[c.category] = (m[c.category] ?? 0) + 1;
    return m;
  }, [courses]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = courses.filter((c) => {
      if (category !== "ALL" && c.category !== category) return false;
      if (level !== "ALL" && c.level !== level) return false;
      if (price === "FREE" && c.priceCents !== 0) return false;
      if (price === "PAID" && c.priceCents === 0) return false;
      if (!t) return true;
      return (
        c.title.toLowerCase().includes(t) ||
        c.subtitle.toLowerCase().includes(t) ||
        c.instructorName.toLowerCase().includes(t) ||
        c.category.toLowerCase().includes(t)
      );
    });

    const sorted = [...list];
    switch (sort) {
      case "RATING": sorted.sort((a, b) => b.ratingAvg - a.ratingAvg); break;
      case "PRICE_LOW": sorted.sort((a, b) => a.priceCents - b.priceCents); break;
      case "PRICE_HIGH": sorted.sort((a, b) => b.priceCents - a.priceCents); break;
      case "NEWEST": sorted.reverse(); break;
      default: sorted.sort((a, b) => b.studentCount - a.studentCount);
    }
    return sorted;
  }, [courses, q, category, level, price, sort]);

  const filtering = q !== "" || category !== "ALL" || level !== "ALL" || price !== "ALL";

  function clearAll() {
    setQ(""); setCategory("ALL"); setLevel("ALL"); setPrice("ALL"); setSort("POPULAR");
  }

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      active ? "bg-brand text-white shadow-soft" : "bg-white text-ink/60 shadow-soft hover:bg-orange-50"
    }`;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-4 pt-6">
      {/* ── ช่องค้นหา ── */}
      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่อคอร์ส ชื่อผู้สอน หรือหมวดวิชา"
            className="w-full rounded-full border border-orange-200 bg-white py-4 pl-14 pr-12 text-[15px] shadow-card outline-none transition focus:border-brand"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="ล้างคำค้นหา"
              className="absolute right-4 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink/40 hover:bg-orange-100 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── หมวดวิชา ── */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={() => setCategory("ALL")} className={chip(category === "ALL")}>
          ทุกหมวด <span className="opacity-60">({courses.length})</span>
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>
            {c} <span className="opacity-60">({countByCategory[c]})</span>
          </button>
        ))}
      </div>

      {/* ── ตัวกรองย่อย ── */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-[24px] bg-white/70 p-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink/45">
          <SlidersHorizontal className="h-4 w-4" /> ตัวกรอง
        </span>

        {/* ราคา */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink/55">ราคา</span>
          {([
            ["ALL", "ทั้งหมด"], ["FREE", "ฟรี"], ["PAID", "มีค่าใช้จ่าย"],
          ] as [Price, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPrice(k)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                price === k ? "bg-brand/15 text-brand" : "text-ink/55 hover:bg-orange-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ระดับ */}
        {levels.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-ink/55">
            ระดับ
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
            >
              <option value="ALL">ทุกระดับ</option>
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        )}

        {/* เรียงลำดับ */}
        <label className="flex items-center gap-2 text-sm text-ink/55">
          เรียงตาม
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>

        {filtering && (
          <button onClick={clearAll} className="rounded-xl px-3 py-1.5 text-sm font-bold text-brand hover:bg-orange-50">
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* ── จำนวนผลลัพธ์ ── */}
      <p className="mt-5 text-center text-sm text-ink/50">
        {filtering ? <>พบ <b className="text-ink">{shown.length}</b> คอร์ส จากทั้งหมด {courses.length} คอร์ส</>
                   : <>ทั้งหมด <b className="text-ink">{courses.length}</b> คอร์ส</>}
      </p>

      {/* ── กริดคอร์ส ── */}
      {shown.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-[28px] bg-white p-14 text-center shadow-card">
          <div className="mb-3 text-5xl">🔍</div>
          <p className="font-display text-lg font-bold">ไม่พบคอร์สที่ค้นหา</p>
          <p className="mt-1 text-sm text-ink/55">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดอื่นดูนะครับ</p>
          <button onClick={clearAll} className="mt-5 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark">
            ดูคอร์สทั้งหมด
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
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
                <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold backdrop-blur">
                  {c.category}
                </span>
              </div>
              <div className="p-5">
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">{c.level}</span>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-brand-dark">{c.title}</h3>
                <p className="mt-2 text-sm text-ink/60">👨‍🏫 {c.instructorName}</p>
                <p className="mt-1 text-xs text-ink/45">
                  {c.totalLessons} บทเรียน · {c.totalHours} ชั่วโมง
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-orange-100 pt-3">
                  <span className="text-sm font-semibold text-amber-500">
                    ★ {c.ratingAvg} <span className="text-ink/40">({c.ratingCount})</span>
                  </span>
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
      )}
    </section>
  );
}

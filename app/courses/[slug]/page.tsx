// components/CourseReviews.tsx — ส่วนรีวิวและให้ดาวของคอร์ส
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Star, Trash2, MessageSquare } from "lucide-react";

type Review = {
  id: string; rating: number; comment: string | null;
  createdAt: string; updatedAt: string;
  user: { id: string; fullName: string; avatarEmoji: string; avatarUrl: string | null };
};

type Data = {
  reviews: Review[];
  breakdown: Record<string, number>;
  average: number;
  count: number;
  mine: Review | null;
  canReview: boolean;
  isAuthenticated: boolean;
};

function thaiDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

/** แถวดาว — ใช้ทั้งแบบอ่านอย่างเดียวและแบบกดเลือก */
function Stars({
  value, size = "h-5 w-5", onPick,
}: { value: number; size?: string; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const cls = `${size} ${filled ? "fill-amber-400 text-amber-400" : "text-orange-200"}`;
        return onPick ? (
          <button key={n} type="button" onClick={() => onPick(n)} aria-label={`${n} ดาว`} className="transition hover:scale-110">
            <Star className={cls} />
          </button>
        ) : (
          <Star key={n} className={cls} />
        );
      })}
    </span>
  );
}

export function CourseReviews({ courseId }: { courseId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/reviews?courseId=${encodeURIComponent(courseId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "โหลดรีวิวไม่สำเร็จ");
      setData(json.data);
      if (json.data.mine) {
        setRating(json.data.mine.rating);
        setComment(json.data.mine.comment ?? "");
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดรีวิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "บันทึกรีวิวไม่สำเร็จ");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกรีวิวไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeMine() {
    if (!window.confirm("ลบรีวิวของคุณออกจากคอร์สนี้?")) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/reviews?courseId=${encodeURIComponent(courseId)}`, { method: "DELETE" });
      setRating(5); setComment("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid place-items-center rounded-[28px] bg-white p-12 shadow-card">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      </section>
    );
  }
  if (!data) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
        <MessageSquare className="h-6 w-6 text-brand" /> รีวิวจากผู้เรียน
      </h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* สรุปคะแนน */}
        <div className="rounded-[28px] bg-white p-6 text-center shadow-card">
          <p className="font-display text-5xl font-extrabold text-brand">{data.average || "–"}</p>
          <div className="mt-2 flex justify-center"><Stars value={data.average} /></div>
          <p className="mt-2 text-sm text-ink/55">จาก {data.count} รีวิว</p>

          <div className="mt-5 grid gap-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = data.breakdown[String(n)] ?? 0;
              const pct = data.count > 0 ? (c / data.count) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-right font-bold text-ink/60">{n}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-orange-100">
                    <span className="block h-full rounded-full bg-gradient-to-r from-brand to-sun" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 text-left text-ink/45">{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ฟอร์ม + รายการรีวิว */}
        <div>
          {/* ฟอร์มเขียนรีวิว */}
          {!data.isAuthenticated ? (
            <div className="rounded-[24px] bg-white p-6 text-center shadow-soft">
              <p className="text-ink/60">อยากรีวิวคอร์สนี้ใช่ไหม?</p>
              <Link href="/login" className="mt-3 inline-flex rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark">
                เข้าสู่ระบบ
              </Link>
            </div>
          ) : !data.canReview ? (
            <div className="rounded-[24px] bg-orange-50/70 p-5 text-center text-sm text-ink/60">
              🔒 รีวิวได้เฉพาะผู้ที่ลงทะเบียนเรียนคอร์สนี้แล้วเท่านั้น
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-[24px] bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-extrabold">
                {data.mine ? "แก้ไขรีวิวของคุณ" : "ให้คะแนนคอร์สนี้"}
              </h3>

              <div className="mt-3 flex items-center gap-3">
                <Stars value={rating} size="h-8 w-8" onPick={setRating} />
                <span className="font-bold text-ink/60">{rating} / 5</span>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="เล่าให้คนอื่นฟังหน่อยว่าคอร์สนี้เป็นยังไง (ไม่บังคับ)"
                className="mt-4 w-full resize-none rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-[15px] outline-none transition focus:border-brand focus:bg-white"
              />

              {error && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4 flex-none" />{error}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {data.mine ? "บันทึกการแก้ไข" : "ส่งรีวิว"}
                </button>
                {data.mine && (
                  <button type="button" onClick={removeMine} disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-5 py-2.5 font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                    <Trash2 className="h-4 w-4" /> ลบรีวิว
                  </button>
                )}
              </div>
            </form>
          )}

          {/* รายการรีวิว */}
          <div className="mt-5 grid gap-3">
            {data.reviews.length === 0 ? (
              <div className="rounded-[24px] border-2 border-dashed border-orange-200 p-10 text-center text-ink/50">
                ยังไม่มีรีวิว — มาเป็นคนแรกกันเลย 🌟
              </div>
            ) : (
              data.reviews.map((r) => (
                <div key={r.id} className="rounded-[24px] bg-white p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-orange-100 text-lg">
                      {r.user.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={r.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        : r.user.avatarEmoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{r.user.fullName}</p>
                      <p className="text-xs text-ink/45">{thaiDate(r.updatedAt)}</p>
                    </div>
                    <Stars value={r.rating} size="h-4 w-4" />
                  </div>
                  {r.comment && <p className="mt-3 whitespace-pre-wrap text-[15px] text-ink/75">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

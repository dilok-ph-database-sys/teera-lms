// app/profile/page.tsx — หน้าข้อมูลส่วนตัว (ดู + แก้ไข)
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Mail, User2, Phone, Pencil } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone: string | null;
  bio: string | null;
  avatarEmoji: string;
  createdAt: string;
};

const ROLE_TH: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  INSTRUCTOR: "ผู้สอน",
  STUDENT: "นักเรียน",
};

/** อีโมจิให้เลือกเป็นรูปโปรไฟล์ */
const EMOJIS = ["🙂", "😎", "🐱", "🐶", "🦊", "🐼", "🦁", "🐧", "🌟", "🎈", "🚀", "📚"];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [needLogin, setNeedLogin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🙂");

  // โหลดข้อมูลปัจจุบัน
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.status === 401) { setNeedLogin(true); return; }
        const json = await res.json();
        const p: Profile = json.data;
        setProfile(p);
        setFullName(p.fullName ?? "");
        setPhone(p.phone ?? "");
        setBio(p.bio ?? "");
        setAvatarEmoji(p.avatarEmoji ?? "🙂");
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false); setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, bio, avatarEmoji }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "บันทึกไม่สำเร็จ");
      setProfile(json.data);
      setSaved(true);
      // รีเฟรชแถบเมนูด้านบนให้แสดงชื่อ/รูปใหม่
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // ── กำลังโหลด ──
  if (loading) {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </main>
    );
  }

  // ── ยังไม่ล็อกอิน ──
  if (needLogin) {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 text-center">
        <div className="rounded-[28px] bg-white p-10 shadow-card">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-4xl">🔒</div>
          <h1 className="font-display text-2xl font-extrabold">ยังไม่ได้เข้าสู่ระบบ</h1>
          <p className="mt-2 text-ink/60">เข้าสู่ระบบก่อนเพื่อดูและแก้ไขข้อมูลส่วนตัว</p>
          <Link href="/login?next=/profile" className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 font-bold text-white shadow-soft hover:bg-brand-dark">
            เข้าสู่ระบบ
          </Link>
        </div>
      </main>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-[15px] outline-none transition focus:border-brand focus:bg-white";

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm font-bold text-brand">บัญชีของฉัน</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">ข้อมูลส่วนตัว</h1>
      <p className="mt-1 text-ink/60">แก้ไขชื่อ รูปโปรไฟล์ และข้อมูลติดต่อของคุณได้ที่นี่</p>

      {/* การ์ดสรุป */}
      <div className="mt-6 flex items-center gap-4 rounded-[28px] bg-gradient-to-br from-brand to-sun p-6 text-white shadow-card">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/25 text-5xl backdrop-blur">
          {avatarEmoji}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-extrabold">{profile?.fullName}</p>
          <p className="truncate text-sm text-white/85">{profile?.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-white/25 px-3 py-1 text-xs font-bold backdrop-blur">
            {ROLE_TH[profile?.role ?? ""] ?? profile?.role}
          </span>
        </div>
      </div>

      {/* ฟอร์มแก้ไข */}
      <form onSubmit={save} className="mt-6 rounded-[28px] bg-white p-7 shadow-card sm:p-9">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Pencil className="h-5 w-5 text-brand" /> แก้ไขข้อมูล
        </h2>

        {/* เลือกรูปโปรไฟล์ */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-ink/70">รูปโปรไฟล์</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setAvatarEmoji(e)}
                className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl transition ${
                  avatarEmoji === e
                    ? "bg-brand text-white shadow-soft ring-2 ring-brand ring-offset-2"
                    : "bg-orange-50 hover:bg-orange-100"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* ชื่อ */}
        <div className="mt-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink/70">
            <User2 className="h-4 w-4 text-orange-400" /> ชื่อ–นามสกุล
          </label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="เช่น ธีรา บุญมี" />
        </div>

        {/* อีเมล (แก้ไม่ได้) */}
        <div className="mt-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink/70">
            <Mail className="h-4 w-4 text-orange-400" /> อีเมล
          </label>
          <input value={profile?.email ?? ""} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
          <p className="mt-1 text-xs text-ink/45">อีเมลใช้สำหรับเข้าสู่ระบบ จึงแก้ไขไม่ได้</p>
        </div>

        {/* เบอร์โทร */}
        <div className="mt-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink/70">
            <Phone className="h-4 w-4 text-orange-400" /> เบอร์โทรศัพท์
          </label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="เช่น 081-234-5678" />
        </div>

        {/* แนะนำตัว */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-ink/70">แนะนำตัวสั้น ๆ</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={300}
            className={`${inputCls} resize-none`}
            placeholder="เล่าเกี่ยวกับตัวคุณ เช่น สนใจเรียนเรื่องอะไร ทำงานด้านไหน"
          />
          <p className="mt-1 text-right text-xs text-ink/45">{bio.length}/300</p>
        </div>

        {/* ข้อความแจ้งผล */}
        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4 flex-none" />{error}
          </p>
        )}
        {saved && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 flex-none" />บันทึกเรียบร้อยแล้ว
          </p>
        )}

        {/* ปุ่ม */}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3 font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            บันทึกข้อมูล
          </button>
          <Link href="/dashboard" className="inline-flex items-center rounded-xl border border-orange-200 px-7 py-3 font-bold text-ink/70 transition hover:bg-orange-50">
            กลับแดชบอร์ด
          </Link>
        </div>
      </form>
    </main>
  );
}

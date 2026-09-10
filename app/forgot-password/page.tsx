// app/forgot-password/page.tsx — หน้าลืมรหัสผ่าน (dev stub)
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // ตอนขึ้นจริง: เรียก Supabase — supabase.auth.resetPasswordForEmail(email, { redirectTo })
    // โหมด dev: จำลองว่าส่งอีเมลแล้ว (ไม่ได้ส่งจริง)
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 bg-sun opacity-40 blur-sm" style={blob} />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 bg-berry opacity-30 blur-sm" style={blob} />

      <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-card sm:p-9">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-3xl">✉️</div>
            <h1 className="font-display text-2xl font-extrabold">ส่งลิงก์แล้ว!</h1>
            <p className="mt-2 text-sm text-ink/60">
              ถ้ามีบัญชีที่ใช้อีเมล <b>{email}</b> เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว
              กรุณาเช็กกล่องจดหมาย
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/40">
              <CheckCircle2 className="h-3.5 w-3.5" />โหมดสาธิต: ยังไม่ได้ส่งอีเมลจริง (ต่อ Supabase ในโปรดักชัน)
            </p>
            <Link href="/login" className="mt-6 inline-block rounded-2xl bg-brand px-6 py-2.5 font-bold text-white shadow-soft hover:bg-brand-dark">กลับไปเข้าสู่ระบบ</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-brand to-sun text-3xl text-white shadow-soft">🔑</div>
              <h1 className="font-display text-2xl font-extrabold">ลืมรหัสผ่าน?</h1>
              <p className="mt-1 text-sm text-ink/60">กรอกอีเมล เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้</p>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-300" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล"
                  className="w-full rounded-xl border border-orange-200 bg-orange-50/40 py-3 pl-11 pr-4 text-[15px] outline-none focus:border-brand focus:bg-white" />
              </div>
              <button type="submit" disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-60">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}ส่งลิงก์ตั้งรหัสผ่านใหม่
              </button>
            </form>
            <div className="mt-5 text-center text-sm">
              <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">‹ กลับไปเข้าสู่ระบบ</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

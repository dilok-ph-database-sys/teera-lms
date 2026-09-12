// components/AuthCard.tsx — การ์ดเข้าสู่ระบบ / สมัครสมาชิก (โทนส้ม–เหลือง)
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Lock, User2, AlertCircle, Info, Check } from "lucide-react";

type Mode = "login" | "signup";

/** ข้อความอธิบาย error ที่ส่งกลับมาจากขั้นตอน Google (?error=...) */
const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: "ยังไม่ได้ตั้งค่าการเข้าสู่ระบบด้วย Google — ผู้ดูแลระบบต้องใส่ GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ก่อน",
  google_cancelled: "คุณยกเลิกการเข้าสู่ระบบด้วย Google",
  google_no_code: "การเชื่อมต่อกับ Google ไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง",
  google_state_mismatch: "การเชื่อมต่อหมดอายุ กรุณากดปุ่ม Google ใหม่อีกครั้ง",
  google_token_failed: "แลกข้อมูลกับ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  google_bad_token: "ข้อมูลจาก Google ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
  google_email_unverified: "อีเมล Google นี้ยังไม่ได้ยืนยัน กรุณายืนยันอีเมลกับ Google ก่อน",
};

/** โลโก้ Google สำหรับปุ่ม (ใช้บนปุ่ม "เข้าสู่ระบบด้วย Google") */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.1 14.7 2 12 2 6.9 2 2.8 6.1 2.8 12S6.9 22 12 22c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.9H12z"/>
    </svg>
  );
}

export function AuthCard({ mode, next, oauthError }: { mode: Mode; next?: string; oauthError?: string }) {
  const isLogin = mode === "login";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");   // ยืนยันรหัสผ่าน (หน้าสมัคร)
  const [remember, setRemember] = useState(true); // จำฉันไว้ (หน้าเข้าสู่ระบบ)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? GOOGLE_ERRORS[oauthError] ?? "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : null,
  );
  const [info, setInfo] = useState<string | null>(null);

  const go = next && next.startsWith("/") ? next : "/dashboard";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);

    // ตรวจฝั่ง client: รหัสผ่านต้องตรงกันตอนสมัคร
    if (!isLogin && password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin
        ? { email, password, remember }
        : { fullName, email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "เกิดข้อผิดพลาด");
      window.location.href = go;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  async function demo(as: string) {
    setLoading(true);
    await fetch(`/api/dev/login?as=${as}`, { method: "POST" });
    window.location.href = go;
  }

  const inputCls =
    "w-full rounded-xl border border-orange-200 bg-orange-50/40 pl-11 pr-4 py-3 text-[15px] outline-none focus:border-brand focus:bg-white";

  return (
    <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-card sm:p-9">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-brand to-sun text-3xl text-white shadow-soft">🎈</div>
        <h1 className="font-display text-2xl font-extrabold">{isLogin ? "ยินดีต้อนรับกลับมา!" : "สมัครสมาชิกฟรี 🎉"}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {isLogin ? "เข้าสู่ระบบเพื่อเรียนต่อจากที่ค้างไว้" : "สร้างบัญชีเพื่อเริ่มเรียนได้ทันที"}
        </p>
      </div>

      {/* ปุ่ม Google — พาไปหน้ายินยอมของ Google จริง */}
      <a
        href={`/api/auth/google?next=${encodeURIComponent(go)}`}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-orange-200 bg-white py-3 text-[15px] font-semibold text-ink/80 transition hover:bg-orange-50"
      >
        <GoogleIcon />
        {isLogin ? "เข้าสู่ระบบด้วย Google" : "สมัครด้วย Google"}
      </a>

      <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-orange-100" />หรือใช้อีเมล<span className="h-px flex-1 bg-orange-100" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {!isLogin && (
          <div className="relative">
            <User2 className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-300" />
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ชื่อ–นามสกุล" className={inputCls} />
          </div>
        )}
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-300" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล" className={inputCls} />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-300" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isLogin ? "รหัสผ่าน" : "รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"} className={inputCls} autoComplete={isLogin ? "current-password" : "new-password"} />
        </div>

        {/* ยืนยันรหัสผ่าน — เฉพาะหน้าสมัคร */}
        {!isLogin && (
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-300" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="ยืนยันรหัสผ่านอีกครั้ง" className={inputCls} />
            {confirm.length > 0 && confirm === password && (
              <Check className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
            )}
          </div>
        )}

        {/* จำฉันไว้ / ลืมรหัสผ่าน — เฉพาะหน้าเข้าสู่ระบบ */}
        {isLogin && (
          <div className="flex items-center justify-between px-1 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink/70">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-orange-300 accent-brand" />
              จำฉันไว้
            </label>
            <Link href="/forgot-password" className="font-medium text-brand hover:text-brand-dark">
              ลืมรหัสผ่าน?
            </Link>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4 flex-none" />{error}
          </p>
        )}
        {info && (
          <p className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
            <Info className="h-4 w-4 flex-none" />{info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[15px] font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      {/* สลับโหมด */}
      <div className="mt-5 rounded-2xl bg-orange-50/60 p-3 text-center text-sm">
        {isLogin ? (
          <>ยังไม่มีบัญชีใช่ไหม?{" "}
            <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-bold text-brand hover:text-brand-dark">สมัครสมาชิก →</Link>
          </>
        ) : (
          <>มีบัญชีอยู่แล้ว?{" "}
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-bold text-brand hover:text-brand-dark">เข้าสู่ระบบ</Link>
          </>
        )}
      </div>

      {/* บัญชีทดลอง (เฉพาะหน้าเข้าสู่ระบบ)
          เปิดให้ทดลองเฉพาะบทบาท "นักเรียน" เท่านั้น
          บัญชีผู้สอน/แอดมินต้องเข้าด้วยอีเมล–รหัสผ่านจริง ไม่เปิดให้กดทดลองหน้าเว็บ */}
      {isLogin && (
        <div className="mt-5">
          <div className="mb-2 text-center text-xs text-ink/45">— หรือลองด้วยบัญชีทดลอง —</div>
          <button
            onClick={() => demo("student")}
            className="w-full rounded-xl border border-orange-200 py-2.5 text-sm font-semibold transition hover:bg-orange-50"
          >
            เข้าสู่ระบบเป็น “นักเรียน” (บัญชีทดลอง)
          </button>
        </div>
      )}
    </div>
  );
}

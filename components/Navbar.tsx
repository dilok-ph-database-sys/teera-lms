// components/Navbar.tsx — แถบเมนูบนสุด (โทนส้ม/เหลือง)
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-brand to-sun text-xl text-white shadow-soft">🎈</span>
          <span className="font-display text-xl font-extrabold leading-none">TEERA<span className="text-brand">Learn</span></span>
        </Link>
        <nav className="ml-2 hidden items-center gap-1 text-[15px] font-medium md:flex">
          <Link href="/courses" className="rounded-xl px-3 py-2 hover:bg-orange-100/70">คอร์สเรียน</Link>
          <Link href="/dashboard" className="rounded-xl px-3 py-2 hover:bg-orange-100/70">แดชบอร์ด</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="hidden rounded-xl px-4 py-2 font-semibold text-ink/80 hover:bg-orange-100/70 sm:inline-flex">เข้าสู่ระบบ</Link>
          <Link href="/signup" className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 font-bold text-white shadow-soft transition hover:bg-brand-dark">สมัครสมาชิก</Link>
        </div>
      </div>
    </header>
  );
}

// components/Navbar.tsx — แถบเมนูบนสุด (โทนส้ม/เหลือง)
// รู้สถานะการล็อกอินเอง:
//   ยังไม่ล็อกอิน → ปุ่ม "เข้าสู่ระบบ" + "สมัครสมาชิก"
//   ล็อกอินแล้ว   → ปุ่ม "ข้อมูลส่วนตัว" + "ออกจากระบบ"
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** ชื่อบทบาทเป็นภาษาไทย */
const ROLE_TH: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  INSTRUCTOR: "ผู้สอน",
  STUDENT: "นักเรียน",
};

export async function Navbar() {
  const user = await getCurrentUser();

  // ออกจากระบบ — ทำงานฝั่งเซิร์ฟเวอร์ (ลบ cookie แล้วกลับหน้าแรก)
  async function logout() {
    "use server";
    cookies().delete("uid");
    redirect("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center gap-6 px-5">
        {/* โลโก้ */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-brand to-sun text-xl text-white shadow-soft">🎈</span>
          <span className="font-display text-xl font-extrabold leading-none">
            TEERA<span className="text-brand">Learn</span>
          </span>
        </Link>

        {/* เมนูหลัก */}
        <nav className="ml-2 hidden items-center gap-1 text-[15px] font-medium md:flex">
          <Link href="/courses" className="rounded-xl px-3 py-2 hover:bg-orange-100/70">คอร์สเรียน</Link>
          <Link href="/dashboard" className="rounded-xl px-3 py-2 hover:bg-orange-100/70">แดชบอร์ด</Link>
        </nav>

        {/* ฝั่งขวา — เปลี่ยนตามสถานะล็อกอิน */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {/* ข้อมูลส่วนตัว */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-orange-100/70"
                title="ดู / แก้ไขข้อมูลส่วนตัว"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sun to-brand text-lg shadow-soft">
                  {user.avatarEmoji ?? "🙂"}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[14px] font-bold">{user.fullName}</span>
                  <span className="block text-[11px] text-ink/50">{ROLE_TH[user.role] ?? user.role}</span>
                </span>
              </Link>

              {/* ออกจากระบบ */}
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-xl border border-orange-200 bg-white px-4 py-2.5 font-bold text-ink/70 transition hover:bg-orange-50 hover:text-brand-dark"
                >
                  ออกจากระบบ
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-xl px-4 py-2 font-semibold text-ink/80 hover:bg-orange-100/70 sm:inline-flex">
                เข้าสู่ระบบ
              </Link>
              <Link href="/signup" className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 font-bold text-white shadow-soft transition hover:bg-brand-dark">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

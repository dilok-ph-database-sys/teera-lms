// app/admin/page.tsx — หน้าผู้ดูแลระบบ (ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์ก่อนเข้า)
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AdminConsole } from "@/components/AdminConsole";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  // ยังไม่ล็อกอิน → ส่งไปหน้าเข้าสู่ระบบ แล้วกลับมาที่นี่
  if (!user) redirect("/login?next=/admin");

  // ล็อกอินแล้วแต่ไม่ใช่แอดมิน → แจ้งให้ทราบ ไม่เผยว่ามีอะไรอยู่ข้างใน
  if (user.role !== "ADMIN") {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 text-center">
        <div className="rounded-[28px] bg-white p-10 shadow-card">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-4xl">🚧</div>
          <h1 className="font-display text-2xl font-extrabold">เข้าหน้านี้ไม่ได้</h1>
          <p className="mt-2 text-ink/60">หน้าผู้ดูแลระบบเปิดให้เฉพาะบัญชีผู้ดูแลเท่านั้น</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 font-bold text-white shadow-soft hover:bg-brand-dark">
            กลับแดชบอร์ด
          </Link>
        </div>
      </main>
    );
  }

  return <AdminConsole adminName={user.fullName} />;
}

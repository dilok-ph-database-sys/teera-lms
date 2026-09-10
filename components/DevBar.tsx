// components/DevBar.tsx — แถบสลับบัญชี (เฉพาะ dev mode) ให้ทดสอบ 3 บทบาทได้ง่าย
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function DevBar({ userName, role }: { userName: string | null; role: string | null }) {
  const router = useRouter();

  async function loginAs(as: string) {
    await fetch(`/api/dev/login?as=${as}`, { method: "POST" });
    router.refresh();
  }
  async function logout() {
    await fetch("/api/dev/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
      <span className="font-mono font-semibold">DEV</span>
      <Link href="/" className="rounded px-2 py-1 hover:bg-amber-100">หน้าแรก</Link>
      <Link href="/courses" className="rounded px-2 py-1 hover:bg-amber-100">คอร์ส</Link>
      <Link href="/dashboard" className="rounded px-2 py-1 hover:bg-amber-100">แดชบอร์ด</Link>
      <span className="mx-1 h-4 w-px bg-amber-300" />
      <span className="text-amber-700">
        เข้าระบบเป็น: <b>{userName ? `${userName} (${role})` : "ยังไม่ล็อกอิน"}</b>
      </span>
      <span className="ml-auto flex gap-1">
        <button onClick={() => loginAs("student")} className="rounded bg-white px-2 py-1 ring-1 ring-amber-200 hover:bg-amber-100">นักเรียน</button>
        <button onClick={() => loginAs("instructor")} className="rounded bg-white px-2 py-1 ring-1 ring-amber-200 hover:bg-amber-100">ผู้สอน</button>
        <button onClick={() => loginAs("admin")} className="rounded bg-white px-2 py-1 ring-1 ring-amber-200 hover:bg-amber-100">แอดมิน</button>
        {userName && <button onClick={logout} className="rounded bg-white px-2 py-1 ring-1 ring-amber-200 hover:bg-amber-100">ออก</button>}
      </span>
    </div>
  );
}

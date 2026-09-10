// app/api/dev/login/route.ts — login จำลองสำหรับ dev (ตั้ง cookie uid)
// ตอนขึ้นจริงลบไฟล์นี้ แล้วใช้ Supabase Auth callback แทน
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ⚠️ ใช้สำหรับ "ทดสอบ" เท่านั้น — ทางลัดนี้ข้ามการตรวจรหัสผ่าน
// ก่อนเปิดให้คนนอกใช้จริง ให้ลบทั้งโฟลเดอร์ app/api/dev/ ออก
const MAP: Record<string, string> = {
  student: "u_student",
  instructor: "u_instructor",
  admin: "u_admin",
};

export async function POST(req: Request) {
  const as = new URL(req.url).searchParams.get("as") ?? "student";
  const uid = MAP[as];
  if (!uid) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "บัญชีทดลองใช้ได้เฉพาะบทบาทนักเรียน" } },
      { status: 403 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    return NextResponse.json({ error: "ยังไม่มีข้อมูล seed — รัน npm run db:seed ก่อน" }, { status: 404 });
  }

  const res = NextResponse.json({ data: { id: user.id, role: user.role } });
  res.cookies.set("uid", uid, { httpOnly: true, path: "/", sameSite: "lax" });
  return res;
}

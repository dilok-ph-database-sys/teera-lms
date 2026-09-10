
// app/api/dev/login/route.ts — login จำลองสำหรับ dev (ตั้ง cookie uid)
// ตอนขึ้นจริงลบไฟล์นี้ แล้วใช้ Supabase Auth callback แทน
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// เปิดให้ทดลองได้เฉพาะบทบาท "นักเรียน" เท่านั้น
// ผู้สอน/แอดมิน ต้องเข้าด้วยอีเมล–รหัสผ่านที่หน้า /login (กันคนกดปุ่มเข้าเป็นแอดมินได้เอง)
const MAP: Record<string, string> = {
  student: "u_student",
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

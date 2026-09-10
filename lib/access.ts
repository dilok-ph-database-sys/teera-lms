// lib/access.ts — ตรรกะตรวจสอบสิทธิ์เข้าเรียน (Authentication + Enrollment)
// "เข้าเรียนได้" = มี Enrollment สถานะ ACTIVE/COMPLETED ที่ยังไม่หมดอายุ
// Enrollment ถูกสร้างจากฝั่งเซิร์ฟเวอร์ (checkout/webhook) เท่านั้น
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

export type AccessDenyReason = "unauthenticated" | "not-enrolled" | "expired";

export interface CourseAccess {
  allowed: boolean;
  reason?: AccessDenyReason;
  userId?: string;
  enrollment?: { id: string; status: string; progressPercent: number };
}

export async function getCourseAccess(courseId: string): Promise<CourseAccess> {
  const user = await getCurrentUser();
  if (!user) return { allowed: false, reason: "unauthenticated" };

  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true, status: true, progressPercent: true, expiresAt: true },
  });

  if (!e || e.status === "CANCELLED") {
    return { allowed: false, reason: "not-enrolled", userId: user.id };
  }
  const expired = e.status === "EXPIRED" || (e.expiresAt !== null && e.expiresAt < new Date());
  if (expired) return { allowed: false, reason: "expired", userId: user.id };

  return {
    allowed: true,
    userId: user.id,
    enrollment: { id: e.id, status: e.status, progressPercent: e.progressPercent },
  };
}

/** ใช้ใน Server Component: ไม่มีสิทธิ์ -> redirect */
export async function requireCourseAccess(courseId: string, courseSlug: string) {
  const access = await getCourseAccess(courseId);
  if (access.allowed) return access;
  if (access.reason === "unauthenticated") redirect(`/login?next=/learn/${courseSlug}`);
  if (access.reason === "expired") redirect(`/courses/${courseSlug}?state=expired`);
  redirect(`/courses/${courseSlug}?state=locked`);
}

/** ใช้ใน Route Handler: throw NextResponse 401/403 ถ้าไม่ผ่าน */
export async function assertCourseAccessApi(courseId: string) {
  const { NextResponse } = await import("next/server");
  const access = await getCourseAccess(courseId);
  if (access.allowed) return access;
  const status = access.reason === "unauthenticated" ? 401 : 403;
  const message =
    access.reason === "unauthenticated" ? "กรุณาเข้าสู่ระบบ"
    : access.reason === "expired" ? "สิทธิ์เข้าเรียนหมดอายุแล้ว"
    : "คุณยังไม่ได้ลงทะเบียนคอร์สนี้";
  throw NextResponse.json({ error: { code: access.reason?.toUpperCase(), message } }, { status });
}

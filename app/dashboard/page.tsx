// app/dashboard/page.tsx — แดชบอร์ด (Server Component)
//   นักเรียน        → คอร์สที่เรียน / ความคืบหน้า / ใบรับรอง
//   ผู้สอน & แอดมิน → ตารางงานรายวัน (คนละข้อความตามบทบาท)
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StudentDashboard, type EnrolledCourse, type CertificateItem } from "@/components/StudentDashboard";
import { StaffDashboard } from "@/components/StaffDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  // ผู้สอน / ผู้ดูแลระบบ ใช้แดชบอร์ดแบบตารางงาน
  if (user.role === "INSTRUCTOR" || user.role === "ADMIN") {
    return <StaffDashboard staffName={user.fullName} role={user.role} />;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: {
      course: { include: { modules: { include: { lessons: { select: { id: true } } } } } },
      certificate: true,
      progress: { where: { isCompleted: true }, select: { lessonId: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const toCard = (e: (typeof enrollments)[number]): EnrolledCourse => {
    const total = e.course.modules.reduce((n, m) => n + m.lessons.length, 0);
    return {
      id: e.id, slug: e.course.slug, title: e.course.title, icon: e.course.icon,
      gradient: e.course.gradient, instructorName: e.course.instructorName,
      progressPercent: e.progressPercent, completedLessons: e.progress.length, totalLessons: total,
      completedAt: e.completedAt ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(e.completedAt) : undefined,
    };
  };

  const inProgress = enrollments.filter((e) => e.status === "ACTIVE").map(toCard);
  const completed = enrollments.filter((e) => e.status === "COMPLETED").map(toCard);
  const certificates: CertificateItem[] = enrollments
    .filter((e) => e.certificate)
    .map((e) => ({
      id: e.certificate!.id, courseTitle: e.course.title, serial: e.certificate!.serial,
      issuedAtLabel: new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(e.certificate!.issuedAt),
      pdfUrl: e.certificate!.pdfUrl ?? undefined,
    }));

  return <StudentDashboard studentName={user.fullName} inProgress={inProgress} completed={completed} certificates={certificates} />;
}

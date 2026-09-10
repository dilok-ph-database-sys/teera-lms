// app/learn/[courseSlug]/page.tsx — หน้าเรียน (Server Component)
// ตรวจสิทธิ์ก่อนเสมอ: ไม่มีสิทธิ์ -> requireCourseAccess จะ redirect ออกไปเอง
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCourseAccess } from "@/lib/access";
import { CoursePlayer } from "@/components/CoursePlayer";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params, searchParams,
}: {
  params: { courseSlug: string };
  searchParams: { lesson?: string };
}) {
  const course = await prisma.course.findUnique({
    where: { slug: params.courseSlug },
    include: { modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } } },
  });
  if (!course) notFound();

  // ★ ด่านตรวจสิทธิ์
  const access = await requireCourseAccess(course.id, course.slug);

  const progress = await prisma.lessonProgress.findMany({
    where: { enrollmentId: access.enrollment!.id, isCompleted: true },
    select: { lessonId: true },
  });

  return (
    <CoursePlayer
      course={{
        id: course.id, slug: course.slug, title: course.title,
        modules: course.modules.map((m) => ({
          id: m.id, title: m.title,
          lessons: m.lessons.map((l) => ({
            id: l.id, title: l.title, type: l.type, durationSec: l.durationSec,
            videoUrl: l.videoUrl, videoKind: l.videoKind, overviewHtml: l.overviewHtml, isPreview: l.isPreview,
          })),
        })),
      }}
      initialLessonId={searchParams.lesson}
      completedLessonIds={progress.map((p) => p.lessonId)}
    />
  );
}

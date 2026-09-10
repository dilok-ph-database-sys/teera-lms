// app/courses/[slug]/page.tsx — หน้ารายละเอียดคอร์ส (Server Component)
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCourseAccess } from "@/lib/access";
import { CourseDetail } from "@/components/CourseDetail";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();

  const [user, access] = await Promise.all([getCurrentUser(), getCourseAccess(course.id)]);

  return (
    <CourseDetail
      course={{
        id: course.id, slug: course.slug, title: course.title, subtitle: course.subtitle,
        icon: course.icon, gradient: course.gradient, instructorName: course.instructorName,
        priceCents: course.priceCents, currency: course.currency, level: course.level,
        totalLessons: course.totalLessons, totalHours: course.totalHours,
        rating: course.ratingAvg, ratingCount: course.ratingCount,
      }}
      hasAccess={access.allowed}
      isAuthenticated={!!user}
    />
  );
}

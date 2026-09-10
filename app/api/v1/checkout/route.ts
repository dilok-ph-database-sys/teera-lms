// app/api/v1/checkout/route.ts
// สร้าง Order + เริ่มชำระเงิน
//  - ถ้าไม่มี STRIPE_SECRET_KEY (dev mode): จำลองว่าจ่ายสำเร็จ -> ปลดล็อกคอร์สทันที
//  - ถ้ามีคีย์จริง: สร้าง Stripe PaymentIntent แล้วให้ webhook เป็นตัวปลดล็อก (โค้ดจริงอยู่ในคอมเมนต์)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const BodySchema = z.object({
  courseId: z.string().min(1),
  method: z.enum(["card", "promptpay"]).default("card"),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "กรุณาเข้าสู่ระบบ" } }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors } }, { status: 422 });
  }
  const { courseId, method } = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, priceCents: true, currency: true, status: true },
  });
  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "ไม่พบคอร์สนี้" } }, { status: 404 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { status: true },
  });
  if (existing && existing.status !== "CANCELLED") {
    return NextResponse.json({ error: { code: "ALREADY_ENROLLED", message: "คุณลงทะเบียนคอร์สนี้แล้ว" } }, { status: 409 });
  }

  // คอร์สฟรี -> ลงทะเบียนเลย
  if (course.priceCents === 0) {
    await enroll(user.id, course.id);
    return NextResponse.json({ data: { free: true, enrolled: true, redirect: `/learn/${courseId}` } });
  }

  // ── โหมดจริง (มีคีย์ Stripe) ────────────────────────────────────────────────
  if (process.env.STRIPE_SECRET_KEY) {
    // const Stripe = (await import("stripe")).default;
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    // 1) สร้าง Order (PENDING) + 2) PaymentIntent (card/promptpay)
    // 3) คืน clientSecret ให้หน้าเว็บจ่าย  4) webhook สร้าง Enrollment (ดูไฟล์ stripe-webhook.route.ts)
    // ...รายละเอียดตามไฟล์ checkout.route.ts ที่ส่งไปก่อนหน้า...
    return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "โหมด Stripe จริง — เปิดโค้ดในไฟล์และตั้งค่า webhook" } }, { status: 501 });
  }

  // ── โหมด DEV (ไม่มีคีย์): จำลองการจ่ายสำเร็จ = สิ่งที่ webhook จะทำในระบบจริง ──
  const orderNo = `ORD-DEV-${Date.now().toString().slice(-8)}`;
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { orderNo, userId: user.id, totalCents: course.priceCents, currency: course.currency, status: "PAID", paidAt: new Date() },
    });
    await tx.payment.create({
      data: { orderId: order.id, provider: "DEV", providerRef: `dev_${orderNo}`, amountCents: course.priceCents, status: "SUCCEEDED", paidAt: new Date() },
    });
    await tx.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      create: { userId: user.id, courseId: course.id, orderId: order.id, status: "ACTIVE", progressPercent: 0 },
      update: { status: "ACTIVE", orderId: order.id },
    });
    await tx.course.update({ where: { id: course.id }, data: { studentCount: { increment: 1 } } });
  });

  return NextResponse.json({ data: { free: false, dev: true, enrolled: true, method, redirect: `/learn/${course.id}` } });
}

async function enroll(userId: string, courseId: string) {
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: "ACTIVE", progressPercent: 0 },
    update: { status: "ACTIVE" },
  });
}

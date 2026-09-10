# TEERA Learn — ระบบเรียนออนไลน์ (Next.js + Prisma)

โปรเจกต์รันได้จริง ครอบคลุม: Student Dashboard, Course Detail + Checkout,
Course Player (วิดีโอ + progress), และ **ตรรกะตรวจสอบสิทธิ์เข้าเรียน**

รันแบบ **DEV mode** ได้ทันทีโดยไม่ต้องมี Supabase หรือคีย์ Stripe จริง
(ใช้ SQLite + login จำลอง + จ่ายเงินจำลอง)

---

## วิธีรัน (3 คำสั่ง)

```bash
npm install          # ติดตั้ง dependencies (ขั้นนี้จะโหลด Prisma engine)
npm run setup        # สร้างตาราง SQLite + ใส่ข้อมูลตัวอย่าง (db push + seed)
npm run dev          # เปิด http://localhost:3000
```

> ถ้า `npm install` แจ้งว่าโหลด Prisma engine ไม่ได้ แปลว่าเน็ตเวิร์กบล็อก
> `binaries.prisma.sh` อยู่ — ลองเครือข่ายอื่น (ปกติเครื่องทั่วไปจะโหลดได้)

---

## ลองใช้งาน

เปิดเว็บแล้วจะมีแถบสีเหลือง **DEV** ด้านบน ใช้สลับบัญชีทดลองได้ (นักเรียน / ผู้สอน / แอดมิน)

| ทดลอง | ทำอะไร |
|---|---|
| กด **นักเรียน** → ไป **แดชบอร์ด** | เห็นคอร์สกำลังเรียน (progress bar), เรียนจบแล้ว, ใบรับรอง |
| ไป **คอร์ส** → เปิดคอร์สที่ยังไม่ซื้อ (PostgreSQL) | กดชำระเงิน → dev mode ปลดล็อกทันที → เข้าเรียนได้ |
| เข้า **ห้องเรียน** → กด "ทำเครื่องหมายว่าเรียนจบ" | progress bar ขยับ + บันทึกลง DB จริง |
| ยังไม่ล็อกอิน แล้วเปิด `/learn/...` | โดนเด้งออก (ตรรกะตรวจสิทธิ์ทำงาน) |

---

## โครงสร้าง

```
app/
  courses/            แคตตาล็อก + หน้ารายละเอียดคอร์ส
  dashboard/          Student Dashboard
  learn/[courseSlug]/ หน้าเรียน (ตรวจสิทธิ์ด้วย requireCourseAccess)
  api/v1/checkout/    เริ่มชำระเงิน (dev = ปลดล็อกเลย / prod = Stripe)
  api/v1/learn/.../progress/  บันทึกความคืบหน้า
  api/dev/            login/logout จำลอง (ลบทิ้งตอนขึ้นจริง)
components/           StudentDashboard, CourseDetail, CoursePlayer, DevBar
lib/                  prisma, auth (dev), access (ตรรกะสิทธิ์)
prisma/               schema (SQLite) + seed
```

---

## เปลี่ยนไปใช้ของจริง (production)

1. **DB**: เปลี่ยน `datasource` ใน `prisma/schema.prisma` เป็น `postgresql`
   แล้วนำ enum / index กลับตามพิมพ์เขียว → `prisma migrate dev`
2. **Auth**: แทน `lib/auth.ts` (getCurrentUser) ด้วย Supabase Auth
   และลบโฟลเดอร์ `app/api/dev/`
3. **Payment**: ตั้ง ENV แล้วเปิดโค้ด Stripe ใน `app/api/v1/checkout/route.ts`
   พร้อมสร้าง webhook `app/api/v1/webhooks/stripe/route.ts`
   (โค้ดเต็มอยู่ในไฟล์ `checkout.route.ts` / `stripe-webhook.route.ts` ที่ส่งให้ก่อนหน้า)

```env
# .env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

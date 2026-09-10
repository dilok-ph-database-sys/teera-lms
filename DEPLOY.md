# 🚀 คู่มือ Deploy ขึ้น Vercel (ให้คนอื่นเข้าได้จริง)

โปรเจกต์นี้เตรียมพร้อม deploy แล้ว (เปลี่ยนจาก SQLite → PostgreSQL เรียบร้อย)
ทำตาม 6 ขั้นตอนนี้ ใช้เวลาประมาณ 15–20 นาที ทั้งหมด **ฟรี**

> สิ่งที่ต้องมี: บัญชี GitHub + บัญชี Vercel (สมัครด้วย GitHub ได้เลย)

---

## ขั้นที่ 1 — เอาโค้ดขึ้น GitHub

1. เข้า https://github.com → กด **New repository**
2. ตั้งชื่อ เช่น `teera-lms` → เลือก **Private** (หรือ Public ก็ได้) → **Create repository**
3. ในโฟลเดอร์โปรเจกต์ เปิด Terminal แล้วรัน (แทน `<ชื่อคุณ>` ด้วยของจริง):

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<ชื่อคุณ>/teera-lms.git
git push -u origin main
```

> ไฟล์ `.gitignore` มีอยู่แล้ว — `node_modules`, `.env`, `dev.db` จะไม่ถูกอัปโหลด (ปลอดภัย)

---

## ขั้นที่ 2 — สร้างโปรเจกต์บน Vercel

1. เข้า https://vercel.com → **Add New… → Project**
2. เลือก repo `teera-lms` ที่เพิ่ง push → **Import**
3. **อย่าเพิ่งกด Deploy** — ไปสร้างฐานข้อมูลก่อน (ขั้นที่ 3)
   *(ถ้าเผลอกด Deploy แล้ว error ไม่เป็นไร เดี๋ยวกลับมา Redeploy ทีหลังได้)*

---

## ขั้นที่ 3 — สร้างฐานข้อมูล PostgreSQL (ฟรี)

1. ในหน้าโปรเจกต์ Vercel → แท็บ **Storage** → **Create Database**
2. เลือก **Postgres** (Neon) → เลือก region ใกล้ ๆ (เช่น Singapore) → **Create**
3. กด **Connect** ให้เชื่อมกับโปรเจกต์ → Vercel จะ **ใส่ตัวแปร env ให้อัตโนมัติ**
   (`DATABASE_URL`, `DATABASE_URL_UNPOOLED` ฯลฯ)

4. ตั้งค่า env เพิ่มให้ Prisma ใช้ครบ 2 ตัว — ไปที่ **Settings → Environment Variables** เช็กว่ามี:
   - `DATABASE_URL` ✅ (มีให้แล้ว)
   - `DIRECT_URL` ➕ เพิ่มเอง โดยก๊อปค่าจาก **`DATABASE_URL_UNPOOLED`** มาใส่
   *(ถ้าไม่มี `DATABASE_URL_UNPOOLED` ให้ใส่ค่าเดียวกับ `DATABASE_URL` ก็ได้)*

---

## ขั้นที่ 4 — สร้างตาราง + ใส่ข้อมูลตัวอย่าง (ทำจากเครื่องตัวเอง)

ขั้นนี้ทำครั้งเดียว เพื่อสร้างตารางและใส่คอร์สตัวอย่างลงฐานข้อมูลบนคลาวด์

1. ก๊อปค่า connection มาไว้ที่เครื่อง — สร้างไฟล์ **`.env`** ในโฟลเดอร์โปรเจกต์:

```env
DATABASE_URL="<ก๊อปค่า DATABASE_URL จาก Vercel>"
DIRECT_URL="<ก๊อปค่า DATABASE_URL_UNPOOLED จาก Vercel>"
```

> วิธีก๊อปง่าย ๆ: Vercel → Storage → เลือก DB → แท็บ **.env.local** → กดปุ่ม copy

2. รันในโฟลเดอร์โปรเจกต์:

```bash
npm install
npm run setup      # สร้างตารางบน Postgres + ใส่ข้อมูลตัวอย่าง
```

เห็นข้อความ `✓ Seed สำเร็จ...` = เรียบร้อย ฐานข้อมูลบนคลาวด์พร้อมแล้ว

---

## ขั้นที่ 5 — Deploy

1. กลับไปที่ Vercel → แท็บ **Deployments** → **Redeploy** (หรือ push โค้ดใหม่ก็ deploy อัตโนมัติ)
2. รอสักครู่จนขึ้น **Ready** ✅

> Build Command ที่ Vercel ใช้คือ `npm run build` ซึ่งในโปรเจกต์ตั้งเป็น
> `prisma generate && next build` อยู่แล้ว ไม่ต้องแก้อะไร

---

## ขั้นที่ 6 — เปิดเว็บ + แชร์ให้คนอื่น

- Vercel จะให้ลิงก์ เช่น `https://teera-lms.vercel.app`
- เปิดได้จากทุกที่ทุกเครื่อง — ส่งลิงก์นี้ให้ใครก็เข้าได้เลย 🎉

---

## ⚠️ สิ่งที่ควรทำก่อนใช้งานจริงจัง

ตอนนี้ระบบยังเป็น **โหมดสาธิต** — ก่อนเปิดให้คนใช้จริงควรแก้:

1. **ระบบล็อกอิน** — ตอนนี้ยังไม่ตรวจรหัสผ่านจริง (dev mode)
   → เปลี่ยนไปใช้ **Supabase Auth** หรือ **NextAuth** และลบโฟลเดอร์ `app/api/dev/`
2. **การชำระเงิน** — ตอนนี้กดจ่ายแล้วปลดล็อกเลย (จำลอง)
   → ใส่คีย์ **Stripe** จริง (ดูไฟล์ `checkout.route.ts` / `stripe-webhook.route.ts` ที่ให้ไว้ก่อนหน้า)
3. **วิดีโอ** — ตอนนี้เป็นวิดีโอตัวอย่าง → อัปโหลดวิดีโอจริงขึ้น storage (เช่น Cloudflare Stream / Bunny)

---

## ❓ เจอปัญหาบ่อย ๆ

| อาการ | วิธีแก้ |
|---|---|
| Deploy แล้วหน้าเว็บ error 500 | ยังไม่ได้ตั้ง `DATABASE_URL`/`DIRECT_URL` ให้ครบ → เช็ก Settings → Environment Variables แล้ว Redeploy |
| `npm run setup` แล้ว error เรื่อง connection | ใช้ค่า `DIRECT_URL` (แบบ non-pooling) ให้ถูก หรือใส่ค่าเดียวกับ DATABASE_URL |
| หน้าเว็บขึ้นแต่ไม่มีคอร์ส | ยังไม่ได้รัน `npm run setup` (ขั้นที่ 4) เพื่อ seed ข้อมูล |
| แก้โค้ดแล้วอยากอัปเดตเว็บ | `git push` — Vercel deploy ให้อัตโนมัติทุกครั้ง |

// lib/ratelimit.ts — จำกัดจำนวนครั้งที่ยิงเข้ามาในช่วงเวลาหนึ่ง (กันเดารหัสผ่าน)
//
// เก็บไว้ในหน่วยความจำของเซิร์ฟเวอร์ ไม่ต้องติดตั้งอะไรเพิ่ม
// ⚠️ ข้อจำกัด: บน Vercel แอปอาจรันหลายเครื่องพร้อมกัน ตัวนับจึงแยกกันคนละเครื่อง
//    ช่วยชะลอการเดารหัสได้จริงในระดับหนึ่ง แต่ไม่ใช่กำแพงกันสมบูรณ์
//    ถ้าต้องการเข้มกว่านี้ ค่อยเปลี่ยนไปใช้ Upstash Redis ทีหลัง

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** ล้างรายการที่หมดอายุทิ้ง กันหน่วยความจำบวม */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * ตรวจและนับจำนวนครั้ง
 * @param key      ตัวระบุผู้ยิง เช่น "login:1.2.3.4"
 * @param limit    จำนวนครั้งสูงสุดในหนึ่งช่วงเวลา
 * @param windowSec ความยาวของช่วงเวลา (วินาที)
 */
export function rateLimit(key: string, limit = 5, windowSec = 600): RateResult {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  b.count++;
  if (b.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/** ล้างตัวนับของ key นี้ (เรียกเมื่อผู้ใช้ล็อกอินสำเร็จ) */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/** ดึง IP ผู้ใช้จาก header ที่ Vercel ใส่มาให้ */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** เปิดใช้เครื่องมือสำหรับทดสอบ (แถบ DEV, ปุ่มสลับบทบาท) หรือไม่
 *  ตั้งค่าใน Vercel: DEV_TOOLS = off  → ปิดทั้งหมด (ใช้ตอนเปิดให้คนนอกใช้จริง) */
export const DEV_TOOLS_ENABLED = process.env.DEV_TOOLS !== "off";

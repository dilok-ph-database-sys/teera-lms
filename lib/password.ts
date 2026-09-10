// lib/password.ts — เข้ารหัส & ตรวจสอบรหัสผ่าน
// ใช้ scrypt ที่มากับ Node.js อยู่แล้ว (ไม่ต้องติดตั้งไลบรารีเพิ่ม)
//
// รูปแบบที่เก็บลงฐานข้อมูล:  scrypt$<salt base64>$<hash base64>
//   • salt สุ่มใหม่ทุกครั้ง → รหัสผ่านเดียวกันของคนละคนจะได้ค่าไม่เหมือนกัน
//   • เทียบด้วย timingSafeEqual → กันการเดารหัสจากเวลาที่ใช้ตอบ (timing attack)
//
// ⚠️ ห้ามเก็บรหัสผ่านแบบข้อความธรรมดาเด็ดขาด และห้ามส่ง hash กลับไปฝั่งเบราว์เซอร์
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCHEME = "scrypt";

/** ความยาวรหัสผ่านขั้นต่ำที่ระบบยอมรับ (ใช้ร่วมกันทั้งสมัครสมาชิกและเปลี่ยนรหัส) */
export const MIN_PASSWORD_LENGTH = 8;

/** แปลงรหัสผ่านเป็นข้อความที่เข้ารหัสแล้ว สำหรับเก็บลงฐานข้อมูล */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(plain.normalize("NFKC"), salt, KEY_LENGTH);
  return `${SCHEME}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** ตรวจว่ารหัสผ่านที่กรอกมา ตรงกับที่เก็บไว้หรือไม่ */
export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;

  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== SCHEME || !saltB64 || !keyB64) return false;

  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(keyB64, "base64");
    const actual = await scrypt(plain.normalize("NFKC"), salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

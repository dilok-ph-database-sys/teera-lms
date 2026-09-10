// components/Footer.tsx
export function Footer() {
  return (
    <footer className="mt-16 bg-ink text-orange-50/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-brand to-sun text-lg text-white">🎈</span>
            <span className="font-display text-lg font-extrabold text-white">TEERA<span className="text-sun">Learn</span></span>
          </div>
          <p className="mt-3 text-sm text-orange-50/60">เรียนสนุก เก่งขึ้น ได้ทุกที่ทุกเวลา แพลตฟอร์มเรียนออนไลน์สำหรับทุกวัย</p>
        </div>
        <div>
          <h4 className="mb-3 font-display font-bold text-white">เรียนรู้</h4>
          <ul className="space-y-2 text-sm"><li>คอร์สทั้งหมด</li><li>หมวดหมู่</li><li>คอร์สฟรี</li><li>ใบประกาศ</li></ul>
        </div>
        <div>
          <h4 className="mb-3 font-display font-bold text-white">เกี่ยวกับ</h4>
          <ul className="space-y-2 text-sm"><li>สอนกับเรา</li><li>ติดต่อ</li><li>คำถามที่พบบ่อย</li><li>เงื่อนไขการใช้งาน</li></ul>
        </div>
        <div>
          <h4 className="mb-3 font-display font-bold text-white">ติดตามเรา</h4>
          <div className="flex gap-2 text-xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">📘</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">📸</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">▶️</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">💬</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-orange-50/50">
        © 2026 TEERA Learn · เว็บตัวอย่างเพื่อการสาธิต
      </div>
    </footer>
  );
}

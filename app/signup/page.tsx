// app/signup/page.tsx — หน้าสมัครสมาชิก
import { AuthCard } from "@/components/AuthCard";

const blob = { borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%" };

export default function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 bg-sun opacity-40 blur-sm" style={blob} />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 bg-sky opacity-30 blur-sm" style={blob} />
      <AuthCard mode="signup" next={searchParams.next} />
    </div>
  );
}

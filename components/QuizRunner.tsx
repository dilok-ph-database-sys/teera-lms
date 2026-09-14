// components/QuizRunner.tsx — ทำแบบทดสอบในหน้าเรียน
//  เฉลยอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น — จะส่งกลับมาหลังกดส่งคำตอบแล้วเท่านั้น
"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

type Question = { id: string; text: string; choices: string[] };
type Best = { score: number; total: number; createdAt: string } | null;
type Answer = {
  questionId: string; picked: number | null; correctIndex: number;
  correct: boolean; explain: string | null; choices: string[];
};
type Result = { score: number; total: number; percent: number; passed: boolean; result: Answer[] };

export function QuizRunner({ lessonId, onPassed }: { lessonId: string; onPassed?: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [best, setBest] = useState<Best>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/quiz?lessonId=${encodeURIComponent(lessonId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "โหลดแบบทดสอบไม่สำเร็จ");
      setQuestions(json.data.questions);
      setBest(json.data.best);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดแบบทดสอบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  // เปลี่ยนบทเรียน → ล้างคำตอบเดิมทิ้ง
  useEffect(() => {
    setAnswers({}); setResult(null);
    load();
  }, [load]);

  async function submit() {
    if (Object.keys(answers).length < questions.length) {
      setError("กรุณาตอบให้ครบทุกข้อก่อนส่ง");
      return;
    }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/v1/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "ส่งคำตอบไม่สำเร็จ");
      setResult(json.data);
      if (json.data.passed) onPassed?.();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งคำตอบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setAnswers({}); setResult(null); setError(null);
  }

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-12">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
        แบบทดสอบนี้ยังไม่มีคำถาม — ผู้สอนกำลังเตรียมอยู่
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">แบบทดสอบ ({questions.length} ข้อ)</h3>
        {best && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            <Trophy className="h-4 w-4" /> คะแนนดีที่สุด {best.score}/{best.total}
          </span>
        )}
      </div>

      {/* ── สรุปผลหลังส่ง ── */}
      {result && (
        <div className={`mt-4 rounded-2xl p-5 text-center ${result.passed ? "bg-green-50" : "bg-amber-50"}`}>
          <p className="text-5xl">{result.passed ? "🎉" : "💪"}</p>
          <p className="mt-2 text-2xl font-extrabold">
            ได้ {result.score} จาก {result.total} ข้อ ({result.percent}%)
          </p>
          <p className={`mt-1 text-sm font-semibold ${result.passed ? "text-green-700" : "text-amber-700"}`}>
            {result.passed ? "ผ่านเกณฑ์แล้ว เก่งมาก!" : "ยังไม่ผ่านเกณฑ์ (ต้องได้ 60% ขึ้นไป) ลองอีกครั้งนะ"}
          </p>
          <button onClick={retry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> ทำใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* ── คำถาม ── */}
      <ol className="mt-5 grid gap-5">
        {questions.map((q, qi) => {
          const ans = result?.result.find((r) => r.questionId === q.id);
          return (
            <li key={q.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold">
                <span className="mr-2 text-orange-600">ข้อ {qi + 1}.</span>
                {q.text}
              </p>

              <div className="mt-3 grid gap-2">
                {q.choices.map((choice, ci) => {
                  const picked = answers[q.id] === ci;
                  let cls = "border-slate-200 hover:bg-slate-50";
                  let mark = null as React.ReactNode;

                  if (ans) {
                    if (ci === ans.correctIndex) {
                      cls = "border-green-300 bg-green-50";
                      mark = <CheckCircle2 className="h-4 w-4 text-green-600" />;
                    } else if (ans.picked === ci) {
                      cls = "border-rose-300 bg-rose-50";
                      mark = <XCircle className="h-4 w-4 text-rose-500" />;
                    }
                  } else if (picked) {
                    cls = "border-orange-400 bg-orange-50";
                  }

                  return (
                    <button
                      key={ci}
                      type="button"
                      disabled={!!result}
                      onClick={() => setAnswers({ ...answers, [q.id]: ci })}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[15px] transition disabled:cursor-default ${cls}`}
                    >
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                        picked && !result ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 text-slate-500"
                      }`}>
                        {String.fromCharCode(65 + ci)}
                      </span>
                      <span className="flex-1">{choice}</span>
                      {mark}
                    </button>
                  );
                })}
              </div>

              {ans?.explain && (
                <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                  💡 {ans.explain}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 flex-none" />{error}
        </p>
      )}

      {!result && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={submit} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} ส่งคำตอบ
          </button>
          <span className="text-sm text-slate-500">ตอบแล้ว {answeredCount} / {questions.length} ข้อ</span>
        </div>
      )}
    </div>
  );
}

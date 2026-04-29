"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({ message, senderEmail, senderName }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setSubmitState("error");
        setStatusMessage(data?.error || "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setSubmitState("success");
      setStatusMessage("문의가 전송되었습니다. 확인 후 필요한 경우 답변드릴게요.");
      setSenderName("");
      setSenderEmail("");
      setMessage("");
    } catch {
      setSubmitState("error");
      setStatusMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="not-prose rounded-3xl border border-primary/15 bg-primary/5 p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">익명 문의 보내기</h2>
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          이름과 이메일은 선택사항입니다. 답변을 원하면 이메일을 남겨주세요.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-foreground/80">
          이름 또는 닉네임 선택
          <input
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            placeholder="익명"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal text-foreground outline-none transition-colors focus:border-primary"
            maxLength={60}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-foreground/80">
          답장 받을 이메일 선택
          <input
            type="email"
            value={senderEmail}
            onChange={(event) => setSenderEmail(event.target.value)}
            placeholder="name@example.com"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal text-foreground outline-none transition-colors focus:border-primary"
            maxLength={120}
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-foreground/80">
        문의 내용
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="서비스 오류, 경로 데이터 문제, 개선 아이디어를 적어주세요."
          className="min-h-40 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal leading-6 text-foreground outline-none transition-colors focus:border-primary"
          maxLength={2000}
          required
        />
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-foreground/55">
          공개된 화면에 글이 올라가지 않고 운영자 메일로만 전송됩니다.
        </p>
        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState === "submitting" ? "전송 중..." : "문의 보내기"}
        </button>
      </div>

      {statusMessage && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            submitState === "success" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-600"
          }`}
          role="status"
        >
          {statusMessage}
        </p>
      )}
    </form>
  );
}

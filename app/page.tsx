"use client";

import { useEffect, useRef, useState } from "react";
import { estimateDailyFootprint, type EstimateResult } from "@/lib/co2Estimate";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; result: EstimateResult };

function EstimateBubble({ result }: { result: EstimateResult }) {
  const hasStructured = result.structured.activities.length > 0;

  return (
    <div className="rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 shadow-lg shadow-black/15 sm:px-5 sm:py-4">
      {hasStructured && (
        <details className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-[var(--muted)]">
            Parsed structure (JSON)
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-[var(--bg)]/80 p-2 font-mono text-[11px] leading-relaxed text-[var(--accent)]/95">
            {JSON.stringify(result.structured, null, 2)}
          </pre>
        </details>
      )}

      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Estimated footprint
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]/90">
        From structured quantities + keyword matches (kg CO₂-eq, illustrative)
      </p>

      {result.howCalculated ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{result.howCalculated}</p>
      ) : null}

      <p className="mt-4 font-mono text-3xl font-semibold tabular-nums text-[var(--accent)] sm:text-4xl">
        {result.totalKg.toFixed(1)}
        <span className="ml-2 text-base font-normal text-[var(--muted)] sm:text-lg">kg CO₂-eq</span>
      </p>

      {result.lines.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4">
          {result.lines.map((line) => (
            <li
              key={line.label}
              className="flex items-center justify-between gap-3 text-sm text-[var(--text)]"
            >
              <span>{line.label}</span>
              <span className="shrink-0 font-mono tabular-nums text-[var(--muted)]">
                {line.kg >= 0 ? "+" : ""}
                {line.kg.toFixed(1)} kg
              </span>
            </li>
          ))}
        </ul>
      )}

      {result.suggestions.length > 0 ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Ideas to lower emissions
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[var(--text)]">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{result.note}</p>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now()}`;
    const result = estimateDailyFootprint(text);

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: assistantId, role: "assistant", result },
    ]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-2xl flex-col px-4">
      <header className="shrink-0 border-b border-[var(--border)]/80 py-4 text-center sm:py-5">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] sm:text-xs">
          MVP
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">EcoTrack</h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--muted)] sm:text-[15px]">
          Describe activities in plain language. We estimate a rough daily CO₂ footprint from keywords.
        </p>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center px-1 pb-8">
            <p className="text-center text-sm text-[var(--muted)]">Try an example:</p>
            <ul className="mx-auto mt-3 max-w-md space-y-2 text-center text-sm text-[var(--text)]">
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setDraft("Commuted by train, chicken salad for lunch, drove to the store")
                  }
                  className="rounded-lg px-2 py-1 text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:decoration-[var(--accent)]"
                >
                  Train + lunch + car
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setDraft("We used 5 delivery trucks and 200kWh")}
                  className="rounded-lg px-2 py-1 text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:decoration-[var(--accent)]"
                >
                  Trucks and electricity
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 pb-2">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--accent)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--bg)] sm:max-w-[78%]">
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full max-w-[92%] sm:max-w-[85%]">
                    <EstimateBubble result={msg.result} />
                  </div>
                )}
              </li>
            ))}
            <li ref={bottomRef} className="h-px shrink-0" aria-hidden />
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)]/80 bg-[var(--bg)]/95 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center text-[10px] text-[var(--muted)]/80">
          Keyword-based demo, not a life-cycle assessment.
        </p>
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1.5 pl-3 shadow-inner shadow-black/20">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message… (Enter to send, Shift+Enter for new line)"
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!draft.trim()}
            className="mb-0.5 shrink-0 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface-elevated)]"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}

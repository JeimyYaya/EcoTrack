"use client";

import { useState } from "react";
import { estimateDailyFootprint } from "@/lib/co2Estimate";

export default function Home() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const result = submitted ? estimateDailyFootprint(text) : null;

  function handleCalculate() {
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-12 sm:py-16">
      <header className="mb-10 text-center sm:mb-12">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          MVP
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">EcoTrack</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Describe your day in plain language. We estimate a rough daily CO₂ footprint from keywords
          (food, travel, home).
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-8">
        <label htmlFor="activities" className="mb-2 block text-sm font-medium text-[var(--muted)]">
          Today&apos;s activities
        </label>
        <textarea
          id="activities"
          rows={5}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSubmitted(false);
          }}
          placeholder="e.g. Commuted by train, had chicken salad for lunch, drove to the store in the evening, long hot shower…"
          className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[15px] text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
        />

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCalculate}
            className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
            Estimate CO₂ footprint
          </button>
          {submitted && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--text)]"
            >
              Clear result
            </button>
          )}
        </div>
      </section>

      {result && (
        <section
          className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 backdrop-blur-sm sm:p-8"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold text-white">Estimated footprint</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Sum of matched categories (kg CO₂-eq / day, illustrative)</p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-4xl font-semibold tabular-nums text-[var(--accent)] sm:text-5xl">
                {result.totalKg.toFixed(1)}
                <span className="ml-2 text-lg font-normal text-[var(--muted)] sm:text-xl">kg CO₂-eq</span>
              </p>
            </div>
          </div>

          {result.lines.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-6">
              {result.lines.map((line) => (
                <li
                  key={line.label}
                  className="flex items-center justify-between gap-4 text-sm text-[var(--text)]"
                >
                  <span>{line.label}</span>
                  <span className="font-mono tabular-nums text-[var(--muted)]">
                    {line.kg >= 0 ? "+" : ""}
                    {line.kg.toFixed(1)} kg
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">{result.note}</p>
        </section>
      )}

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--muted)]/80">
        EcoTrack — keyword-based demo, not a life-cycle assessment.
      </footer>
    </main>
  );
}

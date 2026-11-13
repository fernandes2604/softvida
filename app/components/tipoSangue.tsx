"use client";

import { useEffect, useState } from "react";

const bloodTypes = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;

// Quem pode receber sangue de cada tipo
const canDonateTo: Record<string, string[]> = {
  "O-": ["Todos os tipos"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export default function BloodTypeRotator() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  // Troca automática a cada 3,5s (respeita prefers-reduced-motion)
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % bloodTypes.length);
        setVisible(true);
      }, 250);
    }, 3500);
    return () => clearInterval(id);
  }, [paused]);

  const current = bloodTypes[index];

  return (
    <div
      className="flex flex-col items-center gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative flex h-[18rem] w-[18rem] items-center justify-center rounded-full border border-rose-500/30 bg-zinc-900/80 shadow-2xl shadow-rose-950/40 sm:h-[24rem] sm:w-[24rem]">
        <div className="absolute inset-4 rounded-full border border-rose-400/20" />
        <div className="absolute inset-10 rounded-full border border-rose-500/20" />
        <div
          className={`px-6 text-center transition-all duration-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          aria-live="polite"
        >
          <div className="text-7xl font-black text-white">{current}</div>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.22em] text-rose-300">Tipo sanguíneo</p>
          <p className="mt-4 text-sm text-zinc-300">
            Doa para: <span className="font-semibold text-white">{canDonateTo[current].join(", ")}</span>
          </p>
        </div>
      </div>

      <div className="flex max-w-xs flex-wrap justify-center gap-2" role="tablist" aria-label="Escolher tipo sanguíneo">
        {bloodTypes.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => { setIndex(i); setVisible(true); setPaused(true); }}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
              i === index
                ? "border-rose-500 bg-rose-600 text-white"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
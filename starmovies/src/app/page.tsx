"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import PlatformSlider from "@/components/PlatformSlider";
import StarField from "@/components/StarField";
import ShootingStarIntro from "@/components/ShootingStarIntro";

const TAGLINE = "Stream what the stars watch";

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);
  const [taglineChars, setTaglineChars] = useState(0);

  // Reveal tagline characters one-by-one after intro completes
  useEffect(() => {
    if (!introComplete) return;
    const delay = 600;  // start 600ms after hero fades in
    const interval = 38; // ms per character
    let i = 0;
    let iv: ReturnType<typeof setInterval> | null = null;
    const t = setTimeout(() => {
      iv = setInterval(() => {
        i++;
        setTaglineChars(i);
        if (i >= TAGLINE.length) clearInterval(iv!);
      }, interval);
    }, delay);
    // Cleanup both the outer timeout AND the inner interval
    return () => {
      clearTimeout(t);
      if (iv !== null) clearInterval(iv);
    };
  }, [introComplete]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── Persistent star field ─────────────────────────────── */}
      <StarField />

      {/* ── Intro overlay ────────────────────────────────────── */}
      <ShootingStarIntro onDone={() => setIntroComplete(true)} />

      {/* ── Main content ─────────────────────────────────────── */}
      <div
        style={{
          opacity: introComplete ? 1 : 0,
          transition: introComplete ? "opacity 0.7s ease 0.15s" : "none",
        }}
      >
        <Navbar />

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16 overflow-hidden">

          {/* Radial gold glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: "radial-gradient(ellipse 65% 45% at 50% 42%, rgba(245,197,24,0.07) 0%, transparent 70%)",
            }}
          />

          {/* Hero content — heroEntrance keyframe handles opacity 0→1 itself */}
          <div
            className="relative z-10 flex flex-col items-center gap-5 select-none"
            style={{
              opacity: 0,
              animation: introComplete ? "heroEntrance 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s forwards" : "none",
            }}
          >
            {/* Curved "STAR MOVIES" */}
            <svg
              viewBox="0 0 800 220"
              width="min(800px, 92vw)"
              height="auto"
              aria-label="Star Movies"
              className="overflow-visible"
            >
              <defs>
                <path id="textArc" d="M 60,180 Q 400,20 740,180" fill="none" />
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b8860b" />
                  <stop offset="35%" stopColor="#f5c518" />
                  <stop offset="60%" stopColor="#ffe580" />
                  <stop offset="100%" stopColor="#c8960c" />
                </linearGradient>
                <filter id="textGlow" x="-15%" y="-40%" width="130%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Shadow */}
              <text
                dy="5"
                fill="rgba(0,0,0,0.55)"
                fontSize="88"
                fontWeight="700"
                fontFamily="var(--font-space-mono), 'Space Mono', monospace"
                letterSpacing="0.08em"
              >
                <textPath href="#textArc" startOffset="50%" textAnchor="middle">
                  STAR MOVIES
                </textPath>
              </text>
              {/* Main */}
              <text
                fill="url(#goldGrad)"
                fontSize="88"
                fontWeight="700"
                fontFamily="var(--font-space-mono), 'Space Mono', monospace"
                letterSpacing="0.08em"
                filter="url(#textGlow)"
              >
                <textPath href="#textArc" startOffset="50%" textAnchor="middle">
                  STAR MOVIES
                </textPath>
              </text>
            </svg>

            {/* Tagline — character reveal */}
            <p
              aria-label={TAGLINE}
              className="text-center text-sm tracking-widest uppercase mt-1 h-5"
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.38em",
                minHeight: "1.25rem",
              }}
            >
              {TAGLINE.slice(0, taglineChars)}
              {taglineChars < TAGLINE.length && taglineChars > 0 && (
                <span
                  style={{
                    display: "inline-block",
                    width: "1px",
                    height: "0.9em",
                    background: "rgba(245,197,24,0.7)",
                    verticalAlign: "middle",
                    animation: "cursorBlink 0.7s step-end infinite",
                    marginLeft: "1px",
                  }}
                />
              )}
            </p>

            {/* Divider */}
            <div
              className="w-24 h-px"
              style={{
                background: "linear-gradient(to right, transparent, rgba(245,197,24,0.5), transparent)",
              }}
            />

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <a
                href="#"
                className="px-8 py-3 rounded-xl text-sm font-bold tracking-widest transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  background: "linear-gradient(135deg, #f5c518 0%, #e6a800 100%)",
                  color: "#0a0a0f",
                  letterSpacing: "0.12em",
                  boxShadow: "0 4px 24px rgba(245,197,24,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 36px rgba(245,197,24,0.55)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(245,197,24,0.3)";
                }}
              >
                Browse Movies
              </a>
              <a
                href="#"
                className="px-8 py-3 rounded-xl text-sm font-bold tracking-widest transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  letterSpacing: "0.12em",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "rgba(245,197,24,0.4)";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "rgba(255,255,255,0.18)";
                  el.style.color = "rgba(255,255,255,0.8)";
                }}
              >
                Browse Series
              </a>
            </div>

            {/* Scroll hint */}
            <div
              className="mt-10 flex flex-col items-center gap-1.5 opacity-30"
              style={{ animation: "scrollHint 2s ease-in-out infinite" }}
            >
              <span
                className="text-[9px] tracking-[0.4em] uppercase"
                style={{ fontFamily: "var(--font-space-mono), monospace" }}
              >
                Scroll
              </span>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <path d="M6 0v14M1 9l5 6 5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Bottom fade */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-36 z-0"
            style={{ background: "linear-gradient(to bottom, transparent, #0a0a0f)" }}
          />
        </section>

        {/* ── Platform Slider ─────────────────────────────────── */}
        <section className="relative z-10 w-full py-16 overflow-hidden">
          <div className="flex flex-col items-center gap-3 mb-10">
            <p
              className="text-[10px] tracking-widest uppercase"
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.45em",
              }}
            >
              Streaming platforms supported
            </p>
            <div
              className="w-16 h-px"
              style={{
                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
              }}
            />
          </div>
          <PlatformSlider />
        </section>
      </div>
    </div>
  );
}

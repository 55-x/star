"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ShootingStarIntro — v2
 *
 * Phase 0 — dark sky, bg stars twinkle (400ms)
 * Phase 1 — shooting star travels on curved bezier path
 * Phase 2 — impact: shockwave ring + debris particles + flash
 * Phase 3 — "STAR MOVIES" curved text fades in + tagline chars
 * Phase 4 — curtain lifts (translateY up) revealing hero
 * Phase 5 — done, unmounts
 */

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

interface Debris {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  r: number; hue: number;
}

interface Ring {
  r: number; maxR: number;
  alpha: number;
}

export default function ShootingStarIntro({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>(0);
  const [curtainUp, setCurtainUp] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const rafRef = useRef<number>(0);
  const debrisRef = useRef<Debris[]>([]);
  const ringsRef = useRef<Ring[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;

    // ── Bezier control points ────────────────────────────────
    // Star enters top-left, curves through the screen center
    const P0 = { x: W * 0.04, y: H * 0.06 };
    const P1 = { x: W * 0.25, y: H * 0.15 };
    const P2 = { x: W * 0.38, y: H * 0.55 };
    const P3 = { x: W * 0.50, y: H * 0.44 };

    function bezier(t: number) {
      const u = 1 - t;
      return {
        x: u*u*u*P0.x + 3*u*u*t*P1.x + 3*u*t*t*P2.x + t*t*t*P3.x,
        y: u*u*u*P0.y + 3*u*u*t*P1.y + 3*u*t*t*P2.y + t*t*t*P3.y,
      };
    }

    // ── Background stars ────────────────────────────────────
    type BGStar = { x: number; y: number; r: number; a: number; speed: number; off: number };
    const bgStars: BGStar[] = Array.from({ length: 320 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.3 + Math.random() * 1.3,
      a: 0.08 + Math.random() * 0.55,
      speed: 0.3 + Math.random() * 1.2,
      off: Math.random() * Math.PI * 2,
    }));

    function drawBgStars(elapsed: number) {
      for (const s of bgStars) {
        const tw = Math.sin(elapsed * 0.001 * s.speed + s.off);
        const alpha = Math.max(0.04, s.a + tw * 0.2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,215,255,${alpha})`;
        ctx.fill();
      }
    }

    // ── Spawn debris on impact ───────────────────────────────
    function spawnDebris(cx: number, cy: number) {
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 6;
        debrisRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, maxLife: 35 + Math.random() * 40,
          r: 0.8 + Math.random() * 2.5,
          hue: Math.random() < 0.6 ? 45 : Math.random() < 0.5 ? 30 : 55,
        });
      }
      // Shockwave rings
      ringsRef.current = [
        { r: 0, maxR: 220, alpha: 0.8 },
        { r: 0, maxR: 160, alpha: 0.5 },
      ];
    }

    function drawDebrisAndRings(cx: number, cy: number) {
      // Rings
      for (const ring of ringsRef.current) {
        ring.r += 7;
        ring.alpha *= 0.88;
        if (ring.alpha < 0.01) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245,197,24,${ring.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Debris
      for (let i = debrisRef.current.length - 1; i >= 0; i--) {
        const d = debrisRef.current[i];
        // Remove first if expired — avoids drawing at lf <= 0
        if (d.life >= d.maxLife) { debrisRef.current.splice(i, 1); continue; }
        d.x += d.vx; d.y += d.vy;
        d.vy += 0.08; // gravity
        d.vx *= 0.97; d.vy *= 0.97;
        d.life++;
        const lf = Math.max(0, 1 - d.life / d.maxLife);
        if (lf <= 0) { debrisRef.current.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, Math.max(0.1, d.r * lf), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue},100%,70%,${lf * 0.9})`;
        ctx.fill();
      }
    }

    // ── Main animation ───────────────────────────────────────
    const TRAVEL_DURATION = 1100;
    const TRAIL_SAMPLES = 24; // pre-compute bezier points for trail

    let startTime: number | null = null;
    let impactTime: number | null = null;
    let animState: "travel" | "impact" | "hold" = "travel";
    let impactX = P3.x, impactY = P3.y;

    function easeShoot(t: number) {
      // Fast start, smooth decelerate (circ ease-out feel)
      return 1 - Math.pow(1 - t, 2.2);
    }

    function drawShooting(progress: number) {
      // Multi-segment trail along the bezier
      const headT = progress;
      const tailT = Math.max(0, progress - 0.28);
      const head = bezier(headT);
      const steps = TRAIL_SAMPLES;

      // Build gradient along curve
      for (let i = 0; i < steps; i++) {
        const t0 = tailT + (headT - tailT) * (i / steps);
        const t1 = tailT + (headT - tailT) * ((i + 1) / steps);
        const a = bezier(t0);
        const b = bezier(t1);
        const segFrac = i / steps;
        const alpha = segFrac * segFrac * 0.9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255,240,160,${alpha})`;
        ctx.lineWidth = 1.5 + segFrac * 2;
        ctx.shadowColor = `rgba(255,215,60,${alpha})`;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Head glow
      const hg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 22);
      hg.addColorStop(0, "rgba(255,255,230,1)");
      hg.addColorStop(0.35, "rgba(255,220,60,0.7)");
      hg.addColorStop(1, "rgba(255,180,0,0)");
      ctx.beginPath();
      ctx.arc(head.x, head.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();

      // Micro sparkles around head
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + progress * 12;
        const dist = 8 + Math.sin(progress * 20 + i) * 5;
        const sx = head.x + Math.cos(ang) * dist;
        const sy = head.y + Math.sin(ang) * dist;
        const sa = 0.2 + Math.abs(Math.sin(progress * 15 + i * 0.7)) * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6 + Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,150,${sa})`;
        ctx.fill();
      }
    }

    function drawImpactFlash(flash: number, cx: number, cy: number) {
      const r = 260 * flash;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, `rgba(255,255,220,${flash * 0.95})`);
      grd.addColorStop(0.15, `rgba(255,220,60,${flash * 0.7})`);
      grd.addColorStop(0.5, `rgba(245,197,24,${flash * 0.3})`);
      grd.addColorStop(1, "rgba(245,197,24,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Burst rays
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const len = (40 + (i % 4) * 22) * flash;
        const lineAlpha = flash * 0.55;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.strokeStyle = `rgba(255,240,150,${lineAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    function loop(ts: number) {
      if (startTime === null) startTime = ts;
      const elapsed = ts - startTime;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);
      drawBgStars(elapsed);

      if (animState === "travel") {
        const raw = Math.min(1, elapsed / TRAVEL_DURATION);
        const progress = easeShoot(raw);
        drawShooting(progress);
        if (raw >= 1) {
          animState = "impact";
          impactTime = ts;
          const pos = bezier(1);
          impactX = pos.x; impactY = pos.y;
          spawnDebris(impactX, impactY);
        }
      } else if (animState === "impact") {
        const ie = ts - impactTime!;
        const flash = Math.max(0, 1 - ie / 700);
        drawImpactFlash(flash, impactX, impactY);
        drawDebrisAndRings(impactX, impactY);

        if (flash <= 0) {
          animState = "hold";
          setPhase(2); // show SVG text
          setTimeout(() => setShowTagline(true), 600);
          setTimeout(() => {
            setCurtainUp(true);
            setTimeout(() => { setPhase(5); onDone(); }, 950);
          }, 2200);
        }
      } else {
        // Hold — keep drawing debris & rings until both are exhausted
        const hasDebris = debrisRef.current.length > 0;
        const hasRings = ringsRef.current.some(r => r.alpha > 0.01);
        if (hasDebris || hasRings) drawDebrisAndRings(impactX, impactY);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    const timeout = setTimeout(() => {
      setPhase(1);
      rafRef.current = requestAnimationFrame(loop);
    }, 350);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 5) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{
        background: "#0a0a0f",
        transform: curtainUp ? "translateY(-100%)" : "translateY(0)",
        transition: curtainUp ? "transform 0.95s cubic-bezier(0.76,0,0.24,1)" : "none",
      }}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 w-full h-full" />

      {/* ── STAR MOVIES text after impact ─────────────────────── */}
      {phase >= 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none">
          {/* Curved title */}
          <svg
            viewBox="0 0 800 220"
            width="min(800px, 92vw)"
            height="auto"
            aria-hidden
            className="overflow-visible"
            style={{
              animation: "introTextFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) forwards",
              opacity: 0,
            }}
          >
            <defs>
              <path id="introArc" d="M 60,180 Q 400,20 740,180" fill="none" />
              <linearGradient id="introGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b8860b" />
                <stop offset="35%" stopColor="#f5c518" />
                <stop offset="60%" stopColor="#ffe580" />
                <stop offset="100%" stopColor="#c8960c" />
              </linearGradient>
              <filter id="introGlow" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Shadow */}
            <text
              dy="5" fill="rgba(0,0,0,0.55)"
              fontSize="88" fontWeight="700"
              fontFamily="var(--font-space-mono),'Space Mono',monospace"
              letterSpacing="0.08em"
            >
              <textPath href="#introArc" startOffset="50%" textAnchor="middle">STAR MOVIES</textPath>
            </text>
            {/* Main */}
            <text
              fill="url(#introGold)" fontSize="88" fontWeight="700"
              fontFamily="var(--font-space-mono),'Space Mono',monospace"
              letterSpacing="0.08em" filter="url(#introGlow)"
            >
              <textPath href="#introArc" startOffset="50%" textAnchor="middle">STAR MOVIES</textPath>
            </text>
          </svg>

          {/* Tagline — character reveal */}
          {showTagline && (
            <p
              className="text-xs tracking-widest uppercase"
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.42em",
                animation: "introTagline 0.6s ease forwards",
                opacity: 0,
              }}
            >
              Stream what the stars watch
            </p>
          )}
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{
          background: "linear-gradient(to right, rgba(245,197,24,0.8), rgba(255,240,100,0.4))",
          width: phase >= 2 ? "100%" : phase === 1 ? "55%" : "0%",
          transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 0 8px rgba(245,197,24,0.6)",
        }}
      />

      {/* ── Skip button ───────────────────────────────────────── */}
      <button
        className="absolute bottom-6 right-8 text-xs tracking-widest uppercase"
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.22em",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
        onClick={() => {
          cancelAnimationFrame(rafRef.current);
          setCurtainUp(true);
          setTimeout(() => { setPhase(5); onDone(); }, 950);
        }}
      >
        Skip intro ›
      </button>
    </div>
  );
}

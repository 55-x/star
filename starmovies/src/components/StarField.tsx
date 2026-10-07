"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number;
  baseX: number; baseY: number;
  r: number;
  alpha: number; baseAlpha: number;
  twinkleSpeed: number; twinkleOffset: number;
  pf: number;       // parallax factor 0..1
  hue: number;      // 0=blue-white, 1=warm-gold, 2=cold-blue, 3=red
  layer: number;    // 0=deep 1=mid 2=near
}

interface AmbientShooter {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  tailLen: number;
}

interface Nebula {
  x: number; y: number;
  rx: number; ry: number;
  hue: number;
  alpha: number;
}

const STAR_COUNT = 400;
const NEBULA_COUNT = 4;

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const lerpMouse = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const shootersRef = useRef<AmbientShooter[]>([]);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const nextShooterRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    /* ── resize ─────────────────────────────────────────────── */
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      lerpMouse.current = { x: canvas.width / 2, y: canvas.height / 2 };
      mouse.current = { x: canvas.width / 2, y: canvas.height / 2 };
      seedAll();
    }

    /* ── seed ───────────────────────────────────────────────── */
    function seedAll() {
      const W = canvas.width, H = canvas.height;
      const hues = [0, 0, 0, 1, 2, 3]; // weighted toward white-blue

      starsRef.current = Array.from({ length: STAR_COUNT }, () => {
        const layer = Math.floor(Math.random() * 3);
        const bx = Math.random() * W;
        const by = Math.random() * H;
        const ba = 0.15 + Math.random() * 0.75;
        return {
          x: bx, y: by,
          baseX: bx, baseY: by,
          r: 0.3 + Math.random() * (layer === 2 ? 1.8 : layer === 1 ? 1.2 : 0.7),
          alpha: ba, baseAlpha: ba,
          twinkleSpeed: 0.3 + Math.random() * 1.4,
          twinkleOffset: Math.random() * Math.PI * 2,
          pf: layer === 0 ? 0.01 + Math.random() * 0.04
            : layer === 1 ? 0.05 + Math.random() * 0.07
            : 0.12 + Math.random() * 0.12,
          hue: hues[Math.floor(Math.random() * hues.length)],
          layer,
        };
      });

      nebulaeRef.current = Array.from({ length: NEBULA_COUNT }, () => ({
        x: 0.1 * W + Math.random() * 0.8 * W,
        y: 0.1 * H + Math.random() * 0.8 * H,
        rx: 120 + Math.random() * 240,
        ry: 80 + Math.random() * 160,
        hue: Math.random() < 0.5 ? 220 : Math.random() < 0.5 ? 260 : 30,
        alpha: 0.018 + Math.random() * 0.022,
      }));
    }

    /* ── star colour ────────────────────────────────────────── */
    function starColor(s: Star, a: number): string {
      switch (s.hue) {
        case 1: return `rgba(255,${210 + Math.round(Math.random() * 10)},120,${a})`;
        case 2: return `rgba(160,185,255,${a})`;
        case 3: return `rgba(255,160,130,${a})`;
        default: return `rgba(210,220,255,${a})`;
      }
    }

    /* ── spawn ambient shooters ─────────────────────────────── */
    function spawnShooter() {
      const W = canvas.width, H = canvas.height;
      const angle = -Math.PI / 6 + (Math.random() - 0.5) * (Math.PI / 5);
      const speed = 4 + Math.random() * 5;
      const edge = Math.random();
      let sx: number, sy: number;
      if (edge < 0.5) { sx = Math.random() * W; sy = -10; }
      else { sx = -10; sy = Math.random() * H * 0.6; }
      shootersRef.current.push({
        x: sx, y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle + Math.PI / 2) * speed,
        life: 0, maxLife: 60 + Math.random() * 60,
        tailLen: 60 + Math.random() * 100,
      });
    }

    /* ── draw nebulae ───────────────────────────────────────── */
    function drawNebulae() {
      for (const n of nebulaeRef.current) {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.scale(1, n.ry / n.rx);
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
        grd.addColorStop(0, `hsla(${n.hue},70%,60%,${n.alpha})`);
        grd.addColorStop(1, `hsla(${n.hue},70%,60%,0)`);
        ctx.beginPath();
        ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.restore();
      }
    }

    /* ── draw ambient shooters ──────────────────────────────── */
    function drawShooters() {
      for (let i = shootersRef.current.length - 1; i >= 0; i--) {
        const s = shootersRef.current[i];
        s.x += s.vx; s.y += s.vy; s.life++;
        if (s.life >= s.maxLife) { shootersRef.current.splice(i, 1); continue; }
        const lifeFrac = s.life / s.maxLife;
        const a = lifeFrac < 0.2 ? lifeFrac / 0.2 : lifeFrac > 0.7 ? (1 - lifeFrac) / 0.3 : 1;
        const speed = Math.hypot(s.vx, s.vy) || 1; // guard against zero-speed
        const tx = s.x - s.vx * (s.tailLen / speed);
        const ty = s.y - s.vy * (s.tailLen / speed);
        const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, `rgba(255,245,180,0)`);
        grad.addColorStop(0.5, `rgba(255,240,160,${a * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,220,${a * 0.85})`);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = `rgba(255,230,100,${a * 0.6})`;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    /* ── main draw loop ─────────────────────────────────────── */
    function draw() {
      tRef.current += 0.016;
      const t = tRef.current;
      const W = canvas.width, H = canvas.height;

      // Lerp mouse (smooth 8% per frame)
      lerpMouse.current.x += (mouse.current.x - lerpMouse.current.x) * 0.06;
      lerpMouse.current.y += (mouse.current.y - lerpMouse.current.y) * 0.06;

      ctx.clearRect(0, 0, W, H);

      drawNebulae();

      const cx = W / 2, cy = H / 2;
      const dx = lerpMouse.current.x - cx;
      const dy = lerpMouse.current.y - cy;

      for (const s of starsRef.current) {
        const maxShift = s.layer === 2 ? 50 : s.layer === 1 ? 22 : 8;
        s.x = s.baseX - dx * s.pf * (maxShift / (W / 2));
        s.y = s.baseY - dy * s.pf * (maxShift / (H / 2));

        const dist = Math.hypot(lerpMouse.current.x - s.x, lerpMouse.current.y - s.y);
        const proximity = Math.max(0, 1 - dist / 180);
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        const pulse = s.layer === 2 ? Math.abs(Math.sin(t * 0.4 + s.twinkleOffset * 0.5)) * 0.12 : 0;
        s.alpha = s.baseAlpha + twinkle * 0.2 + proximity * 0.45 + pulse;
        s.alpha = Math.min(1, Math.max(0.03, s.alpha));

        // Draw star
        const r = s.r + proximity * 0.9;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = starColor(s, s.alpha);
        ctx.fill();

        // Cross sparkle on bright nearby foreground stars
        if (proximity > 0.45 && s.r > 0.8 && s.layer > 0) {
          const len = r * 3.5 + proximity * 5;
          const sa = proximity * 0.55;
          ctx.strokeStyle = `rgba(255,245,200,${sa})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
          ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
          // diagonal arms slightly shorter
          const d = len * 0.55;
          ctx.moveTo(s.x - d, s.y - d); ctx.lineTo(s.x + d, s.y + d);
          ctx.moveTo(s.x + d, s.y - d); ctx.lineTo(s.x - d, s.y + d);
          ctx.stroke();
        }
      }

      // Ambient shooting stars
      nextShooterRef.current -= 1;
      if (nextShooterRef.current <= 0) {
        spawnShooter();
        nextShooterRef.current = 280 + Math.random() * 320;
      }
      drawShooters();

      // Cursor-following subtle aura (only after first real mousemove)
      if (mouse.current.x > -9000) {
        const aura = ctx.createRadialGradient(
          lerpMouse.current.x, lerpMouse.current.y, 0,
          lerpMouse.current.x, lerpMouse.current.y, 160
        );
        aura.addColorStop(0, "rgba(245,197,24,0.04)");
        aura.addColorStop(1, "rgba(245,197,24,0)");
        ctx.beginPath();
        ctx.arc(lerpMouse.current.x, lerpMouse.current.y, 160, 0, Math.PI * 2);
        ctx.fillStyle = aura;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.current = { x: e.clientX, y: e.clientY };
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

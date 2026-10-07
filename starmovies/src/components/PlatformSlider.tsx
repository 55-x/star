"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const platforms = [
  {
    name: "Netflix",
    accent: "#E50914",
    logo: (
      <Image
        src="/netflix.png"
        alt="Netflix"
        width={0}
        height={34}
        style={{ objectFit: "contain", width: "auto", height: 34 }}
      />
    ),
  },
  {
    name: "Apple TV+",
    accent: "#ffffff",
    logo: (
      <Image
        src="/appletv.webp"
        alt="Apple TV+"
        width={0}
        height={56}
        style={{ objectFit: "contain", width: "auto", height: 56 }}
      />
    ),
  },
  {
    name: "Hulu",
    accent: "#1CE783",
    logo: (
      <Image
        src="/hulu.webp"
        alt="Hulu"
        width={0}
        height={36}
        style={{ objectFit: "contain", width: "auto", height: 36 }}
      />
    ),
  },
  {
    name: "Disney+",
    accent: "#113ccf",
    logo: (
      /* disney.svg is a vector — render as <img> so the SVG scales cleanly */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/disney.svg"
        alt="Disney+"
        height={38}
        style={{ objectFit: "contain", width: "auto", height: 38 }}
      />
    ),
  },
  {
    name: "Prime Video",
    accent: "#00A8E1",
    logo: (
      <Image
        src="/prime.svg.webp"
        alt="Prime Video"
        width={0}
        height={34}
        style={{ objectFit: "contain", width: "auto", height: 34 }}
      />
    ),
  },
];

// Triple for seamless loop
const allPlatforms = [...platforms, ...platforms, ...platforms];

function PlatformCard({ p }: { p: typeof platforms[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-10 py-6 mx-2.5 rounded-2xl cursor-pointer"
      style={{
        minWidth: 160,
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: hovered ? `1px solid ${p.accent}44` : "1px solid rgba(255,255,255,0.06)",
        boxShadow: hovered ? `0 0 24px ${p.accent}22, inset 0 0 12px ${p.accent}10` : "none",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-3px) scale(1.03)" : "translateY(0) scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          filter: hovered ? "none" : "grayscale(1) brightness(0.45)",
          transition: "filter 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 60,
        }}
      >
        {p.logo}
      </div>
      <span
        className="text-[10px] tracking-widest uppercase"
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)",
          letterSpacing: "0.25em",
          transition: "color 0.3s",
        }}
      >
        {p.name}
      </span>
    </div>
  );
}

export default function PlatformSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex items-center"
        style={{
          animation: "slider-scroll 28s linear infinite",
          animationPlayState: paused ? "paused" : "running",
          width: "max-content",
        }}
      >
        {allPlatforms.map((p, i) => (
          <PlatformCard key={`${p.name}-${i}`} p={p} />
        ))}
      </div>
    </div>
  );
}

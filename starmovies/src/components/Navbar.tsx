"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const PLATFORM_SLUGS: Record<string, string> = {
  "Netflix": "netflix",
  "Apple TV": "apple-tv",
  "Hulu": "hulu",
  "Disney+": "disney-plus",
  "Prime": "prime",
};

const NAV_ITEMS = [
  {
    label: "MOVIES",
    href: "/movies",
    sections: [
      {
        heading: "New Releases",
        items: [{ label: "New Releases", href: "/movies?tab=now_playing" }],
      },
      {
        heading: "Platforms",
        items: [
          "Netflix", "Apple TV", "Hulu", "Disney+", "Prime",
        ].map(p => ({ label: p, href: `/movies?platform=${PLATFORM_SLUGS[p]}` })),
      },
    ],
  },
  {
    label: "SERIES",
    href: "/series",
    sections: [
      {
        heading: "New Releases",
        items: [{ label: "New Releases", href: "/series?tab=on_the_air" }],
      },
      {
        heading: "Platforms",
        items: [
          "Netflix", "Apple TV", "Hulu", "Disney+", "Prime",
        ].map(p => ({ label: p, href: `/series?platform=${PLATFORM_SLUGS[p]}` })),
      },
    ],
  },
];

/** 4-point star SVG icon */
function StarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2 L13.5 10 L21 12 L13.5 14 L12 22 L10.5 14 L3 12 L10.5 10 Z"
        fill="#f5c518"
        style={{ filter: "drop-shadow(0 0 4px rgba(245,197,24,0.8))" }}
      />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(10,10,15,0.96)"
          : "rgba(10,10,15,0.6)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(245,197,24,0.12)"
          : "1px solid rgba(255,255,255,0.04)",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <Link href="/" className="flex items-center gap-2 select-none group">
        <StarIcon size={18} />
        <span
          className="text-xl font-bold tracking-widest uppercase"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            letterSpacing: "0.22em",
          }}
        >
          <span
            className="transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            star
          </span>
          <span
            className="transition-all duration-200"
            style={{
              color: "#f5c518",
              textShadow: "0 0 12px rgba(245,197,24,0.5)",
            }}
          >
            movies
          </span>
        </span>
      </Link>

      {/* ── Nav links ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isOpen = open === item.label;
          return (
            <div key={item.label} className="relative">
              <button
                className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold tracking-widest rounded-md overflow-hidden group/btn"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  color: isOpen ? "#f5c518" : "rgba(255,255,255,0.75)",
                  letterSpacing: "0.18em",
                  transition: "color 0.2s",
                }}
                onMouseEnter={() => setOpen(item.label)}
                onClick={() => setOpen(isOpen ? null : item.label)}
              >
                {/* Hover background pill */}
                <span
                  className="absolute inset-0 rounded-md transition-opacity duration-200"
                  style={{
                    background: "rgba(245,197,24,0.07)",
                    opacity: isOpen ? 1 : 0,
                  }}
                />
                <span className="relative z-10">{item.label}</span>
                <svg
                  width="10" height="6" viewBox="0 0 10 6" fill="none"
                  className="relative z-10"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                    color: isOpen ? "#f5c518" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Active underline */}
                <span
                  className="absolute bottom-0 left-3 right-3 h-[1.5px] rounded-full"
                  style={{
                    background: "#f5c518",
                    transform: isOpen ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow: "0 0 6px rgba(245,197,24,0.6)",
                  }}
                />
              </button>

              {/* ── Dropdown ───────────────────────────────────── */}
              {isOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-52 rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(14,14,22,0.98)",
                    border: "1px solid rgba(245,197,24,0.1)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                    animation: "dropdownIn 0.18s cubic-bezier(0.22,1,0.36,1) forwards",
                  }}
                  onMouseLeave={() => setOpen(null)}
                >
                  {item.sections.map((section, si) => (
                    <div key={section.heading}>
                      {si > 0 && (
                        <div
                          className="mx-4 my-1 h-px"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        />
                      )}
                      <div
                        className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-[0.25em] uppercase"
                        style={{
                          color: "#f5c518",
                          fontFamily: "var(--font-space-mono), monospace",
                        }}
                      >
                        {section.heading}
                      </div>
                      {section.items.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          onClick={() => setOpen(null)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all duration-150"
                          style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-geist-sans), sans-serif" }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement;
                            el.style.color = "#fff";
                            el.style.background = "rgba(245,197,24,0.06)";
                            el.style.paddingLeft = "20px";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement;
                            el.style.color = "rgba(255,255,255,0.6)";
                            el.style.background = "transparent";
                            el.style.paddingLeft = "16px";
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full shrink-0"
                            style={{ background: "rgba(245,197,24,0.4)" }}
                          />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                  <div className="h-2" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Right CTA ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          className="text-sm font-medium tracking-wider transition-all duration-200"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.1em",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.5)"; }}
        >
          Sign in
        </a>
        <a
          href="#"
          className="relative px-5 py-2 text-sm font-bold rounded-lg tracking-wider overflow-hidden transition-all duration-200 hover:scale-105"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            background: "linear-gradient(135deg, #f5c518 0%, #e6a800 100%)",
            color: "#0a0a0f",
            letterSpacing: "0.1em",
            boxShadow: "0 2px 16px rgba(245,197,24,0.25)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 28px rgba(245,197,24,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 16px rgba(245,197,24,0.25)";
          }}
        >
          Join Free
        </a>
      </div>
    </nav>
  );
}

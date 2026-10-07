"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { getMovieDetail, posterUrl, backdropUrl, type Movie } from "@/lib/tmdb";

// ── Stream sources ────────────────────────────────────────
//
// VidCore     – https://vidcore.org/embed/movie/{tmdb_id}
// SuperEmbed  – https://multiembed.mov/?video_id={tmdb_id}&tmdb=1
// SuperEmbed VIP – https://multiembed.mov/directstream.php?video_id={tmdb_id}&tmdb=1

interface Source {
  id: string;
  label: string;
  badge?: string;
  url: (tmdbId: string) => string;
}

const SOURCES: Source[] = [
  {
    id: "vidcore",
    label: "VidCore",
    url: id => `https://vidcore.org/embed/movie/${id}`,
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    url: id => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: "superembed-vip",
    label: "SuperEmbed",
    badge: "VIP",
    url: id => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
  },
];

// ── Fullscreen icon components ────────────────────────────

function IconExpand() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconCollapse() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

// ── Player ────────────────────────────────────────────────

function Player({ movieId }: { movieId: string }) {
  const [activeId, setActiveId] = useState(SOURCES[0].id);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = SOURCES.find(s => s.id === activeId) ?? SOURCES[0];
  const src = active.url(movieId);

  // ── Sync state with browser fullscreen events ─────────
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen({ navigationUI: "hide" }).catch(() => {/* browser may deny */});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── Keyboard: F to toggle, Escape already handled by browser
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't steal keys when focus is inside an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen]);

  function selectSource(id: string) {
    setActiveId(id);
    setIframeKey(k => k + 1);
  }

  return (
    <div>
      {/* ── Source switcher + fullscreen toggle row ─────── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="text-[10px] tracking-[0.25em] uppercase mr-1"
          style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.3)" }}
        >
          Source
        </span>

        {SOURCES.map(s => {
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => selectSource(s.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                background: isActive ? "rgba(245,197,24,0.15)" : "rgba(255,255,255,0.05)",
                border: isActive ? "1px solid rgba(245,197,24,0.45)" : "1px solid rgba(255,255,255,0.08)",
                color: isActive ? "#f5c518" : "rgba(255,255,255,0.45)",
              }}
            >
              {s.label}
              {s.badge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    background: isActive ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.1)",
                    color: isActive ? "#f5c518" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {s.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Fullscreen toggle button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            background: isFullscreen ? "rgba(245,197,24,0.15)" : "rgba(255,255,255,0.05)",
            border: isFullscreen ? "1px solid rgba(245,197,24,0.45)" : "1px solid rgba(255,255,255,0.08)",
            color: isFullscreen ? "#f5c518" : "rgba(255,255,255,0.45)",
          }}
        >
          {isFullscreen ? <IconCollapse /> : <IconExpand />}
          <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
        </button>
      </div>

      {/* ── Player container — fullscreen target ─────────── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl group"
        style={{
          aspectRatio: isFullscreen ? undefined : "16/9",
          background: "#000",
          // When fullscreen: fill the entire screen
          ...(isFullscreen && {
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            borderRadius: 0,
            aspectRatio: undefined,
          }),
        }}
      >
        <iframe
          key={iframeKey}
          src={src}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="origin"
          title="Movie player"
          style={{ border: "none" }}
        />

        {/* Fullscreen overlay button (appears on hover when not fullscreen) */}
        {!isFullscreen && (
          <button
            onClick={toggleFullscreen}
            aria-label="Enter fullscreen"
            className="absolute bottom-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <IconExpand />
          </button>
        )}

        {/* Exit fullscreen overlay button (always visible when fullscreen) */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            aria-label="Exit fullscreen"
            className="absolute top-4 right-4 p-2.5 rounded-xl transition-opacity duration-200"
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 10000,
            }}
          >
            <IconCollapse />
          </button>
        )}
      </div>

      {/* Source note */}
      <p
        className="mt-2 text-[10px] text-right"
        style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.18)" }}
      >
        {active.label}{active.badge ? ` ${active.badge}` : ""} · Press <kbd style={{ fontFamily: "inherit", background: "rgba(255,255,255,0.08)", padding: "0 4px", borderRadius: 3 }}>F</kbd> for fullscreen
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

function formatRuntime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function RatingBadge({ value }: { value: number }) {
  const color = value >= 7.5 ? "#22c55e" : value >= 6 ? "#f5c518" : "#ef4444";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        fontFamily: "var(--font-space-mono), monospace",
      }}
    >
      ★ {value.toFixed(1)}
    </span>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-2.5 py-1 rounded-lg text-xs"
      style={{
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.65)",
        fontFamily: "var(--font-space-mono), monospace",
      }}
    >
      {children}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pt-24 px-4 sm:px-8 max-w-7xl mx-auto pb-20">
      <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="flex gap-2 mb-2">
        {[72, 88, 100].map(w => (
          <div key={w} className="h-7 rounded-lg" style={{ width: w, background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
      <div className="w-full rounded-xl" style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.04)" }} />
      <div className="flex gap-6 mt-6">
        <div className="hidden sm:block w-36 shrink-0 rounded-xl" style={{ aspectRatio: "2/3", background: "rgba(255,255,255,0.04)" }} />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="flex gap-2">
            {[80, 60, 90, 70].map(w => (
              <div key={w} className="h-6 rounded-lg" style={{ width: w, background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
          <div className="space-y-2">
            {[100, 95, 88, 70].map(w => (
              <div key={w} className="h-3 rounded" style={{ width: `${w}%`, background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMovieDetail(id);
        if (!cancelled) setMovie(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load movie");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const backdrop = backdropUrl(movie?.backdrop_path ?? null, "w1280");
  const poster = posterUrl(movie?.poster_path ?? null, "w500");
  const year = movie?.release_date?.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <StarField />

      {/* Backdrop blurred ambient */}
      {backdrop && (
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backdrop})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "blur(60px) saturate(0.5)",
            opacity: 0.12,
            transform: "scale(1.1)",
          }}
        />
      )}

      <Navbar />

      {loading && <DetailSkeleton />}

      {error && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4">
          <p
            className="text-sm"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.4)" }}
          >
            {error}
          </p>
          <Link
            href="/movies"
            className="text-xs text-[#f5c518] hover:underline"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            ← Back to movies
          </Link>
        </div>
      )}

      {!loading && movie && (
        <main
          className="relative z-10 pt-24 pb-24 px-4 sm:px-8 max-w-7xl mx-auto"
          style={{ animation: "cardEntrance 0.5s ease both" }}
        >
          {/* Back link */}
          <Link
            href="/movies"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase mb-8 transition-colors hover:text-[#f5c518]"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.35)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Movies
          </Link>

          {/* ── Player with source switcher ─────────────────── */}
          <Player movieId={id} />

          {/* ── Info row ────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-6 mt-8">

            {/* Poster */}
            {poster && (
              <div
                className="hidden sm:block shrink-0 rounded-xl overflow-hidden shadow-2xl"
                style={{ width: 150, aspectRatio: "2/3", position: "relative" }}
              >
                <Image
                  src={poster}
                  alt={movie.title}
                  fill
                  sizes="150px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Text info */}
            <div className="flex-1 min-w-0">
              {/* Title + year */}
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <h1
                  className="text-2xl sm:text-3xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-space-mono), monospace" }}
                >
                  {movie.title}
                </h1>
                {year && (
                  <span
                    className="text-lg"
                    style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-space-mono), monospace" }}
                  >
                    {year}
                  </span>
                )}
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <RatingBadge value={movie.vote_average} />
                {movie.runtime ? <MetaChip>{formatRuntime(movie.runtime)}</MetaChip> : null}
                {movie.genres?.map(g => <MetaChip key={g.id}>{g.name}</MetaChip>)}
                {movie.original_language && movie.original_language !== "en" && (
                  <MetaChip>{movie.original_language.toUpperCase()}</MetaChip>
                )}
              </div>

              {/* Tagline */}
              {movie.tagline && (
                <p
                  className="italic mb-3 text-sm"
                  style={{ color: "rgba(245,197,24,0.7)", fontFamily: "var(--font-geist-sans), sans-serif" }}
                >
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Overview */}
              {movie.overview && (
                <p
                  className="text-sm max-w-2xl"
                  style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-geist-sans), sans-serif", lineHeight: 1.75 }}
                >
                  {movie.overview}
                </p>
              )}

              {/* Vote count */}
              <p
                className="mt-4 text-[11px]"
                style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-space-mono), monospace" }}
              >
                {movie.vote_count.toLocaleString()} votes
              </p>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

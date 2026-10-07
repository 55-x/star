"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { getTVDetail, posterUrl, backdropUrl, type TVShow, type Season } from "@/lib/tmdb";

// ── Stream source builders ─────────────────────────────────
//
// VidCore TV  – https://vidcore.org/embed/tv/{tmdb_id}?season={s}&episode={e}
// SuperEmbed  – https://multiembed.mov/?video_id={id}&tmdb=1&s={s}&e={e}
// SuperEmbed VIP – https://multiembed.mov/directstream.php?video_id={id}&tmdb=1&s={s}&e={e}

interface Source {
  id: string;
  label: string;
  badge?: string;
  url: (tmdbId: string, season: number, episode: number) => string;
}

const SOURCES: Source[] = [
  {
    id: "vidcore",
    label: "VidCore",
    url: (id, s, e) => `https://vidcore.org/embed/tv/${id}?season=${s}&episode=${e}`,
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "superembed-vip",
    label: "SuperEmbed",
    badge: "VIP",
    url: (id, s, e) =>
      `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
];

// ── Icon helpers ──────────────────────────────────────────

function IconExpand() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconCollapse() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

// ── Season / Episode Selector ─────────────────────────────

interface SEPProps {
  seasons: Season[];
  season: number;
  episode: number;
  episodeCount: number;
  onSeason: (s: number) => void;
  onEpisode: (e: number) => void;
}

function SeasonEpisodeSelector({ seasons, season, episode, episodeCount, onSeason, onEpisode }: SEPProps) {
  const [seasonOpen, setSeasonOpen] = useState(false);
  const seasonRef = useRef<HTMLDivElement>(null);

  // close season dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (seasonRef.current && !seasonRef.current.contains(e.target as Node)) {
        setSeasonOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const validSeasons = seasons.filter(s => s.season_number > 0);
  const currentSeasonObj = validSeasons.find(s => s.season_number === season);

  return (
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <span
        className="text-[10px] tracking-[0.25em] uppercase"
        style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.3)" }}
      >
        Season
      </span>

      {/* Season dropdown */}
      <div ref={seasonRef} className="relative">
        <button
          onClick={() => setSeasonOpen(v => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            background: "rgba(245,197,24,0.12)",
            border: "1px solid rgba(245,197,24,0.35)",
            color: "#f5c518",
            minWidth: 100,
          }}
        >
          {currentSeasonObj?.name ?? `Season ${season}`}
          <svg
            width="8"
            height="5"
            viewBox="0 0 10 6"
            fill="none"
            style={{
              marginLeft: "auto",
              transform: seasonOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {seasonOpen && (
          <div
            className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{
              background: "rgba(14,14,22,0.98)",
              border: "1px solid rgba(245,197,24,0.12)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              minWidth: 160,
              maxHeight: 260,
              overflowY: "auto",
              animation: "dropdownIn 0.15s cubic-bezier(0.22,1,0.36,1) forwards",
            }}
          >
            {validSeasons.map(s => {
              const isActive = s.season_number === season;
              return (
                <button
                  key={s.season_number}
                  onClick={() => { onSeason(s.season_number); setSeasonOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs transition-all duration-150"
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                    color: isActive ? "#f5c518" : "rgba(255,255,255,0.6)",
                    background: isActive ? "rgba(245,197,24,0.08)" : "transparent",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
                    }
                  }}
                >
                  {s.name}
                  {s.episode_count > 0 && (
                    <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>
                      · {s.episode_count} eps
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Episode pills */}
      <span
        className="text-[10px] tracking-[0.25em] uppercase"
        style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.3)" }}
      >
        Episode
      </span>

      <div className="flex items-center gap-1 flex-wrap" style={{ maxWidth: 420 }}>
        {Array.from({ length: Math.min(episodeCount, 50) }, (_, i) => i + 1).map(ep => {
          const isActive = ep === episode;
          return (
            <button
              key={ep}
              onClick={() => onEpisode(ep)}
              className="w-8 h-8 rounded-lg text-[11px] font-bold transition-all duration-150"
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                background: isActive ? "#f5c518" : "rgba(255,255,255,0.06)",
                color: isActive ? "#0a0a0f" : "rgba(255,255,255,0.45)",
                border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,197,24,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f5c518";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
                }
              }}
            >
              {ep}
            </button>
          );
        })}
        {episodeCount > 50 && (
          <span
            className="text-[10px] px-2"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.25)" }}
          >
            +{episodeCount - 50} more
          </span>
        )}
      </div>
    </div>
  );
}

// ── TV Player ─────────────────────────────────────────────

interface PlayerProps {
  showId: string;
  seasons: Season[];
}

function Player({ showId, seasons }: PlayerProps) {
  const validSeasons = seasons.filter(s => s.season_number > 0);
  const firstSeason = validSeasons[0]?.season_number ?? 1;

  const [activeSourceId, setActiveSourceId] = useState(SOURCES[0].id);
  const [season, setSeason] = useState(firstSeason);
  const [episode, setEpisode] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSeasonObj = validSeasons.find(s => s.season_number === season);
  const episodeCount = currentSeasonObj?.episode_count ?? 24;

  const activeSource = SOURCES.find(s => s.id === activeSourceId) ?? SOURCES[0];
  const src = activeSource.url(showId, season, episode);

  // Sync fullscreen state with browser events
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
      el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Keyboard: F to toggle fullscreen
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen]);

  function selectSource(id: string) {
    setActiveSourceId(id);
    setIframeKey(k => k + 1);
  }

  function changeSeason(s: number) {
    setSeason(s);
    setEpisode(1);
    setIframeKey(k => k + 1);
  }

  function changeEpisode(e: number) {
    setEpisode(e);
    setIframeKey(k => k + 1);
  }

  return (
    <div>
      {/* Season / Episode selector */}
      {validSeasons.length > 0 && (
        <SeasonEpisodeSelector
          seasons={validSeasons}
          season={season}
          episode={episode}
          episodeCount={episodeCount}
          onSeason={changeSeason}
          onEpisode={changeEpisode}
        />
      )}

      {/* Source switcher + fullscreen row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="text-[10px] tracking-[0.25em] uppercase mr-1"
          style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.3)" }}
        >
          Source
        </span>

        {SOURCES.map(s => {
          const isActive = s.id === activeSourceId;
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

        <div className="flex-1" />

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

      {/* Player container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl group"
        style={{
          aspectRatio: isFullscreen ? undefined : "16/9",
          background: "#000",
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
          title="Series player"
          style={{ border: "none" }}
        />

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

      <p
        className="mt-2 text-[10px] text-right"
        style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.18)" }}
      >
        {activeSource.label}{activeSource.badge ? ` ${activeSource.badge}` : ""} · S{season}E{episode} · Press{" "}
        <kbd
          style={{
            fontFamily: "inherit",
            background: "rgba(255,255,255,0.08)",
            padding: "0 4px",
            borderRadius: 3,
          }}
        >
          F
        </kbd>{" "}
        for fullscreen
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

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
      {/* Season/ep skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[120, 48, 48, 48, 48, 48].map((w, i) => (
          <div key={i} className="h-8 rounded-lg" style={{ width: w, background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
      {/* Source switcher skeleton */}
      <div className="flex gap-2 mb-2">
        {[80, 100, 120].map(w => (
          <div key={w} className="h-7 rounded-lg" style={{ width: w, background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
      <div className="w-full rounded-xl" style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.04)" }} />
      <div className="flex gap-6 mt-6">
        <div
          className="hidden sm:block w-36 shrink-0 rounded-xl"
          style={{ aspectRatio: "2/3", background: "rgba(255,255,255,0.04)" }}
        />
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

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTVDetail(id);
        if (!cancelled) setShow(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load series");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const backdrop = backdropUrl(show?.backdrop_path ?? null, "w1280");
  const poster = posterUrl(show?.poster_path ?? null, "w500");
  const year = show?.first_air_date?.slice(0, 4);
  const seasons: Season[] = show?.seasons ?? [];
  const avgRuntime = show?.episode_run_time?.[0];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <StarField />

      {/* Backdrop ambient blur */}
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
            href="/series"
            className="text-xs text-[#f5c518] hover:underline"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            ← Back to series
          </Link>
        </div>
      )}

      {!loading && show && (
        <main
          className="relative z-10 pt-24 pb-24 px-4 sm:px-8 max-w-7xl mx-auto"
          style={{ animation: "cardEntrance 0.5s ease both" }}
        >
          {/* Back link */}
          <Link
            href="/series"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase mb-8 transition-colors hover:text-[#f5c518]"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.35)" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Series
          </Link>

          {/* Player */}
          <Player showId={id} seasons={seasons} />

          {/* Info row */}
          <div className="flex flex-col sm:flex-row gap-6 mt-8">
            {/* Poster */}
            {poster && (
              <div
                className="hidden sm:block shrink-0 rounded-xl overflow-hidden shadow-2xl"
                style={{ width: 150, aspectRatio: "2/3", position: "relative" }}
              >
                <Image
                  src={poster}
                  alt={show.name}
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
                  {show.name}
                </h1>
                {year && (
                  <span
                    className="text-lg"
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    {year}
                  </span>
                )}
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <RatingBadge value={show.vote_average} />
                {show.number_of_seasons && (
                  <MetaChip>
                    {show.number_of_seasons} Season{show.number_of_seasons !== 1 ? "s" : ""}
                  </MetaChip>
                )}
                {show.number_of_episodes && (
                  <MetaChip>{show.number_of_episodes} Episodes</MetaChip>
                )}
                {avgRuntime && <MetaChip>~{avgRuntime}m / ep</MetaChip>}
                {show.status && <MetaChip>{show.status}</MetaChip>}
                {show.genres?.map(g => <MetaChip key={g.id}>{g.name}</MetaChip>)}
                {show.original_language && show.original_language !== "en" && (
                  <MetaChip>{show.original_language.toUpperCase()}</MetaChip>
                )}
              </div>

              {/* Tagline */}
              {show.tagline && (
                <p
                  className="italic mb-3 text-sm"
                  style={{
                    color: "rgba(245,197,24,0.7)",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                  }}
                >
                  &ldquo;{show.tagline}&rdquo;
                </p>
              )}

              {/* Overview */}
              {show.overview && (
                <p
                  className="text-sm max-w-2xl"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    lineHeight: 1.75,
                  }}
                >
                  {show.overview}
                </p>
              )}

              {/* Networks */}
              {show.networks && show.networks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {show.networks.map(n => (
                    <MetaChip key={n.id}>{n.name}</MetaChip>
                  ))}
                </div>
              )}

              {/* Vote count */}
              <p
                className="mt-4 text-[11px]"
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "var(--font-space-mono), monospace",
                }}
              >
                {show.vote_count.toLocaleString()} votes
              </p>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

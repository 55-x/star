"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import {
  getTVPopular,
  getTVOnTheAir,
  getTVTopRated,
  getTVAiringToday,
  searchTV,
  posterUrl,
  type TVShow,
} from "@/lib/tmdb";

// ── Tab config ────────────────────────────────────────────

const TABS = [
  { id: "popular",       label: "Popular" },
  { id: "on_the_air",    label: "On The Air" },
  { id: "top_rated",     label: "Top Rated" },
  { id: "airing_today",  label: "Airing Today" },
] as const;

type TabId = typeof TABS[number]["id"];

async function fetchTab(tab: TabId, page: number) {
  switch (tab) {
    case "popular":      return getTVPopular(page);
    case "on_the_air":   return getTVOnTheAir(page);
    case "top_rated":    return getTVTopRated(page);
    case "airing_today": return getTVAiringToday(page);
  }
}

// ── Skeleton ──────────────────────────────────────────────

function PosterSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        aspectRatio: "2/3",
        animation: "skeletonPulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

// ── Series card ───────────────────────────────────────────

function SeriesCard({ show, index }: { show: TVShow; index: number }) {
  const [imgError, setImgError] = useState(false);
  const src = posterUrl(show.poster_path, "w342");
  const year = show.first_air_date?.slice(0, 4) ?? "";
  const rating = show.vote_average.toFixed(1);
  const hasGoodRating = show.vote_average >= 7;

  return (
    <Link
      href={`/series/${show.id}`}
      className="group relative block rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518]"
      style={{
        animation: "cardEntrance 0.4s ease both",
        animationDelay: `${Math.min(index * 40, 400)}ms`,
        opacity: 0,
      }}
    >
      {/* Poster */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "2/3", background: "rgba(255,255,255,0.04)" }}
      >
        {src && !imgError ? (
          <Image
            src={src}
            alt={show.name}
            fill
            sizes="(max-width:640px) 45vw, (max-width:1024px) 22vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              <path d="M8 21h8M12 17v4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-center text-[10px] text-white/30 leading-tight">{show.name}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }}
        >
          <div className="p-3 w-full">
            <div
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-bold tracking-widest"
              style={{
                background: "rgba(245,197,24,0.9)",
                color: "#0a0a0f",
                fontFamily: "var(--font-space-mono), monospace",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="5,3 19,12 5,21" />
              </svg>
              View Details
            </div>
          </div>
        </div>

        {/* Rating badge */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: hasGoodRating ? "rgba(245,197,24,0.92)" : "rgba(0,0,0,0.75)",
            color: hasGoodRating ? "#0a0a0f" : "rgba(255,255,255,0.8)",
            fontFamily: "var(--font-space-mono), monospace",
            backdropFilter: "blur(4px)",
          }}
        >
          ★ {rating}
        </div>
      </div>

      {/* Info */}
      <div className="pt-2.5 pb-1 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-[#f5c518] transition-colors duration-200"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif", color: "rgba(255,255,255,0.9)" }}
        >
          {show.name}
        </p>
        {year && (
          <p
            className="text-[11px] mt-1"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.35)" }}
          >
            {year}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function SeriesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const [shows, setShows] = useState<TVShow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setShows([]);
      setPage(1);
      setError(null);
      try {
        const data = searchQuery.trim()
          ? await searchTV(searchQuery, 1)
          : await fetchTab(activeTab, 1);
        if (!cancelled) {
          setShows(data.results);
          setTotalPages(data.total_pages);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load series");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [activeTab, searchQuery]);

  const loadMore = async () => {
    let next = 0;
    setPage(prev => { next = prev + 1; return prev + 1; });
    setLoadingMore(true);
    setError(null);
    try {
      const data = searchQuery.trim()
        ? await searchTV(searchQuery, next)
        : await fetchTab(activeTab, next);
      setShows(prev => {
        const seen = new Set(prev.map(s => s.id));
        return [...prev, ...data.results.filter(s => !seen.has(s.id))];
      });
      setTotalPages(data.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(val);
      setIsSearching(val.trim().length > 0);
    }, 400);
  };

  const clearSearch = () => {
    setQuery("");
    setSearchQuery("");
    setIsSearching(false);
  };

  const hasMore = page < totalPages && totalPages > 1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <StarField />
      <Navbar />

      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-8 max-w-screen-2xl mx-auto">

        {/* ── Page header ───────────────────────────────── */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold tracking-widest uppercase mb-1"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "#f5c518" }}
          >
            Series
          </h1>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.3)" }}
          >
            Browse TV shows
          </p>
        </div>

        {/* ── Search + Tabs ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search series…"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(245,197,24,0.4)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {!isSearching && (
            <div className="flex items-center gap-1 flex-wrap">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-space-mono), monospace",
                      background: active ? "#f5c518" : "rgba(255,255,255,0.05)",
                      color: active ? "#0a0a0f" : "rgba(255,255,255,0.55)",
                      border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {isSearching && (
            <span
              className="text-xs tracking-wider"
              style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.4)" }}
            >
              Searching for &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────── */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            <p
              className="text-sm text-center max-w-sm"
              style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.4)" }}
            >
              {error.includes("TMDB_API_KEY")
                ? "Add your TMDB API key to .env.local to load series."
                : error}
            </p>
            {error.includes("TMDB_API_KEY") && (
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-4 py-2 rounded-lg transition-all"
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  background: "rgba(245,197,24,0.15)",
                  color: "#f5c518",
                  border: "1px solid rgba(245,197,24,0.3)",
                }}
              >
                Get a free API key →
              </a>
            )}
          </div>
        )}

        {/* ── Grid ───────────────────────────────────────── */}
        {!error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5">
            {loading
              ? Array.from({ length: 20 }).map((_, i) => <PosterSkeleton key={i} />)
              : shows.map((show, i) => (
                  <SeriesCard key={show.id} show={show} index={i} />
                ))
            }
            {loadingMore && Array.from({ length: 6 }).map((_, i) => <PosterSkeleton key={`more-${i}`} />)}
          </div>
        )}

        {/* ── Empty ──────────────────────────────────────── */}
        {!error && !loading && shows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <p
              className="text-sm"
              style={{ fontFamily: "var(--font-space-mono), monospace", color: "rgba(255,255,255,0.35)" }}
            >
              No results for &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* ── Load more ──────────────────────────────────── */}
        {!error && !loading && hasMore && (
          <div className="flex justify-center mt-12">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-10 py-3 rounded-xl text-sm font-bold tracking-widest transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.15em",
              }}
              onMouseEnter={e => {
                if (!loadingMore) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,197,24,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f5c518";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
              }}
            >
              {loadingMore ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

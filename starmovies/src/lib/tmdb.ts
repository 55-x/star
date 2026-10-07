// TMDB API utility
// Docs: https://developer.themoviedb.org/docs
// Base image URL: https://image.tmdb.org/t/p/{size}{poster_path}
// Poster sizes: w92 w154 w185 w342 w500 w780 original

const BASE_URL = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";

function apiKey(): string {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_TMDB_API_KEY in .env.local");
  return key;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // cache for 1 hour
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  original_language: string;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  episode_run_time?: number[];
  tagline?: string;
  original_language: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  seasons?: Season[];
}

export interface Season {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  air_date: string | null;
  poster_path: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface TMDBListResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// ── Endpoints ──────────────────────────────────────────────

export function getNowPlaying(page = 1) {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/now_playing", {
    page: String(page),
    language: "en-US",
  });
}

export function getPopular(page = 1) {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/popular", {
    page: String(page),
    language: "en-US",
  });
}

export function getTopRated(page = 1) {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/top_rated", {
    page: String(page),
    language: "en-US",
  });
}

export function getUpcoming(page = 1) {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/upcoming", {
    page: String(page),
    language: "en-US",
  });
}

export function searchMovies(query: string, page = 1) {
  return tmdbFetch<TMDBListResponse<Movie>>("/search/movie", {
    query,
    page: String(page),
    language: "en-US",
  });
}

export function getMovieDetail(id: string | number) {
  return tmdbFetch<Movie>(`/movie/${id}`, { language: "en-US" });
}

// ── TV Series endpoints ────────────────────────────────────

export function getTVPopular(page = 1) {
  return tmdbFetch<TMDBListResponse<TVShow>>("/tv/popular", {
    page: String(page),
    language: "en-US",
  });
}

export function getTVOnTheAir(page = 1) {
  return tmdbFetch<TMDBListResponse<TVShow>>("/tv/on_the_air", {
    page: String(page),
    language: "en-US",
  });
}

export function getTVTopRated(page = 1) {
  return tmdbFetch<TMDBListResponse<TVShow>>("/tv/top_rated", {
    page: String(page),
    language: "en-US",
  });
}

export function getTVAiringToday(page = 1) {
  return tmdbFetch<TMDBListResponse<TVShow>>("/tv/airing_today", {
    page: String(page),
    language: "en-US",
  });
}

export function searchTV(query: string, page = 1) {
  return tmdbFetch<TMDBListResponse<TVShow>>("/search/tv", {
    query,
    page: String(page),
    language: "en-US",
  });
}

export function getTVDetail(id: string | number) {
  return tmdbFetch<TVShow>(`/tv/${id}`, { language: "en-US" });
}

// ── Image helpers ──────────────────────────────────────────

export function posterUrl(path: string | null, size: "w342" | "w500" | "w780" = "w342") {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

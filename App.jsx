import React, { useEffect, useState } from "react";
import {
  Play,
  RefreshCw,
  AlertCircle,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";

const STATE_TIMEZONES = [
  {
    zoneLabel: "Doğu Saat Dilimi",
    state: "New York",
    population: "19.87M",
    timeZone: "America/New_York",
    offset: "UTC−4 / UTC−5",
  },
  {
    zoneLabel: "Merkez Saat Dilimi",
    state: "Illinois",
    population: "12.55M",
    timeZone: "America/Chicago",
    offset: "UTC−5 / UTC−6",
  },
  {
    zoneLabel: "Dağ Saat Dilimi",
    state: "Arizona",
    population: "7.58M",
    timeZone: "America/Phoenix",
    offset: "UTC−7",
  },
  {
    zoneLabel: "Pasifik Saat Dilimi",
    state: "California",
    population: "39.43M",
    timeZone: "America/Los_Angeles",
    offset: "UTC−7 / UTC−8",
  },
  {
    zoneLabel: "Alaska Saat Dilimi",
    state: "Alaska",
    population: "733K",
    timeZone: "America/Anchorage",
    offset: "UTC−8 / UTC−9",
  },
  {
    zoneLabel: "Hawaii Saat Dilimi",
    state: "Hawaii",
    population: "1.45M",
    timeZone: "Pacific/Honolulu",
    offset: "UTC−10",
  },
];

const INDIA_TIME = {
  zoneLabel: "Hindistan Saat Dilimi",
  state: "Hindistan",
  population: "1.43B",
  timeZone: "Asia/Kolkata",
  offset: "UTC+5:30",
};

const PH_TIME = {
  zoneLabel: "Filipinler Saat Dilimi",
  state: "Filipinler",
  population: "114M",
  timeZone: "Asia/Manila",
  offset: "UTC+8",
};

function formatViewCount(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return String(count);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  return date.toLocaleDateString("tr-TR");
}

function safeFormatTime(date, timeZone) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function safeFormatDate(date, timeZone) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getHour(date, timeZone) {
  const h = new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(date);
  return Number(h);
}

function isPrime(date, zone) {
  const h = getHour(date, zone);
  return h >= 16 && h <= 23;
}

export default function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [nextRefresh, setNextRefresh] = useState("");
  const [now, setNow] = useState(new Date());

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY tanımlı değil"
        );
      }

      const apiUrl = `${supabaseUrl}/functions/v1/youtube_shorts`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setVideos(data.videos || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    const interval = setInterval(() => {
      fetchVideos();
    }, 20 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!lastUpdate) return;

    const updateCountdown = () => {
      const nowTime = new Date();
      const nextRefreshTime = new Date(lastUpdate.getTime() + 20 * 60 * 1000);
      const diffMs = nextRefreshTime.getTime() - nowTime.getTime();

      if (diffMs <= 0) {
        setNextRefresh("Şimdi güncelleniyor...");
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setNextRefresh(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [lastUpdate]);

  const indiaActive = isPrime(now, INDIA_TIME.timeZone);
  const phActive = isPrime(now, PH_TIME.timeZone);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-4">
            <div className="order-1 xl:order-1 xl:col-span-3">
              <div className="sticky top-6">
                <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <Clock3 className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold sm:text-4xl">
                      Youtube Kitle Saat Takip
                    </h1>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {STATE_TIMEZONES.map((item) => {
                    const active = isPrime(now, item.timeZone);

                    return (
                      <div
                        key={item.zoneLabel}
                        className={`rounded-3xl border p-6 shadow-xl ${
                          active
                            ? "border-green-400 bg-green-500/20 ring-1 ring-green-400"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <p className="text-sm text-zinc-400">{item.zoneLabel}</p>

                        <h2 className="text-2xl font-semibold">
                          {safeFormatTime(now, item.timeZone)}
                        </h2>

                        <div className="mt-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {item.state}
                        </div>

                        <p className="text-sm text-zinc-400">
                          {safeFormatDate(now, item.timeZone)}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          Nüfus: {item.population}
                        </div>

                        <p className="mt-2 text-xs text-zinc-500">{item.offset}</p>
                      </div>
                    );
                  })}

                  <div
                    className={`rounded-3xl border p-6 shadow-xl ${
                      indiaActive
                        ? "border-red-400 bg-red-500/20 ring-1 ring-red-400"
                        : "border-orange-900/40 bg-orange-900/40"
                    }`}
                  >
                    <p className="text-sm">{INDIA_TIME.zoneLabel}</p>
                    <h2 className="text-3xl">
                      {safeFormatTime(now, INDIA_TIME.timeZone)}
                    </h2>

                    <div className="mt-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Hindistan
                    </div>

                    <p className="text-sm">
                      {safeFormatDate(now, INDIA_TIME.timeZone)}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      Nüfus: {INDIA_TIME.population}
                    </div>

                    <p className="mt-2 text-xs text-zinc-400">{INDIA_TIME.offset}</p>
                  </div>

                  <div
                    className={`rounded-3xl border p-6 shadow-xl ${
                      phActive
                        ? "border-red-400 bg-red-500/20 ring-1 ring-red-400"
                        : "border-orange-900/40 bg-orange-900/40"
                    }`}
                  >
                    <p className="text-sm">{PH_TIME.zoneLabel}</p>
                    <h2 className="text-3xl">{safeFormatTime(now, PH_TIME.timeZone)}</h2>

                    <div className="mt-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Filipinler
                    </div>

                    <p className="text-sm">{safeFormatDate(now, PH_TIME.timeZone)}</p>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      Nüfus: {PH_TIME.population}
                    </div>

                    <p className="mt-2 text-xs text-zinc-400">{PH_TIME.offset}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-2 xl:order-2 xl:col-span-1">
              <div className="mb-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-red-500/20 p-3">
                      <Play className="h-6 w-6 text-red-500" fill="currentColor" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white sm:text-4xl">
                        YouTube Shorts Sıralaması
                      </h1>
                      <p className="mt-1 text-sm text-slate-400">
                        Son 24 saatin en çok izlenen Shorts videoları
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Son Güncelleme</p>
                    <p className="text-sm font-medium text-white">
                      {lastUpdate
                        ? lastUpdate.toLocaleTimeString("tr-TR")
                        : "Yükleniyor..."}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="mb-1 text-xs text-slate-400">Sonraki Güncelleme</p>
                    <p className="font-mono text-sm font-medium text-emerald-400">
                      {nextRefresh || "Hesaplanıyor..."}
                    </p>
                  </div>

                  <button
                    onClick={fetchVideos}
                    disabled={loading}
                    className="ml-4 rounded-xl bg-red-500 p-3 text-white transition-colors hover:bg-red-600 disabled:bg-red-500/50"
                  >
                    <RefreshCw
                      className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="font-semibold text-amber-200">Hata</p>
                    <p className="text-sm text-amber-100">{error}</p>
                  </div>
                </div>
              )}

              {loading && videos.length === 0 ? (
                <div className="grid gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-2xl bg-slate-800/50"
                    />
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8 text-center">
                  <p className="text-slate-400">Video bulunamadı</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {videos.map((video) => (
                    <a
                      key={video.id}
                      href={`https://youtube.com/shorts/${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30 transition-all hover:border-slate-600 hover:bg-slate-800/50 hover:shadow-lg"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/30">
                            <Play className="h-5 w-5 fill-white text-white" />
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div>
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="mb-2 inline-block rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400">
                                  #{video.rank}
                                </div>

                                <h3 className="line-clamp-2 font-semibold text-white transition-colors group-hover:text-red-400">
                                  {video.title}
                                </h3>
                              </div>
                            </div>

                            <p className="text-sm text-slate-400">
                              {video.channelTitle}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-700/30 pt-2">
                            <div className="text-xs text-slate-500">
                              {formatDate(video.publishedAt)}
                            </div>

                            <div className="text-sm font-semibold text-emerald-400">
                              {formatViewCount(video.viewCount)} görüntüleme
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

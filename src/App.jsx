import React, { useEffect, useMemo, useState } from "react";

const ZONES = [
  { name: "New York", tz: "America/New_York" },
  { name: "Chicago", tz: "America/Chicago" },
  { name: "Phoenix", tz: "America/Phoenix" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Alaska", tz: "America/Anchorage" },
  { name: "Hawaii", tz: "Pacific/Honolulu" },
  { name: "India", tz: "Asia/Kolkata" },
  { name: "Philippines", tz: "Asia/Manila" },
];

const CHANNEL_HANDLES = [
  "EgitimciAdam",
  "SnipZMemes",
  "EzaXD09",
  "zhiphyr",
  "MemeDoggyZ",
  "Moktalojik",
  "ONLYMEMES-4YOU",
  "MiiRain",
  "monium",
  "CurtZmemes",
  "PixelinuBlixMeme",
  "Pezoid.x",
  "Refahyolcusu",
  "victor_rozz",
  "FirstlaughterDose",
  "Devil_React",
  "twosidememes",
  "CrypticWorlds",
  "gelnox",
  "BloopTubeShorts",
  "OxygenosDuo",
  "wafuuMrUnknownXD",
  "GenZMems",
  "DAL3X",
  "NonGeek",
  "Grin",
  "PixelCompaly2",
  "iCloud.y",
  "Zinng",
  "Jolizo",
  "menimemee",
  "Mesosphere-92",
  "Flaxtu",
  "Ogigsy",
  "Pfft_real",
  "GAMETIMENahomom",
  "ZorbZorb",
  "Memurk",
  "XoreXEdit",
  "itsmemetronix",
  "BoruMemes",
  "VazhYT",
  "Zohomemes",
  "Mematus",
  "TrigX_I",
  "Zwaphr",
  "Puzz.Y",
  "JosephMemess",
  "aspectmeme",
  "WisdomVerse2",
  "KXHi",
  "SkeldZ",
  "japinoygamingghlights1",
  "yt.meminho",
  "VadeZmemes",
  "Cyall",
  "Zdak",
  "NikaDimension",
  "RealBlastHaven",
  "MrManZell",
  "memessoo",
  "vkomedipost",
  "Zplunko",
  "EzyCricu",
  "Goofarr",
  "Karsilastirio",
  "drixx3",
  "yaşayan.ölüyüm8",
  "Klypt.x",
  "Techlin",
  "JemsyMemes",
  "ZyroMems",
];

const API_KEYS = [
  "AIzaSyDyjZVAFes67HaZOik5ms8axQoI-ohZpVU",
];

function getTime(tz) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function formatViews(value) {
  return new Intl.NumberFormat("tr-TR").format(Number(value || 0));
}

function parseDurationToSeconds(iso) {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return h * 3600 + m * 60 + s;
}

function timeAgoTR(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

async function fetchJsonWithFallback(urlBuilder) {
  let lastError = null;

  for (const key of API_KEYS) {
    try {
      const res = await fetch(urlBuilder(key));
      const data = await res.json();

      if (!res.ok || data?.error) {
        const msg =
          data?.error?.message ||
          `HTTP ${res.status} ${res.statusText || "API hatası"}`;
        lastError = new Error(msg);
        continue;
      }

      return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("API isteği başarısız oldu.");
}

async function findChannelByHandle(handle) {
  const data = await fetchJsonWithFallback(
    (key) =>
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=5&q=${encodeURIComponent(
        handle
      )}&key=${key}`
  );

  const items = data?.items || [];
  if (!items.length) return null;

  const lowered = handle.toLowerCase();

  const best =
    items.find((item) => {
      const title = item?.snippet?.title?.toLowerCase() || "";
      const channelId = item?.snippet?.channelId?.toLowerCase() || "";
      return title.includes(lowered) || channelId.includes(lowered);
    }) || items[0];

  const channelId = best?.snippet?.channelId;
  const title = best?.snippet?.title || handle;

  if (!channelId) return null;

  return { channelId, title, handle };
}

async function getUploadsPlaylist(channelId) {
  const data = await fetchJsonWithFallback(
    (key) =>
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(
        channelId
      )}&key=${key}`
  );

  return data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function getPlaylistItems(playlistId) {
  const data = await fetchJsonWithFallback(
    (key) =>
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
        playlistId
      )}&maxResults=50&key=${key}`
  );

  return data?.items || [];
}

async function getVideoDetails(videoIds) {
  if (!videoIds.length) return [];

  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const all = [];
  for (const chunk of chunks) {
    const data = await fetchJsonWithFallback(
      (key) =>
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(
          ","
        )}&key=${key}`
    );
    all.push(...(data?.items || []));
  }

  return all;
}

async function fetchTopShortsLast24h() {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;

  const foundChannels = [];
  const notFoundHandles = [];
  const channelErrors = [];

  for (const handle of CHANNEL_HANDLES) {
    try {
      const found = await findChannelByHandle(handle);
      if (found) {
        foundChannels.push(found);
      } else {
        notFoundHandles.push(handle);
      }
    } catch (err) {
      channelErrors.push(`${handle}: ${err?.message || "kanal bulunamadı"}`);
    }
  }

  const playlistResults = [];
  const playlistErrors = [];

  for (const channel of foundChannels) {
    try {
      const uploadsPlaylistId = await getUploadsPlaylist(channel.channelId);
      if (!uploadsPlaylistId) {
        playlistErrors.push(`${channel.handle}: uploads playlist yok`);
        continue;
      }

      const items = await getPlaylistItems(uploadsPlaylistId);
      playlistResults.push({ channel, items });
    } catch (err) {
      playlistErrors.push(
        `${channel.handle}: ${err?.message || "playlist alınamadı"}`
      );
    }
  }

  const candidates = new Map();

  for (const entry of playlistResults) {
    for (const item of entry.items) {
      const videoId =
        item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId;
      const publishedAt =
        item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt;

      if (!videoId || !publishedAt) continue;
      if (new Date(publishedAt).getTime() < last24h) continue;

      candidates.set(videoId, {
        videoId,
        publishedAt,
        channelTitle: entry.channel.title,
        channelHandle: entry.channel.handle,
      });
    }
  }

  const candidateIds = [...candidates.keys()];
  const details = await getVideoDetails(candidateIds);

  const filtered = details
    .map((video) => {
      const publishedAt = video?.snippet?.publishedAt;
      const seconds = parseDurationToSeconds(video?.contentDetails?.duration);

      return {
        id: video?.id,
        title: video?.snippet?.title || "Başlıksız video",
        publishedAt,
        views: Number(video?.statistics?.viewCount || 0),
        seconds,
        channelTitle:
          candidates.get(video?.id)?.channelTitle ||
          video?.snippet?.channelTitle ||
          "Bilinmeyen kanal",
        channelHandle: candidates.get(video?.id)?.channelHandle || "",
        url: `https://www.youtube.com/watch?v=${video?.id}`,
      };
    })
    .filter((video) => {
      if (!video.id || !video.publishedAt) return false;
      if (new Date(video.publishedAt).getTime() < last24h) return false;
      if (!(video.seconds > 0 && video.seconds <= 60)) return false;
      return true;
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    videos: filtered,
    debug: {
      totalChannels: CHANNEL_HANDLES.length,
      foundChannels: foundChannels.length,
      notFoundCount: notFoundHandles.length,
      playlistOkCount: playlistResults.length,
      candidateVideos: candidateIds.length,
      filteredVideos: filtered.length,
      notFoundHandles: notFoundHandles.slice(0, 12),
      channelErrors: channelErrors.slice(0, 12),
      playlistErrors: playlistErrors.slice(0, 12),
    },
  };
}

function TimeCard({ zone }) {
  return (
    <div
      style={{
        background: "#18181b",
        padding: "20px",
        borderRadius: "18px",
        minHeight: "110px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "14px", opacity: 0.7, marginBottom: "8px" }}>
        {zone.name}
      </div>
      <div style={{ fontSize: "26px", fontWeight: "700" }}>
        {getTime(zone.tz)}
      </div>
    </div>
  );
}

function ShortsPanel({ videos, loading, error, updatedAt, onRefresh, debug }) {
  return (
    <div
      style={{
        background: "#111214",
        borderRadius: "24px",
        padding: "18px",
        boxSizing: "border-box",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              opacity: 0.6,
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}
          >
            SON 24 SAAT
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800" }}>
            Shorts Top 10
          </div>
        </div>

        <button
          onClick={onRefresh}
          style={{
            background: "#1f2937",
            color: "white",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Yenile
        </button>
      </div>

      <div
        style={{
          background: "#18181b",
          borderRadius: "16px",
          padding: "12px",
          marginBottom: "14px",
          fontSize: "12px",
          opacity: 0.95,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        Kanal sayısı: {debug.totalChannels}
        {"\n"}Bulunan kanal: {debug.foundChannels}
        {"\n"}Bulunamayan: {debug.notFoundCount}
        {"\n"}Playlist alınan: {debug.playlistOkCount}
        {"\n"}Aday video: {debug.candidateVideos}
        {"\n"}Filtre sonrası: {debug.filteredVideos}
        {"\n"}Son güncelleme:{" "}
        {updatedAt ? new Date(updatedAt).toLocaleTimeString("tr-TR") : "henüz yok"}
      </div>

      {!!debug.notFoundHandles?.length && (
        <div
          style={{
            background: "#18181b",
            borderRadius: "16px",
            padding: "12px",
            marginBottom: "12px",
            fontSize: "12px",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          Bulunamayan ilk handlelar:
          {"\n"}
          {debug.notFoundHandles.join("\n")}
        </div>
      )}

      {!!debug.channelErrors?.length && (
        <div
          style={{
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(220,38,38,0.25)",
            color: "#fecaca",
            borderRadius: "16px",
            padding: "12px",
            marginBottom: "12px",
            fontSize: "12px",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          Kanal hataları:
          {"\n"}
          {debug.channelErrors.join("\n")}
        </div>
      )}

      {!!debug.playlistErrors?.length && (
        <div
          style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#fde68a",
            borderRadius: "16px",
            padding: "12px",
            marginBottom: "12px",
            fontSize: "12px",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          Playlist hataları:
          {"\n"}
          {debug.playlistErrors.join("\n")}
        </div>
      )}

      {loading && (
        <div
          style={{
            background: "#18181b",
            borderRadius: "16px",
            padding: "14px",
            fontSize: "14px",
            marginBottom: "12px",
          }}
        >
          Videolar yükleniyor...
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            background: "rgba(220,38,38,0.16)",
            border: "1px solid rgba(220,38,38,0.35)",
            color: "#fecaca",
            borderRadius: "16px",
            padding: "14px",
            fontSize: "14px",
            marginBottom: "12px",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div
          style={{
            background: "#18181b",
            borderRadius: "16px",
            padding: "14px",
            fontSize: "14px",
          }}
        >
          Uygun Shorts bulunamadı.
        </div>
      )}

      <div style={{ display: "grid", gap: "10px" }}>
        {videos.map((video, index) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              color: "white",
              background: "#18181b",
              borderRadius: "16px",
              padding: "12px",
              display: "block",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  minWidth: "34px",
                  height: "34px",
                  borderRadius: "12px",
                  background: "#27272a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                }}
              >
                {index + 1}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    lineHeight: 1.35,
                    marginBottom: "6px",
                    wordBreak: "break-word",
                  }}
                >
                  {video.title}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.7,
                    marginBottom: "8px",
                  }}
                >
                  {video.channelTitle}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.9,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <span>👁 {formatViews(video.views)}</span>
                  <span>⏱ {video.seconds}s</span>
                  <span>{timeAgoTR(video.publishedAt)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [, setTick] = useState(Date.now());
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [debug, setDebug] = useState({
    totalChannels: CHANNEL_HANDLES.length,
    foundChannels: 0,
    notFoundCount: 0,
    playlistOkCount: 0,
    candidateVideos: 0,
    filteredVideos: 0,
    notFoundHandles: [],
    channelErrors: [],
    playlistErrors: [],
  });

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchTopShortsLast24h();
      setVideos(result.videos);
      setDebug(result.debug);
      setUpdatedAt(Date.now());
    } catch (err) {
      setError(err?.message || "Veriler alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    const refreshTimer = setInterval(loadVideos, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  const timeCards = useMemo(() => ZONES, []);

  return (
    <div
      style={{
        background: "#09090b",
        color: "white",
        minHeight: "100vh",
        padding: "28px",
        boxSizing: "border-box",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 4fr) minmax(320px, 1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "800",
                lineHeight: 1.05,
                marginBottom: "10px",
              }}
            >
              YouTube Kitle Saat Takip
            </div>

            <div
              style={{
                fontSize: "15px",
                opacity: 0.7,
              }}
            >
              Solda saat bölgeleri, sağda son 24 saat içindeki en yüksek izlenen
              Shorts listesi
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >
            {timeCards.map((zone) => (
              <TimeCard key={zone.name} zone={zone} />
            ))}
          </div>
        </div>

        <div>
          <ShortsPanel
            videos={videos}
            loading={loading}
            error={error}
            updatedAt={updatedAt}
            onRefresh={loadVideos}
            debug={debug}
          />
        </div>
      </div>
    </div>
  );
}

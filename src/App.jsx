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
  "@EgitimciAdam",
  "@SnipZMemes",
  "@EzaXD09",
  "@zhiphyr",
  "@MemeDoggyZ",
  "@Moktalojik",
  "@ONLYMEMES-4YOU",
  "@MiiRain",
  "@monium",
  "@CurtZmemes",
  "@PixelinuBlixMeme",
  "@Pezoid.x",
  "@Refahyolcusu",
  "@victor_rozz",
  "@FirstlaughterDose",
  "@Devil_React",
  "@twosidememes",
  "@CrypticWorlds",
  "@gelnox",
  "@BloopTubeShorts",
  "@OxygenosDuo",
  "@wafuuMrUnknownXD",
  "@GenZMems",
  "@DAL3X",
  "@NonGeek",
  "@Grin",
  "@PixelCompaly2",
  "@iCloud.y",
  "@Zinng",
  "@Jolizo",
  "@menimemee",
  "@Mesosphere-92",
  "@Flaxtu",
  "@Ogigsy",
  "@Pfft_real",
  "@GAMETIMENahomom",
  "@ZorbZorb",
  "@Memurk",
  "@XoreXEdit",
  "@itsmemetronix",
  "@BoruMemes",
  "@VazhYT",
  "@Zohomemes",
  "@Mematus",
  "@TrigX_I",
  "@Zwaphr",
  "@Puzz.Y",
  "@JosephMemess",
  "@aspectmeme",
  "@WisdomVerse2",
  "@KXHi",
  "@SkeldZ",
  "@japinoygamingghlights1",
  "@yt.meminho",
  "@VadeZmemes",
  "@Cyall",
  "@Zdak",
  "@NikaDimension",
  "@RealBlastHaven",
  "@MrManZell",
  "@memessoo",
  "@vkomedipost",
  "@Zplunko",
  "@EzyCricu",
  "@Goofarr",
  "@Karsilastirio",
  "@drixx3",
  "@yaşayan.ölüyüm8",
  "@Klypt.x",
  "@Techlin",
  "@JemsyMemes",
  "@ZyroMems",
];

const API_KEYS = [
  "AIzaSyDIa2QFg3tcpDygt5MHrVwNGguYzzUCkkw",
  "AIzaSyB9G3IkR-l7ZHuDBCgrmW4bwPHafttFUCA",
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
  const num = Number(value || 0);
  return new Intl.NumberFormat("tr-TR").format(num);
}

function timeAgoTR(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} sa önce`;
  const day = Math.floor(hour / 24);
  return `${day} gün önce`;
}

function parseDurationToSeconds(iso) {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);

  return h * 3600 + m * 60 + s;
}

async function fetchJsonWithFallback(buildUrl) {
  let lastError = null;

  for (const key of API_KEYS) {
    try {
      const res = await fetch(buildUrl(key));
      const data = await res.json();

      if (!res.ok || data?.error) {
        const message = data?.error?.message || "API hatası";
        console.error("API hata cevabı:", message, data);
        lastError = new Error(message);
        continue;
      }

      return data;
    } catch (err) {
      console.error("API fetch hatası:", err);
      lastError = err;
    }
  }

  throw lastError || new Error("API isteği başarısız oldu.");
}

async function getChannelInfo(handle) {
  const cleanHandle = handle.replace("@", "");

  const data = await fetchJsonWithFallback(
    (key) =>
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(
        cleanHandle
      )}&key=${key}`
  );

  const item = data?.items?.[0];
  if (!item) {
    console.error("Kanal bulunamadı:", handle, data);
    return null;
  }

  return {
    title: item?.snippet?.title || handle,
    handle,
    uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads || null,
  };
}

async function getPlaylistItems(playlistId) {
  const data = await fetchJsonWithFallback(
    (key) =>
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${key}`
  );

  return data?.items || [];
}

async function getVideoDetails(videoIds) {
  if (!videoIds.length) return [];

  const allItems = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);

    const data = await fetchJsonWithFallback(
      (key) =>
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(
          ","
        )}&key=${key}`
    );

    allItems.push(...(data?.items || []));
  }

  return allItems;
}

async function fetchTopShortsLast24h() {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;

  const channelInfos = await Promise.all(
    CHANNEL_HANDLES.map(async (handle) => {
      try {
        return await getChannelInfo(handle);
      } catch (err) {
        console.error("Kanal alınamadı:", handle, err);
        return null;
      }
    })
  );

  const validChannels = channelInfos.filter(
    (item) => item && item.uploadsPlaylistId
  );

  const playlistResults = await Promise.all(
    validChannels.map(async (channel) => {
      try {
        const items = await getPlaylistItems(channel.uploadsPlaylistId);
        return { channel, items };
      } catch (err) {
        console.error("Playlist alınamadı:", channel.handle, err);
        return { channel, items: [] };
      }
    })
  );

  const candidates = new Map();

  for (const entry of playlistResults) {
    for (const item of entry.items) {
      const videoId =
        item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId;
      const publishedAt =
        item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt;

      if (!videoId || !publishedAt) continue;

      if (new Date(publishedAt).getTime() < last24h) {
        continue;
      }

      candidates.set(videoId, {
        videoId,
        channelTitle: entry.channel.title,
        channelHandle: entry.channel.handle,
        publishedAt,
      });
    }
  }

  const allIds = [...candidates.keys()];
  const details = await getVideoDetails(allIds);
  const results = [];

  for (const video of details) {
    const seconds = parseDurationToSeconds(video?.contentDetails?.duration);
    const publishedAt = video?.snippet?.publishedAt;

    if (!publishedAt) continue;
    if (new Date(publishedAt).getTime() < last24h) continue;

    if (seconds > 0 && seconds <= 60) {
      results.push({
        id: video.id,
        title: video?.snippet?.title || "Başlıksız video",
        channelTitle:
          candidates.get(video.id)?.channelTitle ||
          video?.snippet?.channelTitle ||
          "Bilinmeyen kanal",
        channelHandle: candidates.get(video.id)?.channelHandle || "",
        publishedAt,
        views: Number(video?.statistics?.viewCount || 0),
        seconds,
        url: `https://www.youtube.com/watch?v=${video.id}`,
      });
    }
  }

  console.log("Toplam kanal:", CHANNEL_HANDLES.length);
  console.log("Geçerli kanal:", validChannels.length);
  console.log("Aday video sayısı:", allIds.length);
  console.log("Filtre sonrası sonuç sayısı:", results.length);

  return {
    videos: results.sort((a, b) => b.views - a.views).slice(0, 10),
    debug: {
      totalChannels: CHANNEL_HANDLES.length,
      validChannels: validChannels.length,
      candidateVideos: allIds.length,
      filteredVideos: results.length,
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
        height: "100%",
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
          opacity: 0.9,
          lineHeight: 1.6,
        }}
      >
        Kanal sayısı: {CHANNEL_HANDLES.length}
        <br />
        Son güncelleme:{" "}
        {updatedAt
          ? new Date(updatedAt).toLocaleTimeString("tr-TR")
          : "henüz yok"}
        <br />
        Geçerli kanal: {debug.validChannels}
        <br />
        Aday video: {debug.candidateVideos}
        <br />
        Filtre sonrası: {debug.filteredVideos}
      </div>

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
    validChannels: 0,
    candidateVideos: 0,
    filteredVideos: 0,
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
      console.error("Genel loadVideos hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();

    const refreshTimer = setInterval(() => {
      loadVideos();
    }, 5 * 60 * 1000);

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

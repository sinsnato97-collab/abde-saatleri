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
  "CrypticWorlds"
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

function parseDurationToSeconds(iso) {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return h * 3600 + m * 60 + s;
}

async function apiFetch(urlBuilder) {
  for (const key of API_KEYS) {
    try {
      const res = await fetch(urlBuilder(key));
      const data = await res.json();
      if (!res.ok || data.error) continue;
      return data;
    } catch {}
  }
  return null;
}

async function getChannelId(handle) {
  const data = await apiFetch(
    key =>
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&maxResults=1&key=${key}`
  );

  return data?.items?.[0]?.snippet?.channelId || null;
}

async function getUploadsPlaylist(channelId) {
  const data = await apiFetch(
    key =>
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${key}`
  );

  return data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function getPlaylistVideos(playlistId) {
  const data = await apiFetch(
    key =>
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${key}`
  );

  return data?.items?.map(i => i.contentDetails.videoId) || [];
}

async function getVideoDetails(ids) {
  const data = await apiFetch(
    key =>
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids.join(",")}&key=${key}`
  );

  return data?.items || [];
}

async function getShorts() {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const videos = [];

  for (const handle of CHANNEL_HANDLES) {
    const channelId = await getChannelId(handle);
    if (!channelId) continue;

    const playlist = await getUploadsPlaylist(channelId);
    if (!playlist) continue;

    const ids = await getPlaylistVideos(playlist);
    if (!ids.length) continue;

    const details = await getVideoDetails(ids);

    for (const v of details) {
      const seconds = parseDurationToSeconds(v.contentDetails.duration);
      const published = new Date(v.snippet.publishedAt).getTime();

      if (seconds <= 60 && published > last24h) {
        videos.push({
          id: v.id,
          title: v.snippet.title,
          views: Number(v.statistics.viewCount),
          seconds,
          time: v.snippet.publishedAt
        });
      }
    }
  }

  return videos.sort((a, b) => b.views - a.views).slice(0, 10);
}

export default function App() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    getShorts().then(setVideos);
  }, []);

  const timeCards = useMemo(() => ZONES, []);

  return (
    <div style={{background:"#0b0b0b",color:"white",minHeight:"100vh",padding:"30px"}}>
      <h1 style={{fontSize:"40px",fontWeight:"800"}}>YouTube Kitle Saat Takip</h1>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:"30px",marginTop:"30px"}}>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"20px"}}>
          {timeCards.map(z=>(
            <div key={z.name} style={{background:"#18181b",padding:"20px",borderRadius:"18px"}}>
              <div style={{opacity:0.7,fontSize:"14px"}}>{z.name}</div>
              <div style={{fontSize:"28px",fontWeight:"700"}}>{getTime(z.tz)}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#111214",borderRadius:"20px",padding:"20px"}}>
          <h2>Shorts Top 10</h2>

          {videos.length === 0 && <div>Shorts aranıyor...</div>}

          {videos.map((v,i)=>(
            <div key={v.id} style={{background:"#18181b",padding:"10px",borderRadius:"12px",marginTop:"10px"}}>
              <div>{i+1}. {v.title}</div>
              <div style={{fontSize:"12px",opacity:0.7}}>
                👁 {v.views} • ⏱ {v.seconds}s
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

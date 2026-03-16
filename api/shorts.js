export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const CHANNELS = [
    "EgitimciAdam","SnipZMemes","EzaXD09","zhiphyr","MemeDoggyZ","Moktalojik","ONLYMEMES-4YOU",
    "MiiRain","monium","CurtZmemes","PixelinuBlixMeme","Pezoid.x","Refahyolcusu","victor_rozz",
    "FirstlaughterDose","Devil_React","twosidememes","CrypticWorlds","gelnox","BloopTubeShorts",
    "OxygenosDuo","wafuuMrUnknownXD","GenZMems","DAL3X","NonGeek","Grin","PixelCompaly2",
    "iCloud.y","Zinng","Jolizo","menimemee","Mesosphere-92","Flaxtu","Ogigsy","Pfft_real",
    "GAMETIMENahomom","ZorbZorb","Memurk","XoreXEdit","itsmemetronix","BoruMemes","VazhYT",
    "Zohomemes","Mematus","TrigX_I","Zwaphr","Puzz.Y","JosephMemess","aspectmeme","WisdomVerse2",
    "KXHi","SkeldZ","japinoygamingghlights1","yt.meminho","VadeZmemes","Cyall","Zdak",
    "NikaDimension","RealBlastHaven","MrManZell","memessoo","vkomedipost","Zplunko","EzyCricu",
    "Goofarr","Karsilastirio","drixx3","Klypt.x","Techlin","JemsyMemes","ZyroMems","yaşayan.ölüyüm8"
  ];

  // API keys from environment variables (hidden from users)
  const API_KEYS = [
    process.env.YT_API_KEY_1,
    process.env.YT_API_KEY_2,
  ].filter(Boolean);

  if (!API_KEYS.length) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  const BASE = 'https://www.googleapis.com/youtube/v3';
  let keyIdx = 0;

  async function ytFetch(endpoint, params) {
    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      const key = API_KEYS[(keyIdx + attempt) % API_KEYS.length];
      const url = `${BASE}${endpoint}?${new URLSearchParams({ ...params, key })}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.error?.code === 403 || d.error?.code === 429) {
        keyIdx = (keyIdx + 1) % API_KEYS.length;
        continue;
      }
      if (d.error) throw new Error(d.error.message);
      return d;
    }
    throw new Error('Tüm API kotaları doldu');
  }

  function parseDur(iso) {
    const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 999;
    return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
  }

  async function resolveChannel(handle) {
    // Try forHandle
    try {
      const d = await ytFetch('/channels', { part: 'id,contentDetails', forHandle: handle });
      if (d.items?.[0]) return d.items[0];
    } catch {}
    // Fallback: search
    try {
      const s = await ytFetch('/search', { part: 'snippet', type: 'channel', q: handle, maxResults: 1 });
      const cid = s.items?.[0]?.id?.channelId;
      if (cid) {
        const d2 = await ytFetch('/channels', { part: 'id,contentDetails', id: cid });
        if (d2.items?.[0]) return d2.items[0];
      }
    } catch {}
    return null;
  }

  try {
    const allShorts = [];
    const cutoff = Date.now() - 26 * 3600 * 1000;
    const BATCH = 5;

    for (let i = 0; i < CHANNELS.length; i += BATCH) {
      const batch = CHANNELS.slice(i, i + BATCH);
      await Promise.all(batch.map(async (handle) => {
        try {
          const ch = await resolveChannel(handle);
          if (!ch) return;
          const uploadsId = ch.contentDetails.relatedPlaylists.uploads;

          const pl = await ytFetch('/playlistItems', {
            part: 'snippet', playlistId: uploadsId, maxResults: 15
          });

          const recentIds = (pl.items || [])
            .filter(i => new Date(i.snippet.publishedAt) >= cutoff)
            .map(i => i.snippet.resourceId.videoId)
            .filter(Boolean);

          if (!recentIds.length) return;

          const vd = await ytFetch('/videos', {
            part: 'snippet,statistics,contentDetails',
            id: recentIds.join(',')
          });

          for (const v of (vd.items || [])) {
            if (parseDur(v.contentDetails?.duration) > 180) continue;
            allShorts.push({
              videoId: v.id,
              title: v.snippet.title,
              channel: '@' + handle,
              views: parseInt(v.statistics.viewCount || 0),
              publishedAt: v.snippet.publishedAt,
              thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || ''
            });
          }
        } catch {}
      }));
    }

    allShorts.sort((a, b) => b.views - a.views);

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate'); // 30 min cache
    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      total: allShorts.length,
      items: allShorts.slice(0, 10)
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

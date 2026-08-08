const axios = require("axios");

const BASE = "https://kick.com";
const API = `${BASE}/api/v2`;
const TTL = Number(process.env.CACHE_DURATION || 60) * 1000;
const MAX = Number(process.env.MAX_RESULTS || 40);
const VOD_CHANNELS = Number(process.env.VOD_CHANNELS || 8);
const LIVE_LANG = process.env.KICK_LANG || "pt";

const http = axios.create({
  timeout: 12000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; Stremio-Kick-Addon/1.1)",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://kick.com/",
    "Origin": "https://kick.com",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
  }
});

const cache = new Map();

async function cached(key, fn) {
  const old = cache.get(key);
  if (old && old.expires > Date.now()) return old.value;
  const value = await fn();
  cache.set(key, { value, expires: Date.now() + TTL });
  return value;
}

function normalizeChannel(channel, live) {
  if (!channel) return null;

  const livestream = channel.livestream || channel.live_stream || null;
  const slug = channel.slug || channel.username || channel.user?.username;
  if (!slug) return null;

  return {
    slug,
    name: channel.name || channel.username || channel.user?.username || slug,
    avatar: channel.avatar || channel.user?.profile_pic || channel.profile_pic || "",
    banner: channel.banner_image || channel.banner || "",
    followers: channel.followers_count || channel.followers || 0,
    isLive: !!(live || livestream),
    title: livestream?.session_title || livestream?.stream_title || channel.stream_title || "",
    viewers: livestream?.viewer_count || livestream?.viewers || 0,
    category: livestream?.categories?.[0]?.name || livestream?.category?.name || ""
  };
}

async function getChannel(slug) {
  return cached(`channel:${slug}`, async () => {
    const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}`);
    return normalizeChannel(r.data?.data || r.data, false);
  });
}

async function getChannelStream(slug) {
  return cached(`stream:${slug}`, async () => {
    const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}/livestream`);
    const data = r.data?.data || r.data;
    if (!data) return null;

    const playbackUrl = data.playback_url || data.playbackUrl;
    if (!playbackUrl) return null;

    return {
      slug,
      name: slug,
      title: data.session_title || "",
      viewers: data.viewers || 0,
      playbackUrl,
      streamId: data.id || `kick_${slug}`
    };
  });
}

async function getChannelVideos(slug) {
  return cached(`videos:${slug}`, async () => {
    try {
      const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}/videos`);
      const raw = r.data?.data || r.data;
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      console.error("Channel videos error:", err.response?.status || "", err.message);
      return [];
    }
  });
}

function normalizeVod(video, channel) {
  if (!video || !channel) return null;

  return {
    id: video.id,
    slug: channel.slug,
    channel,
    source: video.source,
    duration: video.duration || 0,
    session_title: video.session_title || video.title || channel.name,
    language: video.language || "",
    tags: Array.isArray(video.tags) ? video.tags : [],
    thumbnail: video.thumbnail || {},
    category: video.category?.name || video.category || channel.category || "",
    is_live: !!video.is_live
  };
}

async function getChannelVideo(slug, videoId) {
  const channel = await getChannel(slug);
  if (!channel) return null;
  const videos = await getChannelVideos(slug);
  const raw = videos.find(v => String(v.id) === String(videoId));
  return raw ? normalizeVod(raw, channel) : null;
}

async function getVods(search) {
  // fetch all live channels (no lang filter) to maximize VOD coverage
  const channels = await getLiveStreams("", "en");
  const videos = [];

  for (const channel of channels.slice(0, VOD_CHANNELS)) {
    const channelVideos = await getChannelVideos(channel.slug);
    for (const raw of channelVideos) {
      if (!raw || !raw.source || raw.is_live) continue;
      const vod = normalizeVod(raw, channel);
      if (vod) videos.push(vod);
    }
  }

  let result = videos;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(x =>
      x.session_title?.toLowerCase().includes(q) ||
      x.channel.name.toLowerCase().includes(q) ||
      x.language.toLowerCase().includes(q) ||
      x.tags.some(tag => String(tag).toLowerCase().includes(q))
    );
  }

  return result.slice(0, MAX);
}

async function getLiveStreams(search, lang = LIVE_LANG) {
  return cached(`live:${lang}:${search || ""}`, async () => {
    const url = `${BASE}/stream/livestreams/en`;
    const pages = lang === "pt" ? 4 : 2;
    const allItems = [];

    for (let page = 1; page <= pages; page++) {
      try {
        const r = await http.get(url, {
          params: { page, limit: 24, sort: "desc" },
          headers: { "Accept": "application/json, text/plain, */*" }
        });
        const raw = r.data?.data || r.data?.livestreams || r.data;
        const list = Array.isArray(raw) ? raw : [];
        if (list.length === 0) break;
        allItems.push(...list);
      } catch (err) {
        console.error("getLiveStreams page error:", page, err.message);
        break;
      }
    }

    let result = allItems.map(x => {
      const c = normalizeChannel(x.channel || x, true);
      if (!c) return null;
      c.title = x.session_title || x.stream_title || c.title;
      c.viewers = x.viewer_count || x.viewers || c.viewers;
      c.category = x.category?.name || x.categories?.[0]?.name || c.category;
      c.language = x.language || "";
      return c;
    }).filter(Boolean);

    // Portuguese/Brazilian streams float to the top
    if (lang === "pt" && !search) {
      const pt = result.filter(x => x.language.toLowerCase().includes("portug"));
      const rest = result.filter(x => !x.language.toLowerCase().includes("portug"));
      result = [...pt, ...rest];
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(x =>
        x.slug.toLowerCase().includes(q) ||
        x.name.toLowerCase().includes(q) ||
        x.title.toLowerCase().includes(q) ||
        x.language.toLowerCase().includes(q)
      );
    }

    return result.slice(0, MAX);
  });
}

module.exports = { getChannel, getChannelStream, getChannelVideo, getChannelVideos, getVods, getLiveStreams };
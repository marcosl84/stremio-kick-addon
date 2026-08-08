const axios = require("axios");

const BASE = "https://kick.com";
const API = `${BASE}/api/v2`;
const TTL = Number(process.env.CACHE_DURATION || 60) * 1000;
const MAX = Number(process.env.MAX_RESULTS || 40);

const http = axios.create({
  timeout: 12000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; Stremio-Kick-Addon/1.1)",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://kick.com/"
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
    // This endpoint is used by Kick's web player and can expose the current
    // HLS playback URL without requiring a user OAuth token.
    const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}/livestream`);
    const data = r.data?.data || r.data;
    if (!data) return null;

    const channel = normalizeChannel(data.channel || data, true);
    const playbackUrl = data.playback_url || data.playbackUrl || data.stream?.playback_url;

    if (!playbackUrl) return null;

    return {
      ...channel,
      playbackUrl,
      streamId: data.id || data.stream_id || `kick_${slug}`
    };
  });
}

async function getLiveStreams(search) {
  return cached(`live:${search || ""}`, async () => {
    // Kick's public website endpoint is intentionally used as a fallback
    // because the official developer API requires OAuth credentials.
    const url = `${BASE}/stream/livestreams/en`;
    const r = await http.get(url, {
      params: { page: 1 },
      headers: { "Accept": "application/json, text/plain, */*" }
    });

    const raw = r.data?.data || r.data?.livestreams || r.data;
    const list = Array.isArray(raw) ? raw : [];

    let result = list.map(x => {
      const c = normalizeChannel(x.channel || x, true);
      if (!c) return null;

      // Some versions of the endpoint put stream data at the top level.
      c.title = x.session_title || x.stream_title || c.title;
      c.viewers = x.viewer_count || x.viewers || c.viewers;
      c.category = x.category?.name || x.categories?.[0]?.name || c.category;
      return c;
    }).filter(Boolean);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(x =>
        x.slug.toLowerCase().includes(q) ||
        x.name.toLowerCase().includes(q) ||
        x.title.toLowerCase().includes(q)
      );
    }

    return result.slice(0, MAX);
  });
}

module.exports = { getChannel, getChannelStream, getLiveStreams };
const axios = require("axios");

const BASE = "https://kick.com";
const API = `${BASE}/api/v2`;
const TTL = Number(process.env.CACHE_DURATION || 60) * 1000;
const EMPTY_TTL = Number(process.env.CACHE_EMPTY_DURATION || 8) * 1000;
const MAX = Number(process.env.MAX_RESULTS || 40);
const VOD_CHANNELS = Number(process.env.VOD_CHANNELS || 8);
const LIVE_LANG = process.env.KICK_LANG || "pt";
const FALLBACK_LIVE_SLUGS = String(process.env.KICK_FALLBACK_LIVE_SLUGS || "baianotv,gaules,casimito,alanzoka,nobru,coringa,fpsn1,flowgames,neymarjr,ronaldinho,xqc,adinross,amouranth,trainwreckstv,westcol,elmariana,rivers_gg,ibai,rubius,auronplay")
  .split(",")
  .map(x => x.trim().toLowerCase())
  .filter(Boolean);
const LIVE_LIST_TIMEOUT = Number(process.env.KICK_LIVE_LIST_TIMEOUT_MS || 3500);
const FAST_PROBE_TIMEOUT = Number(process.env.KICK_FAST_PROBE_TIMEOUT_MS || 3500);

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

function normalizeKickToken(token) {
  const raw = String(token || "").trim();
  if (!raw) return "";

  const withoutBearer = raw.replace(/^Bearer\s+/i, "");
  const withoutQuotes = withoutBearer.replace(/^['"]|['"]$/g, "");
  return withoutQuotes.trim();
}

function buildKickAuthHeaders(token) {
  const clean = normalizeKickToken(token);
  if (!clean) return {};

  return {
    Authorization: `Bearer ${clean}`,
    "X-Kick-Session": clean,
    "X-Session-Token": clean
  };
}

const cache = new Map();

function unique(items) {
  return Array.from(new Set(items));
}

async function listLiveByFallbackSlugs(search = "") {
  const q = String(search || "").trim().toLowerCase();
  const source = q
    ? FALLBACK_LIVE_SLUGS.filter(slug => slug.includes(q))
    : FALLBACK_LIVE_SLUGS;
  const slugs = unique(source).slice(0, MAX);

  if (slugs.length === 0) return [];

  const results = await Promise.all(slugs.map(async slug => {
    try {
      const r = await axios.get(`${API}/channels/${encodeURIComponent(slug)}`, {
        timeout: FAST_PROBE_TIMEOUT,
        headers: http.defaults.headers
      });
      const ch = r.data?.data || r.data;
      if (!ch?.playback_url || !ch?.livestream) return null;

      return {
        slug,
        name: ch.name || ch.username || ch.user?.username || slug,
        avatar: ch.avatar || ch.user?.profilepic || ch.user?.profile_pic || ch.profilepic || "",
        banner: ch.banner_image || ch.banner || "",
        followers: ch.followers_count || ch.followers || 0,
        isLive: true,
        title: ch.livestream?.session_title || "",
        viewers: ch.livestream?.viewer_count || 0,
        category: ch.livestream?.categories?.[0]?.name || ch.livestream?.category?.name || "",
        language: ch.livestream?.language || ""
      };
    } catch {
      return null;
    }
  }));

  return results.filter(Boolean).slice(0, MAX);
}

async function cached(key, fn) {
  const old = cache.get(key);
  if (old && old.expires > Date.now()) return old.value;
  const value = await fn();

  // Empty upstream results are common when Kick rate-limits or channels toggle
  // live/offline. Keep them cached only briefly to reduce false "no streams".
  const isEmptyArray = Array.isArray(value) && value.length === 0;
  const isEmptyObject = value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
  const isEmpty = value == null || isEmptyArray || isEmptyObject;
  cache.set(key, { value, expires: Date.now() + (isEmpty ? EMPTY_TTL : TTL) });
  return value;
}

function normalizeChannel(channel, live) {
  if (!channel) return null;

  const livestream = channel.livestream || channel.live_stream || null;
  const slug = channel.slug || channel.username || channel.user?.username;
  if (!slug) return null;

  const name = channel.name || channel.username || channel.user?.username || slug;
  return {
    slug,
    name,
    avatar: channel.avatar || channel.user?.profilepic || channel.user?.profile_pic || channel.profilepic || "",
    banner: channel.banner_image || channel.banner || channel.user?.banner || "",
    followers: channel.followers_count || channel.followers || 0,
    isLive: !!(live || livestream),
    title: livestream?.session_title || livestream?.stream_title || channel.stream_title || "",
    viewers: livestream?.viewer_count || livestream?.viewers || 0,
    category: livestream?.categories?.[0]?.name || livestream?.category?.name || "",
    language: livestream?.language || channel.language || "",
    thumbnail: livestream?.thumbnail?.src || channel.thumbnail?.src || ""
  };
}

function mergePriorityChannels(baseList = [], priorityList = []) {
  const seen = new Set();
  const merged = [];

  for (const item of [...priorityList, ...baseList]) {
    const slug = String(item?.slug || "").trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    merged.push(item);
  }

  return merged;
}

function resolveLivePayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  return payload.live_stream || payload.livestream || payload;
}

function resolvePlaybackUrl(payload) {
  if (!payload || typeof payload !== "object") return "";
  const live = resolveLivePayload(payload);
  const playbackUrl = live?.playback_url || payload.playback_url || live?.source_url || payload.source_url || "";
  return String(playbackUrl || "").trim();
}

async function getChannel(slug) {
  return cached(`channel:${slug}`, async () => {
    const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}`);
    return normalizeChannel(r.data?.data || r.data, false);
  });
}

async function getChannelStream(slug) {
  return cached(`stream:${slug}`, async () => {
    // Prefer channel endpoint first: it has been more stable than /livestream
    // from server IPs and already includes playback_url when the channel is live.
    try {
      const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}`);
      const ch = r.data?.data || r.data;
      if (ch?.playback_url && ch?.livestream) {
        return {
          slug,
          name: ch.user?.username || slug,
          title: ch.livestream?.session_title || "",
          viewers: ch.livestream?.viewer_count || 0,
          playbackUrl: ch.playback_url,
          streamId: ch.livestream?.id || `kick_${slug}`
        };
      }
    } catch {}

    // Fallback to /livestream for channels where channel payload is incomplete.
    try {
      const r = await http.get(`${API}/channels/${encodeURIComponent(slug)}/livestream`);
      const data = r.data?.data || r.data;
      if (data?.playback_url) {
        return {
          slug,
          name: slug,
          title: data.session_title || "",
          viewers: data.viewers || 0,
          playbackUrl: data.playback_url,
          streamId: data.id || `kick_${slug}`
        };
      }
    } catch {}

    return null;
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
          timeout: LIVE_LIST_TIMEOUT,
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
      c.language = x.language || c.language || "";
      c.thumbnail = x.thumbnail?.src || c.thumbnail || "";
      if (!c.avatar && x.channel?.user?.profilepic) c.avatar = x.channel.user.profilepic;
      if (!c.banner && x.channel?.banner) c.banner = x.channel.banner;
      return c;
    }).filter(Boolean);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(x =>
        x.slug.toLowerCase().includes(q) ||
        x.name.toLowerCase().includes(q) ||
        x.title.toLowerCase().includes(q) ||
        x.language.toLowerCase().includes(q)
      );
    }

    const followed = await getFollowedChannels(process.env.KICK_TOKEN || "");
    if (followed.length > 0) {
      result = mergePriorityChannels(result, followed);
    }

    if (result.length === 0) {
      const fallback = await listLiveByFallbackSlugs(search);
      if (fallback.length > 0) return fallback;
    }

    return result.slice(0, MAX);
  });
}

async function getFollowedChannels(token) {
  const cleanToken = normalizeKickToken(token);
  if (!cleanToken) return [];

  return cached(`followed:${cleanToken.slice(0, 20)}`, async () => {
    const headers = buildKickAuthHeaders(cleanToken);

    try {
      const r = await http.get(`${API}/channels/followed`, { headers });
      const raw = r.data?.data || r.data;
      const list = Array.isArray(raw) ? raw : [];

      const live = [];
      for (const ch of list) {
        const channel = ch.channel || ch;
        const slug = channel.slug || channel.username || ch.slug || ch.username;
        if (!slug) continue;
        const ls = channel.livestream || ch.livestream || null;
        if (!ls && !channel.is_live) continue;

        live.push({
          slug,
          name: channel.user?.username || channel.username || ch.user?.username || slug,
          avatar: channel.user?.profilepic || channel.avatar || ch.user?.profilepic || "",
          banner: channel.banner_image || channel.banner || ch.banner_image || "",
          title: ls?.session_title || channel.title || "",
          viewers: ls?.viewer_count || channel.viewers_count || 0,
          thumbnail: ls?.thumbnail?.src || channel.thumbnail || "",
          language: ls?.language || channel.language || "",
          isLive: true
        });
      }
      return live;
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        console.warn("Kick followed channels auth failed; returning empty list.", { status, message: error.message });
        return [];
      }
      throw error;
    }
  });
}

async function searchLiveChannels(query) {
  const q = query.toLowerCase().trim();
  const results = [];
  const seen = new Set();

  try {
    const stream = await getChannelStream(q);
    if (stream) {
      results.push({ slug: q, name: stream.name || q, title: stream.title, viewers: stream.viewers, avatar: "", banner: "", language: "", isLive: true });
      seen.add(q);
    }
  } catch {}

  const live = await getLiveStreams("", "en");
  for (const ch of live) {
    if (seen.has(ch.slug)) continue;
    if (ch.slug.toLowerCase().includes(q) || ch.name.toLowerCase().includes(q) || ch.title.toLowerCase().includes(q)) {
      results.push(ch);
      seen.add(ch.slug);
    }
  }

  if (results.length === 0) {
    const fallback = await listLiveByFallbackSlugs(q);
    for (const ch of fallback) {
      if (seen.has(ch.slug)) continue;
      if (ch.slug.toLowerCase().includes(q) || ch.name.toLowerCase().includes(q) || ch.title.toLowerCase().includes(q)) {
        results.push(ch);
        seen.add(ch.slug);
      }
    }
  }

  return results.slice(0, MAX);
}

async function searchVods(query) {
  const q = query.toLowerCase().trim();
  const results = [];
  const seen = new Set();

  // direct channel slug lookup to fetch that channel's full VOD list
  try {
    const channel = await getChannel(q);
    if (channel) {
      const videos = await getChannelVideos(q);
      for (const raw of videos) {
        if (!raw || !raw.source || raw.is_live) continue;
        const vod = normalizeVod(raw, channel);
        if (vod) { results.push(vod); seen.add(`${vod.slug}:${vod.id}`); }
      }
    }
  } catch {}

  // also search through cached VOD list
  const allVods = await getVods("");
  for (const vod of allVods) {
    const key = `${vod.slug}:${vod.id}`;
    if (seen.has(key)) continue;
    if (
      vod.session_title?.toLowerCase().includes(q) ||
      vod.channel.slug.toLowerCase().includes(q) ||
      vod.channel.name.toLowerCase().includes(q)
    ) {
      results.push(vod);
      seen.add(key);
    }
  }

  return results.slice(0, MAX);
}

module.exports = {
  getChannel,
  getChannelStream,
  getChannelVideo,
  getChannelVideos,
  getVods,
  getLiveStreams,
  searchLiveChannels,
  searchVods,
  normalizeKickToken,
  buildKickAuthHeaders,
  getFollowedChannels,
  resolveLivePayload,
  resolvePlaybackUrl,
  mergePriorityChannels,
  normalizeChannel
};
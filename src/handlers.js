const kick = require("./kickApi");

const FALLBACK_IMAGE = "https://kick.com/favicon.ico";

function cleanId(id) {
  return String(id || "")
    .replace(/^kick_/, "")
    .trim();
}

function parseVodId(id) {
  const cleaned = cleanId(id);
  if (!cleaned.startsWith("vod_")) return null;
  const parts = cleaned.slice(4).split("_");
  if (parts.length < 2) return null;
  const videoId = parts.pop();
  const slug = parts.join("_");
  return { slug, videoId };
}

function asString(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function sanitizeText(value, fallback = "") {
  const text = asString(value, fallback);
  const clean = text
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean || fallback;
}

function isHttpUrl(value) {
  const text = asString(value, "").trim();
  return /^https?:\/\/.+/i.test(text);
}

function isLikelyImageUrl(value) {
  const text = asString(value, "").trim();
  if (!isHttpUrl(text)) return false;

  // Accept known Kick image CDNs and common image file extensions.
  if (/^https?:\/\/(files|images)\.kick\.com\//i.test(text)) return true;
  return /\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/i.test(text);
}

function extractImageUrl(value) {
  if (isLikelyImageUrl(value)) return asString(value).trim();
  if (!value || typeof value !== "object") return "";

  const candidates = [
    value.src,
    value.url,
    value.thumbnail,
    value.image,
    value.full,
    value.original,
    value.large,
    value.medium,
    value.small
  ];

  for (const candidate of candidates) {
    if (isLikelyImageUrl(candidate)) return asString(candidate).trim();
  }

  return "";
}

function safeImage(value) {
  const found = extractImageUrl(value);
  return found || FALLBACK_IMAGE;
}

function buildLiveStreamEntries(slug, streamInfo, baseUrl) {
  const cleanBase = String(baseUrl || "").replace(/\/$/, "");
  const useLocalProxy = cleanBase && process.env.USE_HLS_PROXY !== "false";
  const directUrl = asString(streamInfo.playbackUrl);
  const proxyUrl = useLocalProxy
    ? asString(`${cleanBase}/proxy/live/${encodeURIComponent(slug)}.m3u8`)
    : "";

  const baseName = sanitizeText(asString(streamInfo.name, slug), "Kick Live");
  const baseTitle = sanitizeText(streamInfo.title || "Ao vivo", "Ao vivo");

  const streams = [];
  if (proxyUrl) {
    streams.push({
      name: sanitizeText(`Kick Proxy - ${baseName}`, "Kick Proxy"),
      title: baseTitle,
      description: baseTitle,
      url: proxyUrl
    });
  }

  if (directUrl) {
    streams.push({
      name: sanitizeText(`Kick Direct - ${baseName}`, "Kick Direct"),
      title: baseTitle,
      description: baseTitle,
      url: directUrl
    });
  }

  return streams;
}

function buildVodStreamEntries(vod, baseUrl) {
  const cleanBase = String(baseUrl || "").replace(/\/$/, "");
  const useLocalProxy = cleanBase && process.env.USE_HLS_PROXY !== "false";
  const directUrl = asString(vod.source);
  const proxyUrl = useLocalProxy
    ? asString(`${cleanBase}/proxy/hls?u=${encodeURIComponent(Buffer.from(vod.source, "utf8").toString("base64url"))}`)
    : "";

  const baseName = sanitizeText(asString(vod.channel?.name, vod.slug), "Kick VOD");
  const baseTitle = sanitizeText(vod.session_title || "VOD", "VOD");

  const streams = [];
  if (proxyUrl) {
    streams.push({
      name: sanitizeText(`Kick VOD Proxy - ${baseName}`, "Kick VOD Proxy"),
      title: baseTitle,
      description: baseTitle,
      url: proxyUrl
    });
  }

  if (directUrl) {
    streams.push({
      name: sanitizeText(`Kick VOD Direct - ${baseName}`, "Kick VOD Direct"),
      title: baseTitle,
      description: baseTitle,
      url: directUrl
    });
  }

  return streams;
}

function toLiveMeta(c) {
  return {
    id: `kick_${c.slug}`,
    type: "live",
    name: sanitizeText(c.name, c.slug),
    poster: safeImage(c.thumbnail || c.avatar),
    background: safeImage(c.thumbnail || c.banner || c.avatar),
    logo: safeImage(c.avatar || c.thumbnail),
    description: c.title
      ? `${c.title}${c.viewers ? ` • ${c.viewers} espectadores` : ""}`
      : `Canal ${c.name} na Kick`
  };
}

function toVodMeta(v) {
  return {
    id: `kick_vod_${v.slug}_${v.id}`,
    type: "other",
    name: sanitizeText(v.session_title || `VOD de ${v.channel.name}`, "Kick VOD"),
    poster: safeImage(v.thumbnail?.src || v.channel.avatar),
    background: safeImage(v.thumbnail?.src || v.channel.banner || v.channel.avatar),
    logo: safeImage(v.channel.avatar || v.thumbnail?.src),
    description: `${v.category ? `${v.category} • ` : ""}${v.language || ""}${v.duration ? ` • ${Math.floor(v.duration / 60)} min` : ""}`,
    runtime: v.duration ? Number(v.duration) : undefined
  };
}

async function handleCatalog(type, id, extra) {
  try {
    if (type === "live") {
      const list = extra.search
        ? await kick.searchLiveChannels(extra.search)
        : await kick.getLiveStreams("", "pt");
      return { metas: list.map(toLiveMeta) };
    }

    if (type === "other") {
      const list = extra.search
        ? await kick.searchVods(extra.search)
        : await kick.getVods("");
      return { metas: list.map(toVodMeta) };
    }

    return { metas: [] };
  } catch (err) {
    console.error("Catalog error:", err.response?.status || "", err.message);
    return { metas: [] };
  }
}

async function handleMeta(type, id) {
  if (type === "live") {
    const slug = cleanId(id);
    if (!slug) return null;

    try {
      const c = await kick.getChannel(slug);
      return c ? toLiveMeta(c) : null;
    } catch (err) {
      console.error("Meta error:", err.response?.status || "", err.message);
      return null;
    }
  }

  if (type === "other") {
    const vodInfo = parseVodId(id);
    if (!vodInfo) return null;

    try {
      const vod = await kick.getChannelVideo(vodInfo.slug, vodInfo.videoId);
      return vod ? toVodMeta(vod) : null;
    } catch (err) {
      console.error("Meta error:", err.response?.status || "", err.message);
      return null;
    }
  }

  return null;
}

async function handleStream(type, id, baseUrl = "") {
  if (type === "live") {
    const slug = cleanId(id);
    if (!slug) return { streams: [] };

    try {
      const s = await kick.getChannelStream(slug);
      if (!s || !s.playbackUrl) return { streams: [] };

      return {
        streams: buildLiveStreamEntries(slug, s, baseUrl)
      };
    } catch (err) {
      console.error("Stream error:", err.response?.status || "", err.message);
      return { streams: [] };
    }
  }

  if (type === "other") {
    const vodInfo = parseVodId(id);
    if (!vodInfo) return { streams: [] };

    try {
      const vod = await kick.getChannelVideo(vodInfo.slug, vodInfo.videoId);
      if (!vod || !vod.source) return { streams: [] };

      return {
        streams: buildVodStreamEntries(vod, baseUrl)
      };
    } catch (err) {
      console.error("Stream error:", err.response?.status || "", err.message);
      return { streams: [] };
    }
  }

  return { streams: [] };
}

module.exports = { handleCatalog, handleMeta, handleStream, toLiveMeta };
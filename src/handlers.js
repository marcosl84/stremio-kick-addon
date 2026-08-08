const kick = require("./kickApi");

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

function buildLiveStreamEntry(slug, streamInfo, baseUrl) {
  const cleanBase = String(baseUrl || "").replace(/\/$/, "");
  const useLocalProxy = cleanBase && process.env.USE_HLS_PROXY !== "false";
  const playbackUrl = useLocalProxy
    ? `${cleanBase}/proxy/live/${encodeURIComponent(slug)}.m3u8`
    : streamInfo.playbackUrl;

  return {
    name: `Kick • ${streamInfo.name}`,
    description: streamInfo.title || "Ao vivo",
    url: playbackUrl,
    behaviorHints: {
      bingeGroup: `kick_${slug}`
    }
  };
}

function buildVodStreamEntry(vod, baseUrl) {
  const cleanBase = String(baseUrl || "").replace(/\/$/, "");
  const useLocalProxy = cleanBase && process.env.USE_HLS_PROXY !== "false";
  const playbackUrl = useLocalProxy
    ? `${cleanBase}/proxy/hls?u=${encodeURIComponent(Buffer.from(vod.source, "utf8").toString("base64url"))}`
    : vod.source;

  return {
    name: `Kick VOD • ${vod.channel.name}`,
    description: vod.session_title || "VOD",
    url: playbackUrl,
    behaviorHints: {
      bingeGroup: `kick_vod_${vod.slug}`
    }
  };
}

function toLiveMeta(c) {
  return {
    id: `kick_${c.slug}`,
    type: "live",
    name: c.name,
    poster: c.thumbnail || c.avatar || undefined,
    background: c.thumbnail || c.banner || undefined,
    logo: c.avatar || undefined,
    description: c.title
      ? `${c.title}${c.viewers ? ` • ${c.viewers} espectadores` : ""}`
      : `Canal ${c.name} na Kick`
  };
}

function toVodMeta(v) {
  return {
    id: `kick_vod_${v.slug}_${v.id}`,
    type: "other",
    name: v.session_title || `VOD de ${v.channel.name}`,
    poster: v.thumbnail?.src || v.channel.avatar || undefined,
    background: v.thumbnail?.src || v.channel.banner || undefined,
    logo: v.channel.avatar || undefined,
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
        streams: [buildLiveStreamEntry(slug, s, baseUrl)]
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
        streams: [buildVodStreamEntry(vod, baseUrl)]
      };
    } catch (err) {
      console.error("Stream error:", err.response?.status || "", err.message);
      return { streams: [] };
    }
  }

  return { streams: [] };
}

module.exports = { handleCatalog, handleMeta, handleStream, toLiveMeta };
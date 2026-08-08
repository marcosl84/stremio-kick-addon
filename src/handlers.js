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

function toLiveMeta(c) {
  return {
    id: `kick_${c.slug}`,
    type: "live",
    name: c.name,
    poster: c.avatar || undefined,
    background: c.banner || undefined,
    logo: c.avatar || undefined,
    description: c.title
      ? `${c.title}${c.viewers ? ` • ${c.viewers} espectadores` : ""}`
      : `Canal ${c.name} na Kick`
  };
}

function toVodMeta(v) {
  return {
    id: `kick_vod_${v.slug}_${v.id}`,
    type: "movie",
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
      const list = await kick.getLiveStreams(extra.search);
      return { metas: list.map(toLiveMeta) };
    }

    if (type === "movie") {
      const list = await kick.getVods(extra.search);
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

  if (type === "movie") {
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

async function handleStream(type, id) {
  if (type === "live") {
    const slug = cleanId(id);
    if (!slug) return { streams: [] };

    try {
      const s = await kick.getChannelStream(slug);
      if (!s || !s.playbackUrl) return { streams: [] };

      return {
        streams: [{
          name: `Kick • ${s.name}`,
          title: s.title || "Ao vivo",
          url: s.playbackUrl,
          behaviorHints: {
            notWebReady: true,
            bingeGroup: `kick_${slug}`
          }
        }]
      };
    } catch (err) {
      console.error("Stream error:", err.response?.status || "", err.message);
      return { streams: [] };
    }
  }

  if (type === "movie") {
    const vodInfo = parseVodId(id);
    if (!vodInfo) return { streams: [] };

    try {
      const vod = await kick.getChannelVideo(vodInfo.slug, vodInfo.videoId);
      if (!vod || !vod.source) return { streams: [] };

      return {
        streams: [{
          name: `Kick VOD • ${vod.channel.name}`,
          title: vod.session_title || "VOD",
          url: vod.source,
          behaviorHints: {
            notWebReady: true,
            bingeGroup: `kick_vod_${vod.slug}`
          }
        }]
      };
    } catch (err) {
      console.error("Stream error:", err.response?.status || "", err.message);
      return { streams: [] };
    }
  }

  return { streams: [] };
}

module.exports = { handleCatalog, handleMeta, handleStream };
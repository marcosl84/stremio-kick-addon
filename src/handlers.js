const kick = require("./kickApi");

function cleanSlug(id) {
  return String(id || "")
    .replace(/^kick_live_/, "")
    .replace(/^kick_channel_/, "")
    .replace(/^kick_/, "")
    .trim();
}

function toMeta(c) {
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

async function handleCatalog(type, id, extra) {
  if (type !== "live") return { metas: [] };

  try {
    const list = await kick.getLiveStreams(extra.search);
    return { metas: list.map(toMeta) };
  } catch (err) {
    console.error("Catalog error:", err.response?.status || "", err.message);
    return { metas: [] };
  }
}

async function handleMeta(type, id) {
  const slug = cleanSlug(id);
  if (!slug) return null;

  try {
    const c = await kick.getChannel(slug);
    return c ? toMeta(c) : null;
  } catch (err) {
    console.error("Meta error:", err.response?.status || "", err.message);
    return null;
  }
}

async function handleStream(type, id) {
  const slug = cleanSlug(id);
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

module.exports = { handleCatalog, handleMeta, handleStream };
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveLivePayload, resolvePlaybackUrl, normalizeKickToken, buildKickAuthHeaders, mergePriorityChannels, normalizeVod } = require('../src/kickApi');
const { extractPlaylistVariants, chooseCompatibleVariant, getQualityLabel, toLiveMeta } = require('../src/handlers');

test('normalizeKickToken accepts raw JWT and Bearer-prefixed values', () => {
  assert.equal(normalizeKickToken('eyJhbGciOiJIUzI1NiJ9.test'), 'eyJhbGciOiJIUzI1NiJ9.test');
  assert.equal(normalizeKickToken('Bearer eyJhbGciOiJIUzI1NiJ9.test'), 'eyJhbGciOiJIUzI1NiJ9.test');
  assert.equal(normalizeKickToken('"eyJhbGciOiJIUzI1NiJ9.test"'), 'eyJhbGciOiJIUzI1NiJ9.test');
});

test('buildKickAuthHeaders keeps a valid Authorization header for Kick APIs', () => {
  const headers = buildKickAuthHeaders('Bearer eyJhbGciOiJIUzI1NiJ9.test');
  assert.equal(headers.Authorization, 'Bearer eyJhbGciOiJIUzI1NiJ9.test');
  assert.equal(headers['X-Kick-Session'], 'eyJhbGciOiJIUzI1NiJ9.test');
});

test('modern Kick live payloads expose playback_url through live_stream', () => {
  const payload = {
    playback_url: 'https://live-video.net/manifest.m3u8',
    live_stream: {
      session_title: 'Live test',
      viewer_count: 123,
      playback_url: 'https://live-video.net/manifest.m3u8'
    }
  };

  assert.equal(resolvePlaybackUrl(payload), 'https://live-video.net/manifest.m3u8');
  assert.equal(resolveLivePayload(payload)?.session_title, 'Live test');
});

test('playlist variants expose quality labels and a default compatible selection', () => {
  const body = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720,FRAME-RATE=30.0
https://cdn.example/live/720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x1080,FRAME-RATE=60.0
https://cdn.example/live/1080p.m3u8`;

  const variants = extractPlaylistVariants(body, 'https://cdn.example/live/master.m3u8');
  assert.equal(variants.length, 2);
  assert.equal(getQualityLabel(variants[0]), '720p');
  assert.equal(getQualityLabel(variants[1]), '1080p');
  assert.equal(chooseCompatibleVariant(variants)?.height, 720);
});

test('followed channels are prioritized and keep streamer metadata', () => {
  const followed = [{ slug: 'gabepeixe', name: 'gabepeixe', avatar: 'https://img.example/gabe.jpg', banner: 'https://img.example/gabe-banner.jpg', title: 'Ao vivo', viewers: 1200 }];
  const live = [{ slug: 'coringa', name: 'coringa', avatar: 'https://img.example/coringa.jpg', banner: 'https://img.example/coringa-banner.jpg', title: 'Jogo com a galera', viewers: 900 }];

  const merged = mergePriorityChannels(live, followed);
  assert.equal(merged[0].slug, 'gabepeixe');
  assert.equal(merged[0].avatar, 'https://img.example/gabe.jpg');
  assert.equal(merged[0].banner, 'https://img.example/gabe-banner.jpg');
  assert.equal(merged.length, 2);
});

test('live metadata uses the streamer name as the title and preserves the cover art', () => {
  const meta = toLiveMeta({
    slug: 'gabepeixe',
    name: 'gabepeixe',
    avatar: 'https://img.example/gabe-avatar.jpg',
    banner: 'https://img.example/gabe-banner.jpg',
    title: 'Fazendo lives de valor',
    viewers: 1234
  });

  assert.equal(meta.name, 'gabepeixe');
  assert.equal(meta.poster, 'https://img.example/gabe-avatar.jpg');
  assert.equal(meta.background, 'https://img.example/gabe-banner.jpg');
  assert.equal(meta.description, 'Fazendo lives de valor • 1234 espectadores');
});

test('modern Kick VOD payloads keep a usable playback URL and metadata', () => {
  const channel = {
    slug: 'gabepeixe',
    name: 'gabepeixe',
    avatar: 'https://img.example/gabe-avatar.jpg',
    banner: 'https://img.example/gabe-banner.jpg',
    category: 'IRL'
  };

  const vod = normalizeVod({
    id: 42,
    playback_url: 'https://live-video.net/vod/42/master.m3u8',
    session_title: 'Replay da live',
    duration: 1234,
    language: 'pt',
    is_live: false,
    thumbnail: { src: 'https://img.example/thumb.jpg' }
  }, channel);

  assert.equal(vod.source, 'https://live-video.net/vod/42/master.m3u8');
  assert.equal(vod.session_title, 'Replay da live');
  assert.equal(vod.category, 'IRL');
  assert.equal(vod.slug, 'gabepeixe');
});

'use strict';
/* Lazy seed: converts the frontend js/data/* content (via generated seed-data.js)
 * into blob records on first request. Seeded posts reference picsum URLs —
 * only real user uploads are stored as media blobs. Demo logins: password "password". */
const data = require('./seed-data');

const MIN = 6e4, HOUR = 36e5, DAY = 864e5;
function parseAgo(s) {
  const m = /^(\d+)(m|h|d|w)$/.exec(String(s || '').trim());
  if (!m) return HOUR;
  const k = { m: MIN, h: HOUR, d: DAY, w: 7 * DAY }[m[2]];
  return parseInt(m[1], 10) * k;
}

const ME_FOLLOWS = ['wander.lens', 'spice.route', 'circuit.break', 'paws.and.claws',
  'pixel.nomad', 'dev.diaries', 'frames.by.ana', 'astro.nights'];
const FOLLOW_ME = ['terra.garden', 'dev.diaries', 'astro.nights', 'frames.by.ana', 'thrift.tales'];
/* Posts by you.exe so the seeded profile grid isn't empty */
const MY_POSTS = [
  { seed: 'prof-1', ago: 2 * DAY, likes: 900, caption: 'Weekend dump 📸', tags: [] },
  { seed: 'prof-2', ago: 5 * DAY, likes: 1513, caption: 'Golden hour never misses 🌅', tags: ['#photography'] },
  { seed: 'prof-3', ago: 9 * DAY, likes: 2126, caption: 'New setup, who dis 💻', tags: ['#desksetup'] },
];

async function seedAll(store, { hashPassword, rid }) {
  const now = Date.now();
  const set = (k, v) => store.set(k, JSON.stringify(v));
  const pwHash = hashPassword('password');

  // users
  for (const u of [data.me, ...data.users]) {
    await set(`users/${u.username}.json`, {
      username: u.username, name: u.name, bio: u.bio, avatar: u.avatar,
      verified: u.verified, createdAt: now - 400 * DAY, passwordHash: pwHash,
    });
  }

  // follows
  await set('follows/you.exe.json', ME_FOLLOWS);
  for (const f of FOLLOW_ME) await set(`follows/${f}.json`, ['you.exe']);

  // posts from data
  let i = 0;
  for (const p of data.posts) {
    const id = 'seed-p' + (i++);
    const createdAt = now - parseAgo(p.time);
    await set(`posts/${id}.json`, {
      id, username: p.user,
      image: { kind: 'url', url: `https://picsum.photos/seed/${p.seed}/800/800` },
      caption: p.caption, tags: p.tags, createdAt, baseLikes: p.likes,
    });
    await set(`likes/${id}.json`, []);
    await set(`comments/${id}.json`, p.comments.map((c, j) => ({
      id: `${id}-c${j}`, username: c.user, text: c.text, createdAt: createdAt + (j + 1) * HOUR,
    })));
  }
  // my posts
  MY_POSTS.forEach((p, k) => {
    const id = 'seed-mine' + k;
    const createdAt = now - p.ago;
    set(`posts/${id}.json`, {
      id, username: 'you.exe',
      image: { kind: 'url', url: `https://picsum.photos/seed/${p.seed}/800/800` },
      caption: p.caption, tags: p.tags, createdAt, baseLikes: p.likes,
    });
    set(`likes/${id}.json`, []);
    set(`comments/${id}.json`, []);
  });

  // stories (last 24h)
  let si = 0;
  for (const s of data.stories) {
    const id = 'seed-s' + (si++);
    await set(`stories/${s.user}/${id}.json`, {
      id, username: s.user,
      image: { kind: 'url', url: `https://picsum.photos/seed/${s.seed}/600/1000` },
      createdAt: now - parseAgo(s.time),
    });
  }

  // notifications for you.exe
  await set('notifs/you.exe.json', data.notifications.map((n, k) => ({
    id: 'seed-n' + k, type: n.type, actor: n.user, text: n.text,
    postImage: n.thumb ? `https://picsum.photos/seed/${n.thumb}/100/100` : null,
    createdAt: now - parseAgo(n.time),
  })));

  // DM threads (keyed by sorted pair)
  for (const t of data.threads) {
    const key = 'dm/' + ['you.exe', t.user].sort().join('/') + '.json';
    const n = t.messages.length;
    await set(key, t.messages.map((m, j) => ({
      id: `seed-dm-${t.user}-${j}`,
      from: m.from === 'me' ? 'you.exe' : t.user,
      text: m.text, createdAt: now - (n - j) * HOUR, liked: !!m.liked,
    })));
  }
}

module.exports = { seedAll };

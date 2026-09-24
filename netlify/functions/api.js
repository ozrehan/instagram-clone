'use strict';
/* Instagram-clone backend — ONE Netlify Function, manual routing.
 *
 * Store interface (real: @netlify/blobs getStore; tests: in-memory shim):
 *   get(key)                              -> string|null
 *   get(key, {type:'arrayBuffer'})        -> ArrayBuffer|null
 *   set(key, string|Buffer|ArrayBuffer|Uint8Array)
 *   delete(key)
 *   list({prefix})                        -> { blobs: [{key}] }
 *
 * Blob layout:
 *   users/{username}.json      sessions/{token}.json
 *   posts/{id}.json            likes/{postId}.json        comments/{postId}.json
 *   saves/{username}.json      follows/{username}.json    media/{mid}.bin (+ .meta.json)
 *   stories/{username}/{sid}.json
 *   notifs/{username}.json     dm/{a}/{b}.json (a<b sorted)  dmread/{me}/{other}.json
 *   meta/seeded
 */
const crypto = require('crypto');

const SESSION_DAYS = 30;
const MAX_IMAGE_BYTES = 800 * 1024;

/* ---------------- crypto ---------------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
function verifyPassword(pw, stored) {
  try {
    const [, saltHex, hashHex] = String(stored).split('$');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    const test = crypto.scryptSync(pw, salt, 64);
    return test.length === hash.length && crypto.timingSafeEqual(test, hash);
  } catch { return false; }
}
const rid = p => p + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const newToken = () => crypto.randomBytes(32).toString('hex');

/* ---------------- store helpers ---------------- */
const jget = async (store, key, fb = null) => {
  const raw = await store.get(key);
  if (raw == null) return fb;
  try { return JSON.parse(raw); } catch { return fb; }
};
const jset = (store, key, obj) => store.set(key, JSON.stringify(obj));

function createApp(store) {
  /* ---------------- seeding ---------------- */
  let _seedPromise = null;
  function ensureSeeded() {
    if (!_seedPromise) {
      _seedPromise = (async () => {
        if (await store.get('meta/seeded')) return;
        const { seedAll } = require('./seed');
        await seedAll(store, { hashPassword, rid });
        await jset(store, 'meta/seeded', { at: Date.now() });
      })();
    }
    return _seedPromise;
  }

  /* ---------------- auth ---------------- */
  const publicUser = u => ({
    username: u.username, name: u.name, bio: u.bio || '',
    avatar: u.avatar, verified: !!u.verified, createdAt: u.createdAt,
  });

  async function authUser(headers) {
    const h = headers['authorization'] || headers['Authorization'] || '';
    const m = /^Bearer\s+(.+)$/.exec(String(h).trim());
    if (!m) return null;
    const s = await jget(store, 'sessions/' + m[1] + '.json', null);
    if (!s || s.expiresAt < Date.now()) return null;
    const u = await jget(store, 'users/' + s.username + '.json', null);
    return u || null;
  }

  async function countsFor(username) {
    const posts = await listPostsBy(username);
    const followers = await followersOf(username);
    const following = await jget(store, `follows/${username}.json`, []);
    return { posts: posts.length, followers: followers.length, following: following.length };
  }

  /* ---------------- data access ---------------- */
  async function listPostsBy(username) {
    const { blobs } = await store.list({ prefix: 'posts/' });
    const out = [];
    for (const b of blobs) {
      const p = await jget(store, b.key, null);
      if (p && p.username === username) out.push(p);
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }
  async function followersOf(username) {
    const { blobs } = await store.list({ prefix: 'follows/' });
    const out = [];
    for (const b of blobs) {
      const arr = await jget(store, b.key, []);
      if (arr.includes(username)) out.push(b.key.slice('follows/'.length, -'.json'.length));
    }
    return out;
  }
  const imageUrl = img => (img && img.kind === 'media') ? `/api/media/${img.id}` : (img ? img.url : '');

  async function presentPost(p, me) {
    const likes = await jget(store, `likes/${p.id}.json`, []);
    const comments = await jget(store, `comments/${p.id}.json`, []);
    const saves = me ? await jget(store, `saves/${me}.json`, []) : [];
    const owner = await jget(store, `users/${p.username}.json`, null);
    return {
      id: p.id, username: p.username,
      name: owner ? owner.name : p.username,
      avatar: owner ? owner.avatar : '',
      verified: owner ? !!owner.verified : false,
      image: imageUrl(p.image),
      caption: p.caption, tags: p.tags || [], createdAt: p.createdAt,
      likes: (p.baseLikes || 0) + likes.length,
      liked: me ? likes.includes(me) : false,
      saved: me ? saves.includes(p.id) : false,
      commentsCount: comments.length,
      comments: comments.slice(-2).map(c => ({ id: c.id, username: c.username, text: c.text, createdAt: c.createdAt })),
    };
  }

  function parseImageData(imageData) {
    const m = /^data:(image\/(jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(imageData || ''));
    if (!m) return { error: 'imageData must be a data URL (jpeg/png/webp/gif)' };
    const buf = Buffer.from(m[3], 'base64');
    if (buf.length > MAX_IMAGE_BYTES) return { error: `image too large (max ${MAX_IMAGE_BYTES / 1024}KB)` };
    if (buf.length === 0) return { error: 'empty image' };
    return { buf, mime: m[1] };
  }
  async function storeImage(imageData, imageUrl, prefix) {
    if (imageData) {
      const r = parseImageData(imageData);
      if (r.error) return r;
      const mid = rid(prefix || 'm');
      await store.set(`media/${mid}.bin`, r.buf);
      await jset(store, `media/${mid}.meta.json`, { mime: r.mime, at: Date.now() });
      return { image: { kind: 'media', id: mid } };
    }
    if (imageUrl && /^https?:\/\//.test(imageUrl)) return { image: { kind: 'url', url: imageUrl } };
    return { error: 'imageData (data URL) or imageUrl (http) required' };
  }

  async function addNotif(username, n) {
    if (!username) return;
    const arr = await jget(store, `notifs/${username}.json`, []);
    arr.push({ id: rid('n'), createdAt: Date.now(), ...n });
    await jset(store, `notifs/${username}.json`, arr.slice(-100));
  }

  const dmKey = (a, b) => 'dm/' + [a, b].sort().join('/') + '.json';

  /* ---------------- responses ---------------- */
  const json = (statusCode, obj) => ({
    statusCode, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  });
  const ok = obj => json(200, obj);
  const err = (statusCode, error) => json(statusCode, { error });
  const needAuth = () => err(401, 'auth required');

  /* ---------------- router ---------------- */
  async function handle(req) {
    await ensureSeeded();
    const method = (req.method || 'GET').toUpperCase();
    const seg = String(req.path || '/').split('?')[0].split('/').filter(Boolean);
    const q = req.query || {};
    let body = null;
    if (req.body) { try { body = JSON.parse(req.body); } catch { return err(400, 'invalid JSON body'); } }

    // CORS preflight
    if (method === 'OPTIONS') {
      return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' }, body: '' };
    }

    try {
      // ---- public ----
      if (seg.length === 0) return ok({ ok: true, name: 'instagram-clone-api' });
      if (seg[0] === 'health') return ok({ ok: true, time: Date.now() });

      if (seg[0] === 'auth' && seg[1] === 'signup' && method === 'POST') {
        const { username = '', password = '', name = '' } = body || {};
        const uname = String(username).trim();
        if (!/^[a-zA-Z0-9._]{2,30}$/.test(uname)) return err(400, 'username: 2-30 chars, letters/numbers/._');
        if (String(password).length < 4) return err(400, 'password: min 4 chars');
        if (!String(name).trim()) return err(400, 'name required');
        if (await store.get(`users/${uname}.json`)) return err(409, 'username taken');
        const user = {
          username: uname, name: String(name).trim().slice(0, 60), bio: '',
          avatar: `https://picsum.photos/seed/ava-${encodeURIComponent(uname)}/100/100`,
          verified: false, createdAt: Date.now(), passwordHash: hashPassword(String(password)),
        };
        await jset(store, `users/${uname}.json`, user);
        const token = newToken();
        await jset(store, `sessions/${token}.json`, { username: uname, expiresAt: Date.now() + SESSION_DAYS * 864e5 });
        return ok({ token, user: publicUser(user) });
      }

      if (seg[0] === 'auth' && seg[1] === 'login' && method === 'POST') {
        const { username = '', password = '' } = body || {};
        const user = await jget(store, `users/${String(username).trim()}.json`, null);
        if (!user || !verifyPassword(String(password), user.passwordHash)) return err(401, 'invalid username or password');
        const token = newToken();
        await jset(store, `sessions/${token}.json`, { username: user.username, expiresAt: Date.now() + SESSION_DAYS * 864e5 });
        return ok({ token, user: publicUser(user) });
      }

      // media is public (like CDN images)
      if (seg[0] === 'media' && seg[1] && method === 'GET') {
        const mid = seg[1];
        if (!/^[A-Za-z0-9]+$/.test(mid)) return err(400, 'bad media id');
        const ab = await store.get(`media/${mid}.bin`, { type: 'arrayBuffer' });
        if (!ab) return err(404, 'media not found');
        const meta = await jget(store, `media/${mid}.meta.json`, { mime: 'image/jpeg' });
        return {
          statusCode: 200,
          headers: { 'Content-Type': meta.mime || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000', 'Access-Control-Allow-Origin': '*' },
          body: Buffer.from(ab).toString('base64'),
          isBase64Encoded: true,
        };
      }

      // ---- authed ----
      const me = await authUser(req.headers || {});
      if (!me) return needAuth();
      const meName = me.username;

      if (seg[0] === 'me' && method === 'GET') {
        return ok({ user: publicUser(me), counts: await countsFor(meName) });
      }

      if (seg[0] === 'users' && seg.length === 1 && method === 'GET') {
        const { blobs } = await store.list({ prefix: 'users/' });
        const following = await jget(store, `follows/${meName}.json`, []);
        const out = [];
        for (const b of blobs) {
          const u = await jget(store, b.key, null);
          if (u && u.username !== meName) out.push({ ...publicUser(u), isFollowing: following.includes(u.username) });
        }
        return ok({ users: out });
      }

      if (seg[0] === 'users' && seg[1] && seg.length === 2 && method === 'GET') {
        const u = await jget(store, `users/${seg[1]}.json`, null);
        if (!u) return err(404, 'user not found');
        const posts = await listPostsBy(u.username);
        const following = await jget(store, `follows/${meName}.json`, []);
        return ok({
          user: publicUser(u),
          counts: await countsFor(u.username),
          isFollowing: following.includes(u.username),
          isMe: u.username === meName,
          posts: await Promise.all(posts.map(p => presentPost(p, meName))),
        });
      }

      if (seg[0] === 'users' && seg[1] && seg[2] === 'follow' && method === 'POST') {
        const target = seg[1];
        if (target === meName) return err(400, 'cannot follow yourself');
        if (!await store.get(`users/${target}.json`)) return err(404, 'user not found');
        const arr = await jget(store, `follows/${meName}.json`, []);
        let following;
        if (arr.includes(target)) { following = false; await jset(store, `follows/${meName}.json`, arr.filter(x => x !== target)); }
        else {
          following = true;
          arr.push(target);
          await jset(store, `follows/${meName}.json`, arr);
          await addNotif(target, { type: 'follow', actor: meName, text: 'started following you.' });
        }
        return ok({ following, followers: (await followersOf(target)).length });
      }

      if (seg[0] === 'feed' && method === 'GET') {
        const following = await jget(store, `follows/${meName}.json`, []);
        const authors = new Set([meName, ...following]);
        const { blobs } = await store.list({ prefix: 'posts/' });
        let posts = [];
        for (const b of blobs) {
          const p = await jget(store, b.key, null);
          if (p && authors.has(p.username)) posts.push(p);
        }
        posts.sort((a, b) => b.createdAt - a.createdAt);
        if (q.before) {
          const ref = await jget(store, `posts/${q.before}.json`, null);
          if (ref) posts = posts.filter(p => p.createdAt < ref.createdAt);
        }
        const limit = Math.min(parseInt(q.limit, 10) || 20, 50);
        posts = posts.slice(0, limit);
        return ok({ posts: await Promise.all(posts.map(p => presentPost(p, meName))) });
      }

      if (seg[0] === 'posts' && seg.length === 1 && method === 'POST') {
        const caption = String((body && body.caption) || '').slice(0, 2200) || 'New post ✨';
        const r = await storeImage(body && body.imageData, body && body.imageUrl, 'm');
        if (r.error) return err(400, r.error);
        const tags = (caption.match(/#\w+/g) || []).slice(0, 5);
        const post = { id: rid('p'), username: meName, image: r.image, caption, tags, createdAt: Date.now(), baseLikes: 0 };
        await jset(store, `posts/${post.id}.json`, post);
        await jset(store, `likes/${post.id}.json`, []);
        await jset(store, `comments/${post.id}.json`, []);
        return ok({ post: await presentPost(post, meName) });
      }

      if (seg[0] === 'posts' && seg[1] && seg.length === 2 && method === 'DELETE') {
        const p = await jget(store, `posts/${seg[1]}.json`, null);
        if (!p) return err(404, 'post not found');
        if (p.username !== meName) return err(403, 'not your post');
        await store.delete(`posts/${p.id}.json`);
        await store.delete(`likes/${p.id}.json`);
        await store.delete(`comments/${p.id}.json`);
        if (p.image && p.image.kind === 'media') {
          await store.delete(`media/${p.image.id}.bin`);
          await store.delete(`media/${p.image.id}.meta.json`);
        }
        return ok({ deleted: true });
      }

      if (seg[0] === 'posts' && seg[1] && seg[2] === 'like' && method === 'POST') {
        const p = await jget(store, `posts/${seg[1]}.json`, null);
        if (!p) return err(404, 'post not found');
        const likes = await jget(store, `likes/${p.id}.json`, []);
        const want = body && typeof body.value === 'boolean' ? body.value : !likes.includes(meName);
        let liked;
        if (want && !likes.includes(meName)) {
          likes.push(meName); liked = true;
          if (p.username !== meName) await addNotif(p.username, { type: 'like', actor: meName, text: 'liked your photo.', postId: p.id, postImage: imageUrl(p.image) });
        } else if (!want && likes.includes(meName)) {
          liked = false;
          await jset(store, `likes/${p.id}.json`, likes.filter(x => x !== meName));
        } else { liked = likes.includes(meName); return ok({ liked, likes: (p.baseLikes || 0) + likes.length }); }
        if (liked) await jset(store, `likes/${p.id}.json`, likes);
        return ok({ liked, likes: (p.baseLikes || 0) + (await jget(store, `likes/${p.id}.json`, [])).length });
      }

      if (seg[0] === 'posts' && seg[1] && seg[2] === 'save' && method === 'POST') {
        const p = await jget(store, `posts/${seg[1]}.json`, null);
        if (!p) return err(404, 'post not found');
        const saves = await jget(store, `saves/${meName}.json`, []);
        let saved;
        if (saves.includes(p.id)) { saved = false; await jset(store, `saves/${meName}.json`, saves.filter(x => x !== p.id)); }
        else { saved = true; saves.push(p.id); await jset(store, `saves/${meName}.json`, saves); }
        return ok({ saved });
      }

      if (seg[0] === 'posts' && seg[1] && seg[2] === 'comments' && method === 'POST') {
        const p = await jget(store, `posts/${seg[1]}.json`, null);
        if (!p) return err(404, 'post not found');
        const text = String((body && body.text) || '').trim().slice(0, 220);
        if (!text) return err(400, 'comment text required');
        const comments = await jget(store, `comments/${p.id}.json`, []);
        const c = { id: rid('c'), username: meName, text, createdAt: Date.now() };
        comments.push(c);
        await jset(store, `comments/${p.id}.json`, comments);
        if (p.username !== meName) {
          await addNotif(p.username, { type: 'comment', actor: meName, text: `commented: "${text.slice(0, 60)}"`, postId: p.id, postImage: imageUrl(p.image) });
        }
        return ok({ comment: c, commentsCount: comments.length });
      }

      if (seg[0] === 'stories' && method === 'GET') {
        const following = await jget(store, `follows/${meName}.json`, []);
        const authors = [meName, ...following];
        const cutoff = Date.now() - 24 * 36e5;
        const out = [];
        for (const a of authors) {
          const { blobs } = await store.list({ prefix: `stories/${a}/` });
          const items = [];
          for (const b of blobs) {
            const s = await jget(store, b.key, null);
            if (s && s.createdAt > cutoff) items.push({ id: s.id, image: imageUrl(s.image), createdAt: s.createdAt });
          }
          if (items.length) {
            const u = await jget(store, `users/${a}.json`, null);
            out.push({ username: a, avatar: u ? u.avatar : '', verified: u ? !!u.verified : false, items: items.sort((x, y) => x.createdAt - y.createdAt) });
          }
        }
        return ok({ stories: out });
      }

      if (seg[0] === 'stories' && method === 'POST') {
        const r = await storeImage(body && body.imageData, body && body.imageUrl, 's');
        if (r.error) return err(400, r.error);
        const s = { id: rid('s'), username: meName, image: r.image, createdAt: Date.now() };
        await jset(store, `stories/${meName}/${s.id}.json`, s);
        return ok({ story: { id: s.id, image: imageUrl(s.image), createdAt: s.createdAt } });
      }

      if (seg[0] === 'explore' && method === 'GET') {
        const { blobs } = await store.list({ prefix: 'posts/' });
        const posts = [];
        for (const b of blobs) {
          const p = await jget(store, b.key, null);
          if (p) posts.push(p);
        }
        const scored = [];
        for (const p of posts) {
          const likes = await jget(store, `likes/${p.id}.json`, []);
          scored.push({ p, score: (p.baseLikes || 0) + likes.length });
        }
        scored.sort((a, b) => b.score - a.score);
        return ok({ posts: await Promise.all(scored.slice(0, 30).map(x => presentPost(x.p, meName))) });
      }

      if (seg[0] === 'notifications' && method === 'GET') {
        const arr = await jget(store, `notifs/${meName}.json`, []);
        const out = [];
        for (const n of arr.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 30)) {
          const actor = await jget(store, `users/${n.actor}.json`, null);
          out.push({ ...n, actorAvatar: actor ? actor.avatar : '', actorVerified: actor ? !!actor.verified : false });
        }
        return ok({ notifications: out });
      }

      if (seg[0] === 'dm' && seg.length === 1 && method === 'GET') {
        const { blobs } = await store.list({ prefix: 'dm/' });
        const out = [];
        for (const b of blobs) {
          const parts = b.key.slice(3, -'.json'.length).split('/');
          if (!parts.includes(meName)) continue;
          const other = parts.find(x => x !== meName);
          const msgs = await jget(store, b.key, []);
          if (!msgs.length) continue;
          const last = msgs[msgs.length - 1];
          const readTs = await jget(store, `dmread/${meName}/${other}.json`, 0);
          const unread = msgs.filter(m => m.from === other && m.createdAt > readTs).length;
          const u = await jget(store, `users/${other}.json`, null);
          out.push({
            username: other, name: u ? u.name : other, avatar: u ? u.avatar : '',
            verified: u ? !!u.verified : false,
            lastText: last.text, lastAt: last.createdAt, unread,
          });
        }
        out.sort((a, b) => b.lastAt - a.lastAt);
        return ok({ threads: out });
      }

      if (seg[0] === 'dm' && seg[1] && seg.length === 2 && method === 'GET') {
        const other = seg[1];
        if (!await store.get(`users/${other}.json`)) return err(404, 'user not found');
        const key = dmKey(meName, other);
        let msgs = await jget(store, key, []);
        if (q.after) msgs = msgs.filter(m => m.createdAt > +q.after);
        await jset(store, `dmread/${meName}/${other}.json`, Date.now());
        return ok({ messages: msgs });
      }

      if (seg[0] === 'dm' && seg[1] && seg.length === 2 && method === 'POST') {
        const other = seg[1];
        if (other === meName) return err(400, 'cannot DM yourself');
        if (!await store.get(`users/${other}.json`)) return err(404, 'user not found');
        const text = String((body && body.text) || '').trim().slice(0, 1000);
        if (!text) return err(400, 'message text required');
        const key = dmKey(meName, other);
        const msgs = await jget(store, key, []);
        const m = { id: rid('dm'), from: meName, text, createdAt: Date.now(), liked: false };
        msgs.push(m);
        await jset(store, key, msgs);
        return ok({ message: m });
      }

      if (seg[0] === 'dm' && seg[1] && seg[2] === 'like' && method === 'POST') {
        const other = seg[1];
        const key = dmKey(meName, other);
        const msgs = await jget(store, key, []);
        const m = msgs.find(x => x.id === (body && body.messageId));
        if (!m) return err(404, 'message not found');
        m.liked = !m.liked;
        await jset(store, key, msgs);
        return ok({ liked: m.liked });
      }

      return err(404, 'unknown route');
    } catch (e) {
      console.error('api error', e);
      return err(500, 'server error');
    }
  }

  return { handle };
}

/* Netlify Function entrypoint */
exports.handler = async (event) => {
  const { getStore } = require('@netlify/blobs');
  const store = getStore({ name: 'instagram', consistency: 'strong' });
  const app = createApp(store);
  let path = event.path || '/';
  path = path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
  const body = event.isBase64Encoded && event.body
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : (event.body || null);
  return app.handle({
    method: event.httpMethod,
    path,
    query: event.queryStringParameters || {},
    headers: event.headers || {},
    body,
  });
};

exports.createApp = createApp;
exports.__testables = { hashPassword, verifyPassword };

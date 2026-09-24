/* Local demo backend: implements the same routes as the Netlify Function
 * against the in-page seed data, so the app still demos from file://
 * with zero server. Current user is IG.ME (you.exe). */
window.IG = window.IG || {};

(function () {
  // demo: follow the suggested accounts so the feed is alive out of the box
  function ensureDemoFollows() {
    if (IG.store && IG.store.follows.size === 0) {
      ['wander.lens', 'spice.route', 'circuit.break', 'paws.and.claws',
       'pixel.nomad', 'dev.diaries', 'frames.by.ana', 'astro.nights'].forEach(u => IG.store.follows.add(u));
    }
  }
  const now = Date.now();
  let _uid = 1000;
  const nid = p => p + '-' + (_uid++);

  // stamp createdAt onto seed data once
  IG.POSTS.forEach(p => { if (!p.createdAt) p.createdAt = now - IG.parseAgo(p.time); });
  IG.STORIES.forEach((s, i) => { if (!s.createdAt) s.createdAt = now - IG.parseAgo(s.time); if (!s.id) s.id = 'ls' + i; });
  IG.NOTIFICATIONS.forEach((n, i) => { if (!n.createdAt) n.createdAt = now - IG.parseAgo(n.time); if (!n.id) n.id = 'ln' + i; });
  IG.THREADS.forEach(t => t.messages.forEach((m, i) => { if (!m.id) m.id = t.id + '-m' + i; if (!m.createdAt) m.createdAt = now - (t.messages.length - i) * 36e5; }));

  const pub = u => ({ username: u.user || u.username, name: u.name, bio: u.bio || '', avatar: u.avatar, verified: !!u.verified, createdAt: u.createdAt || now - 400 * 864e5 });
  const mePub = () => ({ username: IG.ME.user, name: IG.ME.name, bio: IG.ME.bio, avatar: IG.ME.avatar, verified: !!IG.ME.verified, createdAt: now - 400 * 864e5 });
  const findUser = name => name === IG.ME.user ? { user: IG.ME.user, name: IG.ME.name, bio: IG.ME.bio, avatar: IG.ME.avatar, verified: IG.ME.verified } : IG.USERS.find(u => u.user === name);

  function presentPost(p) {
    const u = findUser(p.user) || {};
    const comments = (p.comments || []).map(c => ({ id: c.id || nid('c'), username: c.user, text: c.text, createdAt: c.createdAt || now }));
    return {
      id: p.id, username: p.user, name: u.name || p.user, avatar: u.avatar || '',
      verified: !!u.verified,
      image: p.imgUrl || IG.pic(p.seed),
      caption: p.caption, tags: p.tags || [], createdAt: p.createdAt || now,
      likes: p.likes, liked: !!p.liked, saved: !!p.saved,
      commentsCount: comments.length,
      comments: comments.slice(-2),
    };
  }

  function feedPosts() {
    const authors = new Set([IG.ME.user, ...IG.store.follows]);
    return IG.POSTS.filter(p => authors.has(p.user)).sort((a, b) => b.createdAt - a.createdAt);
  }

  const ok = o => o;
  const err = msg => { const e = new Error(msg); e.local = true; throw e; };

  IG.localReq = async function (method, path, body) {
    ensureDemoFollows();
    const [rawPath, qs] = String(path).split('?');
    const seg = rawPath.split('/').filter(Boolean);
    const q = Object.fromEntries(new URLSearchParams(qs || ''));

    if (seg.length === 0 || seg[0] === 'health') return ok({ ok: true });

    if (seg[0] === 'auth') {
      if (seg[1] === 'login') {
        const { username = '', password = '' } = body || {};
        const un = String(username).trim();
        const known = un === IG.ME.user || IG.USERS.some(u => u.user === un);
        if (!known || String(password) !== 'password') err('invalid username or password');
        return ok({ token: 'local', user: un === IG.ME.user ? mePub() : pub(findUser(un)) });
      }
      if (seg[1] === 'signup') {
        const { username = '', password = '', name = '' } = body || {};
        const un = String(username).trim();
        if (!/^[a-zA-Z0-9._]{2,30}$/.test(un)) err('username: 2-30 chars, letters/numbers/._');
        if (String(password).length < 4) err('password: min 4 chars');
        if (!String(name).trim()) err('name required');
        if (un === IG.ME.user || IG.USERS.some(u => u.user === un)) err('username taken');
        IG.USERS.push({ user: un, name: String(name).trim(), bio: '', avatar: IG.pic('ava-' + un, 100, 100), followers: 0, following: 0, verified: false });
        return ok({ token: 'local', user: pub(findUser(un)) });
      }
    }

    if (seg[0] === 'me') {
      const mine = IG.POSTS.filter(p => p.user === IG.ME.user);
      return ok({ user: mePub(), counts: { posts: mine.length || 128, followers: IG.ME.followers || 12400, following: IG.ME.following || 486 } });
    }

    if (seg[0] === 'users' && seg.length === 1) {
      const following = IG.store.follows;
      return ok({ users: IG.USERS.map(u => ({ ...pub(u), isFollowing: following.has(u.user) })) });
    }
    if (seg[0] === 'users' && seg[1] && seg.length === 2) {
      const u = findUser(seg[1]);
      if (!u) err('user not found');
      const posts = IG.POSTS.filter(p => p.user === u.user).sort((a, b) => b.createdAt - a.createdAt);
      return ok({
        user: pub(u),
        counts: { posts: u.user === IG.ME.user ? (posts.length || 128) : posts.length, followers: u.followers || 0, following: u.following || 0 },
        isFollowing: IG.store.follows.has(u.user),
        isMe: u.user === IG.ME.user,
        posts: posts.map(presentPost),
      });
    }
    if (seg[0] === 'users' && seg[2] === 'follow') {
      if (seg[1] === IG.ME.user) err('cannot follow yourself');
      const following = IG.toggleFollow(seg[1]);
      const u = findUser(seg[1]);
      if (following && u) {
        IG.NOTIFICATIONS.unshift({ id: nid('n'), type: 'follow', user: IG.ME.user, text: 'started following you.', time: 'now', createdAt: now });
      }
      return ok({ following, followers: (u.followers || 0) + (following ? 1 : 0) });
    }

    if (seg[0] === 'feed') {
      let posts = feedPosts();
      if (q.before) {
        const ref = IG.POSTS.find(p => String(p.id) === String(q.before));
        if (ref) posts = posts.filter(p => p.createdAt < ref.createdAt);
      }
      return ok({ posts: posts.slice(0, Math.min(+q.limit || 20, 50)).map(presentPost) });
    }

    if (seg[0] === 'posts' && seg.length === 1 && method === 'POST') {
      const caption = String((body && body.caption) || '').slice(0, 2200) || 'New post ✨';
      const imgUrl = body && (body.imageData || body.imageUrl);
      if (!imgUrl) err('image required');
      const id = Math.max(0, ...IG.POSTS.map(p => +p.id || 0)) + 1;
      const p = {
        id, user: IG.ME.user, imgUrl: imgUrl.startsWith('data:') ? imgUrl : null,
        seed: imgUrl.startsWith('data:') ? null : undefined, time: 'now', createdAt: Date.now(),
        likes: 0, liked: false, saved: false, caption,
        tags: (caption.match(/#\w+/g) || []).slice(0, 5), comments: [],
      };
      if (!p.imgUrl) p.seed = 'my-' + id;
      if (body.imageUrl) { p.imgUrl = body.imageUrl; p.seed = null; }
      IG.POSTS.unshift(p);
      return ok({ post: presentPost(p) });
    }
    if (seg[0] === 'posts' && seg[1] && seg.length === 2 && method === 'DELETE') {
      const i = IG.POSTS.findIndex(p => String(p.id) === String(seg[1]));
      if (i < 0) err('post not found');
      if (IG.POSTS[i].user !== IG.ME.user) err('not your post');
      IG.POSTS.splice(i, 1);
      return ok({ deleted: true });
    }
    if (seg[0] === 'posts' && seg[2] === 'like') {
      const p = IG.POSTS.find(x => String(x.id) === String(seg[1]));
      if (!p) err('post not found');
      const want = body && typeof body.value === 'boolean' ? body.value : !p.liked;
      if (p.liked !== want) { p.liked = want; p.likes += want ? 1 : -1; }
      return ok({ liked: p.liked, likes: p.likes });
    }
    if (seg[0] === 'posts' && seg[2] === 'save') {
      const p = IG.POSTS.find(x => String(x.id) === String(seg[1]));
      if (!p) err('post not found');
      p.saved = !p.saved;
      return ok({ saved: p.saved });
    }
    if (seg[0] === 'posts' && seg[2] === 'comments') {
      const p = IG.POSTS.find(x => String(x.id) === String(seg[1]));
      if (!p) err('post not found');
      const text = String((body && body.text) || '').trim().slice(0, 220);
      if (!text) err('comment text required');
      const c = { id: nid('c'), user: IG.ME.user, text, time: 'now', createdAt: Date.now() };
      p.comments.push(c);
      return ok({ comment: { id: c.id, username: c.user, text: c.text, createdAt: c.createdAt }, commentsCount: p.comments.length });
    }

    if (seg[0] === 'stories' && method === 'GET') {
      const authors = [IG.ME.user, ...IG.store.follows];
      const cutoff = Date.now() - 24 * 36e5;
      const out = [];
      for (const a of authors) {
        const items = IG.STORIES.filter(s => s.user === a && s.createdAt > cutoff)
          .map(s => ({ id: s.id, image: s.imgUrl || IG.storyImg(s), createdAt: s.createdAt }));
        if (items.length) {
          const u = findUser(a) || {};
          out.push({ username: a, avatar: u.avatar || '', verified: !!u.verified, items });
        }
      }
      return ok({ stories: out });
    }
    if (seg[0] === 'stories' && method === 'POST') {
      const imgUrl = body && (body.imageData || body.imageUrl);
      if (!imgUrl) err('image required');
      const s = { id: nid('s'), user: IG.ME.user, imgUrl, time: 'now', createdAt: Date.now() };
      IG.STORIES.unshift(s);
      return ok({ story: { id: s.id, image: imgUrl, createdAt: s.createdAt } });
    }

    if (seg[0] === 'explore') {
      const posts = [...IG.POSTS].sort((a, b) => b.likes - a.likes).slice(0, 30);
      return ok({ posts: posts.map(presentPost) });
    }

    if (seg[0] === 'notifications') {
      return ok({
        notifications: IG.NOTIFICATIONS.slice(0, 30).map(n => {
          const u = findUser(n.user) || {};
          return {
            id: n.id, type: n.type, actor: n.user, text: n.text, createdAt: n.createdAt,
            actorAvatar: u.avatar || '', actorVerified: !!u.verified,
            postImage: n.thumb ? IG.pic(n.thumb, 100, 100) : null,
          };
        }),
      });
    }

    if (seg[0] === 'dm' && seg.length === 1) {
      return ok({
        threads: IG.THREADS.map(t => {
          const u = findUser(t.user) || {};
          const last = t.messages[t.messages.length - 1];
          return {
            username: t.user, name: u.name || t.user, avatar: u.avatar || '', verified: !!u.verified,
            lastText: last ? ((last.from === 'me' ? 'You: ' : '') + last.text) : 'Say hi 👋',
            lastAt: last ? last.createdAt : 0, unread: t.unread || 0,
          };
        }).sort((a, b) => b.lastAt - a.lastAt),
      });
    }
    if (seg[0] === 'dm' && seg[1] && seg.length === 2 && method === 'GET') {
      let t = IG.THREADS.find(x => x.user === seg[1]);
      if (!t) {
        if (!findUser(seg[1])) err('user not found');
        t = { id: nid('t'), user: seg[1], unread: 0, messages: [] };
        IG.THREADS.push(t);
      }
      let msgs = t.messages.map(m => ({ id: m.id, from: m.from === 'me' ? IG.ME.user : t.user, text: m.text, createdAt: m.createdAt, liked: !!m.liked }));
      if (q.after) msgs = msgs.filter(m => m.createdAt > +q.after);
      t.unread = 0;
      return ok({ messages: msgs });
    }
    if (seg[0] === 'dm' && seg[1] && seg.length === 2 && method === 'POST') {
      if (seg[1] === IG.ME.user) err('cannot DM yourself');
      let t = IG.THREADS.find(x => x.user === seg[1]);
      if (!t) {
        if (!findUser(seg[1])) err('user not found');
        t = { id: nid('t'), user: seg[1], unread: 0, messages: [] };
        IG.THREADS.push(t);
      }
      const text = String((body && body.text) || '').trim().slice(0, 1000);
      if (!text) err('message text required');
      const m = { id: nid('m'), from: 'me', text, time: 'now', createdAt: Date.now(), liked: false };
      t.messages.push(m);
      // demo bot reply
      setTimeout(() => {
        t.messages.push({ id: nid('m'), from: 'them', text: IG.DM_REPLIES[Math.floor(Math.random() * IG.DM_REPLIES.length)], time: 'now', createdAt: Date.now(), liked: false });
        if (IG.store.view === 'dm' && document.querySelector('#view-dm.active')) IG.renderDM();
        else IG.renderNav();
      }, 2100);
      return ok({ message: { id: m.id, from: IG.ME.user, text: m.text, createdAt: m.createdAt, liked: false } });
    }
    if (seg[0] === 'dm' && seg[2] === 'like') {
      const t = IG.THREADS.find(x => x.user === seg[1]);
      if (!t) err('thread not found');
      const m = t.messages.find(x => x.id === (body && body.messageId));
      if (!m) err('message not found');
      m.liked = !m.liked;
      return ok({ liked: m.liked });
    }

    err('unknown route: ' + path);
  };
})();

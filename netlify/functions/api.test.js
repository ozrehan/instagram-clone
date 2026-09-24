'use strict';
/* Backend tests — pure node, in-memory store shim. Must exit 0. */
const assert = require('assert');
const { createApp } = require('./api');

/* In-memory shim mirroring the @netlify/blobs subset the app uses */
function memStore() {
  const m = new Map();
  const toBuf = v => Buffer.isBuffer(v) ? v
    : v instanceof ArrayBuffer ? Buffer.from(v)
    : ArrayBuffer.isView(v) ? Buffer.from(v.buffer, v.byteOffset, v.byteLength)
    : Buffer.from(String(v), 'utf8');
  return {
    async get(k, opts) {
      if (!m.has(k)) return null;
      const v = m.get(k);
      if (opts && opts.type === 'arrayBuffer') return toBuf(v).buffer.slice(toBuf(v).byteOffset, toBuf(v).byteOffset + toBuf(v).byteLength);
      return v;
    },
    async set(k, v) { m.set(k, Buffer.isBuffer(v) || v instanceof ArrayBuffer || ArrayBuffer.isView(v) ? toBuf(v) : String(v)); },
    async delete(k) { m.delete(k); },
    async list(opts) {
      const keys = [...m.keys()].filter(k => !opts || !opts.prefix || k.startsWith(opts.prefix)).sort();
      return { blobs: keys.map(key => ({ key })) };
    },
  };
}

const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function main() {
  const app = createApp(memStore());
  const call = async (method, path, { token, body, query } = {}) => {
    const res = await app.handle({
      method, path, query: query || {},
      headers: token ? { authorization: 'Bearer ' + token } : {},
      body: body === undefined ? null : JSON.stringify(body),
    });
    let parsed = null;
    try { parsed = res.body ? JSON.parse(res.body) : null; } catch { /* binary */ }
    return { ...res, json: parsed };
  };

  // 1. signup -> login
  let r = await call('POST', '/auth/signup', { body: { username: 'alice', password: 'secret1', name: 'Alice' } });
  assert.strictEqual(r.statusCode, 200, 'signup: ' + r.body);
  const aliceToken = r.json.token;
  assert.ok(aliceToken, 'token issued');
  assert.strictEqual(r.json.user.username, 'alice');

  r = await call('POST', '/auth/signup', { body: { username: 'alice', password: 'secret9', name: 'Dup' } });
  assert.strictEqual(r.statusCode, 409, 'duplicate signup rejected');

  r = await call('POST', '/auth/login', { body: { username: 'alice', password: 'wrong' } });
  assert.strictEqual(r.statusCode, 401, 'wrong password rejected');

  r = await call('POST', '/auth/login', { body: { username: 'alice', password: 'secret1' } });
  assert.strictEqual(r.statusCode, 200, 'login works');
  const aliceToken2 = r.json.token;
  assert.ok(aliceToken2 && aliceToken2 !== aliceToken, 'fresh token per login');

  // 2. upload post (tiny png data URL)
  r = await call('POST', '/posts', { token: aliceToken, body: { imageData: 'data:image/png;base64,' + PNG_1PX, caption: 'hello world #test' } });
  assert.strictEqual(r.statusCode, 200, 'upload: ' + r.body);
  const postId = r.json.post.id;
  assert.ok(r.json.post.image.startsWith('/api/media/'), 'media path returned');
  assert.deepStrictEqual(r.json.post.tags, ['#test']);
  const mid = r.json.post.image.split('/').pop();

  // oversize image rejected (over 1.5MB)
  r = await call('POST', '/posts', { token: aliceToken, body: { imageData: 'data:image/jpeg;base64,' + 'A'.repeat(3 * 1024 * 1024), caption: 'big' } });
  assert.strictEqual(r.statusCode, 400, 'oversize image rejected');

  // validation: bad usernames, short password, long caption
  r = await call('POST', '/auth/signup', { body: { username: 'AB', password: 'secret1', name: 'X' } });
  assert.strictEqual(r.statusCode, 400, 'short username rejected');
  r = await call('POST', '/auth/signup', { body: { username: 'Alice!', password: 'secret1', name: 'X' } });
  assert.strictEqual(r.statusCode, 400, 'uppercase/special username rejected');
  r = await call('POST', '/auth/signup', { body: { username: 'carol', password: '12345', name: 'X' } });
  assert.strictEqual(r.statusCode, 400, 'short password rejected');
  r = await call('POST', '/posts', { token: aliceToken, body: { imageData: 'data:image/png;base64,' + PNG_1PX, caption: 'x'.repeat(501) } });
  assert.strictEqual(r.statusCode, 400, 'caption > 500 rejected');
  assert.ok(/^[0-9a-f]{32}$/.test(aliceToken), 'token is 32 hex chars');

  // 3. feed contains it
  r = await call('GET', '/feed', { token: aliceToken });
  assert.strictEqual(r.statusCode, 200);
  assert.ok(r.json.posts.some(p => p.id === postId), 'feed contains new post');
  assert.strictEqual(r.json.posts[0].id, postId, 'newest first');

  // 4. second user likes -> notification
  r = await call('POST', '/auth/signup', { body: { username: 'bob', password: 'secret2', name: 'Bob' } });
  const bobToken = r.json.token;
  r = await call('POST', `/posts/${postId}/like`, { token: bobToken });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(r.json.liked, true);
  assert.strictEqual(r.json.likes, 1);
  r = await call('GET', '/notifications', { token: aliceToken });
  assert.ok(r.json.notifications.some(n => n.type === 'like' && n.actor === 'bob'), 'like notification present');

  // toggle off
  r = await call('POST', `/posts/${postId}/like`, { token: bobToken });
  assert.strictEqual(r.json.liked, false);
  assert.strictEqual(r.json.likes, 0);

  // 5. comment -> notification
  r = await call('POST', `/posts/${postId}/comments`, { token: bobToken, body: { text: 'nice pic!' } });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(r.json.comment.text, 'nice pic!');
  r = await call('GET', '/notifications', { token: aliceToken });
  assert.ok(r.json.notifications.some(n => n.type === 'comment' && n.actor === 'bob'), 'comment notification present');

  // 5b. comments GET + users search
  r = await call('GET', `/posts/${postId}/comments`, { token: bobToken });
  assert.strictEqual(r.statusCode, 200);
  assert.ok(r.json.comments.some(c => c.text === 'nice pic!'), 'comment listed via GET');
  r = await call('GET', '/users/search', { token: bobToken, query: { q: 'ali' } });
  assert.strictEqual(r.statusCode, 200);
  assert.ok(r.json.users.some(u => u.username === 'alice'), 'search finds alice');
  r = await call('GET', '/users/search', { token: bobToken, query: { q: 'zzz-nope' } });
  assert.strictEqual(r.json.users.length, 0, 'empty search -> []');

  // 6. follow -> profile counts
  r = await call('POST', '/users/alice/follow', { token: bobToken });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(r.json.following, true);
  r = await call('GET', '/users/alice', { token: bobToken });
  assert.strictEqual(r.json.counts.followers, 1, 'follower count = 1');
  assert.strictEqual(r.json.counts.posts, 1, 'post count = 1');
  assert.strictEqual(r.json.isFollowing, true);
  r = await call('GET', '/notifications', { token: aliceToken });
  assert.ok(r.json.notifications.some(n => n.type === 'follow' && n.actor === 'bob'), 'follow notification present');

  // 7. media serves bytes back
  r = await call('GET', '/media/' + mid, { token: aliceToken });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(r.headers['Content-Type'], 'image/png');
  assert.strictEqual(r.isBase64Encoded, true);
  assert.strictEqual(r.body, PNG_1PX, 'media bytes round-trip');

  // 8. unauthorized blocked
  r = await call('GET', '/feed');
  assert.strictEqual(r.statusCode, 401, 'no token -> 401');
  r = await call('POST', '/posts', { token: 'bogus', body: { caption: 'x' } });
  assert.strictEqual(r.statusCode, 401, 'bad token -> 401');

  // 9. DM flow
  r = await call('POST', '/dm/bob', { token: aliceToken, body: { text: 'hey bob' } });
  assert.strictEqual(r.statusCode, 200);
  r = await call('GET', '/dm/alice', { token: bobToken });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(r.json.messages.length, 1);
  assert.strictEqual(r.json.messages[0].text, 'hey bob');
  r = await call('GET', '/dm', { token: bobToken });
  assert.strictEqual(r.json.threads[0].username, 'alice');
  assert.strictEqual(r.json.threads[0].unread, 0, 'reading marks thread read');

  // 10. save + delete (own post)
  r = await call('POST', `/posts/${postId}/save`, { token: bobToken });
  assert.strictEqual(r.json.saved, true);
  r = await call('DELETE', `/posts/${postId}`, { token: bobToken });
  assert.strictEqual(r.statusCode, 403, 'cannot delete others post');
  r = await call('DELETE', `/posts/${postId}`, { token: aliceToken });
  assert.strictEqual(r.statusCode, 200);
  r = await call('GET', '/feed', { token: aliceToken });
  assert.ok(!r.json.posts.some(p => p.id === postId), 'deleted post gone');

  // 11. stories round-trip
  r = await call('POST', '/stories', { token: aliceToken, body: { imageData: 'data:image/png;base64,' + PNG_1PX } });
  assert.strictEqual(r.statusCode, 200);
  r = await call('GET', '/stories', { token: aliceToken });
  assert.ok(r.json.stories.some(s => s.username === 'alice'), 'story listed');

  console.log('ALL TESTS PASSED');
}

main().then(() => process.exit(0), e => { console.error('TEST FAILED:', e); process.exit(1); });

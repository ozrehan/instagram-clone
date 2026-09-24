'use strict';
/* Lazy seed: 3 demo users with posts (picsum.photos placeholder photos).
 * Runs once, on first request, only if the store is empty.
 * Demo logins: alexsnaps / miavibes / joshtravels — password "demo1234". */
const DEMO_PASSWORD = 'demo1234';
const DEMO_USERS = ['alexsnaps', 'miavibes', 'joshtravels'];

const DEMOS = [
  {
    username: 'alexsnaps', name: 'Alex Carter', bio: 'street photographer | city lights',
    posts: [
      { pic: 'insta-alex-1', caption: 'golden hour hits different downtown 🌆' },
      { pic: 'insta-alex-2', caption: 'rainy day reflections. no filter needed.' },
      { pic: 'insta-alex-3', caption: 'new lens, who dis 📷' },
    ],
  },
  {
    username: 'miavibes', name: 'Mia Rossi', bio: 'food, travel & slow mornings ☕',
    posts: [
      { pic: 'insta-mia-1', caption: 'brunch of champions 🥐' },
      { pic: 'insta-mia-2', caption: 'found this hidden beach today 🏝️' },
      { pic: 'insta-mia-3', caption: 'sunday reset.' },
    ],
  },
  {
    username: 'joshtravels', name: 'Josh Miller', bio: 'chasing mountains | 42 countries',
    posts: [
      { pic: 'insta-josh-1', caption: 'sunrise at 4,000m. worth every step 🏔️' },
      { pic: 'insta-josh-2', caption: 'desert nights under a billion stars ✨' },
      { pic: 'insta-josh-3', caption: 'the road goes on forever 🚗' },
    ],
  },
];

const SEED_COMMENTS = [
  { author: 'miavibes', text: 'this is stunning 😍' },
  { author: 'joshtravels', text: 'take me there!' },
  { author: 'alexsnaps', text: 'great shot 👏' },
];

async function seedAll(store, { hashPassword, rid }) {
  const now = Date.now();
  const set = (k, v) => store.set(k, JSON.stringify(v));
  const pwHash = hashPassword(DEMO_PASSWORD);
  let n = 0;

  for (const d of DEMOS) {
    await set(`users/${d.username}.json`, {
      username: d.username, name: d.name, bio: d.bio,
      avatar: `https://picsum.photos/seed/ava-${d.username}/100/100`,
      verified: false, createdAt: now - 400 * 864e5, passwordHash: pwHash,
    });
    await set(`follows/${d.username}.json`,
      DEMO_USERS.filter((u) => u !== d.username));

    for (const p of d.posts) {
      n += 1;
      const id = 'seed-p' + n;
      const createdAt = now - n * 5 * 36e5;
      const likers = DEMO_USERS.filter((u) => u !== d.username)
        .filter((u, i) => (n + i) % 2 === 0);
      const cm = SEED_COMMENTS[n % 3];
      const comments = n % 2 === 0
        ? [{ id: `${id}-c0`, username: cm.author === d.username ? 'miavibes' : cm.author,
             text: cm.text, createdAt: createdAt + 36e5 }]
        : [];
      await set(`posts/${id}.json`, {
        id, username: d.username,
        image: { kind: 'url', url: `https://picsum.photos/seed/${p.pic}/600/600` },
        caption: p.caption, tags: [], createdAt, baseLikes: 0,
      });
      await set(`likes/${id}.json`, likers);
      await set(`comments/${id}.json`, comments);
    }
  }
}

module.exports = { seedAll, DEMO_USERS, DEMO_PASSWORD };

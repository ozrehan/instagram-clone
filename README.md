# Instagram Clone — full-stack prototype


**Live demo:** [https://ozrehan-insta-clone.netlify.app](https://ozrehan-insta-clone.netlify.app)

A pixel-faithful Instagram **web** clone with a **real backend**: accounts,
uploads, likes, comments, follows, stories, notifications and DMs all persist
server-side. Vanilla HTML/CSS/JS frontend, zero frameworks; Node 20 serverless
API with persistent storage.

## How it works

- **Backend**: one Netlify Function (`netlify/functions/api.js`) + Netlify Blobs.
  Manual routing, scrypt-hashed passwords, Bearer-token sessions (30 days),
  binary media served with correct content types. Zero npm deps except
  `@netlify/blobs` (vendored — no build step).
- **Frontend** (`IG.req`) talks to the API at `/.netlify/functions/api`
  (configurable via `window.IG_API_BASE` or `localStorage.ig_api_base`;
  `/api/*` also works via the redirect in `netlify.toml`).
- **No backend? No problem.** If the API is unreachable (e.g. opened via
  `file://`), the app falls back to an in-page demo backend (`js/local.js`)
  implementing the same routes against the seed data — the UI is identical.

**Demo logins** (seeded accounts, password `password`): `you.exe`,
`wander.lens`, `spice.route`, `dev.diaries` … — or sign up a brand-new account.

## Features (all real, all persisted)

- **Auth** — Instagram-style login/signup screen, sessions, log out (More → confirm)
- **Home feed** — posts from people you follow, newest first, infinite scroll;
  like (single click), double-click heart burst, save/bookmark, live comments,
  delete your own posts, hashtags, verified badges
- **Stories** — tray with gradient rings + persistent seen state, fullscreen
  viewer with progress bars, auto-advance, keyboard arrows; **upload your own
  story** via the "Your story" tile; replies arrive as real DMs
- **Reels** — vertical player, autoplay-on-center, mute toggle, progress bar
  (curated sample videos)
- **Explore** — real posts ranked by likes, topic filter chips
- **Profiles** — any user: header, live post/follower/following counts, follow /
  unfollow, Message button, POSTS grid (click a tile to open the post)
- **Direct messages** — thread list with live unread badges, conversations,
  send, double-tap to like a message, polling for new messages
- **Notifications** — likes, comments and follows on your content, with follow-back
- **Create** — upload a photo (downscaled in-browser to ≤1080px JPEG <500KB)
  or pick a stock photo, caption it, publish → stored as a media blob,
  served back through the API
- Responsive: right rail collapses <1100px, sidebar shrinks <760px

Images: user uploads → Netlify Blobs; seeded content → [picsum.photos](https://picsum.photos).
Videos: Google's public `gtv-videos-bucket` sample MP4s.
Font: Grand Hotel (wordmark) via Google Fonts.

## API endpoints

```
POST /api/auth/signup {username,password,name} → {token,user}
POST /api/auth/login  {username,password}      → {token,user}
GET  /api/me
GET  /api/feed?before=<id>&limit=20
POST /api/posts {imageData|caption} | {imageUrl,caption}
POST /api/posts/:id/like {value?}   (toggle)
POST /api/posts/:id/save            (toggle)
POST /api/posts/:id/comments {text}
DELETE /api/posts/:id               (own only)
GET  /api/media/:id                 (binary image bytes)
GET  /api/stories                   (last 24h, grouped by user)
POST /api/stories {imageData|imageUrl}
GET  /api/explore
GET  /api/users
GET  /api/users/:username           (profile + posts + counts)
POST /api/users/:username/follow    (toggle)
GET  /api/notifications
GET  /api/dm
GET  /api/dm/:username?after=<ts>
POST /api/dm/:username {text}
POST /api/dm/:username/like {messageId}
```

## Project structure

```
instagram-clone/
├── index.html            # markup skeleton + auth view + script tags
├── netlify.toml          # functions dir + /api/* → function redirect
├── README.md
├── assets/icons.svg      # SVG sprite (inlined into index.html)
├── css/                  # variables, base, layout, sidebar, stories, post,
│                         # reels, explore, profile, dm, modals, auth
├── netlify/functions/    # *** the backend ***
│   ├── api.js            # ONE function: router + createApp(store) + handler
│   ├── seed.js           # lazy seed from seed-data (first request)
│   ├── seed-data.js      # generated from js/data/* (single source of truth)
│   ├── api.test.js       # backend tests, in-memory store shim (exit 0)
│   ├── package.json      # only dep: @netlify/blobs
│   └── node_modules/     # vendored — ships in the deploy zip, no build step
└── js/                   # plain <script> tags, dependency order
    ├── api.js            # API_BASE, token, IG.req, backend probe, image downscale
    ├── local.js          # offline demo backend (same routes, in-memory)
    ├── auth.js           # login/signup screen + logout
    ├── app.js            # boot: probe → auth gate → render
    ├── store.js          # client UI state (view, tabs, seen stories…)
    ├── utils/            # format.js (fmt, esc, pic, compact, timeAgo…), dom.js
    ├── data/             # seed content (also feeds the backend seed)
    └── components/       # sidebar, stories, post, feed, reels, explore,
                          # profile, dm, notifications, create
```

The function is reachable at `/.netlify/functions/api/<route>`
(and `/api/<route>` via redirect). Frontend calls go through `IG.req()`,
which picks the real API or the local demo backend automatically.

## Run it

**Deployed** (Netlify): the zip must include `netlify/functions/` with its
`node_modules` — functions are detected automatically, no build needed.

**Locally**: open `index.html` (demo mode), or run the real stack with
[Netlify Dev](https://docs.netlify.com/cli/local-development/):

```bash
cd instagram-clone
npx netlify dev   # API at /.netlify/functions/api, Blobs work locally
```

**Backend tests**:

```bash
cd netlify/functions
node api.test.js   # signup→login→upload→feed→like→notify→comment→follow→media→auth→DMs
```

**Regenerate seed data** after editing `js/data/*`:

```bash
node /tmp/gen-seed.js   # (script used at build time)
```

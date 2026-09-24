# Instagram Clone

A pixel-faithful, fully interactive Instagram **web** clone — vanilla HTML/CSS/JS,
zero frameworks, zero build step. Works from `file://` or any static host.

## Features

- **Home feed** — 18 realistic posts: like (single click), double-click heart burst,
  save/bookmark, live comments, share, hashtags, verified badges
- **Stories** — tray with gradient rings + seen state, fullscreen viewer with
  progress bars, auto-advance, prev/next zones, keyboard arrows, story replies,
  story likes
- **Reels** — vertical player, autoplay-on-center, click play/pause, like rail,
  mute toggle, progress bar, audio marquee
- **Explore** — grid with topic filter chips (Travel / Food / Animals / …)
- **Profile** — header, stats, bio, tabbed **POSTS / REELS / TAGGED** grids
- **Direct messages** — thread list with unread badges, working conversations,
  send with typing indicator + auto-replies, double-click a message to like it
- **Notifications** — heart icon opens a dropdown (likes, follows, mentions)
  with working Follow buttons
- **Create** — upload a photo or pick a stock seed, write a caption, publish →
  appears in feed + profile grid
- Responsive: right rail collapses <1100px, sidebar shrinks <760px

Images: [picsum.photos](https://picsum.photos) (seeded, stable).
Videos: Google's public `gtv-videos-bucket` sample MP4s.
Font: Grand Hotel (wordmark) via Google Fonts — the only external asset besides media.

## Project structure

```
instagram-clone/
├── index.html            # markup skeleton only (views, overlays, sprite, script tags)
├── README.md
├── assets/
│   └── icons.svg         # SVG sprite — source of truth (inlined into index.html)
├── css/                  # one stylesheet per concern
│   ├── variables.css     # design tokens
│   ├── base.css          # reset, .ic icon helper, buttons, toast
│   ├── layout.css        # app shell + responsive breakpoints
│   ├── sidebar.css       # left nav
│   ├── stories.css       # tray + fullscreen viewer
│   ├── post.css          # post cards + right rail
│   ├── reels.css         # vertical video player
│   ├── explore.css       # grid + filter chips
│   ├── profile.css       # header + tabbed grids
│   ├── dm.css            # thread list + conversation
│   └── modals.css        # notifications panel + create modal
└── js/                   # plain <script> tags, dependency order, file:// safe
    ├── app.js            # boot + wiring
    ├── store.js          # client state (view, follows, seen stories, tabs…)
    ├── utils/
    │   ├── format.js     # fmt, esc, pic, compact
    │   └── dom.js        # $, icon(), toast()
    ├── data/
    │   ├── users.js      # 15 users (avatar seed, bio, followers, verified)
    │   ├── posts.js      # 18 posts (captions, hashtags, comments)
    │   ├── stories.js    # 10 stories
    │   ├── reels.js      # 8 reels (mp4 URLs, captions, audio)
    │   ├── notifications.js
    │   └── threads.js    # DM threads + histories + bot replies
    └── components/
        ├── sidebar.js    # nav + view router
        ├── stories.js    # tray + viewer (progress, auto-advance, reply)
        ├── post.js       # post card (burst, like, save, comments)
        ├── feed.js       # home view + suggestions
        ├── reels.js      # player (autoplay, mute, progress)
        ├── explore.js    # grid + chips
        ├── profile.js    # header + POSTS/REELS/TAGGED tabs
        ├── dm.js         # threads + conversation + send + like
        ├── notifications.js  # dropdown panel
        └── create.js     # create-post modal (upload/seed → publish)
```

Scripts share one namespace (`window.IG`) and load in dependency order —
no modules, no bundler, so everything works straight from `file://`.

## Run it

Just open `index.html` in a browser — or serve the folder:

```bash
cd instagram-clone
python3 -m http.server 8000   # then open http://localhost:8000
```

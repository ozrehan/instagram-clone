# Instagram Clone

A high-fidelity Instagram **web** clone in a single self-contained HTML file.
Vanilla HTML/CSS/JS — no frameworks, no build step, no external JS libraries.

## Features

- **Sidebar nav** — Instagram wordmark (Grand Hotel font), SVG icons, active states
- **Stories** — gradient rings, horizontal scroll, fullscreen viewer with 5s progress bar + auto-advance
- **Feed** — 6 realistic posts; like toggle, double-click heart burst, bookmark, live comments
- **Reels** — 9:16 muted autoplay-looping videos, click to play/pause, like rail, audio marquee
- **Explore** — grid with hover like/comment overlays
- **Profile** — header with stats/bio, 3-column post grid
- **Suggested for you** rail with Follow toggles

## Media

- Images: `picsum.photos` (seeded, stable)
- Videos: Google's public sample bucket (`storage.googleapis.com/gtv-videos-bucket/sample/…`)
- Font: Google Fonts "Grand Hotel" (wordmark only)

## Run

Just open `index.html` in a browser (works from `file://`), or serve it:

```bash
cd ~/workspace/instagram-clone
python3 -m http.server 8000
# → http://localhost:8000
```

Internet access is required for picsum images, sample videos, and the font.

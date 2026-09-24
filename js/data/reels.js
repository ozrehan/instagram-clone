/* Reels — 8 vertical videos (Google's public sample MP4s) */
window.IG = window.IG || {};

const _gb = 'https://storage.googleapis.com/gtv-videos-bucket/sample/';
IG.REELS = [
  { user: 'wander.lens',   seed: 'reel-bbb',   src: _gb + 'BigBuckBunny.mp4',
    caption: 'POV: you finally booked the trip ✈️ #travel', audio: 'original audio — wander.lens',
    likes: 45200, comments: 812, shares: 2300 },
  { user: 'spice.route',   seed: 'reel-blaze', src: _gb + 'ForBiggerBlazes.mp4',
    caption: 'Flambé Friday 🔥 wait for it… #foodie', audio: 'Trending — Kitchen Beats',
    likes: 88900, comments: 2104, shares: 9100 },
  { user: 'circuit.break', seed: 'reel-escape',src: _gb + 'ForBiggerEscapes.mp4',
    caption: 'Robot obstacle course v3 🤖 #robotics', audio: 'original audio — circuit.break',
    likes: 31200, comments: 640, shares: 1100 },
  { user: 'paws.and.claws',seed: 'reel-joy',   src: _gb + 'ForBiggerJoyrides.mp4',
    caption: 'Biscuit\'s first beach day 🐶🌊 #dogs', audio: 'Happy — Feel Good Mix',
    likes: 120400, comments: 5300, shares: 18400 },
  { user: 'fit.with.isha', seed: 'reel-melt',  src: _gb + 'ForBiggerMeltdowns.mp4',
    caption: 'Leg day. No excuses. 🏋️ #fitness', audio: 'Phonk — Gym Mode',
    likes: 67800, comments: 1900, shares: 4200 },
  { user: 'frames.by.ana', seed: 'reel-fun',   src: _gb + 'ForBiggerFun.mp4',
    caption: 'BTS of the short film 🎬 #filmmaking', audio: 'Cinematic — Strings',
    likes: 54300, comments: 1210, shares: 3300 },
  { user: 'trail.blazer',  seed: 'reel-sintel',src: _gb + 'Sintel.mp4',
    caption: 'Drone shots from 14,000 ft 🏔️ #trekking', audio: 'Epic — Mountain Air',
    likes: 97600, comments: 3400, shares: 12800 },
  { user: 'astro.nights',  seed: 'reel-ed',    src: _gb + 'ElephantsDream.mp4',
    caption: 'Timelapse: 6 hours → 30 seconds 🔭 #astrophotography', audio: 'Ambient — Night Sky',
    likes: 72800, comments: 1950, shares: 6700 },
];

/* Poster shown before video loads: portrait picsum crop of the reel seed */
IG.reelPoster = r => IG.pic(r.seed, 480, 854);

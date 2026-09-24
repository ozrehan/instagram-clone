/* Central client-side state */
window.IG = window.IG || {};

IG.store = {
  view: 'home',            // home | reels | explore | profile | dm
  seenStories: {},         // user -> true
  follows: new Set(),      // usernames the user follows
  activeThread: null,      // thread id in DM view
  notifOpen: false,
  notifSeen: false,
  exploreTopic: 'All',
  profileTab: 'POSTS',     // POSTS | REELS | TAGGED
  reelsMuted: true,
};

IG.toggleFollow = function (username) {
  const s = IG.store.follows;
  if (s.has(username)) { s.delete(username); return false; }
  s.add(username); return true;
};

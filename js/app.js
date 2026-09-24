/* App boot: probe backend → auth gate → render */
window.IG = window.IG || {};

IG._booted = false;

IG.boot = async function () {
  IG.$('wordmark').onclick = () => IG.go('home');
  IG.$('more-btn').onclick = () => {
    if (confirm('Log out of Instagram?')) IG.logout();
  };
  IG.$('see-all-btn').onclick = () => IG.toast('See all suggestions');

  IG.initStoryViewer();
  IG.initNotif();
  IG.initCreate();

  document.addEventListener('visibilitychange', () => {
    // pause reels when tab hidden
    if (document.hidden) {
      document.querySelectorAll('#view-reels video').forEach(v => v.pause());
    }
  });

  // which backend? real API if reachable, else local demo
  IG.BACKEND = (await IG.probeBackend()) ? 'api' : 'local';
  if (IG.BACKEND === 'local') {
    IG.toast('Demo mode — no backend connection');
    IG.setMe({ username: IG.ME.user, name: IG.ME.name, avatar: IG.ME.avatar, bio: IG.ME.bio, verified: IG.ME.verified });
    await IG.bootApp();
    return;
  }

  // real backend: need a token
  if (IG.token()) {
    try {
      const r = await IG.req('GET', '/me');
      IG.setMe(r.user);
      await IG.bootApp();
      return;
    } catch (e) { /* bad/expired token → fall through to auth */ }
  }
  IG.showAuth();
};

/* Render the whole app shell after auth (or in local demo mode) */
IG.bootApp = async function () {
  if (IG._booted) {
    IG.renderNav();
    IG.go('home');
    return;
  }
  IG._booted = true;
  IG.renderNav();
  await IG.renderFeed(true);
  IG.renderExplore();
  IG.renderProfile();
};

document.addEventListener('DOMContentLoaded', IG.boot);

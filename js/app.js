/* App boot: wire static chrome, render initial views */
window.IG = window.IG || {};

IG.boot = function () {
  // wordmark + More button
  IG.$('wordmark').onclick = () => IG.go('home');
  IG.$('more-btn').onclick = () => IG.toast('More options');

  // home view static chrome
  IG.renderMeRow();
  IG.$('see-all-btn').onclick = () => IG.toast('See all suggestions');

  // overlays
  IG.initStoryViewer();
  IG.initNotif();
  IG.initCreate();

  // first render
  IG.renderNav();
  IG.renderFeed();
  IG.renderExplore();
  IG.renderProfile();

  document.addEventListener('visibilitychange', () => {
    // pause reels when tab hidden
    if (document.hidden) {
      document.querySelectorAll('#view-reels video').forEach(v => v.pause());
    }
  });
};

document.addEventListener('DOMContentLoaded', IG.boot);

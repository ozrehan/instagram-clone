/* Reels — vertical player: autoplay-on-center, play/pause, like rail,
   mute toggle, progress bar, audio marquee */
window.IG = window.IG || {};

let _reelsInit = false;
const _reelLiked = new Map(); // index -> bool

IG.renderReels = function () {
  IG.$('reels').innerHTML = IG.REELS.map((r, i) => {
    const liked = _reelLiked.get(i) || false;
    return `<div class="reel" data-i="${i}">
      <video src="${r.src}" poster="${IG.reelPoster(r)}" ${IG.store.reelsMuted ? 'muted' : ''}
             loop playsinline preload="metadata"></video>
      <div class="reel-progress"><i></i></div>
      <div class="reel-grad"></div>
      <button class="reel-mute" data-i="${i}" aria-label="mute">${IG.icon(IG.store.reelsMuted ? 'mute' : 'volume')}</button>
      <div class="reel-play-hint">${IG.icon('play')}</div>
      <div class="reel-cap">
        <div class="ru">@${IG.esc(r.user)}</div>
        <div class="rc">${IG.esc(r.caption)}</div>
        <div class="audio">${IG.icon('music', 'sm')}<div class="marquee"><span>${IG.esc(r.audio)} &nbsp;•&nbsp; ${IG.esc(r.audio)} &nbsp;•&nbsp;</span></div></div>
      </div>
      <div class="reel-rail">
        <button class="r-like ${liked ? 'liked' : ''}" data-i="${i}">${IG.icon('heart')}<span>${IG.fmt(r.likes)}</span></button>
        <button class="r-cmt">${IG.icon('comment')}<span>${IG.fmt(r.comments)}</span></button>
        <button class="r-share">${IG.icon('share')}<span>${IG.fmt(r.shares)}</span></button>
        <img src="${IG.user(r.user).avatar}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;border:1px solid #fff" alt="">
      </div>
    </div>`;
  }).join('');

  IG.$('reels').querySelectorAll('.reel').forEach(card => {
    const v = card.querySelector('video');
    const bar = card.querySelector('.reel-progress i');
    v.addEventListener('click', () => {
      if (v.paused) { v.play().catch(() => {}); card.classList.remove('paused'); }
      else { v.pause(); card.classList.add('paused'); }
    });
    v.addEventListener('timeupdate', () => {
      if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + '%';
    });
    v.addEventListener('play', () => card.classList.remove('paused'));
    v.addEventListener('pause', () => card.classList.add('paused'));
  });

  IG.$('reels').querySelectorAll('.r-like').forEach(b => {
    b.onclick = () => {
      const i = +b.dataset.i, r = IG.REELS[i];
      const liked = !(_reelLiked.get(i) || false);
      _reelLiked.set(i, liked);
      r.likes += liked ? 1 : -1;
      b.classList.toggle('liked', liked);
      b.querySelector('span').textContent = IG.fmt(r.likes);
    };
  });
  IG.$('reels').querySelectorAll('.r-cmt').forEach(b =>
    b.onclick = () => IG.toast('Comments are disabled in this demo'));
  IG.$('reels').querySelectorAll('.r-share').forEach(b =>
    b.onclick = () => IG.toast('Link copied to clipboard'));
  IG.$('reels').querySelectorAll('.reel-mute').forEach(b =>
    b.onclick = e => {
      e.stopPropagation();
      IG.store.reelsMuted = !IG.store.reelsMuted;
      IG.$('reels').querySelectorAll('video').forEach(v => { v.muted = IG.store.reelsMuted; });
      IG.$('reels').querySelectorAll('.reel-mute').forEach(mb =>
        mb.innerHTML = IG.icon(IG.store.reelsMuted ? 'mute' : 'volume'));
      IG.toast(IG.store.reelsMuted ? 'Muted' : 'Sound on 🔊');
    });
};

/* Autoplay the reel nearest the viewport center; pause the rest */
IG.initReels = function () {
  if (!_reelsInit) {
    IG.renderReels();
    _reelsInit = true;
    addEventListener('scroll', () => { if (IG.store.view === 'reels') IG.tickReels(); }, { passive: true });
  }
  IG.tickReels();
};

IG.tickReels = function () {
  if (IG.store.view !== 'reels') return;
  let best = null, bestD = 1e9;
  IG.$('reels').querySelectorAll('.reel').forEach(card => {
    const r = card.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - innerHeight / 2);
    if (d < bestD) { bestD = d; best = card; }
  });
  IG.$('reels').querySelectorAll('.reel').forEach(card => {
    const v = card.querySelector('video');
    if (card === best && bestD < innerHeight) { v.play().catch(() => {}); }
    else { v.pause(); }
  });
};

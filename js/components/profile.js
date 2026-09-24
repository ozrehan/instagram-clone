/* Profile view — header, stats, tabbed POSTS / REELS / TAGGED grids */
window.IG = window.IG || {};

IG.PROFILE_TABS = ['POSTS', 'REELS', 'TAGGED'];

/* My own posts: authored posts + anything published via Create modal */
IG.myPosts = function () {
  return IG.POSTS.filter(p => p.user === IG.ME.user);
};

/* Seeded grid for the profile before the user publishes anything */
IG.PROFILE_GRID_SEEDS = ['prof-1', 'prof-2', 'prof-3', 'prof-4', 'prof-5',
                         'prof-6', 'prof-7', 'prof-8', 'prof-9'];

IG.renderProfile = function () {
  const tab = IG.store.profileTab;
  const mine = IG.myPosts();
  let gridHtml = '';

  if (tab === 'POSTS') {
    const items = mine.length
      ? mine.map(p => ({ pid: p.id, src: p.imgUrl || IG.pic(p.seed, 500, 500), likes: p.likes, comments: p.comments.length }))
      : IG.PROFILE_GRID_SEEDS.map((s, i) => ({ pid: '', src: IG.pic(s, 500, 500), likes: 900 + i * 613, comments: 30 + i * 11 }));
    gridHtml = items.map(it =>
      `<div class="tile" data-pid="${it.pid}">
        <img src="${it.src}" loading="lazy" alt="">
        <div class="ov"><span>♥ ${IG.fmt(it.likes)}</span><span>💬 ${IG.fmt(it.comments)}</span></div>
      </div>`).join('');
    if (!gridHtml) gridHtml = `<div class="p-empty">No posts yet — tap Create to share your first photo 📸</div>`;
  } else if (tab === 'REELS') {
    gridHtml = IG.REELS.slice(0, 6).map((r, i) =>
      `<div class="tile"><img src="${IG.reelPoster(r)}" loading="lazy" alt="">
        <span class="reel-tag">${IG.icon('reels')}</span>
        <div class="ov"><span>▶ ${IG.compact(r.likes)}</span></div>
      </div>`).join('');
  } else {
    const tagged = ['tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5', 'tag-6'];
    gridHtml = tagged.map((s, i) =>
      `<div class="tile"><img src="${IG.pic(s, 500, 500)}" loading="lazy" alt="">
        <div class="ov"><span>♥ ${IG.fmt(2100 + i * 521)}</span><span>💬 ${IG.fmt(48 + i * 9)}</span></div>
      </div>`).join('');
  }

  IG.$('profile-wrap').innerHTML = `
    <div class="p-head">
      <img class="p-avatar" src="${IG.ME.avatar}" alt="">
      <div class="p-info">
        <div class="row1">
          <h2>${IG.esc(IG.ME.user)}${IG.verifiedBadge(IG.ME)}</h2>
          <button class="btn" id="p-edit">Edit profile</button>
          <button class="btn" id="p-archive">View archive</button>
          <button class="btn" id="p-settings" aria-label="settings">${IG.icon('settings', 'sm')}</button>
        </div>
        <div class="p-stats">
          <span><b>${mine.length || 128}</b> posts</span>
          <span><b>${IG.compact(IG.ME.followers)}</b> followers</span>
          <span><b>${IG.fmt(IG.ME.following)}</b> following</span>
        </div>
        <div class="p-bio"><b>${IG.esc(IG.ME.name)}</b>${IG.esc(IG.ME.bio).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="p-tabs">
      ${IG.PROFILE_TABS.map(t => `<button class="${t === tab ? 'active' : ''}" data-tab="${t}">${t}</button>`).join('')}
    </div>
    <div class="p-grid">${gridHtml}</div>`;

  IG.$('profile-wrap').querySelectorAll('.p-tabs button').forEach(b =>
    b.onclick = () => { IG.store.profileTab = b.dataset.tab; IG.renderProfile(); });
  IG.$('p-edit').onclick = () => IG.toast('Edit profile is disabled in this demo');
  IG.$('p-archive').onclick = () => IG.toast('No archived stories yet');
  IG.$('p-settings').onclick = () => IG.toast('Settings');
  IG.$('profile-wrap').querySelectorAll('.p-grid .tile').forEach(tile =>
    tile.onclick = () => {
      if (tile.dataset.pid) IG.go('home'); // jump to the post in feed
      IG.toast('Opening post…');
    });
};

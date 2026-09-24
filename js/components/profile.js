/* Profile view — any user, from the API. Tabs: POSTS / REELS / TAGGED */
window.IG = window.IG || {};

IG.PROFILE_TABS = ['POSTS', 'REELS', 'TAGGED'];
IG._profileUser = null; // username being viewed; null = me

IG.viewUser = function (username) {
  IG._profileUser = username || IG.ME.user;
  IG.go('profile');
};
window.viewUser = IG.viewUser;

IG.renderProfile = async function () {
  const username = IG._profileUser || IG.ME.user;
  let data = null;
  try {
    data = await IG.req('GET', `/users/${encodeURIComponent(username)}`);
  } catch (e) {
    IG.$('profile-wrap').innerHTML = `<div class="p-empty">Couldn't load @${IG.esc(username)}</div>`;
    return;
  }
  (data.posts || []).forEach(p => { IG.cache.posts[p.id] = p; });
  const u = data.user, c = data.counts, tab = IG.store.profileTab;
  const isMe = data.isMe;
  let gridHtml = '';

  if (tab === 'POSTS') {
    const items = data.posts || [];
    gridHtml = items.length ? items.map(p =>
      `<div class="tile" data-pid="${IG.esc(String(p.id))}">
        <img src="${IG.resolveImg(p.image)}" loading="lazy" alt="">
        <div class="ov"><span>♥ ${IG.fmt(p.likes)}</span><span>💬 ${IG.fmt(p.commentsCount)}</span></div>
      </div>`).join('')
      : `<div class="p-empty">${isMe ? 'No posts yet — tap Create to share your first photo 📸' : `@${IG.esc(username)} hasn't posted yet`}</div>`;
  } else if (tab === 'REELS') {
    gridHtml = (IG.REELS || []).slice(0, 6).map(r =>
      `<div class="tile"><img src="${IG.reelPoster(r)}" loading="lazy" alt="">
        <span class="reel-tag">${IG.icon('reels')}</span>
        <div class="ov"><span>▶ ${IG.compact(r.likes)}</span></div>
      </div>`).join('') || `<div class="p-empty">No reels yet</div>`;
  } else {
    gridHtml = `<div class="p-empty">No tagged photos</div>`;
  }

  IG.$('profile-wrap').innerHTML = `
    <div class="p-head">
      <img class="p-avatar" src="${IG.resolveImg(u.avatar)}" alt="">
      <div class="p-info">
        <div class="row1">
          <h2>${IG.esc(u.username)}${u.verified ? IG.icon('verified', 'verified') : ''}</h2>
          ${isMe
            ? `<button class="btn" id="p-edit">Edit profile</button>
               <button class="btn" id="p-settings" aria-label="settings">${IG.icon('settings', 'sm')}</button>`
            : `<button class="btn-primary" id="p-follow">${data.isFollowing ? 'Following' : 'Follow'}</button>
               <button class="btn" id="p-msg">Message</button>`}
        </div>
        <div class="p-stats">
          <span><b>${IG.fmt(c.posts)}</b> posts</span>
          <span><b>${IG.compact(c.followers)}</b> followers</span>
          <span><b>${IG.fmt(c.following)}</b> following</span>
        </div>
        <div class="p-bio"><b>${IG.esc(u.name)}</b>${IG.esc(u.bio || '').replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="p-tabs">
      ${IG.PROFILE_TABS.map(t => `<button class="${t === tab ? 'active' : ''}" data-tab="${t}">${t}</button>`).join('')}
    </div>
    <div class="p-grid">${gridHtml}</div>`;

  IG.$('profile-wrap').querySelectorAll('.p-tabs button').forEach(b =>
    b.onclick = () => { IG.store.profileTab = b.dataset.tab; IG.renderProfile(); });
  const pe = IG.$('p-edit');
  if (pe) pe.onclick = () => IG.toast('Edit profile is coming soon');
  const ps = IG.$('p-settings');
  if (ps) ps.onclick = () => IG.toast('Settings');
  const pf = IG.$('p-follow');
  if (pf) pf.onclick = async () => {
    try {
      const r = await IG.req('POST', `/users/${encodeURIComponent(username)}/follow`);
      pf.textContent = r.following ? 'Following' : 'Follow';
      IG.renderProfile();
      IG.renderSuggestions();
    } catch (e) { IG.toast('Could not follow'); }
  };
  const pm = IG.$('p-msg');
  if (pm) pm.onclick = () => { IG.store.activeThread = username; IG.go('dm'); };
  IG.$('profile-wrap').querySelectorAll('.p-grid .tile[data-pid]').forEach(tile =>
    tile.onclick = () => IG.openPostModal(tile.dataset.pid));
};

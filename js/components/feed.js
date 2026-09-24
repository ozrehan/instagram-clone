/* Home feed: stories + posts + right rail suggestions — all from the API */
window.IG = window.IG || {};

IG._feedLoading = false;
IG._feedDone = false;

IG.SUGGESTIONS = ['pixel.nomad', 'brew.culture', 'terra.garden', 'fit.with.isha', 'circuit.break',
                  'dev.diaries', 'sneaker.head', 'thrift.tales'];

IG.renderFeed = async function (reset) {
  if (reset !== false) {
    IG.$('posts').innerHTML = '';
    IG._feedDone = false;
  }
  IG.renderStories();
  await IG.loadMorePosts();
  IG.renderSuggestions();
  IG.renderMeRow();
};

IG.loadMorePosts = async function () {
  if (IG._feedLoading || IG._feedDone) return;
  IG._feedLoading = true;
  try {
    const cards = IG.$('posts').querySelectorAll('.post');
    const before = cards.length ? cards[cards.length - 1].dataset.id : null;
    const r = await IG.req('GET', '/feed?limit=12' + (before ? `&before=${encodeURIComponent(before)}` : ''));
    if (!r.posts.length) {
      IG._feedDone = true;
      if (!cards.length) IG.$('posts').innerHTML = `<div class="p-empty">No posts yet — follow people or share your first photo 📸</div>`;
      return;
    }
    const html = r.posts.map(p => IG.postCard(p)).join('');
    IG.$('posts').insertAdjacentHTML('beforeend', html);
    IG.$('posts').querySelectorAll('.post:not([data-wired])').forEach(card => {
      card.dataset.wired = '1';
      IG.wirePost(card);
    });
  } catch (e) {
    if (!IG.$('posts').children.length) IG.$('posts').innerHTML = `<div class="p-empty">Couldn't load feed — check your connection.</div>`;
  }
  IG._feedLoading = false;
};

IG.renderSuggestions = async function () {
  let users = [];
  try {
    const r = await IG.req('GET', '/users');
    users = (r.users || []).filter(u => !u.isFollowing).slice(0, 8);
  } catch (e) { /* offline */ }
  if (!users.length && IG.BACKEND === 'local') {
    users = (IG.SUGGESTIONS || []).map(n => ({ username: n, name: (IG.user(n) || {}).name || n, avatar: (IG.user(n) || {}).avatar || '', bio: (IG.user(n) || {}).bio || '', isFollowing: IG.store.follows.has(n) }));
  }
  IG.$('suggestions').innerHTML = users.map(u => `
    <div class="sug-row" data-user="${IG.esc(u.username)}">
      <img src="${IG.resolveImg(u.avatar)}" alt="" data-user="${IG.esc(u.username)}">
      <div class="who"><b>${IG.esc(u.username)}</b><span>${IG.esc(u.bio || u.name || '')}</span></div>
      <button class="link follow-btn ${u.isFollowing ? 'following' : ''}">${u.isFollowing ? 'Following' : 'Follow'}</button>
    </div>`).join('');
  IG.$('suggestions').querySelectorAll('.sug-row').forEach(row => {
    const name = row.dataset.user;
    row.querySelector('img').onclick = () => IG.viewUser(name);
    row.querySelector('.follow-btn').onclick = async e => {
      e.stopPropagation();
      try {
        const r = await IG.req('POST', `/users/${encodeURIComponent(name)}/follow`);
        e.target.textContent = r.following ? 'Following' : 'Follow';
        e.target.classList.toggle('following', r.following);
        IG.toast(r.following ? `Following ${name}` : `Unfollowed ${name}`);
      } catch (err) { IG.toast('Could not follow — try again'); }
    };
  });
};

IG.renderMeRow = function () {
  IG.$('me-row').innerHTML = `
    <img src="${IG.resolveImg(IG.ME.avatar)}" alt="you" data-user="${IG.esc(IG.ME.user)}" style="cursor:pointer">
    <div class="who"><b>${IG.esc(IG.ME.user)}</b><span>${IG.esc(IG.ME.name)}</span></div>
    <button class="link" id="switch-btn">Switch</button>`;
  IG.$('me-row').querySelector('img').onclick = () => IG.viewUser(IG.ME.user);
  IG.$('switch-btn').onclick = () => IG.logout();
};

/* infinite scroll */
IG._feedScroll = function () {
  if (IG.store.view !== 'home' || IG._feedLoading || IG._feedDone) return;
  const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 900;
  if (nearBottom) IG.loadMorePosts();
};
window.addEventListener('scroll', () => IG._feedScroll(), { passive: true });

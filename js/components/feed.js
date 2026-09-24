/* Home feed: stories + posts + right rail suggestions */
window.IG = window.IG || {};

IG.renderFeed = function () {
  IG.renderStories();
  IG.$('posts').innerHTML = IG.POSTS.map(p => IG.postCard(p)).join('');
  IG.$('posts').querySelectorAll('.post').forEach(card => IG.wirePost(card));
  IG.renderSuggestions();
};

IG.SUGGESTIONS = ['pixel.nomad', 'brew.culture', 'terra.garden', 'fit.with.isha', 'circuit.break',
                  'dev.diaries', 'sneaker.head', 'thrift.tales'];

IG.renderSuggestions = function () {
  IG.$('suggestions').innerHTML = IG.SUGGESTIONS.map(name => {
    const usr = IG.user(name);
    const following = IG.store.follows.has(name);
    return `<div class="sug-row" data-user="${IG.esc(name)}">
      <img src="${usr.avatar}" alt="">
      <div class="who"><b>${IG.esc(name)}</b><span>${IG.esc(usr.bio)}</span></div>
      <button class="link follow-btn ${following ? 'following' : ''}">${following ? 'Following' : 'Follow'}</button>
    </div>`;
  }).join('');
  IG.$('suggestions').querySelectorAll('.sug-row').forEach(row => {
    const name = row.dataset.user;
    row.querySelector('img').onclick = () => IG.toast(`@${name} — ${IG.fmt(IG.user(name).followers)} followers`);
    row.querySelector('.follow-btn').onclick = e => {
      const following = IG.toggleFollow(name);
      e.target.textContent = following ? 'Following' : 'Follow';
      e.target.classList.toggle('following', following);
      IG.toast(following ? `Following ${name}` : `Unfollowed ${name}`);
    };
  });
};

IG.renderMeRow = function () {
  IG.$('me-row').innerHTML = `
    <img src="${IG.ME.avatar}" alt="you">
    <div class="who"><b>${IG.ME.user}</b><span>${IG.esc(IG.ME.name)}</span></div>
    <button class="link" id="switch-btn">Switch</button>`;
  IG.$('switch-btn').onclick = () => IG.toast('Logged in as ' + IG.ME.user);
  IG.$('see-all-btn').onclick = () => IG.toast('See all suggestions');
};

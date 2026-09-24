/* Post card component: like, double-click burst, save, comments */
window.IG = window.IG || {};

IG.tagify = function (text, tags) {
  let html = IG.esc(text).replace(/\n/g, '<br>');
  for (const t of (tags || [])) html += ` <span class="tag">${IG.esc(t)}</span>`;
  return html;
};

IG.postCard = function (p) {
  const usr = IG.user(p.user);
  const imgSrc = p.imgUrl || IG.pic(p.seed);
  const commentsHtml = p.comments.map(c =>
    `<div class="c"><span class="uname">${IG.esc(c.user)}</span>${IG.esc(c.text)}<span class="ctime">${IG.esc(c.time || '')}</span></div>`
  ).join('');
  return `<article class="post" data-id="${p.id}">
    <div class="post-head">
      <img class="avatar" src="${usr.avatar}" alt="">
      <span class="uname">${IG.esc(p.user)}${IG.verifiedBadge(usr)}</span><span class="dot">•</span><span class="time">${IG.esc(p.time)}</span>
      <span class="more">${IG.icon('more')}</span>
    </div>
    <div class="post-img-wrap">
      <img class="post-img" src="${imgSrc}" alt="post" draggable="false">
      <div class="heart-burst">${IG.icon('heart')}</div>
    </div>
    <div class="post-actions">
      <button class="like-btn ${p.liked ? 'liked' : ''}" aria-label="like">${IG.icon('heart')}</button>
      <button class="cmt-btn" aria-label="comment">${IG.icon('comment')}</button>
      <button class="share-btn" aria-label="share">${IG.icon('share')}</button>
      <button class="bookmark ${p.saved ? 'saved' : ''}" aria-label="save">${IG.icon('bookmark')}</button>
    </div>
    <div class="likes">${IG.fmt(p.likes)} likes</div>
    <div class="caption"><span class="uname">${IG.esc(p.user)}</span>${IG.tagify(p.caption, p.tags)}</div>
    <div class="view-comments">View all ${p.comments.length + 47} comments</div>
    <div class="comments">${commentsHtml}</div>
    <div class="comment-box">
      <input type="text" placeholder="Add a comment..." maxlength="220">
      <span class="emoji">😊</span>
      <button class="post-btn">Post</button>
    </div>
  </article>`;
};

IG.wirePost = function (card) {
  const p = IG.POSTS.find(x => x.id === +card.dataset.id);
  if (!p) return;
  const likeBtn = card.querySelector('.like-btn');
  const likesEl = card.querySelector('.likes');
  const burst = card.querySelector('.heart-burst');
  const img = card.querySelector('.post-img');
  const input = card.querySelector('.comment-box input');
  const postBtn = card.querySelector('.post-btn');

  const refreshLikes = () => {
    likesEl.textContent = IG.fmt(p.likes) + ' likes';
    likeBtn.classList.toggle('liked', p.liked);
  };
  const setLiked = v => { if (p.liked !== v) { p.liked = v; p.likes += v ? 1 : -1; refreshLikes(); } };

  likeBtn.onclick = () => setLiked(!p.liked);

  img.addEventListener('dblclick', () => {
    burst.classList.remove('pop'); void burst.offsetWidth; burst.classList.add('pop');
    setLiked(true);
  });

  const bm = card.querySelector('.bookmark');
  bm.onclick = () => {
    p.saved = !p.saved;
    bm.classList.toggle('saved', p.saved);
    IG.toast(p.saved ? 'Saved to collection' : 'Removed from saved');
  };

  card.querySelector('.more').onclick = () => IG.toast('Post options');
  card.querySelector('.cmt-btn').onclick = () => input.focus();
  card.querySelector('.share-btn').onclick = () => IG.toast('Link copied to clipboard');

  input.addEventListener('input', () => postBtn.classList.toggle('show', input.value.trim().length > 0));
  const addComment = () => {
    const text = input.value.trim();
    if (!text) return;
    p.comments.push({ user: IG.ME.user, text, time: 'now' });
    const div = IG.el(`<div class="c"><span class="uname">${IG.esc(IG.ME.user)}</span>${IG.esc(text)}<span class="ctime">now</span></div>`);
    card.querySelector('.comments').appendChild(div);
    input.value = '';
    postBtn.classList.remove('show');
    card.querySelector('.view-comments').textContent = `View all ${p.comments.length + 47} comments`;
  };
  postBtn.onclick = addComment;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addComment(); });
};

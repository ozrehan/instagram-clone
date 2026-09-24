/* Post card component: like, double-click burst, save, comments — all via API */
window.IG = window.IG || {};

IG.cache = IG.cache || { posts: {}, users: {} };

IG.tagify = function (text, tags) {
  let html = IG.esc(text).replace(/\n/g, '<br>');
  for (const t of (tags || [])) html += ` <span class="tag">${IG.esc(t)}</span>`;
  return html;
};

IG.vbadge = u => (u && (u.verified || u === true)) ? IG.icon('verified', 'verified') : '';

IG.postCard = function (p) {
  IG.cache.posts[p.id] = p;
  if (p.username) IG.cache.users[p.username] = { username: p.username, name: p.name, avatar: p.avatar, verified: p.verified };
  const commentsHtml = (p.comments || []).map(c =>
    `<div class="c"><span class="uname" data-user="${IG.esc(c.username)}">${IG.esc(c.username)}</span>${IG.esc(c.text)}<span class="ctime">${IG.timeAgo(c.createdAt)}</span></div>`
  ).join('');
  const moreCount = Math.max(0, (p.commentsCount || 0) - (p.comments || []).length);
  return `<article class="post" data-id="${IG.esc(String(p.id))}">
    <div class="post-head">
      <img class="avatar" src="${IG.resolveImg(p.avatar)}" alt="" data-user="${IG.esc(p.username)}">
      <span class="uname" data-user="${IG.esc(p.username)}">${IG.esc(p.username)}${IG.vbadge(p)}</span><span class="dot">•</span><span class="time">${IG.timeAgo(p.createdAt)}</span>
      <span class="more">${IG.icon('more')}</span>
    </div>
    <div class="post-img-wrap">
      <img class="post-img" src="${IG.resolveImg(p.image)}" alt="post" draggable="false" loading="lazy">
      <div class="heart-burst">${IG.icon('heart')}</div>
    </div>
    <div class="post-actions">
      <button class="like-btn ${p.liked ? 'liked' : ''}" aria-label="like">${IG.icon('heart')}</button>
      <button class="cmt-btn" aria-label="comment">${IG.icon('comment')}</button>
      <button class="share-btn" aria-label="share">${IG.icon('share')}</button>
      <button class="bookmark ${p.saved ? 'saved' : ''}" aria-label="save">${IG.icon('bookmark')}</button>
    </div>
    <div class="likes">${IG.fmt(p.likes)} likes</div>
    <div class="caption"><span class="uname" data-user="${IG.esc(p.username)}">${IG.esc(p.username)}</span>${IG.tagify(p.caption, p.tags)}</div>
    ${moreCount ? `<div class="view-comments">View all ${IG.fmt(p.commentsCount)} comments</div>` : ''}
    <div class="comments">${commentsHtml}</div>
    <div class="comment-box">
      <input type="text" placeholder="Add a comment..." maxlength="220">
      <span class="emoji">😊</span>
      <button class="post-btn">Post</button>
    </div>
  </article>`;
};

IG.wirePost = function (card) {
  const p = IG.cache.posts[card.dataset.id];
  if (!p) return;
  const likeBtn = card.querySelector('.like-btn');
  const likesEl = card.querySelector('.likes');
  const burst = card.querySelector('.heart-burst');
  const img = card.querySelector('.post-img');
  const input = card.querySelector('.comment-box input');
  const postBtn = card.querySelector('.post-btn');
  const mine = p.username === IG.ME.user;

  const refreshLikes = () => {
    likesEl.textContent = IG.fmt(p.likes) + ' likes';
    likeBtn.classList.toggle('liked', p.liked);
  };
  const doLike = async (value) => {
    try {
      const r = await IG.req('POST', `/posts/${encodeURIComponent(p.id)}/like`, value === undefined ? {} : { value });
      p.liked = r.liked; p.likes = r.likes;
      refreshLikes();
    } catch (e) { IG.toast('Could not like — try again'); }
  };

  likeBtn.onclick = () => doLike();
  img.addEventListener('dblclick', () => {
    burst.classList.remove('pop'); void burst.offsetWidth; burst.classList.add('pop');
    if (!p.liked) doLike(true);
  });

  const bm = card.querySelector('.bookmark');
  bm.onclick = async () => {
    try {
      const r = await IG.req('POST', `/posts/${encodeURIComponent(p.id)}/save`);
      p.saved = r.saved;
      bm.classList.toggle('saved', p.saved);
      IG.toast(p.saved ? 'Saved to collection' : 'Removed from saved');
    } catch (e) { IG.toast('Could not save — try again'); }
  };

  card.querySelector('.more').onclick = async () => {
    if (mine && confirm('Delete this post?')) {
      try {
        await IG.req('DELETE', `/posts/${encodeURIComponent(p.id)}`);
        delete IG.cache.posts[p.id];
        card.remove();
        IG.toast('Post deleted');
      } catch (e) { IG.toast('Could not delete'); }
    } else if (!mine) {
      IG.toast('Post options');
    }
  };
  card.querySelector('.cmt-btn').onclick = () => input.focus();
  card.querySelector('.share-btn').onclick = () => IG.toast('Link copied to clipboard');
  card.querySelectorAll('[data-user]').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = e => { e.stopPropagation(); IG.viewUser(el.dataset.user); };
  });

  input.addEventListener('input', () => postBtn.classList.toggle('show', input.value.trim().length > 0));
  const addComment = async () => {
    const text = input.value.trim();
    if (!text) return;
    postBtn.disabled = true;
    try {
      const r = await IG.req('POST', `/posts/${encodeURIComponent(p.id)}/comments`, { text });
      p.commentsCount = r.commentsCount;
      p.comments.push(r.comment);
      const div = IG.el(`<div class="c"><span class="uname" data-user="${IG.esc(r.comment.username)}">${IG.esc(r.comment.username)}</span>${IG.esc(r.comment.text)}<span class="ctime">now</span></div>`);
      div.querySelector('.uname').onclick = e => { e.stopPropagation(); IG.viewUser(r.comment.username); };
      card.querySelector('.comments').appendChild(div);
      input.value = '';
      postBtn.classList.remove('show');
      const vc = card.querySelector('.view-comments');
      if (vc) vc.textContent = `View all ${IG.fmt(p.commentsCount)} comments`;
    } catch (e) { IG.toast('Could not post comment'); }
    postBtn.disabled = false;
  };
  postBtn.onclick = addComment;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addComment(); });
};

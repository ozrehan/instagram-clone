/* Stories tray + fullscreen viewer (progress, auto-advance, reply) */
window.IG = window.IG || {};

IG.renderStories = function () {
  IG.$('stories').innerHTML = IG.STORIES.map(s => {
    const usr = IG.user(s.user);
    const seen = IG.store.seenStories[s.user] ? 'seen' : '';
    return `<div class="story ${seen}" data-user="${s.user}">
      <div class="story-ring"><div class="inner"><img src="${usr.avatar}" alt="${IG.esc(s.user)}" loading="lazy"></div></div>
      <div class="story-name">${IG.esc(s.user)}</div>
    </div>`;
  }).join('');
  IG.$('stories').querySelectorAll('.story').forEach(el => {
    el.onclick = () => IG.openStory(el.dataset.user);
  });
};

let _svTimer = null, _svIdx = 0, _svOrder = [], _svLiked = false;

IG.openStory = function (user) {
  _svOrder = IG.STORIES.map(s => s.user);
  _svIdx = Math.max(0, _svOrder.indexOf(user));
  _svLiked = false;
  IG.$('story-viewer').classList.add('open');
  IG._playStory();
};

IG._playStory = function () {
  cancelAnimationFrame(_svTimer);
  const user = _svOrder[_svIdx];
  const s = IG.STORIES.find(x => x.user === user);
  const usr = IG.user(user);
  IG.store.seenStories[user] = true;

  IG.$('sv-avatar').src = usr.avatar;
  IG.$('sv-name').innerHTML = `${IG.esc(user)} ${IG.verifiedBadge(usr)}`;
  IG.$('sv-time').textContent = '· ' + s.time;
  IG.$('sv-img').src = IG.storyImg(s);
  IG.$('sv-reply-input').value = '';
  IG.$('sv-like').classList.toggle('liked', _svLiked);

  const prog = IG.$('sv-prog');
  prog.innerHTML = _svOrder.map((_, i) =>
    `<div class="sv-prog"><i style="width:${i < _svIdx ? '100%' : '0'}"></i></div>`).join('');
  const bar = prog.children[_svIdx].firstChild;

  const t0 = performance.now(), DUR = 5000;
  const step = t => {
    const k = Math.min(1, (t - t0) / DUR);
    bar.style.width = (k * 100) + '%';
    if (k < 1) { _svTimer = requestAnimationFrame(step); }
    else {
      _svIdx++;
      if (_svIdx < _svOrder.length) IG._playStory(); else IG.closeStory();
    }
  };
  _svTimer = requestAnimationFrame(step);
  IG.renderStories();
};

IG.closeStory = function () {
  cancelAnimationFrame(_svTimer);
  IG.$('story-viewer').classList.remove('open');
};
window.closeStory = IG.closeStory;

/* step to prev/next story via side zones */
IG.storyStep = function (dir) {
  _svIdx += dir;
  if (_svIdx < 0) _svIdx = 0;
  if (_svIdx >= _svOrder.length) { IG.closeStory(); return; }
  _svLiked = false;
  IG._playStory();
};

IG.storyReply = function () {
  const input = IG.$('sv-reply-input');
  const text = input.value.trim();
  if (!text) return;
  IG.toast(`Reply sent to ${_svOrder[_svIdx]} 💬`);
  input.value = '';
};

IG.storyLike = function () {
  _svLiked = !_svLiked;
  IG.$('sv-like').classList.toggle('liked', _svLiked);
};

IG.initStoryViewer = function () {
  IG.$('sv-close').onclick = e => { e.stopPropagation(); IG.closeStory(); };
  IG.$('sv-card').onclick = e => {
    // clicks on interactive children shouldn't close
    if (e.target.closest('.sv-reply, .sv-close, .sv-nav, .sv-user')) return;
    IG.closeStory();
  };
  IG.$('sv-prev').onclick = e => { e.stopPropagation(); IG.storyStep(-1); };
  IG.$('sv-next').onclick = e => { e.stopPropagation(); IG.storyStep(1); };
  IG.$('sv-reply-input').addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') IG.storyReply();
  });
  IG.$('sv-reply-send').onclick = e => { e.stopPropagation(); IG.storyReply(); };
  IG.$('sv-like').onclick = e => { e.stopPropagation(); IG.storyLike(); };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') IG.closeStory();
    if (IG.$('story-viewer').classList.contains('open')) {
      if (e.key === 'ArrowRight') IG.storyStep(1);
      if (e.key === 'ArrowLeft') IG.storyStep(-1);
    }
  });
};
window.openStory = IG.openStory;

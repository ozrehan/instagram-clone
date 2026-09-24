/* Stories tray + fullscreen viewer — backed by the API.
 * Upload: tap "Your story". Reply: sends a DM to the story owner. */
window.IG = window.IG || {};

IG._stories = []; // [{username, avatar, verified, items:[{id,image,createdAt}]}]
IG._seenStories = {};
try { IG._seenStories = JSON.parse(localStorage.getItem('ig_seen') || '{}'); } catch {}
IG._saveSeen = function () {
  try { localStorage.setItem('ig_seen', JSON.stringify(IG._seenStories)); } catch {}
};

IG.renderStories = async function () {
  try {
    const r = await IG.req('GET', '/stories');
    IG._stories = r.stories || [];
  } catch (e) { IG._stories = []; }
  const mine = IG._stories.find(s => s.username === IG.ME.user);
  const others = IG._stories.filter(s => s.username !== IG.ME.user);
  const tile = (s, isMine) => {
    const unseen = s.items.some(it => !IG._seenStories[it.id]);
    return `<div class="story ${unseen ? '' : 'seen'}" data-user="${IG.esc(s.username)}">
      <div class="story-ring"><div class="inner"><img src="${IG.resolveImg(s.avatar)}" alt="${IG.esc(s.username)}" loading="lazy"></div>${isMine ? '<span class="story-plus">+</span>' : ''}</div>
      <div class="story-name">${isMine ? 'Your story' : IG.esc(s.username)}</div>
    </div>`;
  };
  IG.$('stories').innerHTML =
    `<div class="story ${mine && mine.items.some(it => !IG._seenStories[it.id]) ? '' : 'seen'}" data-user="__upload__">
      <div class="story-ring"><div class="inner"><img src="${IG.resolveImg(IG.ME.avatar)}" alt="you" loading="lazy"></div><span class="story-plus">+</span></div>
      <div class="story-name">Your story</div>
    </div>` +
    (mine ? tile(mine, true) : '') + others.map(s => tile(s, false)).join('');
  IG.$('stories').querySelectorAll('.story').forEach(el => {
    el.onclick = () => {
      if (el.dataset.user === '__upload__') IG.uploadStory();
      else IG.openStory(el.dataset.user);
    };
  });
};

IG.uploadStory = function () {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    IG.toast('Uploading story…');
    try {
      const imageData = await IG.fileToDataUrl(f);
      await IG.req('POST', '/stories', { imageData });
      await IG.renderStories();
      IG.toast('Story shared 🎉');
    } catch (e) { IG.toast('Story upload failed: ' + e.message); }
  };
  inp.click();
};

let _svTimer = null, _svOrder = [], _svIdx = 0, _svItem = 0, _svLiked = false;

IG.openStory = function (user) {
  _svOrder = IG._stories.filter(s => s.items.length).map(s => s.username);
  _svIdx = Math.max(0, _svOrder.indexOf(user));
  _svItem = 0;
  _svLiked = false;
  IG.$('story-viewer').classList.add('open');
  IG._playStory();
};

IG._playStory = function () {
  cancelAnimationFrame(_svTimer);
  const s = IG._stories.find(x => x.username === _svOrder[_svIdx]);
  if (!s) { IG.closeStory(); return; }
  if (_svItem >= s.items.length) {
    _svIdx++;
    _svItem = 0;
    if (_svIdx >= _svOrder.length) { IG.closeStory(); return; }
    IG._playStory();
    return;
  }
  const it = s.items[_svItem];
  IG._seenStories[it.id] = true;
  IG._saveSeen();

  IG.$('sv-avatar').src = IG.resolveImg(s.avatar);
  IG.$('sv-name').innerHTML = `${IG.esc(s.username)} ${s.verified ? IG.icon('verified', 'verified') : ''}`;
  IG.$('sv-time').textContent = '· ' + IG.timeAgo(it.createdAt);
  IG.$('sv-img').src = IG.resolveImg(it.image);
  IG.$('sv-reply-input').value = '';
  IG.$('sv-like').classList.toggle('liked', _svLiked);

  const prog = IG.$('sv-prog');
  const total = _svOrder.reduce((a, u) => a + IG._stories.find(x => x.username === u).items.length, 0);
  let done = 0;
  for (let i = 0; i < _svIdx; i++) done += IG._stories.find(x => x.username === _svOrder[i]).items.length;
  done += _svItem;
  prog.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="sv-prog"><i style="width:${i < done ? '100%' : '0'}"></i></div>`).join('');
  const bar = prog.children[done].firstChild;

  const t0 = performance.now(), DUR = 5000;
  const step = t => {
    const k = Math.min(1, (t - t0) / DUR);
    bar.style.width = (k * 100) + '%';
    if (k < 1) { _svTimer = requestAnimationFrame(step); }
    else { _svItem++; _svLiked = false; IG._playStory(); }
  };
  _svTimer = requestAnimationFrame(step);
  IG.renderStories();
};

IG.closeStory = function () {
  cancelAnimationFrame(_svTimer);
  IG.$('story-viewer').classList.remove('open');
};
window.closeStory = IG.closeStory;

IG.storyStep = function (dir) {
  const s = IG._stories.find(x => x.username === _svOrder[_svIdx]);
  _svItem += dir;
  if (_svItem < 0) {
    _svIdx = Math.max(0, _svIdx - 1);
    const prev = IG._stories.find(x => x.username === _svOrder[_svIdx]);
    _svItem = prev ? prev.items.length - 1 : 0;
  } else if (s && _svItem >= s.items.length) {
    _svIdx++; _svItem = 0;
    if (_svIdx >= _svOrder.length) { IG.closeStory(); return; }
  }
  _svLiked = false;
  IG._playStory();
};

/* Reply → real DM to the story owner */
IG.storyReply = async function () {
  const input = IG.$('sv-reply-input');
  const text = input.value.trim();
  if (!text) return;
  const owner = _svOrder[_svIdx];
  try {
    await IG.req('POST', `/dm/${encodeURIComponent(owner)}`, { text: `Replied to your story: ${text}` });
    IG.toast(`Reply sent to ${owner} 💬`);
  } catch (e) { IG.toast('Could not send reply'); }
  input.value = '';
};

IG.storyLike = function () {
  _svLiked = !_svLiked;
  IG.$('sv-like').classList.toggle('liked', _svLiked);
  if (_svLiked) IG.toast('Story liked ❤️');
};

IG.initStoryViewer = function () {
  IG.$('sv-close').onclick = e => { e.stopPropagation(); IG.closeStory(); };
  IG.$('sv-card').onclick = e => {
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

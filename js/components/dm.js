/* Direct messages — threads + conversation from the API, with polling.
 * Double-tap a bubble to like it (persisted server-side). */
window.IG = window.IG || {};

IG._threads = [];
IG._messages = [];
IG._dmPoll = null;

IG.renderDM = async function () {
  try {
    const r = await IG.req('GET', '/dm');
    IG._threads = r.threads || [];
  } catch (e) { IG._threads = []; }
  if (!IG.store.activeThread && IG._threads.length) IG.store.activeThread = IG._threads[0].username;
  const wrap = IG.$('dm-wrap');
  wrap.classList.toggle('thread-open', !!IG.store.activeThread);
  IG._renderThreadList();
  await IG._renderConversation();
  IG._startDmPoll();
  IG.renderNav();
};

IG._threadSnippet = function (t) {
  return t.lastText || 'Say hi 👋';
};

IG._renderThreadList = function () {
  IG.$('dm-threads').innerHTML = `
    <div class="dm-threads-head"><span>${IG.esc(IG.ME.user)}</span>
      <button id="dm-new" aria-label="new message">${IG.icon('plus', 'sm')}</button></div>
    <div class="dm-threads-list">
      ${IG._threads.map(t => `
        <div class="dm-thread ${t.username === IG.store.activeThread ? 'active' : ''}" data-user="${IG.esc(t.username)}">
          <img src="${IG.resolveImg(t.avatar)}" alt="">
          <div class="who"><b>${IG.esc(t.username)}</b><span>${IG.esc(IG._threadSnippet(t))}</span></div>
          ${t.unread ? `<span class="unread">${t.unread}</span>` : ''}
        </div>`).join('') || `<div class="p-empty">No conversations yet</div>`}
    </div>`;
  IG.$('dm-new').onclick = async () => {
    const name = prompt('Username to message:');
    if (!name || !name.trim()) return;
    IG.store.activeThread = name.trim();
    await IG.renderDM();
  };
  IG.$('dm-threads').querySelectorAll('.dm-thread').forEach(el => {
    el.onclick = async () => {
      IG.store.activeThread = el.dataset.user;
      await IG.renderDM();
    };
  });
};

IG._renderConversation = async function () {
  const username = IG.store.activeThread;
  const box = IG.$('dm-conv');
  if (!username) {
    box.innerHTML = `<div class="dm-empty">${IG.icon('messenger')}
      <h3>Your messages</h3><p>Send private photos and messages to a friend.</p></div>`;
    return;
  }
  let t = IG._threads.find(x => x.username === username);
  try {
    const r = await IG.req('GET', `/dm/${encodeURIComponent(username)}`);
    IG._messages = r.messages || [];
  } catch (e) {
    if (e.message === 'user not found') { IG.toast('No such user'); IG.store.activeThread = null; IG.renderDM(); return; }
    IG._messages = [];
  }
  if (!t) {
    try {
      const u = await IG.req('GET', `/users/${encodeURIComponent(username)}`);
      t = { username, name: u.user.name, avatar: u.user.avatar, verified: u.user.verified };
      IG._threads.unshift(t);
    } catch { t = { username, name: username, avatar: '', verified: false }; }
  }
  box.innerHTML = `
    <div class="dm-conv-head">
      <img src="${IG.resolveImg(t.avatar)}" alt="" data-user="${IG.esc(username)}" style="cursor:pointer">
      <div class="who"><b data-user="${IG.esc(username)}" style="cursor:pointer">${IG.esc(username)}${t.verified ? IG.icon('verified', 'verified') : ''}</b>
        <div class="status" id="dm-status">Active now</div></div>
      <div class="spacer"></div>
      <button id="dm-info" aria-label="details">${IG.icon('more', 'sm')}</button>
    </div>
    <div class="dm-msgs" id="dm-msgs">
      <div class="dm-day">Today</div>
      ${IG._messages.map(m => `
        <div class="dm-bubble ${m.from === IG.ME.user ? 'out' : 'in'}" data-mid="${IG.esc(m.id)}">
          ${IG.esc(m.text)}
          ${m.liked ? `<span class="dm-like">${IG.icon('heart')}</span>` : ''}
          <span class="dmtime">${IG.timeAgo(m.createdAt)}</span>
        </div>`).join('')}
    </div>
    <div class="dm-input">
      <input id="dm-input" type="text" placeholder="Message..." autocomplete="off">
      <button class="send" id="dm-send">Send</button>
    </div>`;

  const msgs = IG.$('dm-msgs');
  msgs.scrollTop = msgs.scrollHeight;
  box.querySelector('[data-user]').onclick = e => IG.viewUser(username);

  msgs.querySelectorAll('.dm-bubble').forEach(b => {
    b.addEventListener('dblclick', async () => {
      try {
        const r = await IG.req('POST', `/dm/${encodeURIComponent(username)}/like`, { messageId: b.dataset.mid });
        const m = IG._messages.find(x => x.id === b.dataset.mid);
        if (m) m.liked = r.liked;
        b.querySelector('.dm-like')?.remove();
        if (r.liked) b.insertAdjacentHTML('beforeend', `<span class="dm-like">${IG.icon('heart')}</span>`);
      } catch (e) { /* ignore */ }
    });
  });

  const input = IG.$('dm-input'), sendBtn = IG.$('dm-send');
  input.addEventListener('input', () => sendBtn.classList.toggle('show', input.value.trim().length > 0));
  const send = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.classList.remove('show');
    try {
      const r = await IG.req('POST', `/dm/${encodeURIComponent(username)}`, { text });
      IG._messages.push(r.message);
      await IG._renderConversation();
      const r2 = await IG.req('GET', '/dm');
      IG._threads = r2.threads || [];
      IG._renderThreadList();
    } catch (e) { IG.toast('Message failed to send'); }
  };
  sendBtn.onclick = send;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  IG.$('dm-info').onclick = () => IG.viewUser(username);
};

/* Poll for new messages while the DM view is open */
IG._startDmPoll = function () {
  clearInterval(IG._dmPoll);
  IG._dmPoll = setInterval(async () => {
    if (IG.store.view !== 'dm' || !IG.store.activeThread) return;
    try {
      const last = IG._messages.length ? IG._messages[IG._messages.length - 1].createdAt : 0;
      const r = await IG.req('GET', `/dm/${encodeURIComponent(IG.store.activeThread)}?after=${last}`);
      if (r.messages && r.messages.length) {
        IG._messages.push(...r.messages);
        await IG._renderConversation();
        const r2 = await IG.req('GET', '/dm');
        IG._threads = r2.threads || [];
        IG._renderThreadList();
        IG.renderNav();
      }
    } catch (e) { /* poll quietly */ }
  }, 5000);
};

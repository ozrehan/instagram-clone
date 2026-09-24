/* Direct messages — thread list + conversation with send + double-tap like */
window.IG = window.IG || {};

IG.renderDM = function () {
  const wrap = IG.$('dm-wrap');
  if (!IG.store.activeThread) {
    const first = IG.THREADS[0];
    if (first) IG.store.activeThread = first.id;
  }
  wrap.classList.toggle('thread-open', !!IG.store.activeThread);
  IG._renderThreadList();
  IG._renderConversation();
};

IG._threadSnippet = function (t) {
  const m = t.messages[t.messages.length - 1];
  if (!m) return 'Say hi 👋';
  return (m.from === 'me' ? 'You: ' : '') + m.text;
};

IG._renderThreadList = function () {
  IG.$('dm-threads').innerHTML = `
    <div class="dm-threads-head"><span>${IG.ME.user}</span>
      <button id="dm-new" aria-label="new message">${IG.icon('plus', 'sm')}</button></div>
    <div class="dm-threads-list">
      ${IG.THREADS.map(t => {
        const usr = IG.user(t.user);
        return `<div class="dm-thread ${t.id === IG.store.activeThread ? 'active' : ''}" data-tid="${t.id}">
          <img src="${usr.avatar}" alt="">
          <div class="who"><b>${IG.esc(t.user)}</b><span>${IG.esc(IG._threadSnippet(t))}</span></div>
          ${t.unread ? `<span class="unread">${t.unread}</span>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  IG.$('dm-new').onclick = () => IG.toast('Start a new conversation');
  IG.$('dm-threads').querySelectorAll('.dm-thread').forEach(el => {
    el.onclick = () => {
      IG.store.activeThread = el.dataset.tid;
      const t = IG.THREADS.find(x => x.id === el.dataset.tid);
      t.unread = 0;
      IG.renderDM();
      IG.renderNav(); // refresh DM badge
    };
  });
};

IG._renderConversation = function () {
  const t = IG.THREADS.find(x => x.id === IG.store.activeThread);
  const box = IG.$('dm-conv');
  if (!t) {
    box.innerHTML = `<div class="dm-empty">${IG.icon('messenger')}
      <h3>Your messages</h3><p>Send private photos and messages to a friend.</p></div>`;
    return;
  }
  const usr = IG.user(t.user);
  box.innerHTML = `
    <div class="dm-conv-head">
      <img src="${usr.avatar}" alt="">
      <div class="who"><b>${IG.esc(t.user)}${IG.verifiedBadge(usr)}</b>
        <div class="status" id="dm-status">Active now</div></div>
      <div class="spacer"></div>
      <button id="dm-call" aria-label="voice call">${IG.icon('play', 'sm')}</button>
      <button id="dm-info" aria-label="details">${IG.icon('more', 'sm')}</button>
    </div>
    <div class="dm-msgs" id="dm-msgs">
      <div class="dm-day">Today</div>
      ${t.messages.map((m, i) => `
        <div class="dm-bubble ${m.from === 'me' ? 'out' : 'in'}" data-mi="${i}">
          ${IG.esc(m.text)}
          ${m.liked ? `<span class="dm-like">${IG.icon('heart')}</span>` : ''}
          <span class="dmtime">${IG.esc(m.time)}</span>
        </div>`).join('')}
    </div>
    <div class="dm-input">
      <input id="dm-input" type="text" placeholder="Message..." autocomplete="off">
      <button class="send" id="dm-send">Send</button>
    </div>`;

  const msgs = IG.$('dm-msgs');
  msgs.scrollTop = msgs.scrollHeight;

  // double-click / double-tap a bubble to like it
  msgs.querySelectorAll('.dm-bubble').forEach(b => {
    b.addEventListener('dblclick', () => {
      const m = t.messages[+b.dataset.mi];
      m.liked = !m.liked;
      IG._renderConversation();
    });
  });

  const input = IG.$('dm-input'), sendBtn = IG.$('dm-send');
  input.addEventListener('input', () => sendBtn.classList.toggle('show', input.value.trim().length > 0));
  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    t.messages.push({ from: 'me', text, time: 'now', liked: false });
    IG._renderConversation();
    IG._renderThreadList();
    // bot reply with typing indicator
    const status = IG.$('dm-status');
    setTimeout(() => {
      if (!IG.$('dm-msgs')) return;
      IG.$('dm-msgs').insertAdjacentHTML('beforeend',
        `<div class="dm-typing" id="dm-typing">typing…</div>`);
      IG.$('dm-msgs').scrollTop = IG.$('dm-msgs').scrollHeight;
      if (status) status.textContent = 'typing…';
    }, 700);
    setTimeout(() => {
      const reply = IG.DM_REPLIES[Math.floor(Math.random() * IG.DM_REPLIES.length)];
      t.messages.push({ from: 'them', text: reply, time: 'now', liked: false });
      if (IG.store.activeThread === t.id && IG.store.view === 'dm') {
        IG._renderConversation();
      } else {
        t.unread = (t.unread || 0) + 1;
        IG.renderNav();
      }
      IG._renderThreadList();
    }, 2100);
  };
  sendBtn.onclick = send;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  IG.$('dm-call').onclick = () => IG.toast('Voice calls are disabled in this demo');
  IG.$('dm-info').onclick = () => IG.toast('Conversation details');
};

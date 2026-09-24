/* Notifications dropdown panel — real events from the API */
window.IG = window.IG || {};

IG.toggleNotif = function () {
  IG.store.notifOpen = !IG.store.notifOpen;
  IG.store.notifSeen = true;
  IG.$('notif-panel').classList.toggle('open', IG.store.notifOpen);
  if (IG.store.notifOpen) IG.renderNotif();
  IG.renderNav();
};
window.toggleNotif = IG.toggleNotif;

IG.closeNotif = function () {
  IG.store.notifOpen = false;
  IG.$('notif-panel').classList.remove('open');
};

IG._notifCount = 0;

IG.renderNotif = async function () {
  let items = [];
  try {
    const r = await IG.req('GET', '/notifications');
    items = r.notifications || [];
    IG._notifCount = items.length;
  } catch (e) { /* offline */ }
  IG.$('notif-panel').innerHTML = `
    <div class="notif-head">Notifications</div>
    ${items.length ? items.map(n => {
      const action = n.type === 'follow'
        ? `<button class="notif-follow-btn" data-user="${IG.esc(n.actor)}">Follow back</button>`
        : n.postImage ? `<img class="notif-thumb" src="${IG.resolveImg(n.postImage)}" alt="">` : '';
      return `<div class="notif-row" data-user="${IG.esc(n.actor)}">
        <img class="nava" src="${IG.resolveImg(n.actorAvatar)}" alt="">
        <div class="txt"><b>${IG.esc(n.actor)}</b> ${IG.esc(n.text)}
          <div class="time">${IG.timeAgo(n.createdAt)}</div></div>
        ${action}
      </div>`;
    }).join('') : `<div class="p-empty">No notifications yet.<br>When people like or follow you, it'll show up here.</div>`}`;
  IG.$('notif-panel').querySelectorAll('.notif-follow-btn').forEach(b => {
    b.onclick = async e => {
      e.stopPropagation();
      try {
        const r = await IG.req('POST', `/users/${encodeURIComponent(b.dataset.user)}/follow`);
        b.textContent = r.following ? 'Following' : 'Follow back';
      } catch (err) { IG.toast('Could not follow'); }
    };
  });
  IG.$('notif-panel').querySelectorAll('.notif-row').forEach(row => {
    row.onclick = () => {
      IG.closeNotif();
      IG.viewUser(row.dataset.user);
    };
  });
};

IG.initNotif = function () {
  document.addEventListener('click', e => {
    if (IG.store.notifOpen &&
        !e.target.closest('#notif-panel') &&
        !e.target.closest('[data-nav="notif"]')) {
      IG.closeNotif();
    }
  });
};

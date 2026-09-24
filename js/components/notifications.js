/* Notifications dropdown panel (heart icon in sidebar) */
window.IG = window.IG || {};

IG.toggleNotif = function () {
  IG.store.notifOpen = !IG.store.notifOpen;
  IG.store.notifSeen = true;
  IG.$('notif-panel').classList.toggle('open', IG.store.notifOpen);
  if (IG.store.notifOpen) IG.renderNotif();
};
window.toggleNotif = IG.toggleNotif;

IG.closeNotif = function () {
  IG.store.notifOpen = false;
  IG.$('notif-panel').classList.remove('open');
};

IG.renderNotif = function () {
  IG.$('notif-panel').innerHTML = `
    <div class="notif-head">Notifications</div>
    ${IG.NOTIFICATIONS.map(n => {
      const usr = IG.user(n.user);
      const following = IG.store.follows.has(n.user);
      const action = n.type === 'follow'
        ? `<button class="notif-follow-btn ${following ? 'following' : ''}" data-user="${IG.esc(n.user)}">${following ? 'Following' : 'Follow'}</button>`
        : n.thumb ? `<img class="notif-thumb" src="${IG.pic(n.thumb, 100, 100)}" alt="">` : '';
      return `<div class="notif-row" data-user="${IG.esc(n.user)}">
        <img class="nava" src="${usr.avatar}" alt="">
        <div class="txt"><b>${IG.esc(n.user)}</b> ${IG.esc(n.text)}
          <div class="time">${IG.esc(n.time)}</div></div>
        ${action}
      </div>`;
    }).join('')}`;
  IG.$('notif-panel').querySelectorAll('.notif-follow-btn').forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      const following = IG.toggleFollow(b.dataset.user);
      b.textContent = following ? 'Following' : 'Follow';
      b.classList.toggle('following', following);
    };
  });
  IG.$('notif-panel').querySelectorAll('.notif-row').forEach(row => {
    row.onclick = e => {
      if (e.target.closest('.notif-follow-btn')) return;
      IG.closeNotif();
      IG.go('home');
    };
  });
};

IG.initNotif = function () {
  // click outside closes the panel
  document.addEventListener('click', e => {
    if (IG.store.notifOpen &&
        !e.target.closest('#notif-panel') &&
        !e.target.closest('[data-nav="notif"]')) {
      IG.closeNotif();
    }
  });
};

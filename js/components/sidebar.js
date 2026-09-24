/* Sidebar navigation + view router */
window.IG = window.IG || {};

IG.NAV = [
  { id: 'home',    label: 'Home',          icon: 'home' },
  { id: 'search',  label: 'Search',        icon: 'search',  action: 'fake' },
  { id: 'explore', label: 'Explore',       icon: 'explore' },
  { id: 'reels',   label: 'Reels',         icon: 'reels' },
  { id: 'dm',      label: 'Messages',      icon: 'messenger' },
  { id: 'notif',   label: 'Notifications', icon: 'heart',   action: 'notif' },
  { id: 'create',  label: 'Create',        icon: 'plus',    action: 'create' },
  { id: 'profile', label: 'Profile',       avatar: true },
];

IG.renderNav = function () {
  const unreadDMs = IG.THREADS.reduce((a, t) => a + (t.unread || 0), 0);
  IG.$('nav-list').innerHTML = IG.NAV.map(n => {
    const active = n.id === IG.store.view ? 'active' : '';
    let visual;
    if (n.avatar) {
      visual = `<img class="nav-avatar" src="${IG.ME.avatar}" alt="profile">`;
    } else if (n.id === 'home' && n.id === IG.store.view) {
      visual = IG.icon('home', 'filled');
    } else {
      visual = IG.icon(n.icon);
    }
    const badge = n.id === 'dm' && unreadDMs
      ? `<span class="nav-badge">${unreadDMs}</span>` : '';
    return `<button class="nav-item ${active}" data-nav="${n.id}">${visual}<span>${n.label}</span>${badge}</button>`;
  }).join('');
  IG.$('nav-list').querySelectorAll('[data-nav]').forEach(el => {
    el.onclick = () => IG.go(el.dataset.nav);
  });
};

/* Router: switch views or trigger actions */
IG.go = function (view) {
  const nav = IG.NAV.find(n => n.id === view);
  if (!nav) return;
  if (nav.action === 'fake') { IG.toast('Search is decorative in this demo 🙂'); return; }
  if (nav.action === 'notif') { IG.toggleNotif(); return; }
  if (nav.action === 'create') { IG.openCreate(); return; }

  IG.store.view = view;
  IG.closeNotif();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  IG.$('view-' + view).classList.add('active');
  IG.renderNav();
  if (view === 'reels') IG.initReels();
  if (view === 'explore') IG.renderExplore();
  if (view === 'profile') IG.renderProfile();
  if (view === 'dm') IG.renderDM();
  window.scrollTo(0, 0);
};
window.go = IG.go;

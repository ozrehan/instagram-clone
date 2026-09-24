/* DOM helpers + icon helper + toast */
window.IG = window.IG || {};

IG.$ = id => document.getElementById(id);

/* <svg class="ic ..."><use href="#i-name"/></svg> — same-document refs, file:// safe */
IG.icon = (name, cls = '') =>
  `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

IG.el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
};

let _toastT;
IG.toast = function (msg) {
  const t = IG.$('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => t.classList.remove('show'), 2200);
};
window.toast = IG.toast;

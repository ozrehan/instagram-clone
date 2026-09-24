/* Auth screen — Instagram-style login/signup. Shown when no token. */
window.IG = window.IG || {};

IG._authMode = 'login';

IG.showAuth = function () {
  IG.$('auth-view').classList.add('open');
  IG.$('app').classList.add('authed-out');
  IG._renderAuth();
};
IG.hideAuth = function () {
  IG.$('auth-view').classList.remove('open');
  IG.$('app').classList.remove('authed-out');
};

IG._renderAuth = function () {
  const login = IG._authMode === 'login';
  IG.$('auth-view').innerHTML = `
    <div class="auth-wrap">
      <div class="auth-phone">
        <div class="phone-frame">
          <div class="phone-screen">
            <div class="phone-word">Instagram</div>
            <div class="phone-story"></div>
            <div class="phone-post"></div>
            <div class="phone-row"><span class="ph-heart">♥</span><span class="ph-bubble">💬</span><span class="ph-plane">➤</span></div>
            <div class="phone-post p2"></div>
          </div>
        </div>
      </div>
      <div class="auth-col">
        <div class="auth-card">
          <div class="auth-word">Instagram</div>
          <form id="auth-form" autocomplete="off">
            ${login ? '' : `<input id="auth-name" type="text" placeholder="Full name" maxlength="60" required>`}
            <input id="auth-user" type="text" placeholder="Username" maxlength="30" required>
            <input id="auth-pass" type="password" placeholder="Password" required>
            <button type="submit" class="auth-btn" id="auth-submit">${login ? 'Log in' : 'Sign up'}</button>
          </form>
          <div class="auth-err" id="auth-err"></div>
          <div class="auth-or"><span></span>OR<span></span></div>
          <button class="auth-demo" id="auth-demo">Use a demo account</button>
          <div class="auth-hint">Seeded accounts log in with password <b>demo1234</b><br>e.g. <b>alexsnaps</b> · <b>miavibes</b> · <b>joshtravels</b></div>
        </div>
        <div class="auth-card small">
          ${login
            ? `Don't have an account? <button class="link" id="auth-switch">Sign up</button>`
            : `Have an account? <button class="link" id="auth-switch">Log in</button>`}
        </div>
      </div>
    </div>`;
  IG.$('auth-switch').onclick = () => { IG._authMode = login ? 'signup' : 'login'; IG._renderAuth(); };
  IG.$('auth-demo').onclick = () => {
    IG.$('auth-user').value = 'alexsnaps';
    IG.$('auth-pass').value = 'demo1234';
    IG.$('auth-form').requestSubmit();
  };
  IG.$('auth-form').onsubmit = async e => {
    e.preventDefault();
    const btn = IG.$('auth-submit'), errEl = IG.$('auth-err');
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = '…';
    try {
      const username = IG.$('auth-user').value.trim();
      const password = IG.$('auth-pass').value;
      const path = login ? '/auth/login' : '/auth/signup';
      const body = login ? { username, password }
        : { username, password, name: IG.$('auth-name').value.trim() };
      const r = await IG.req('POST', path, body);
      IG.setToken(r.token);
      IG.setMe(r.user);
      IG.hideAuth();
      await IG.bootApp();
      IG.toast(`Welcome, ${r.user.username} 👋`);
    } catch (e2) {
      errEl.textContent = e2.message || 'Something went wrong';
    } finally {
      btn.disabled = false;
      btn.textContent = login ? 'Log in' : 'Sign up';
    }
  };
};

/* Normalize the logged-in user for components */
IG.setMe = function (u) {
  IG.ME = {
    user: u.username, name: u.name, avatar: u.avatar,
    bio: u.bio || '', followers: 0, following: 0, posts: 0, verified: !!u.verified,
  };
};

IG.logout = function () {
  IG.setToken(null);
  IG.showAuth();
};

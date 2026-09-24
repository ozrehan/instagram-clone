/* Create-post modal: upload a photo (downscaled in-browser) or pick a stock
 * photo, add a caption, publish via the API → top of feed + profile grid */
window.IG = window.IG || {};

let _createImg = null; // { imageData } | { imageUrl }

IG.CREATE_SEEDS = ['create-1', 'create-2', 'create-3', 'create-4',
                   'create-5', 'create-6', 'create-7', 'create-8'];

IG.openCreate = function () {
  _createImg = null;
  IG._renderCreateStep1();
  IG.$('create-modal').classList.add('open');
};
window.openCreate = IG.openCreate;

IG.closeCreate = function () {
  IG.$('create-modal').classList.remove('open');
};
window.closeCreate = IG.closeCreate;

IG._renderCreateStep1 = function () {
  IG.$('create-box').innerHTML = `
    <div class="modal-head">Create new post
      <button class="mclose" id="create-x">${IG.icon('close')}</button></div>
    <div class="create-step">
      <label class="create-drop" id="create-drop">
        ${IG.icon('image')}
        <div><b>Upload a photo</b><br>or pick a stock photo below</div>
        <input type="file" id="create-file" accept="image/*" hidden>
      </label>
      <div class="or-divider">OR PICK A STOCK PHOTO</div>
      <div class="create-seeds">
        ${IG.CREATE_SEEDS.map(s => `<img src="${IG.pic(s, 300, 300)}" data-seed="${s}" loading="lazy" alt="">`).join('')}
      </div>
    </div>`;
  IG.$('create-x').onclick = IG.closeCreate;
  IG.$('create-file').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const imageData = await IG.fileToDataUrl(f);
      _createImg = { imageData, preview: imageData };
      IG._renderCreateStep2();
    } catch (err) { IG.toast('Could not read that image'); }
  });
  IG.$('create-box').querySelectorAll('.create-seeds img').forEach(img => {
    img.onclick = () => {
      _createImg = { imageUrl: IG.pic(img.dataset.seed, 800, 800), preview: IG.pic(img.dataset.seed, 800, 800) };
      IG._renderCreateStep2();
    };
  });
};

IG._renderCreateStep2 = function () {
  IG.$('create-box').innerHTML = `
    <div class="modal-head">Create new post
      <button class="mclose" id="create-x">${IG.icon('close')}</button></div>
    <div class="create-step">
      <div class="create-preview"><img src="${_createImg.preview}" alt="preview"></div>
      <div class="create-caption">
        <textarea id="create-caption" placeholder="Write a caption..." maxlength="2200"></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" id="create-back">Back</button>
      <button class="btn-primary" id="create-share">Share</button>
    </div>`;
  IG.$('create-x').onclick = IG.closeCreate;
  IG.$('create-back').onclick = IG._renderCreateStep1;
  IG.$('create-share').onclick = IG.publishPost;
};

IG.publishPost = async function () {
  const caption = (IG.$('create-caption').value || '').trim() || 'New post ✨';
  const btn = IG.$('create-share');
  btn.disabled = true;
  btn.textContent = 'Sharing…';
  try {
    const payload = { caption };
    if (_createImg.imageData) payload.imageData = _createImg.imageData;
    else payload.imageUrl = _createImg.imageUrl;
    const r = await IG.req('POST', '/posts', payload);
    IG.cache.posts[r.post.id] = r.post;
    IG.closeCreate();
    IG.store.profileTab = 'POSTS';
    IG.go('home');
    await IG.renderFeed(true);
    IG.toast('Your post has been shared 🎉');
  } catch (e) {
    IG.toast('Share failed: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Share';
  }
};
window.publishPost = IG.publishPost;

IG.initCreate = function () {
  IG.$('create-modal').addEventListener('click', e => {
    if (e.target.id === 'create-modal') IG.closeCreate();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') IG.closeCreate();
  });
};

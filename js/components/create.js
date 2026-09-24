/* Create-post modal: upload a file or pick a stock seed, add a caption,
   publish → appears at the top of the feed and in the profile grid */
window.IG = window.IG || {};

let _createImg = null; // { imgUrl } | { seed }

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
  IG.$('create-file').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    _createImg = { imgUrl: URL.createObjectURL(f) };
    IG._renderCreateStep2();
  });
  IG.$('create-box').querySelectorAll('.create-seeds img').forEach(img => {
    img.onclick = () => { _createImg = { seed: img.dataset.seed }; IG._renderCreateStep2(); };
  });
};

IG._renderCreateStep2 = function () {
  const src = _createImg.imgUrl || IG.pic(_createImg.seed, 800, 800);
  IG.$('create-box').innerHTML = `
    <div class="modal-head">Create new post
      <button class="mclose" id="create-x">${IG.icon('close')}</button></div>
    <div class="create-step">
      <div class="create-preview"><img src="${src}" alt="preview"></div>
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

IG.publishPost = function () {
  const caption = (IG.$('create-caption').value || '').trim() || 'New post ✨';
  const tags = (caption.match(/#\w+/g) || []).slice(0, 5);
  const id = Math.max(...IG.POSTS.map(p => p.id)) + 1;
  IG.POSTS.unshift({
    id,
    user: IG.ME.user,
    seed: _createImg.seed || ('my-' + id),
    imgUrl: _createImg.imgUrl || null,
    time: 'now',
    likes: 0, liked: false, saved: false,
    caption, tags,
    comments: [],
  });
  IG.closeCreate();
  IG.store.profileTab = 'POSTS';
  IG.renderFeed();
  IG.go('home');
  IG.toast('Your post has been shared 🎉');
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

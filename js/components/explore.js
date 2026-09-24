/* Explore grid — real posts from the API, topic filter chips */
window.IG = window.IG || {};

IG.EXPLORE_TOPICS = ['All', 'Travel', 'Food', 'Animals', 'City', 'Art', 'Fitness', 'Nature'];
IG.TOPIC_TAGS = {
  Travel: ['travel', 'wanderlust', 'santorini', 'japan', 'kyoto', 'trekking', 'himalayas', 'adventure', 'autumn'],
  Food: ['foodie', 'biryani', 'homecooking', 'sourdough', 'baking', 'bread', 'latteart', 'coffee', 'cafehopping'],
  Animals: ['rescuedog', 'adoptdontshop'],
  City: ['streetphotography', 'mumbai', 'city'],
  Art: ['filmmaking', 'colorgrading', 'cinema', 'photography'],
  Fitness: ['fitness', '5amclub', 'grind', 'marathon', 'running', 'nevergiveup'],
  Nature: ['astrophotography', 'milkyway', 'nightsky', 'plants', 'urbanjungle', 'plantmom'],
};

IG._explorePosts = [];

IG.renderExplore = async function () {
  try {
    const r = await IG.req('GET', '/explore');
    IG._explorePosts = r.posts || [];
    IG._explorePosts.forEach(p => { IG.cache.posts[p.id] = p; });
  } catch (e) { IG._explorePosts = []; }
  IG._paintExplore();
};

IG._paintExplore = function () {
  const topic = IG.store.exploreTopic;
  const kw = IG.TOPIC_TAGS[topic] || [];
  const posts = IG._explorePosts.filter(p =>
    topic === 'All' || (p.tags || []).some(t => kw.includes(t.replace('#', '').toLowerCase())));
  IG.$('explore-chips').innerHTML = IG.EXPLORE_TOPICS.map(t =>
    `<button class="chip ${t === topic ? 'active' : ''}" data-topic="${t}">${t}</button>`).join('');
  IG.$('explore-chips').querySelectorAll('.chip').forEach(c =>
    c.onclick = () => { IG.store.exploreTopic = c.dataset.topic; IG._paintExplore(); });
  IG.$('explore-grid').innerHTML = posts.length ? posts.map(p =>
    `<div class="tile" data-pid="${IG.esc(String(p.id))}"><img src="${IG.resolveImg(p.image)}" loading="lazy" alt="">
       <div class="ov"><span>♥ ${IG.fmt(p.likes)}</span><span>💬 ${IG.fmt(p.commentsCount)}</span></div>
     </div>`).join('')
    : `<div class="p-empty">Nothing here yet — be the first to post!</div>`;
  IG.$('explore-grid').querySelectorAll('.tile').forEach(tile =>
    tile.onclick = () => IG.openPostModal(tile.dataset.pid));
};

/* Lightweight post modal for explore/profile tiles */
IG.openPostModal = function (pid) {
  const p = IG.cache.posts[pid];
  if (!p) return;
  IG.$('create-box').innerHTML = `
    <div class="modal-head">${IG.esc(p.username)}
      <button class="mclose" id="pm-x">${IG.icon('close')}</button></div>
    <div class="pm-body">${IG.postCard(p)}</div>`;
  IG.$('pm-x').onclick = IG.closeCreate;
  IG.$('create-modal').classList.add('open');
  const card = IG.$('create-box').querySelector('.post');
  IG.wirePost(card);
};

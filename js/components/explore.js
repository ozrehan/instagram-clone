/* Explore grid with topic filter chips */
window.IG = window.IG || {};

IG.EXPLORE_TOPICS = ['All', 'Travel', 'Food', 'Animals', 'City', 'Art', 'Fitness', 'Nature'];

IG.EXPLORE_TILES = [
  { seed: 'exp-mount',  topic: 'Travel' }, { seed: 'exp-kyoto',   topic: 'Travel' },
  { seed: 'exp-beach',  topic: 'Travel' }, { seed: 'exp-desert',  topic: 'Travel' },
  { seed: 'exp-santorini', topic: 'Travel' }, { seed: 'exp-trek',  topic: 'Travel' },
  { seed: 'exp-ramen',   topic: 'Food' },   { seed: 'exp-biryani', topic: 'Food' },
  { seed: 'exp-latte',   topic: 'Food' },   { seed: 'exp-sourdough', topic: 'Food' },
  { seed: 'exp-cake',    topic: 'Food' },   { seed: 'exp-thali',   topic: 'Food' },
  { seed: 'exp-puppy',   topic: 'Animals' },{ seed: 'exp-kitten',  topic: 'Animals' },
  { seed: 'exp-parrot',  topic: 'Animals' },{ seed: 'exp-horse',   topic: 'Animals' },
  { seed: 'exp-city',    topic: 'City' },   { seed: 'exp-night',   topic: 'City' },
  { seed: 'exp-street',  topic: 'City' },   { seed: 'exp-metro',   topic: 'City' },
  { seed: 'exp-mural',   topic: 'Art' },    { seed: 'exp-gallery', topic: 'Art' },
  { seed: 'exp-cinema',  topic: 'Art' },    { seed: 'exp-neon',    topic: 'Art' },
  { seed: 'exp-gym',     topic: 'Fitness' },{ seed: 'exp-run',    topic: 'Fitness' },
  { seed: 'exp-yoga',    topic: 'Fitness' },{ seed: 'exp-cycle',  topic: 'Fitness' },
  { seed: 'exp-forest',  topic: 'Nature' }, { seed: 'exp-waterfall', topic: 'Nature' },
  { seed: 'exp-milkyway',topic: 'Nature' }, { seed: 'exp-garden', topic: 'Nature' },
];

IG.renderExplore = function () {
  const topic = IG.store.exploreTopic;
  const tiles = IG.EXPLORE_TILES.filter(t => topic === 'All' || t.topic === topic);
  IG.$('explore-chips').innerHTML = IG.EXPLORE_TOPICS.map(t =>
    `<button class="chip ${t === topic ? 'active' : ''}" data-topic="${t}">${t}</button>`).join('');
  IG.$('explore-chips').querySelectorAll('.chip').forEach(c =>
    c.onclick = () => { IG.store.exploreTopic = c.dataset.topic; IG.renderExplore(); });
  IG.$('explore-grid').innerHTML = tiles.map((t, i) =>
    `<div class="tile"><img src="${IG.pic(t.seed, 500, 500)}" loading="lazy" alt="${t.topic}">
       <div class="ov"><span>♥ ${IG.fmt(1200 + i * 437)}</span><span>💬 ${IG.fmt(40 + i * 17)}</span></div>
     </div>`).join('');
  IG.$('explore-grid').querySelectorAll('.tile').forEach(tile =>
    tile.onclick = () => IG.toast('Opening post…'));
};

/* Stories — 10 story slides with portrait image seeds */
window.IG = window.IG || {};

IG.STORIES = [
  { user: 'wander.lens',   seed: 'story-wander',   time: '2h'  },
  { user: 'spice.route',   seed: 'story-spice',    time: '3h'  },
  { user: 'circuit.break', seed: 'story-circuit',  time: '5h'  },
  { user: 'paws.and.claws',seed: 'story-paws',     time: '6h'  },
  { user: 'pixel.nomad',   seed: 'story-pixel',    time: '8h'  },
  { user: 'fit.with.isha', seed: 'story-fit',      time: '11h' },
  { user: 'brew.culture',  seed: 'story-brew',     time: '13h' },
  { user: 'terra.garden',   seed: 'story-terra',    time: '16h' },
  { user: 'dev.diaries',   seed: 'story-dev',      time: '19h' },
  { user: 'frames.by.ana', seed: 'story-ana',      time: '22h' },
];

/* Story image: portrait crop of the seed */
IG.storyImg = s => IG.pic(s.seed, 600, 1000);

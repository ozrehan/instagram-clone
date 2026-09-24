/* Users — 15 seeded profiles */
window.IG = window.IG || {};

IG.ME = {
  user: 'you.exe',
  name: 'Shaik',
  avatar: IG.pic('you-avatar', 100, 100),
  bio: 'building cool stuff on the internet 🚀\n📍 Bengaluru, India',
  followers: 12400, following: 486, posts: 128,
  verified: false,
};

IG.USERS = [
  { user: 'wander.lens',   name: 'Aarav Mehta',   bio: 'Chasing sunrises 🌅 | 42 countries', avatar: IG.pic('ava-wander', 100, 100),  followers: 89200,  following: 412,  verified: true  },
  { user: 'spice.route',   name: 'Priya Nair',    bio: 'Home cook · recipes below 👇',       avatar: IG.pic('ava-spice', 100, 100),   followers: 156000, following: 890,  verified: true  },
  { user: 'circuit.break', name: 'Rohan Verma',   bio: 'I build robots 🤖',                   avatar: IG.pic('ava-circuit', 100, 100), followers: 67400,  following: 231,  verified: false },
  { user: 'paws.and.claws',name: 'Sneha Rao',     bio: 'Rescue mom 🐾',                       avatar: IG.pic('ava-paws', 100, 100),    followers: 203000, following: 105,  verified: true  },
  { user: 'pixel.nomad',   name: 'Arjun Pillai',  bio: 'Street photography · 35mm',          avatar: IG.pic('ava-pixel', 100, 100),   followers: 44800,  following: 620,  verified: false },
  { user: 'fit.with.isha', name: 'Isha Sharma',   bio: '5AM club 🏋️ · coach',                avatar: IG.pic('ava-fit', 100, 100),     followers: 98700,  following: 344,  verified: true  },
  { user: 'brew.culture',  name: 'Karan Joshi',    bio: 'Coffee snob ☕ · café hunter',        avatar: IG.pic('ava-brew', 100, 100),    followers: 31200,  following: 512,  verified: false },
  { user: 'terra.garden',   name: 'Meera Iyer',    bio: 'Urban jungle 🌿 · plant tips',       avatar: IG.pic('ava-terra', 100, 100),   followers: 76500,  following: 289,  verified: false },
  { user: 'dev.diaries',   name: 'Aditya Rao',    bio: 'Full-stack · shipping daily 💻',     avatar: IG.pic('ava-dev', 100, 100),     followers: 52900,  following: 701,  verified: false },
  { user: 'frames.by.ana', name: 'Ananya Das',    bio: 'Filmmaker 🎬 · colorist',             avatar: IG.pic('ava-ana', 100, 100),     followers: 134000, following: 198,  verified: true  },
  { user: 'trail.blazer',  name: 'Vikram Singh',  bio: 'Himalayas 🏔️ · trek guides',         avatar: IG.pic('ava-trail', 100, 100),   followers: 88100,  following: 456,  verified: false },
  { user: 'sneaker.head',  name: 'Rahul Khanna',  bio: 'Sneaker collector 👟 · 200+ pairs',   avatar: IG.pic('ava-sneak', 100, 100),    followers: 41700,  following: 933,  verified: false },
  { user: 'bake.with.ria', name: 'Ria Kapoor',    bio: 'Sourdough scientist 🍞',              avatar: IG.pic('ava-ria', 100, 100),     followers: 69300,  following: 377,  verified: false },
  { user: 'astro.nights',  name: 'Kabir Malhotra',bio: 'Astrophotography 🔭',                avatar: IG.pic('ava-astro', 100, 100),    followers: 91800,  following: 142,  verified: true  },
  { user: 'thrift.tales',  name: 'Zoya Khan',     bio: 'Sustainable fashion ♻️',              avatar: IG.pic('ava-zoya', 100, 100),    followers: 38600,  following: 845,  verified: false },
];

IG.user = name => name === IG.ME.user ? IG.ME : IG.USERS.find(x => x.user === name);

IG.verifiedBadge = u => u.verified ? IG.icon('verified', 'verified') : '';

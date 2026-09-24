/* Posts — 18 realistic feed posts. liked/saved mutate live. */
window.IG = window.IG || {};

IG.POSTS = [
  { id: 0, user: 'wander.lens', seed: 'post-santorini', time: '2h', likes: 12847, liked: false, saved: false,
    caption: 'Santorini at golden hour hits different 🌅\nSave this for your Greece itinerary ✈️',
    tags: ['#travel', '#santorini', '#wanderlust'],
    comments: [
      { user: 'pixel.nomad', text: 'This is unreal 😍 adding to the list!', time: '1h' },
      { user: 'you.exe',     text: 'Take me there!!', time: '44m' } ] },
  { id: 1, user: 'spice.route', seed: 'post-biryani', time: '5h', likes: 8932, liked: false, saved: false,
    caption: 'Sunday dum biryani recipe is finally up 🍗\nFull video in my reels — link in bio!',
    tags: ['#foodie', '#biryani', '#homecooking'],
    comments: [
      { user: 'brew.culture',   text: 'The aroma came through the screen 🔥', time: '3h' },
      { user: 'fit.with.isha',  text: 'Cheat day approved 😤', time: '2h' } ] },
  { id: 2, user: 'circuit.break', seed: 'post-robot', time: '8h', likes: 15230, liked: false, saved: false,
    caption: 'After 6 months of work, SPARK can finally balance on two wheels 🤖\nBuilt with ROS2 + a lot of coffee.',
    tags: ['#robotics', '#engineering', '#buildinpublic'],
    comments: [
      { user: 'dev.diaries', text: 'Insane build quality 👏 drop the repo!', time: '6h' },
      { user: 'wander.lens', text: 'Skynet begins 😅', time: '5h' } ] },
  { id: 3, user: 'paws.and.claws', seed: 'post-puppy', time: '12h', likes: 24511, liked: false, saved: false,
    caption: 'Meet Biscuit 🐶 rescued last week, already ruling the house.\nAdopt, don\'t shop ❤️',
    tags: ['#rescuedog', '#adoptdontshop'],
    comments: [
      { user: 'terra.garden', text: 'Those eyes!! 😭❤️', time: '9h' },
      { user: 'spice.route',  text: 'Biscuit is the goodest boy', time: '7h' } ] },
  { id: 4, user: 'fit.with.isha', seed: 'post-gym', time: '1d', likes: 6704, liked: false, saved: false,
    caption: 'Day 214 of the 5AM club 🏋️\nDiscipline > motivation. Every. Single. Time.',
    tags: ['#fitness', '#5amclub', '#grind'],
    comments: [
      { user: 'circuit.break', text: '214 days is wild, respect 💪', time: '20h' } ] },
  { id: 5, user: 'pixel.nomad', seed: 'post-street', time: '2d', likes: 11098, liked: false, saved: false,
    caption: 'Mumbai rains + old streets = magic 📸\nShot on 35mm film, no edits.',
    tags: ['#streetphotography', '#mumbai', '#35mm'],
    comments: [
      { user: 'wander.lens',  text: 'Film grain makes everything better', time: '1d' },
      { user: 'brew.culture', text: 'Framing is perfect 👌', time: '1d' } ] },
  { id: 6, user: 'dev.diaries', seed: 'post-setup', time: '2d', likes: 9412, liked: false, saved: false,
    caption: 'Desk setup tour 2026 💻\nSpecs in the comments — yes, the keyboard is louder than my thoughts.',
    tags: ['#desksetup', '#coding', '#developer'],
    comments: [
      { user: 'circuit.break', text: 'That monitor arm setup is clean', time: '1d' },
      { user: 'you.exe',       text: 'Keyboard model?? 👀', time: '1d' } ] },
  { id: 7, user: 'frames.by.ana', seed: 'post-cinema', time: '3d', likes: 18760, liked: false, saved: false,
    caption: 'Color grading breakdown 🎬\nBefore → after. Never underestimate a good LUT.',
    tags: ['#filmmaking', '#colorgrading', '#cinema'],
    comments: [
      { user: 'pixel.nomad', text: 'The teal-orange is so clean', time: '2d' } ] },
  { id: 8, user: 'trail.blazer', seed: 'post-himalaya', time: '3d', likes: 21405, liked: false, saved: false,
    caption: 'Day 4 of the Hampta Pass trek 🏔️\nAltitude: 14,100 ft. Oxygen: questionable. Views: unreal.',
    tags: ['#trekking', '#himalayas', '#adventure'],
    comments: [
      { user: 'wander.lens',   text: 'Adding this to my bucket list immediately', time: '2d' },
      { user: 'fit.with.isha', text: 'Your legs must be destroyed 😂', time: '2d' } ] },
  { id: 9, user: 'bake.with.ria', seed: 'post-sourdough', time: '4d', likes: 7831, liked: false, saved: false,
    caption: 'Crumb shot Saturday 🍞\n72-hour ferment, 82% hydration. Recipe drops tomorrow!',
    tags: ['#sourdough', '#baking', '#bread'],
    comments: [
      { user: 'spice.route', text: 'That ear!! Teach me your ways 🙏', time: '3d' } ] },
  { id: 10, user: 'astro.nights', seed: 'post-milkyway', time: '4d', likes: 31208, liked: false, saved: false,
    caption: 'The Milky Way over Spiti Valley 🔭\nSingle 25s exposure, zero light pollution.',
    tags: ['#astrophotography', '#milkyway', '#nightsky'],
    comments: [
      { user: 'trail.blazer', text: 'Spiti nights are something else ✨', time: '3d' },
      { user: 'you.exe',      text: 'This looks fake, incredible work', time: '3d' } ] },
  { id: 11, user: 'sneaker.head', seed: 'post-sneakers', time: '5d', likes: 6544, liked: false, saved: false,
    caption: 'Grail acquired 👟\nWaited 3 years for this colorway. Worth every second.',
    tags: ['#sneakerhead', '#kicks', '#grails'],
    comments: [
      { user: 'dev.diaries', text: 'No way you actually got them 😱', time: '4d' } ] },
  { id: 12, user: 'thrift.tales', seed: 'post-thrift', time: '5d', likes: 5920, liked: false, saved: false,
    caption: 'Entire fit: ₹850 from thrift stores ♻️\nSustainable fashion > fast fashion. Always.',
    tags: ['#thrifted', '#sustainablefashion', '#ootd'],
    comments: [
      { user: 'bake.with.ria', text: 'The blazer fit is perfect on you!', time: '4d' } ] },
  { id: 13, user: 'brew.culture', seed: 'post-latte', time: '6d', likes: 4812, liked: false, saved: false,
    caption: 'Poured this tulip on the first try today ☕\nSmall wins. New café review up on the blog.',
    tags: ['#latteart', '#coffee', '#cafehopping'],
    comments: [
      { user: 'spice.route', text: 'Okay barista 👀', time: '5d' } ] },
  { id: 14, user: 'terra.garden', seed: 'post-monstera', time: '1w', likes: 8730, liked: false, saved: false,
    caption: 'New leaf unfurling on the monstera 🌿\nGrowth is slow but it\'s happening. Same for us.',
    tags: ['#plants', '#urbanjungle', '#plantmom'],
    comments: [
      { user: 'paws.and.claws', text: 'So pretty! Any care tips?', time: '6d' },
      { user: 'terra.garden',   text: '@paws.and.claws bright indirect light + ignore it a little 😄', time: '6d' } ] },
  { id: 15, user: 'wander.lens', seed: 'post-kyoto', time: '1w', likes: 19934, liked: false, saved: false,
    caption: 'Kyoto in autumn 🍁\nWoke up at 4AM for this shot. Zero regrets.',
    tags: ['#japan', '#kyoto', '#autumn'],
    comments: [
      { user: 'frames.by.ana', text: 'The colors are unreal', time: '1w' },
      { user: 'pixel.nomad',   text: '4AM club pays off', time: '1w' } ] },
  { id: 16, user: 'fit.with.isha', seed: 'post-marathon', time: '1w', likes: 14277, liked: false, saved: false,
    caption: 'First marathon DONE 🏅 4:12:33\nCried at km 38. Finished anyway.',
    tags: ['#marathon', '#running', '#nevergiveup'],
    comments: [
      { user: 'trail.blazer',  text: 'Sub-4:15 on your first?! Beast 🔥', time: '1w' },
      { user: 'brew.culture',  text: 'Celebratory coffee on me ☕', time: '1w' } ] },
  { id: 17, user: 'dev.diaries', seed: 'post-shipped', time: '1w', likes: 11046, liked: false, saved: false,
    caption: 'Shipped v2.0 at 2AM 🚀\n1,000 users in the first week. Building in public works.',
    tags: ['#buildinpublic', '#startup', '#indiehacker'],
    comments: [
      { user: 'circuit.break', text: 'Let\'s gooo! Congrats 🎉', time: '1w' },
      { user: 'you.exe',       text: 'Proud of you man', time: '1w' } ] },
];

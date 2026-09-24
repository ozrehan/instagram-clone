/* DM threads — conversation histories with timestamps.
   from: 'me' | 'them'. liked: message liked via double-tap. */
window.IG = window.IG || {};

IG.THREADS = [
  { id: 't1', user: 'wander.lens', unread: 2,
    messages: [
      { from: 'them', text: 'Brooo that Santorini shot!! 📸', time: '10:24', liked: false },
      { from: 'me',   text: 'Thanks man! You should come next time', time: '10:31', liked: false },
      { from: 'them', text: 'Planning December actually ✈️', time: '10:32', liked: false },
      { from: 'them', text: 'Send me your itinerary?', time: '10:32', liked: false } ] },
  { id: 't2', user: 'spice.route', unread: 0,
    messages: [
      { from: 'me',   text: 'That biryani reel broke my diet 😭', time: 'Yesterday', liked: false },
      { from: 'them', text: 'Haha come over Sunday, making extra!', time: 'Yesterday', liked: true },
      { from: 'me',   text: 'Deal. Bringing dessert 🍰', time: 'Yesterday', liked: false } ] },
  { id: 't3', user: 'circuit.break', unread: 1,
    messages: [
      { from: 'them', text: 'SPARK v2 balancing test went well!', time: '09:15', liked: false },
      { from: 'them', text: 'Want to collab on the vision module?', time: '09:16', liked: false } ] },
  { id: 't4', user: 'dev.diaries', unread: 0,
    messages: [
      { from: 'me',   text: 'Congrats on the 1k users!! 🚀', time: 'Tue', liked: false },
      { from: 'them', text: 'Thanks! Still can\'t believe it', time: 'Tue', liked: false },
      { from: 'them', text: 'Drinks on me this weekend 🍻', time: 'Tue', liked: false },
      { from: 'me',   text: 'You don\'t have to ask twice 😄', time: 'Tue', liked: true } ] },
  { id: 't5', user: 'paws.and.claws', unread: 0,
    messages: [
      { from: 'them', text: 'Biscuit says hi 🐶', time: 'Mon', liked: false },
      { from: 'me',   text: 'Give him a treat for me!', time: 'Mon', liked: false } ] },
  { id: 't6', user: 'fit.with.isha', unread: 3,
    messages: [
      { from: 'them', text: 'Marathon training plan — want in?', time: '08:02', liked: false },
      { from: 'them', text: 'Week 1 is easy I promise 😌', time: '08:03', liked: false },
      { from: 'them', text: 'Hellooo? Don\'t leave me on read 😂', time: '08:20', liked: false } ] },
];

/* Contextual auto-replies for the demo bot */
IG.DM_REPLIES = [
  'Haha exactly 😄',
  'No way! Tell me more 👀',
  'Okay that\'s actually amazing',
  'Let\'s catch up this weekend?',
  'Sending you the pics now 📸',
  'LOL stop 😂',
  '100% agree with you on this',
];

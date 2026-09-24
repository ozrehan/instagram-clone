/* Formatting helpers */
window.IG = window.IG || {};

IG.fmt = n => Number(n).toLocaleString('en-US');

IG.esc = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

IG.pic = (seed, w = 600, h = 600) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

/* Compact counts like 1.2K / 3.4M for rail badges */
IG.compact = n => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

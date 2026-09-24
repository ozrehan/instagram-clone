/* API layer: talks to the Netlify Function backend, or falls back to the
 * local in-page demo backend (js/local.js) when the API is unreachable
 * (e.g. opened via file://). Components ONLY use IG.req(). */
window.IG = window.IG || {};

IG.API_BASE = window.IG_API_BASE
  || (typeof localStorage !== 'undefined' && localStorage.getItem('ig_api_base'))
  || '/.netlify/functions/api';

IG.BACKEND = 'api'; // 'api' | 'local'

IG.token = function () {
  try { return localStorage.getItem('ig_token'); } catch { return null; }
};
IG.setToken = function (t) {
  try { t ? localStorage.setItem('ig_token', t) : localStorage.removeItem('ig_token'); } catch {}
};

/* Resolve an image reference from the API to a usable <img> src.
 * Server returns '/api/media/<id>' for uploads, https://... for seeded pics. */
IG.resolveImg = function (u) {
  if (!u) return '';
  if (/^(https?:|blob:|data:)/.test(u)) return u;
  if (u.startsWith('/api/')) return IG.API_BASE + u.slice(4);
  return u;
};

IG.timeAgo = function (ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  const d = Math.floor(h / 24);
  if (d < 7) return d + 'd';
  const w = Math.floor(d / 7);
  if (w < 5) return w + 'w';
  return new Date(ts).toLocaleDateString();
};

IG.parseAgo = function (s) {
  const m = /^(\d+)(m|h|d|w)$/.exec(String(s || '').trim());
  if (!m) return 36e5;
  const k = { m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[m[2]];
  return parseInt(m[1], 10) * k;
};

/* The single request entrypoint. In 'local' mode it dispatches to the
 * in-page demo backend instead of fetch. */
IG.req = async function (method, path, body) {
  if (IG.BACKEND === 'local') return IG.localReq(method, path, body);
  const headers = { 'Content-Type': 'application/json' };
  const t = IG.token();
  if (t) headers['Authorization'] = 'Bearer ' + t;
  const res = await fetch(IG.API_BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) {
    IG.setToken(null);
    IG.showAuth();
    throw new Error('unauthorized');
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error((data && data.error) || ('request failed: ' + res.status));
  return data;
};

/* Probe the backend; returns true when the real API answers. */
IG.probeBackend = async function () {
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(IG.API_BASE + '/health', { signal: ctl.signal });
    clearTimeout(to);
    return res.ok;
  } catch { return false; }
};

/* Downscale an image File to a data URL: max 1080px, JPEG, < 500KB. */
IG.fileToDataUrl = function (file, maxDim = 1080, maxBytes = 500 * 1024) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      let q = 0.85, out = cv.toDataURL('image/jpeg', q);
      while (out.length * 0.75 > maxBytes && q > 0.4) {
        q -= 0.1;
        out = cv.toDataURL('image/jpeg', q);
      }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read image')); };
    img.src = url;
  });
};

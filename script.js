const stream = document.getElementById('stream');
const bottomSentinel = document.getElementById('bottomSentinel');
const backToTop = document.getElementById('backToTop');

let total = 0n;
const MAX_ITEMS = 140;
const BATCH = 24;

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function gradient() {
  const h1 = rand(190, 260);
  const h2 = (h1 + rand(40, 120)) % 360;
  const s1 = rand(60, 80);
  const s2 = rand(60, 80);
  const l1 = rand(45, 65);
  const l2 = rand(45, 65);
  return `linear-gradient(${rand(0,180)}deg, hsl(${h1} ${s1}% ${l1}%), hsl(${h2} ${s2}% ${l2}%))`;
}

const lower = 'abcdefghijklmnopqrstuvwxyz';
const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const digits = '0123456789';
const symbols = '!@#$%^&*()-_=+[]{};:,.<>/?';
const alphabetStr = lower + upper + digits + symbols;
const alphabet = Array.from(alphabetStr);
const base = BigInt(alphabet.length);
const MIN_LEN = 8;
const MAX_LEN = 20;
const charToIndex = new Map(alphabet.map((c, i) => [c, BigInt(i)]));

function pow(baseB, exp) {
  let r = 1n;
  for (let i = 0; i < exp; i++) r *= baseB;
  return r;
}

function encodeGlobalIndex(idx1) {
  let n = BigInt(idx1) - 1n;
  let len = MIN_LEN;
  while (true) {
    const block = pow(base, len);
    if (n < block || len >= MAX_LEN) break;
    n -= block;
    len += 1;
  }
  const out = new Array(Number(len));
  for (let i = 0; i < out.length; i++) {
    const digit = n % base;
    out[out.length - 1 - i] = alphabet[Number(digit)];
    n = n / base;
  }
  return out.join('');
}

function decodeToGlobalIndex(pwd) {
  if (!pwd || pwd.length < MIN_LEN || pwd.length > MAX_LEN) return null;
  let n = 0n;
  for (let i = 0; i < pwd.length; i++) {
    const ch = pwd[i];
    const val = charToIndex.get(ch);
    if (val === undefined) return null;
    n = n * base + val;
  }
  let prefix = 0n;
  for (let l = MIN_LEN; l < pwd.length; l++) {
    prefix += pow(base, l);
  }
  return prefix + n + 1n;
}

function makeCard(index) {
  const card = document.createElement('article');
  card.className = 'card';
  card.style.minHeight = `${rand(100, 220)}px`;

  const band = document.createElement('div');
  band.className = 'accent-band';
  band.style.backgroundImage = gradient();
  card.appendChild(band);

  const id = document.createElement('div');
  id.className = 'index';
  id.textContent = `#${index}`;
  card.appendChild(id);

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'Random Password';
  card.appendChild(title);

  const pwd = encodeGlobalIndex(index);
  const body = document.createElement('div');
  body.className = 'pwd';
  body.textContent = pwd;
  card.appendChild(body);

  const copy = document.createElement('button');
  copy.className = 'copy-btn';
  copy.textContent = 'Copy';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pwd);
      copy.textContent = 'Copied';
      setTimeout(() => { copy.textContent = 'Copy'; }, 1200);
    } catch (_) {}
  });
  card.appendChild(copy);

  return card;
}

function appendBatch(count) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    total += 1n;
    frag.appendChild(makeCard(total));
  }
  stream.appendChild(frag);

  if (stream.children.length > MAX_ITEMS) {
    const excess = stream.children.length - MAX_ITEMS;
    for (let i = 0; i < excess; i++) {
      const first = stream.firstElementChild;
      if (first) first.remove();
    }
  }
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) appendBatch(BATCH);
  }
}, { rootMargin: '600px 0px' });

observer.observe(bottomSentinel);

appendBatch(36);

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');
const numberInput = document.getElementById('numberInput');
const jumpBtn = document.getElementById('jumpBtn');
const jumpError = document.getElementById('jumpError');

function formatBigInt(n) {
  const s = n.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function findIndexOfPassword() {
  const val = (searchInput.value || '').trim();
  const decoded = decodeToGlobalIndex(val);
  if (decoded === null) {
    searchResult.textContent = 'Password must be 8–20 chars from the supported set';
  } else {
    searchResult.textContent = `Index: ${formatBigInt(decoded)}`;
  }
}

searchBtn.addEventListener('click', findIndexOfPassword);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') findIndexOfPassword();
});

function parseBigIntStr(s) {
  const t = (s || '').trim();
  if (!/^\d+$/.test(t)) return null;
  try { return BigInt(t); } catch { return null; }
}

function jumpToStream() {
  const n = parseBigIntStr(numberInput.value);
  if (n === null || n <= 0n) {
    jumpError.textContent = 'Enter a positive integer';
    return;
  }
  jumpError.textContent = '';
  total = n - 1n;
  stream.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'auto' });
  appendBatch(BATCH);
}

jumpBtn.addEventListener('click', jumpToStream);
numberInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') jumpToStream();
});

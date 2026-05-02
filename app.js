/**
 * app.js — Multi-Layer Encoding Pipeline
 *
 * UX flow:
 *  1. Type text
 *  2. Click encoder chips to add layers — they appear in a numbered queue
 *     with ↑ ↓ reorder and ✕ remove buttons
 *  3. Click "Run Pipeline" → each layer's output feeds the next
 *  4. See a summary table + per-layer step-by-step breakdown
 */

// ── Color palette (one per layer) ─────────────────────────────────────────────
const LAYER_COLORS = [
  '#7c5cfc','#fc5ca8','#5cf4fc','#fc9a5c',
  '#5cf46c','#fccc5c','#a07cfc','#fc7caa',
  '#7ccffc','#fc5c5c','#c45cfc'
];
const layerColor = i => LAYER_COLORS[i % LAYER_COLORS.length];

// ── State ─────────────────────────────────────────────────────────────────────
let layers    = [];   // [{ key, uid }]  — ordered list
let animSpeed = 500;
let animTimers = [];
let uidSeq    = 0;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $inputText    = document.getElementById('inputText');
const $encoderGrid  = document.getElementById('encoderGrid');
const $encodeBtn    = document.getElementById('encodeBtn');
const $clearBtn     = document.getElementById('clearBtn');
const $outputSec    = document.getElementById('outputSection');
const $finalText    = document.getElementById('finalOutputText');
const $copyBtn      = document.getElementById('copyBtn');
const $layerPanels  = document.getElementById('layerPanels');
const $summaryBody  = document.getElementById('summaryBody');
const $queueEmpty   = document.getElementById('queueEmpty');
const $queueList    = document.getElementById('queueList');
const $queueCount   = document.getElementById('queueCountLabel');

// ── Build encoder chips ───────────────────────────────────────────────────────
function buildChips() {
  $encoderGrid.innerHTML = '';
  Object.entries(ENCODERS).forEach(([key, enc]) => {
    const btn = document.createElement('button');
    btn.className = 'encoder-chip';
    btn.id = `chip-${key}`;
    btn.textContent = enc.label;
    btn.addEventListener('click', () => addLayer(key));
    $encoderGrid.appendChild(btn);
  });
}

// ── Layer management ──────────────────────────────────────────────────────────
function addLayer(key) {
  layers.push({ key, uid: uidSeq++ });
  render();
}

function removeLayer(uid) {
  layers = layers.filter(l => l.uid !== uid);
  render();
}

function moveLayer(uid, dir) {
  const i = layers.findIndex(l => l.uid === uid);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= layers.length) return;
  [layers[i], layers[j]] = [layers[j], layers[i]];
  render();
}

// ── Full render ───────────────────────────────────────────────────────────────
function render() {
  renderChips();
  renderQueue();
  $encodeBtn.disabled = layers.length === 0;
}

function renderChips() {
  Object.keys(ENCODERS).forEach(key => {
    const chip = document.getElementById(`chip-${key}`);
    if (!chip) return;
    const count = layers.filter(l => l.key === key).length;
    if (count === 0) {
      chip.className = 'encoder-chip';
      chip.textContent = ENCODERS[key].label;
      chip.style.cssText = '';
    } else {
      const firstIdx = layers.findIndex(l => l.key === key);
      const color = layerColor(firstIdx);
      chip.className = 'encoder-chip selected';
      chip.style.cssText = `background:${color}20;border-color:${color}77;box-shadow:0 0 8px ${color}33`;
      chip.innerHTML =
        ENCODERS[key].label +
        `<span class="chip-count" style="background:${color}99">${count > 1 ? '×' + count : firstIdx + 1}</span>`;
    }
  });
}

function renderQueue() {
  $queueList.innerHTML = '';

  if (layers.length === 0) {
    $queueEmpty.classList.remove('hidden');
    if ($queueCount) $queueCount.textContent = '';
    return;
  }
  $queueEmpty.classList.add('hidden');
  if ($queueCount) {
    const names = layers.map(({key}, i) => `L${i+1}:${ENCODERS[key].label}`).join(' → ');
    $queueCount.textContent = `${layers.length} layer${layers.length > 1 ? 's' : ''} — ${names}`;
  }

  layers.forEach(({ key, uid }, i) => {
    const color = layerColor(i);
    const enc   = ENCODERS[key];

    // Arrow separator between items
    if (i > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'queue-arrow';
      arrow.innerHTML =
        '<div class="queue-arrow-line"></div>' +
        '<span>↓</span>' +
        '<div class="queue-arrow-line"></div>';
      $queueList.appendChild(arrow);
    }

    // Queue item row
    const item = document.createElement('div');
    item.className = 'queue-item';

    // Numbered badge
    const badge = document.createElement('div');
    badge.className = 'queue-layer-badge';
    badge.style.cssText = `background:${color};box-shadow:0 0 10px ${color}44`;
    badge.textContent = i + 1;

    // Name
    const name = document.createElement('div');
    name.className = 'queue-item-name';
    name.style.color = color;
    name.textContent = enc.label;

    // Description hint
    const desc = document.createElement('div');
    desc.className = 'queue-item-desc';
    desc.textContent = enc.desc || '';

    // Controls
    const ctrl = document.createElement('div');
    ctrl.className = 'queue-ctrl-group';

    const upBtn = makeQBtn('↑', i === 0, () => moveLayer(uid, -1), false);
    const dnBtn = makeQBtn('↓', i === layers.length - 1, () => moveLayer(uid, +1), false);
    const rmBtn = makeQBtn('✕', false, () => removeLayer(uid), true);

    ctrl.appendChild(upBtn); ctrl.appendChild(dnBtn); ctrl.appendChild(rmBtn);

    item.appendChild(badge); item.appendChild(name);
    item.appendChild(desc); item.appendChild(ctrl);
    $queueList.appendChild(item);
  });
}

function makeQBtn(label, isDisabled, onClick, isDanger) {
  const btn = document.createElement('button');
  btn.className = 'q-btn' + (isDanger ? ' danger' : '');
  btn.textContent = label;
  btn.disabled = isDisabled;
  btn.addEventListener('click', e => { e.stopPropagation(); onClick(); });
  return btn;
}

// ── Summary table ─────────────────────────────────────────────────────────────
function renderSummary(rawInput, results) {
  $summaryBody.innerHTML = '';

  // Raw input row
  $summaryBody.appendChild(makeSumRow('—', 'Raw Input', '—', rawInput, rawInput.length, '#6666aa'));

  results.forEach((r, i) => {
    const color = layerColor(i);
    $summaryBody.appendChild(
      makeSumRow(`L${i+1}`, ENCODERS[r.key].label, r.input, r.output, r.output.length, color, r.input.length)
    );
  });
}

function makeSumRow(layerLabel, encName, inputVal, outputVal, outLen, color, inLen) {
  const tr = document.createElement('tr');
  const ratio = inLen ? ((outLen / inLen) * 100).toFixed(0) + '%' : '—';
  const maxV = 34;
  const trim = s => s.length > maxV ? s.slice(0, maxV) + '…' : s;

  tr.innerHTML = `
    <td><span class="sum-badge" style="background:${color}22;border:1px solid ${color}55;color:${color}">${layerLabel}</span></td>
    <td class="sum-enc" style="color:${color}">${encName}</td>
    <td class="sum-val" title="${escHtml(inputVal)}">${escHtml(trim(inputVal))}</td>
    <td class="sum-val sum-out" style="color:${color}" title="${escHtml(outputVal)}">${escHtml(trim(outputVal))}</td>
    <td class="sum-len">${outLen} ${inLen ? '(' + ratio + ')' : ''}</td>
  `;
  return tr;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── DOM builders ──────────────────────────────────────────────────────────────
function buildBitStream(bitStr) {
  const wrap = document.createElement('div');
  wrap.className = 'bit-stream';
  bitStr.split(' ').forEach((grp, gi, arr) => {
    const g = document.createElement('div'); g.className = 'bit-group';
    for (const b of grp) {
      const box = document.createElement('div');
      box.className = 'bit-box ' + (b === '1' ? 'one' : 'zero');
      box.textContent = b; g.appendChild(box);
    }
    wrap.appendChild(g);
    if (gi < arr.length - 1) { const s = document.createElement('div'); s.className = 'bit-sep'; wrap.appendChild(s); }
  });
  return wrap;
}

function buildCharBlocks(blocks) {
  const wrap = document.createElement('div'); wrap.className = 'char-blocks';
  blocks.forEach(b => {
    const bl = document.createElement('div'); bl.className = 'char-block';
    const top = document.createElement('div');
    top.className = 'char-top' + (b.type === 'rot' ? ' rot' : '');
    top.textContent = b.top === ' ' ? '·' : b.top;
    const bot = document.createElement('div'); bot.className = 'char-bot';
    bot.textContent = b.bottom;
    bl.appendChild(top); bl.appendChild(bot); wrap.appendChild(bl);
  });
  return wrap;
}

function buildDataRow({ key, value, type }) {
  const row = document.createElement('div'); row.className = 'data-row';
  const k = document.createElement('div'); k.className = 'data-key'; k.textContent = key;
  const v = document.createElement('div');
  v.className = 'data-val' + (type === 'highlight' ? ' highlight' : type === 'plain' ? ' plain' : '');
  v.textContent = value;
  row.appendChild(k); row.appendChild(v); return row;
}

function mkSpacer(h = '.55rem') { const d = document.createElement('div'); d.style.height = h; return d; }

// ── Step card ─────────────────────────────────────────────────────────────────
function buildStepCard(step, idx, color) {
  const card = document.createElement('div'); card.className = 'step-card';

  // Head
  const head = document.createElement('div'); head.className = 'step-head';
  const num = document.createElement('div'); num.className = 'step-num';
  num.style.cssText = `color:${color};border:1px solid ${color}44;background:${color}18`;
  num.textContent = idx + 1;
  const title = document.createElement('div'); title.className = 'step-title';
  title.textContent = step.title;
  const arrow = document.createElement('div'); arrow.className = 'step-arrow'; arrow.textContent = '▼';
  head.appendChild(num); head.appendChild(title); head.appendChild(arrow);

  // Body
  const body = document.createElement('div'); body.className = 'step-body';
  if (step.explanation) {
    const e = document.createElement('div'); e.className = 'step-explanation';
    e.style.borderLeftColor = color; e.textContent = step.explanation;
    body.appendChild(e);
  }
  if (step.charBlocks?.length) { body.appendChild(buildCharBlocks(step.charBlocks)); body.appendChild(mkSpacer()); }
  if (step.bits)               { body.appendChild(buildBitStream(step.bits)); body.appendChild(mkSpacer()); }
  if (step.data?.length) {
    const grid = document.createElement('div'); grid.className = 'data-grid';
    step.data.forEach(item => grid.appendChild(buildDataRow(item)));
    body.appendChild(grid);
  }

  card.appendChild(head); card.appendChild(body);
  head.addEventListener('click', () => {
    const open = card.classList.contains('open');
    card.closest('.layer-body-inner')?.querySelectorAll('.step-card.open').forEach(c => c !== card && c.classList.remove('open'));
    card.classList.toggle('open', !open);
  });
  return card;
}

// ── Layer panel ───────────────────────────────────────────────────────────────
function buildLayerPanel(li, key, inp, steps, out) {
  const enc = ENCODERS[key], color = layerColor(li);
  const trim = (s, n=44) => s.length > n ? s.slice(0,n) + '…' : s;

  const panel = document.createElement('div');
  panel.className = 'layer-panel'; panel.id = `lp-${li}`;

  // Stripe
  const stripe = document.createElement('div'); stripe.className = 'layer-stripe';
  stripe.style.background = `linear-gradient(90deg,${color},${color}33)`;
  panel.appendChild(stripe);

  // Header
  const hdr = document.createElement('div'); hdr.className = 'layer-header';

  const badge = document.createElement('div'); badge.className = 'layer-num-badge';
  badge.style.cssText = `background:linear-gradient(135deg,${color},${color}99);box-shadow:0 0 12px ${color}44`;
  badge.textContent = `L${li+1}`;

  const info = document.createElement('div'); info.className = 'layer-header-info';
  const t = document.createElement('div'); t.className = 'layer-header-title'; t.style.color = color;
  t.textContent = enc.label + ' — Layer ' + (li+1);
  const sub = document.createElement('div'); sub.className = 'layer-header-subtitle';
  sub.innerHTML =
    `<span class="layer-header-in">"${escHtml(trim(inp))}"</span>` +
    ` <span style="color:var(--text-dim)">→</span> ` +
    `<span class="layer-header-out" style="color:${color}">"${escHtml(trim(out))}"</span>`;
  info.appendChild(t); info.appendChild(sub);

  // Right controls
  const right = document.createElement('div'); right.className = 'layer-header-right';
  const cpyBtn = document.createElement('button'); cpyBtn.className = 'layer-copy-btn';
  cpyBtn.textContent = '⎘ Copy Output'; cpyBtn.title = 'Copy this layer\'s output';
  cpyBtn.addEventListener('click', e => {
    e.stopPropagation();
    navigator.clipboard.writeText(out).then(() => {
      cpyBtn.textContent = '✓ Copied'; cpyBtn.style.color = 'var(--green)';
      setTimeout(() => { cpyBtn.textContent = '⎘ Copy Output'; cpyBtn.style.color = ''; }, 1800);
    });
  });
  const tog = document.createElement('div'); tog.className = 'layer-toggle'; tog.textContent = '▼';
  right.appendChild(cpyBtn); right.appendChild(tog);

  hdr.appendChild(badge); hdr.appendChild(info); hdr.appendChild(right);
  hdr.addEventListener('click', () => panel.classList.toggle('expanded'));
  panel.appendChild(hdr);

  // Progress
  const pw = document.createElement('div'); pw.className = 'layer-progress-wrap';
  const pt = document.createElement('div'); pt.className = 'progress-track';
  const pf = document.createElement('div'); pf.className = 'progress-fill';
  pf.id = `pf-${li}`; pf.style.background = `linear-gradient(90deg,${color},${color}77)`;
  pt.appendChild(pf);
  const pi = document.createElement('div'); pi.className = 'progress-info';
  const pl = document.createElement('div'); pl.className = 'progress-label';
  pl.id = `pl-${li}`; pl.textContent = `0 / ${steps.length} steps`;
  pi.appendChild(pl); pw.appendChild(pt); pw.appendChild(pi);
  panel.appendChild(pw);

  // Body
  const body = document.createElement('div'); body.className = 'layer-body';
  const inner = document.createElement('div'); inner.className = 'layer-body-inner';
  inner.id = `ls-${li}`; body.appendChild(inner); panel.appendChild(body);

  return panel;
}

// ── Run pipeline ──────────────────────────────────────────────────────────────
function runPipeline() {
  const raw = $inputText.value.trim();
  if (!raw)             { shake($inputText); $inputText.focus(); return; }
  if (!layers.length)   { shake($encoderGrid); return; }

  killTimers();
  $outputSec.classList.add('hidden');
  $layerPanels.innerHTML = '';

  // Execute
  const results = [];
  let cur = raw;
  for (const { key } of layers) {
    let res;
    try   { res = ENCODERS[key].fn(cur); }
    catch (e) { res = { output: `[Error: ${e.message}]`, steps: [{ title: 'Error', explanation: e.message, data: [] }] }; }
    results.push({ key, input: cur, output: res.output, steps: res.steps });
    cur = res.output;
  }

  const finalOut = results[results.length - 1].output;

  // Final output text
  $finalText.textContent = finalOut;

  // Summary table
  renderSummary(raw, results);

  // Build panels (collapsed, expand first)
  results.forEach((r, i) => {
    const panel = buildLayerPanel(i, r.key, r.input, r.steps, r.output);
    $layerPanels.appendChild(panel);
    if (i === 0) panel.classList.add('expanded');
  });

  $outputSec.classList.remove('hidden');
  requestAnimationFrame(() => $outputSec.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  // Animate layer by layer
  function animateLayer(li) {
    if (li >= results.length) return;
    const { steps } = results[li];
    const color = layerColor(li);
    const inner = document.getElementById(`ls-${li}`);
    const pf    = document.getElementById(`pf-${li}`);
    const pl    = document.getElementById(`pl-${li}`);
    if (!inner) return;

    const cards = steps.map((s, si) => {
      const c = buildStepCard(s, si, color);
      inner.appendChild(c); return c;
    });

    let si = 0;
    function reveal() {
      if (si < cards.length) {
        cards[si].classList.add('visible');
        if (li === 0 && si === 0) push(() => cards[0].classList.add('open'), 180);
        const pct = Math.round((si + 1) / cards.length * 100);
        if (pf) pf.style.width = pct + '%';
        if (pl) pl.textContent = `${si+1} / ${cards.length} steps`;
        si++;
        push(reveal, animSpeed);
      } else {
        push(() => {
          document.getElementById(`lp-${li+1}`)?.classList.add('expanded');
          animateLayer(li + 1);
        }, Math.max(animSpeed * 0.6, 100));
      }
    }
    reveal();
  }
  animateLayer(0);
}

function push(fn, delay) { const t = setTimeout(fn, delay); animTimers.push(t); }
function killTimers()    { animTimers.forEach(clearTimeout); animTimers = []; }

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetAll() {
  killTimers();
  layers = [];
  render();
  $outputSec.classList.add('hidden');
  $layerPanels.innerHTML = '';
  $summaryBody.innerHTML = '';
  $inputText.value = '';
  $inputText.focus();
}

// ── Shake ─────────────────────────────────────────────────────────────────────
function shake(el) {
  el.animate([
    {transform:'translateX(0)'},{transform:'translateX(-7px)'},
    {transform:'translateX(7px)'},{transform:'translateX(-4px)'},
    {transform:'translateX(4px)'},{transform:'translateX(0)'}
  ], { duration: 320, easing: 'ease-in-out' });
}

// ── Copy final output ─────────────────────────────────────────────────────────
$copyBtn.addEventListener('click', () => {
  const text = $finalText.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    $copyBtn.textContent = '✓ Copied!'; $copyBtn.classList.add('copied');
    setTimeout(() => { $copyBtn.textContent = '⎘ Copy'; $copyBtn.classList.remove('copied'); }, 2000);
  });
});

// ── Speed ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.speed-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    animSpeed = parseInt(btn.dataset.speed);
  })
);

// ── Buttons ───────────────────────────────────────────────────────────────────
$encodeBtn.addEventListener('click', runPipeline);
$clearBtn .addEventListener('click', resetAll);
$inputText.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) runPipeline(); });

// ── Init ──────────────────────────────────────────────────────────────────────
buildChips();
render();

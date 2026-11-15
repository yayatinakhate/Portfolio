/* app.js — renders data/chapters.js into the page, then wires the scroll journey.
   Sections:
     1. helpers            2. block renderers        3. page build
     4. interactions       5. scroll scenes (GSAP)   6. reduced-motion fallback */
(function () {
  'use strict';
  const D = window.PORTFOLIO;
  if (!D) { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">data/chapters.js did not load.</p>'; return; }

  /* ---------------------------------------------------------------- 1. helpers */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]reduce\b/.test(location.search);
  const mobile = matchMedia('(max-width: 720px)').matches;
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const chip = (c, label) => c ? `<span class="chip ${esc(c)}">${esc(label || c)}</span>` : '';
  const img = (it, extra = '') => `<img src="${esc(it.src)}" alt="${esc(it.alt || '')}" loading="lazy" decoding="async" style="${it.ar ? `--ar:${esc(it.ar)};` : ''}${extra}">`;
  const cap = it => (it.caption || it.heading || it.chip)
    ? `<figcaption${it.heading ? ' class="plain"' : ''}>${it.heading ? `<b>${it.heading}</b>` : ''}${chip(it.chip)}${it.caption ? `<span>${it.caption}</span>` : ''}</figcaption>` : '';
  /* galleries: any photo item can carry `gallery: [ { src, caption } | { video, poster, caption } ]`; clicking opens them in the viewer */
  const GAL = [];
  const galAttr = it => it.gallery && it.gallery.length ? ` data-gal="${GAL.push([{ src: it.src, caption: it.caption || it.heading || it.alt || '' }, ...it.gallery]) - 1}"` : '';
  const galBadge = it => {
    if (!it.gallery || !it.gallery.length) return '';
    const v = it.gallery.filter(g => g.video).length, p = it.gallery.length - v;
    return `<span class="gal-badge">${p ? `+${p} photo${p > 1 ? 's' : ''}` : ''}${p && v ? ' · ' : ''}${v ? `▶ ${v} video${v > 1 ? 's' : ''}` : ''}</span>`;
  };
  const shot = (it, cls = '') => `<figure class="shot rv ${cls}"${galAttr(it)}><div class="frame">${img(it)}${galBadge(it)}</div>${cap(it)}</figure>`;
  const head = (title, intro, scriptTxt) => `<div class="head-row">${title ? `<h2>${title}</h2>` : ''}${intro ? `<p>${intro}</p>` : ''}${scriptTxt ? `<p class="script">${scriptTxt}</p>` : ''}</div>`;
  const wrapSection = (b, inner, cls = '') => `<section class="blk block on-${esc(b.theme || b._theme)} ${cls}" ${b.id ? `id="${esc(b.id)}"` : ''}><div class="wrap">${b.kicker ? `<p class="kicker q-kicker">${esc(b.kicker)}</p>` : ''}${inner}</div></section>`;
  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  /* 3D model: poster first; the viewer library and the .glb load only when the block is near the screen */
  const modelHTML = m => `<figure class="m3d" data-model="${esc(m.src)}" data-orbit="${esc(m.orbit || '')}" data-alt="${esc(m.alt || '')}" data-poster="${esc(m.poster || '')}" data-still-caption="${esc(m.stillCaption || '')}">
    <div class="m3d-stage">
      ${m.poster ? `<img class="m3d-poster" src="${esc(m.poster)}" alt="${esc(m.alt || '')}" loading="lazy">` : ''}
      <div class="m3d-ui" hidden><span class="m3d-tag">3D</span><button type="button" class="m3d-go" aria-pressed="false">Explore in 3D</button><button type="button" class="m3d-reset" hidden>Reset view</button><button type="button" class="m3d-full" hidden>Full screen</button></div>
      <p class="m3d-hint" hidden>Drag to rotate · scroll or pinch to zoom · right-drag or two fingers to pan</p>
    </div>
    ${m.caption ? `<figcaption class="script">${m.caption}</figcaption>` : ''}
  </figure>`;

  const A = D.applicant || {};

  /* ---------------------------------------------------------------- 2. block renderers
     Each returns an HTML string. `bare` = rendered inside a columns block (no section wrapper). */
  const R = {
    text: b => `<div class="txt">${b.h2 ? `<h2>${b.h2}</h2>` : ''}${(b.paras || []).map(p => `<p>${p}</p>`).join('')}${b.aside ? `<div class="aside"><b>${esc(b.aside.label || '')}</b><p>${b.aside.text}</p></div>` : ''}${b.script ? `<p class="script">${b.script}</p>` : ''}</div>`,

    intro: b => `<section class="blk block hi on-${esc(b.theme || 'butter')}"><div class="wrap hi-grid"><img class="me rv" src="${esc(b.image.src)}" alt="${esc(b.image.alt || '')}" loading="lazy"><div><h2>${b.title}</h2><p class="lede">${b.lede}</p><div class="facts">${(b.facts || []).map(f => `<div><b>${esc(f.k)}</b>${f.v}</div>`).join('')}</div>${b.interests && A.interests ? `<p class="kicker">Research interests</p><div class="tags sm">${A.interests.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}${b.script ? `<p class="script">${b.script}</p>` : ''}</div></div></section>`,

    numbers: b => wrapSection(b, `${b.title ? `<h2>${b.title}</h2>` : ''}<div class="nums">${b.items.map(n => `<div class="num-item rv"><p class="num-fig"><b ${n.n != null ? `data-count="${n.n}"` : ''}>${n.n != null ? 0 : esc(n.text)}</b>${n.unit ? `<i>${esc(n.unit)}</i>` : ''}</p><span>${n.label}</span></div>`).join('')}</div>`, 'nums-blk'),

    /* six steps on a ring; auto-advances until someone picks one */
    loop: b => wrapSection(b, head(b.title, b.intro) + `<div class="loop" data-loop>
      <div class="loop-ring" role="tablist" aria-label="${esc(b.title || 'Steps')}">
        <svg viewBox="0 0 200 200" aria-hidden="true"><circle class="loop-track" cx="100" cy="100" r="78"/><circle class="loop-arc" cx="100" cy="100" r="78" pathLength="1"/></svg>
        ${b.steps.map((s, i) => `<button type="button" role="tab" class="loop-node" style="--a:${Math.round(i * 360 / b.steps.length - 90)}deg" aria-selected="false">${esc(s.name)}</button>`).join('')}
        <div class="loop-mid" aria-hidden="true"><b></b><small>of ${String(b.steps.length).padStart(2, '0')}</small></div>
      </div>
      <div class="loop-panel" role="tabpanel" aria-live="polite"></div>
    </div>${b.script ? `<p class="script accent">${b.script}</p>` : ''}`, 'loop-blk'),

    /* research interests, each tied back to the chapters that raised the question */
    research: b => wrapSection(b, `<h2>${b.title}</h2>${b.lede ? `<p class="lede" style="margin-top:20px">${b.lede}</p>` : ''}<div class="rsch" data-research>
      <div class="rsch-tabs" role="tablist" aria-label="Research interests">${b.items.map((it, i) => `<button type="button" role="tab" aria-selected="${i === 0}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(it.name)}</button>`).join('')}</div>
      <div class="rsch-panel" role="tabpanel" aria-live="polite"></div>
    </div>${b.script ? `<p class="script" style="margin-top:36px">${b.script}</p>` : ''}`, 'rsch-blk'),

    academics: b => wrapSection(b, `<h2>${b.title}</h2><div class="acad">
      <div class="rv">
        <p class="acad-deg">${A.degree || ''}</p><p class="acad-school">${A.school || ''}</p>
        ${A.cgpa ? `<p class="acad-cgpa"><b>${esc(A.cgpa)}</b><i>${esc(A.cgpaOf || '')}</i></p>` : ''}
        ${A.coursework ? `<h3>Coursework</h3><div class="tags sm">${A.coursework.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="rv">
        ${b.projects ? `<h3>Academic projects</h3>${b.projects.map(p => `<div class="acad-proj"><b>${p.name}</b><small>${esc(p.tools || '')}</small><p>${p.text}</p></div>`).join('')}` : ''}
        ${A.certifications ? `<h3 style="margin-top:22px">Certifications</h3><ul class="acad-list">${A.certifications.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${A.leadership ? `<h3>Leadership</h3><ul class="acad-list">${A.leadership.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </div>
    </div>`, 'acad-blk'),

    strip: (b, bare) => {
      const grid = `<div class="strip c${b.cols || 3}${b.plain ? ' plain' : ''}">${b.items.map(it => shot(it)).join('')}</div>`;
      const note = b.note ? R.note(b.note) : '';
      const duo = b.duo ? R.duo(b.duo) : '';
      if (bare || b.bare) return grid + note + duo;
      return wrapSection(b, head(b.title, b.intro) + grid + note + duo);
    },
    note: b => `<p class="note">${chip(b.chip, b.label)}<span>${b.text}</span></p>`,
    mosaic: b => `<div class="mosaic">${b.items.map(it => `<figure class="shot rv${it.tall ? ' tall' : ''}"${it.wide ? ' style="grid-column:span 2"' : ''}><div class="frame"${it.tall ? ' style="height:100%"' : ''}>${img(it, it.tall ? 'aspect-ratio:auto;height:100%;' : '')}</div>${cap(it)}</figure>`).join('')}</div>`,
    probs: b => `<ol class="probs">${b.items.map(t => `<li>${t}</li>`).join('')}</ol>`,
    figure: b => shot(b),
    columns: b => {
      const col = list => `<div>${(list || []).map(x => render(x, b._theme, true)).join('')}</div>`;
      const inner = `${b.h2 ? `<h2>${b.h2}</h2>` : ''}<div class="split" style="grid-template-columns:${esc(b.ratio || '1fr 1fr')};align-items:${esc(b.align || 'center')};${b.h2 ? 'margin-top:40px' : ''}">${col(b.left)}${col(b.right)}</div>`;
      return wrapSection(b, inner);
    },
    duo: b => `<div class="duo"><div class="m">${chip(b.m.chip, b.m.label)}<p>${b.m.text}</p></div><div class="r">${chip(b.r.chip, b.r.label)}<p>${b.r.text}</p></div></div>`,
    stats: b => `<div class="stats">${b.items.map(s => `<div class="stat"><b ${s.n != null ? `data-count="${s.n}"` : ''}>${s.n != null ? 0 : esc(s.text)}</b><span>${s.label}</span></div>`).join('')}</div>`,

    scrubber: b => wrapSection(b, `<h2>${b.h2}</h2>${b.lede ? `<p class="lede" style="margin-top:14px;opacity:.85">${b.lede}</p>` : ''}
      <div class="scrub" data-scrub>
        <div class="stage" role="group" aria-roledescription="carousel" aria-label="${esc(b.h2 || 'Attempts')}">
          ${b.steps.map((s, i) => `<img src="${esc(s.src)}" alt="${esc(s.alt || '')}" draggable="false" ${i ? 'loading="lazy"' : 'class="on"'}>`).join('')}
          <span class="stage-count" aria-hidden="true"></span>
          <button type="button" class="stage-nav prev" aria-label="Previous attempt">‹</button>
          <button type="button" class="stage-nav next" aria-label="Next attempt">›</button>
        </div>
        <div class="scrub-side">
          <p class="scrub-count" aria-hidden="true"></p>
          <div class="readout" aria-live="polite"><span class="chip"></span><span class="script"></span></div>
          <div class="film" role="group" aria-label="All ${b.steps.length} attempts" style="--n:${b.steps.length}">
            ${b.steps.map((s, i) => `<button type="button" class="film-item ${esc(s.chip || '')}" aria-label="Attempt ${i + 1}: ${esc(s.text)}"><img src="${esc(s.src)}" alt="" loading="lazy" draggable="false"><span>${String(i + 1).padStart(2, '0')}</span></button>`).join('')}
          </div>
          ${b.hint ? `<p class="hint">${b.hint}</p>` : ''}
        </div>
      </div>`, 'scrub-blk'),

    projects: b => wrapSection(b, head(b.title, b.intro) + `<div class="projects">${b.items.map(p => `<button class="proj rv" data-zoom="${esc(p.src)}" data-cap="${esc(p.name)}"><img src="${esc(p.src)}" alt="${esc(p.name)}" loading="lazy"${p.contain ? ' style="object-fit:contain;background:#eee"' : ''}><span class="cap"><h3>${esc(p.name)}</h3><p>${p.text}</p></span></button>`).join('')}</div>`),

    process: b => wrapSection(b, head(b.title, null, b.script) + `<div class="process"><div class="line"><i></i></div><div class="strip c${b.items.length}">${b.items.map((it, i) => `<figure class="shot"><span class="n">${i + 1}</span><div class="frame">${img(Object.assign({ ar: '3/5' }, it))}</div>${cap(it)}</figure>`).join('')}</div></div>`),

    model: b => wrapSection(b, head(b.title, b.intro) + modelHTML(b)),

    /* a quadcopter, top view, drawn like a CAD sketch; assembles on scroll in the order of the three steps */
    assembly: b => {
      const arm = a => {
        const hl = a === 315;                      // the top-right arm carries the labels and the "this shape / another" comparison
        return `<g class="as-arm${hl ? ' hl' : ''}" transform="rotate(${a} 300 300)">
          <line class="as-mate" x1="336" y1="300" x2="600" y2="300"/>
          ${hl ? '<path class="as-alt" d="M336 279 L500 279 L500 321 L336 321 Z"/>' : ''}
          <g class="as-p as-beam"><path d="M336 287 L498 292 Q508 300 498 308 L336 313 Z"/>${hl ? '<text class="as-label" x="372" y="274">ARM</text>' : ''}</g>
          <g class="as-p as-motor"><circle cx="510" cy="300" r="22"/><circle class="as-hub" cx="510" cy="300" r="7"/>${hl ? '<text class="as-label" x="488" y="266">MOTOR</text>' : ''}</g>
          <g class="as-p as-prop"><circle class="as-disk" cx="510" cy="300" r="72"/><g class="as-blades"><ellipse cx="476" cy="300" rx="34" ry="7"/><ellipse cx="544" cy="300" rx="34" ry="7"/></g>${hl ? '<text class="as-label" x="540" y="218">PROP</text>' : ''}</g>
          <circle class="as-ring r1" cx="338" cy="300" r="13"/><circle class="as-ring r2" cx="510" cy="300" r="30"/>
          ${hl ? '<text class="as-label as-l3 as-this" x="360" y="268">THIS SHAPE</text><text class="as-label as-l3 as-other" x="360" y="344">OR ANOTHER?</text>' : ''}
        </g>`;
      };
      const svg = `<svg class="as-svg" viewBox="-40 -40 680 680" role="img" aria-label="A quadcopter drawn from above, assembling part by part">
        ${[45, 135, 225, 315].map(arm).join('')}
        <g class="as-frame"><rect x="232" y="222" width="136" height="156" rx="24"/><text class="as-label" x="300" y="398" text-anchor="middle">FRAME</text></g>
        <g class="as-fc"><rect x="270" y="270" width="60" height="60" rx="6"/><circle cx="279" cy="279" r="3"/><circle cx="321" cy="279" r="3"/><circle cx="279" cy="321" r="3"/><circle cx="321" cy="321" r="3"/><path d="M300 314 L300 288 M291 297 L300 288 L309 297"/></g>
      </svg>`;
      return wrapSection(b, `${b.title ? `<h2>${b.title}</h2>` : ''}<div class="as-grid">${svg}<ol class="as-steps">${(b.steps || []).map((t, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${t}</li>`).join('')}</ol></div>`, 'assembly');
    },

    dl: b => wrapSection(b, `<div class="alongside"><div><h2 style="margin-bottom:26px">${b.title}</h2><dl>${b.items.map(i => `<div><dt>${i.dt}</dt>${i.dd ? `<dd>${i.dd}</dd>` : ''}</dl></div>`.replace('</dl></div>', '</div>')).join('')}</dl></div>${b.model ? modelHTML(Object.assign({ poster: b.render && b.render.src, alt: b.render && b.render.alt, caption: b.render && b.render.caption, stillCaption: b.render && b.render.caption }, b.model)) : b.render ? `<figure><div class="render"><img src="${esc(b.render.src)}" alt="${esc(b.render.alt || '')}" loading="lazy"></div><figcaption class="script" style="margin-top:10px">${b.render.caption || ''}</figcaption></figure>` : ''}</div>`),

    log: b => wrapSection(b, `<h2>${b.h2}</h2><div class="alt" aria-label="${b.altitude} metres"><span data-alt="${b.altitude}">0</span><small>m</small></div>
      <div class="split rev" style="margin-top:30px;align-items:start"><div><div class="log" data-log><div class="parts" role="tablist" aria-label="Parts"></div><div class="detail"><p role="tabpanel"></p><div class="fleet" aria-hidden="true"></div></div></div></div>${b.figure ? shot(b.figure) : ''}</div>`, 'ladakh'),

    bigquote: b => wrapSection(b, `${b.lede ? `<p class="lede" style="margin-top:14px">${b.lede}</p>` : ''}<p class="bigquote" data-bigquote>${b.quote}</p>${b.script ? `<p class="script">${b.script}</p>` : ''}`),

    flips: b => wrapSection(b, head(b.title, b.intro) + `<div class="flips">${b.items.map(f => `<button class="flip" aria-pressed="false"><span class="in"><span class="f"><small>What I did</small><p>${f.did}</p><small>Flip for the question</small></span><span class="b"><small>The question I'd ask now</small><p>${f.ask}</p></span></span></button>`).join('')}</div>${b.script ? `<p class="script accent">${b.script}</p>` : ''}`),

    tags: b => wrapSection(b, `<h2>${b.title}</h2>${b.lede ? `<p class="lede" style="margin-top:20px">${b.lede}</p>` : ''}<div class="tags">${b.items.map(t => `<span>${t}</span>`).join('')}</div>`),

    bench: b => wrapSection(b, head(b.title, b.intro) + `<div class="bench-wrap">
      <button type="button" class="bench-nav prev" aria-label="Scroll left">‹</button>
      <div class="bench" tabindex="0" aria-label="${esc(b.title || 'Photos')}: scrolls sideways">${b.items.map(it => `<figure class="shot"${galAttr(it)}><div class="frame">${img(Object.assign({ ar: '5/9' }, it))}${galBadge(it)}</div>${cap(it)}</figure>`).join('')}</div>
      <button type="button" class="bench-nav next" aria-label="Scroll right">›</button></div>`),

    video: b => wrapSection(b, `<div class="split vid-split"><div class="vid-stage" data-video><video muted loop playsinline preload="none" poster="${esc(b.poster || '')}" data-src="${esc(b.src)}"></video><span class="rec"><i></i>${esc(b.label || 'FPV FEED')}</span><button class="vplay" aria-label="Play video">▶</button></div><div class="mini">${(b.aside || []).map(it => `<figure class="shot rv"${it.wide ? ' style="grid-column:span 2"' : ''}><div class="frame">${img(it)}</div>${cap(it)}</figure>`).join('')}</div></div>`),

    placeholder: b => wrapSection(b, `<div class="ph-card rv"><div class="bars"></div><b>${esc(b.title || 'Coming soon')}</b><p>${b.text || ''}</p></div>`)
  };
  function render(b, theme, bare) {
    b._theme = theme;
    const fn = R[b.type];
    if (!fn) { console.warn('Unknown block type', b.type); return ''; }
    return fn(b, bare);
  }

  /* ---------------------------------------------------------------- 3. page build */
  const P = D.person, HUD = D.hud, chapters = D.chapters;
  if (P.linkedin && /REPLACE/i.test(P.linkedin)) P.linkedin = null;   // placeholder → no button
  document.title = `${P.name} — ${P.tagline}`;
  $('meta[name=description]').content = P.description || '';

  $('#hero').innerHTML = `
    <div class="hero-ui">
      <div class="meta">${(P.meta || []).map(m => `<span>${esc(m)}</span>`).join('')}</div>
      <div class="hero-title">
        <p class="hero-name">${esc(P.name)}</p>
        <h1>${P.tagline.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ')}</h1>
        <p class="script hero-sub">${esc(P.sub || '')}</p>
      </div>
      <div class="foot"><div class="hero-links"><button type="button" data-plan aria-haspopup="dialog">Flight plan</button>${P.linkedin ? `<a href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}${P.resume ? `<a href="${esc(P.resume)}" download>Resume (PDF)</a>` : ''}</div><div class="foot-r"><button type="button" class="skip" data-skip>Skip intro ↓</button><span class="cue"><i></i>${esc(D.hero.cue || 'Scroll')}</span></div></div>
    </div>`;

  $('#hud').innerHTML = `
    <div class="hud-tl"><b>${esc(HUD.callsign)}</b><span>${esc(HUD.link || '')}</span><span class="rssi">RSSI <i></i><i></i><i></i><i></i><i class="off"></i></span></div>
    <div class="hud-tr"><b data-hud="volt">${HUD.voltageStart.toFixed(1)}V</b><span class="bat"><i data-hud="bat"></i></span></div>
    <div class="hud-bl"><b data-hud="time">00:00</b><span>FLT TIME</span></div>
    <div class="hud-br"><b data-hud="wp">WP --/--</b><span data-hud="name">—</span><span data-hud="dist">DIST ---- m</span></div>
    <div class="hud-center" aria-hidden="true"><div class="horizon" data-hud="horizon"><i></i></div><svg viewBox="0 0 80 80"><path d="M40 20v10M40 50v10M20 40h10M50 40h10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="40" cy="40" r="3" fill="currentColor"/></svg></div>
    <div class="hud-msg" data-hud="msg" aria-live="polite"></div>
    <button type="button" class="hud-planbtn" data-plan aria-haspopup="dialog">☰ Flight plan</button>
    <nav class="hud-nav" aria-label="Chapters"><ol>${chapters.map((c, i) => `<li><button data-go="${i}" aria-label="${esc(c.title)}"><span>${esc(c.num)} ${esc(c.title)}</span></button></li>`).join('')}</ol></nav>`;

  const journey = $('#journey');
  journey.innerHTML = chapters.map((c, i) => {
    const coverHTML = c.cover
      ? `<img src="${esc(c.cover.src)}" alt="${esc(c.cover.alt || '')}" ${i < 2 ? '' : 'loading="lazy"'} decoding="async">`
      : `<div class="nosignal"><span>NO SIGNAL</span><small>WP ${esc(c.num)}</small></div>`;
    return `<article class="chapter" id="${esc(c.id)}" data-index="${i}">
      <section class="wp on-${esc(c.theme)}${c.interlude ? ' interlude' : ''}">
        <div class="wp-stage">
          <div class="wp-card">${coverHTML}</div>
          <div class="wp-tag"><b>WP ${esc(c.num)}</b><span>${esc(c.title)}</span><i></i></div>
          <div class="wp-tx">
            <div><span class="num">${esc(c.num)}</span><h2>${c.title}</h2>${c.role ? `<p class="role">${c.role}</p>` : ''}${c.result ? `<p class="result"><b>Result</b>${c.result}</p>` : ''}${c.methods ? `<p class="methods"><b>Methods</b>${c.methods.map(m => `<span>${esc(m)}</span>`).join('')}</p>` : ''}</div>
            <div class="story">${(c.story || []).map(p => `<p>${p}</p>`).join('')}${c.stats ? R.stats({ items: c.stats }) : ''}${c.quote ? `<p class="script">${c.quote}</p>` : ''}${c.learned ? `<p class="learned">${esc(c.learned)}</p>` : ''}</div>
          </div>
        </div>
      </section>
      ${(c.blocks || []).map(b => render(b, c.theme)).join('')}
    </article>`;
  }).join('');

  $('#exit').innerHTML = `<div class="exit-tx"><p class="script">Goggles off.</p></div>`;
  $('#finale').innerHTML = `<div class="wrap" style="width:100%"><h2>${D.finale.lines.map(l => l.replace('<em>', '<span class="brk" data-split>').replace('</em>', '</span>')).join('<br>')}</h2>
    <div class="contact"><div><strong>${esc(P.name)}</strong><div class="mail">${esc(P.email)}</div></div><button class="btn" data-copy>${esc(D.finale.copy || 'Copy email')}</button><a class="btn" href="mailto:${esc(P.email)}">${esc(D.finale.write || 'Write to me')}</a>${P.linkedin ? `<a class="btn ghost" href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}${P.resume ? `<a class="btn ghost" href="${esc(P.resume)}" download>Download resume</a>` : ''}</div></div>`;

  // hide the resume button if the PDF isn't there yet
  if (P.resume) fetch(P.resume, { method: 'HEAD' }).then(r => { if (!r.ok) $$('a[download]').forEach(a => a.remove()); }).catch(() => {});

  /* ---------------------------------------------------------------- flight plan + skip (for reviewers who want the gist fast) */
  let goTo = i => { const a = $$('.chapter')[i]; if (a) a.scrollIntoView(); };      // replaced by a ScrollTrigger-aware version below
  const plan = h(`<div id="plan" role="dialog" aria-modal="true" aria-label="Flight plan" hidden><div class="plan-in">
    <div class="plan-head"><b>Flight plan</b><span>${chapters.length} waypoints · pick one to fly straight there</span><button type="button" class="plan-x" data-plan-close>Close</button></div>
    ${A.degree ? `<div class="plan-brief"><p><b>${A.degree}</b> · ${A.school}${A.cgpa ? ` · CGPA ${esc(A.cgpa)} / 10` : ''}</p>${A.interests ? `<div class="tags sm">${A.interests.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}<div class="plan-links">${P.resume ? `<a href="${esc(P.resume)}" download>Resume (PDF)</a>` : ''}${P.linkedin ? `<a href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}<a href="mailto:${esc(P.email)}">Email</a></div></div>` : ''}
    <ol>${chapters.map((c, i) => `<li><button type="button" data-go-plan="${i}"><span class="pn">${esc(c.num)}</span><span class="pt"><b>${c.title}</b>${c.role ? `<small>${c.role}</small>` : ''}${c.result ? `<em>${c.result}</em>` : ''}</span></button></li>`).join('')}</ol>
  </div></div>`);
  document.body.appendChild(plan);
  let planReturn = null;
  function openPlan() { planReturn = document.activeElement; plan.hidden = false; document.documentElement.classList.add('plan-open'); const f = $('button[data-go-plan]', plan); if (f) f.focus(); }
  function closePlan(restore = true) { plan.hidden = true; document.documentElement.classList.remove('plan-open'); if (restore && planReturn && planReturn.focus) planReturn.focus({ preventScroll: true }); }
  $$('[data-plan]').forEach(b => b.addEventListener('click', openPlan));
  $('[data-plan-close]', plan).addEventListener('click', () => closePlan());
  plan.addEventListener('click', e => { if (e.target === plan) closePlan(); });
  plan.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePlan(); return; }
    if (e.key === 'Tab') { const f = $$('button', plan), first = f[0], last = f[f.length - 1];   // keep focus inside the dialog
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); } }
  });
  $$('[data-go-plan]', plan).forEach(b => b.addEventListener('click', () => { closePlan(false); goTo(+b.dataset.goPlan); }));
  $$('[data-skip]').forEach(b => b.addEventListener('click', () => goTo(0)));

  /* ---------------------------------------------------------------- 4. interactions (port of the original site) */
  // split letters
  $$('[data-split]').forEach(el => { const t = el.textContent; el.textContent = ''; [...t].forEach(ch => { const s = document.createElement('span'); s.className = 'l'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); }); });

  // chocolate-style scrubbers
  $$('[data-scrub]').forEach(sc => {
    const data = findBlock('scrubber', sc) || { steps: [] };
    const n = data.steps.length, stage = $('.stage', sc), imgs = $$('.stage img', sc), film = $$('.film-item', sc);
    const chipEl = $('.readout .chip', sc), txt = $('.readout .script', sc), count = $('.scrub-count', sc), sCount = $('.stage-count', sc);
    const pad = k => String(k).padStart(2, '0');
    let ci = 0;
    function set(i) {
      ci = (i + n) % n;
      const st = data.steps[ci];
      imgs.forEach((im, k) => im.classList.toggle('on', k === ci));
      film.forEach((b, k) => { b.setAttribute('aria-pressed', k === ci); b.classList.toggle('done', k < ci); });
      chipEl.className = 'chip ' + st.chip; chipEl.textContent = st.chip; txt.textContent = st.text;
      count.textContent = `Attempt ${pad(ci + 1)} of ${pad(n)}`; sCount.textContent = `${pad(ci + 1)} / ${pad(n)}`;
    }
    film.forEach((b, k) => b.addEventListener('click', () => set(k)));
    $('.stage-nav.prev', sc).addEventListener('click', e => { e.stopPropagation(); set(ci - 1); });
    $('.stage-nav.next', sc).addEventListener('click', e => { e.stopPropagation(); set(ci + 1); });
    set(0);
    sc.closest('section').addEventListener('keydown', e => { if (e.key === 'ArrowRight') { set(ci + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { set(ci - 1); e.preventDefault(); } });
    /* swipe or drag the big photo; a plain tap still moves to the next attempt */
    let sw = null, swiped = false;
    stage.addEventListener('pointerdown', e => { if (e.target.closest('.stage-nav')) return; sw = { x: e.clientX, y: e.clientY }; swiped = false; });
    stage.addEventListener('pointerup', e => {
      if (!sw) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; set(ci + (dx < 0 ? 1 : -1)); }
    });
    stage.addEventListener('pointercancel', () => { sw = null; });
    stage.addEventListener('click', e => { if (e.target.closest('.stage-nav')) return; if (swiped) { swiped = false; return; } set(ci + 1); });
  });

  // failure logs
  const jet = '<svg viewBox="0 0 24 24"><path d="M12 2c.8 0 1.3 1.2 1.3 2.6v5.2l8.2 4.7v2.1l-8.2-2.5v4.7l2.4 1.8V22L12 21l-3.7 1v-1.4l2.4-1.8v-4.7l-8.2 2.5v-2.1l8.2-4.7V4.6C10.7 3.2 11.2 2 12 2z"/></svg>';
  $$('[data-log]').forEach(lg => {
    const data = findBlock('log', lg) || { entries: [] };
    const parts = $('.parts', lg), txt = $('.detail p', lg), fleet = $('.fleet', lg);
    fleet.innerHTML = jet + jet + jet;
    data.entries.forEach((e, i) => { const b = document.createElement('button'); b.setAttribute('role', 'tab'); b.textContent = e.part; b.onclick = () => set(i); parts.appendChild(b); });
    function set(i) { $$('button', parts).forEach((b, k) => b.setAttribute('aria-selected', k === i)); txt.textContent = data.entries[i].text; txt.classList.remove('swap'); void txt.offsetWidth; txt.classList.add('swap'); $$('svg', fleet).forEach((s, k) => s.classList.toggle('lost', !!data.entries[i].fleet && k > 0)); }
    set(0); lg._setLog = set; lg._fleetIndex = data.entries.findIndex(e => e.fleet);
  });

  // big quotes → words
  $$('[data-bigquote]').forEach(bq => { bq.innerHTML = bq.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' '); });

  // flips
  $$('.flip').forEach(f => f.addEventListener('click', () => f.setAttribute('aria-pressed', f.getAttribute('aria-pressed') !== 'true')));

  // copy email
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async e => { const t = e.currentTarget, o = t.textContent; try { await navigator.clipboard.writeText(P.email); t.textContent = 'Email copied'; } catch (_) { t.textContent = P.email; } setTimeout(() => t.textContent = o, 2200); }));

  // breaking letters in the finale
  $$('.brk').forEach(brkEl => {
    const brk = $$('.l', brkEl);
    const scatter = () => brk.forEach((l, i) => l.style.transform = `translate(${(i % 2 ? 1 : -1) * (4 + i * 2)}px,${(i % 3 - 1) * 14}px) rotate(${(i % 2 ? 1 : -1) * (8 + i * 3)}deg)`);
    const reset = () => brk.forEach(l => l.style.transform = '');
    brkEl.addEventListener('pointerenter', scatter); brkEl.addEventListener('pointerleave', reset);
    new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting && !reduce) { io.unobserve(e.target); scatter(); setTimeout(reset, 1200); } }), { threshold: .8 }).observe(brkEl);
  });

  // count-ups (stats + altitude)
  const countUp = (el, end, ms, fmt) => { if (reduce) { el.textContent = fmt(end); return; } const t0 = performance.now(); (function tick(t) { const p = Math.min(1, (t - t0) / ms); el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); })(t0); };
  const ioC = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; ioC.unobserve(e.target); countUp(e.target, +e.target.dataset.count, 1400, n => n.toLocaleString('en-US')); }), { threshold: .6 });
  $$('[data-count]').forEach(el => ioC.observe(el));
  if (reduce) $$('[data-count]').forEach(el => { el.textContent = (+el.dataset.count).toLocaleString('en-US'); });   // no count-up: show the figure straight away
  const ioA = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; ioA.unobserve(e.target); const el = $('[data-alt]', e.target); const lg = $('[data-log]', e.target); countUp(el, +el.dataset.alt, 2200, n => n.toLocaleString('en-US')); if (lg && lg._fleetIndex >= 0 && !reduce) setTimeout(() => lg._setLog(lg._fleetIndex), 3000); }), { threshold: .4 });
  $$('.ladakh').forEach(el => ioA.observe(el));

  // work loop
  $$('[data-loop]').forEach(lp => {
    const data = findBlock('loop', lp) || { steps: [] }, n = data.steps.length;
    const nodes = $$('.loop-node', lp), arc = $('.loop-arc', lp), mid = $('.loop-mid b', lp), panel = $('.loop-panel', lp);
    let i = 0, timer = null, touched = false;
    function set(k) {
      i = (k + n) % n; const s = data.steps[i];
      nodes.forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.classList.toggle('done', j < i); });
      arc.style.strokeDasharray = `${i / n + 0.0001} 1`;
      mid.textContent = String(i + 1).padStart(2, '0');
      panel.innerHTML = `<p class="kicker">Step ${i + 1} of ${n}</p><h3>${esc(s.name)}</h3><p class="loop-text">${s.text}</p>${s.tools ? `<p class="loop-tools">${s.tools.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}${s.example ? `<p class="loop-eg">${s.example}</p>` : ''}`;
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    }
    const pick = k => { touched = true; clearInterval(timer); set(k); };
    nodes.forEach((b, j) => b.addEventListener('click', () => pick(j)));
    lp.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { pick(i + 1); nodes[i].focus(); e.preventDefault(); } if (e.key === 'ArrowLeft') { pick(i - 1); nodes[i].focus(); e.preventDefault(); } });
    set(0);
    if (!reduce) new IntersectionObserver(es => es.forEach(e => { clearInterval(timer); if (e.isIntersecting && !touched) timer = setInterval(() => set(i + 1), 3400); }), { threshold: 0.4 }).observe(lp);
  });

  // research map
  $$('[data-research]').forEach(rs => {
    const data = findBlock('research', rs) || { items: [] }, tabs = $$('.rsch-tabs button', rs), panel = $('.rsch-panel', rs);
    function set(k) {
      const it = data.items[k]; if (!it) return;
      tabs.forEach((b, j) => b.setAttribute('aria-selected', j === k));
      panel.innerHTML = `<p class="rsch-q">${it.question}</p><p class="kicker">Where it comes from</p><ul class="rsch-ev">${(it.evidence || []).map(e => { const ci = chapters.findIndex(c => c.id === e.chapter), c = chapters[ci]; return `<li><button type="button" data-ch="${ci}"><b>${c ? esc(c.num) + ' · ' + esc(c.title) : ''}</b><span>${e.text}</span><i aria-hidden="true">→</i></button></li>`; }).join('')}</ul><p class="kicker">What I want to learn</p><p class="rsch-learn">${it.learn || ''}</p>`;
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    }
    tabs.forEach((b, j) => b.addEventListener('click', () => set(j)));
    panel.addEventListener('click', e => { const b = e.target.closest('[data-ch]'); if (b && +b.dataset.ch >= 0) goTo(+b.dataset.ch); });
    set(0);
  });

  // 3D models
  const MV_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  let mvLoading = null;
  const loadMV = () => mvLoading || (mvLoading = new Promise((res, rej) => {
    if (window.customElements && customElements.get('model-viewer')) return res();
    /* the .glb files are meshopt-compressed; the viewer must know where its decoder is before it starts */
    window.ModelViewerElement = Object.assign(window.ModelViewerElement || {}, { meshoptDecoderLocation: 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.22.0/meshopt_decoder.js' });
    const s = document.createElement('script'); s.type = 'module'; s.src = MV_SRC;
    s.onload = () => customElements.whenDefined('model-viewer').then(res); s.onerror = rej; document.head.appendChild(s);
  }));
  const fallbackStatic = fig => {
    fig.classList.add('static'); const ui = $('.m3d-ui', fig); if (ui) ui.remove(); const hint = $('.m3d-hint', fig); if (hint) hint.remove();
    const cap = $('figcaption', fig); if (cap && fig.dataset.stillCaption) cap.textContent = fig.dataset.stillCaption;   // no "explore in 3D" on a still
    if (!$('.m3d-poster', fig) && fig.dataset.poster) $('.m3d-stage', fig).insertAdjacentHTML('afterbegin', `<img class="m3d-poster" src="${esc(fig.dataset.poster)}" alt="${esc(fig.dataset.alt)}">`);
  };
  $$('[data-model]').forEach(fig => {
    const src = fig.dataset.model, stage = $('.m3d-stage', fig);
    if (!src) return fallbackStatic(fig);
    const sameOrigin = !/^https?:/i.test(src) || src.startsWith(location.origin);
    const exists = sameOrigin ? fetch(src, { method: 'HEAD' }).then(r => r.ok).catch(() => false) : Promise.resolve(true);
    exists.then(ok => {
      if (!ok) { console.info('3D model not found, showing the still image instead:', src); return fallbackStatic(fig); }
      new IntersectionObserver((es, io) => es.forEach(e => {
        if (!e.isIntersecting) return; io.disconnect();
        loadMV().then(() => {
          const mv = document.createElement('model-viewer');
          const attrs = { src, alt: fig.dataset.alt || '3D model', poster: fig.dataset.poster || '', 'shadow-intensity': '0.9', exposure: '1.05', 'environment-image': 'neutral',
            'interaction-prompt': 'none', 'touch-action': 'pan-y', ar: '', 'ar-modes': 'webxr scene-viewer quick-look', 'rotation-per-second': '16deg' };
          if (fig.dataset.orbit) attrs['camera-orbit'] = fig.dataset.orbit;
          if (!reduce) attrs['auto-rotate'] = '';
          Object.entries(attrs).forEach(([k, v]) => mv.setAttribute(k, v));
          mv.addEventListener('error', () => { mv.remove(); fallbackStatic(fig); }, { once: true });
          mv.addEventListener('load', () => fig.classList.add('ready'), { once: true });
          const poster = $('.m3d-poster', fig); if (poster) poster.remove();
          stage.prepend(mv);
          const ui = $('.m3d-ui', fig), go = $('.m3d-go', fig), reset = $('.m3d-reset', fig), full = $('.m3d-full', fig), hint = $('.m3d-hint', fig);
          ui.hidden = false;
          /* controls stay off until asked for, so scrolling the page never gets captured by the model */
          go.addEventListener('click', () => {
            const on = go.getAttribute('aria-pressed') !== 'true';
            go.setAttribute('aria-pressed', on); go.textContent = on ? 'Done' : 'Explore in 3D';
            if (on) { mv.setAttribute('camera-controls', ''); mv.removeAttribute('auto-rotate'); } else { mv.removeAttribute('camera-controls'); if (!reduce) mv.setAttribute('auto-rotate', ''); }
            reset.hidden = full.hidden = hint.hidden = !on; fig.classList.toggle('live', on);
          });
          reset.addEventListener('click', () => { mv.cameraOrbit = fig.dataset.orbit || '0deg 75deg 105%'; mv.cameraTarget = 'auto auto auto'; mv.fieldOfView = 'auto'; mv.resetTurntableRotation && mv.resetTurntableRotation(0); });
          full.addEventListener('click', () => { const el = stage; (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); });
        }).catch(() => fallbackStatic(fig));
      }), { rootMargin: '400px 0px' }).observe(fig);
    });
  });

  // lazy video
  $$('[data-video]').forEach(stage => {
    const v = $('video', stage), play = $('.vplay', stage);
    let loaded = false;
    const load = () => { if (loaded) return; loaded = true; v.src = v.dataset.src; v.load(); };
    const tryPlay = () => { load(); const p = v.play(); if (p && p.catch) p.catch(() => stage.classList.add('needs-tap')); };
    play.addEventListener('click', () => { stage.classList.remove('needs-tap'); tryPlay(); });
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (reduce) { load(); stage.classList.add('needs-tap'); } else tryPlay(); }
      else if (!v.paused) v.pause();
    }), { rootMargin: '400px 0px' }).observe(stage);
  });

  // sideways strips: drag with a mouse, arrow buttons and keys, gentle snapping, no accidental "back" swipe at the edges
  let dragMoved = false;
  const dragGuard = e => { if (!dragMoved) return false; e.preventDefault(); e.stopPropagation(); dragMoved = false; return true; };
  $$('.bench-wrap').forEach(w => {
    const strip = $('.bench', w), prev = $('.bench-nav.prev', w), next = $('.bench-nav.next', w);
    $$('img', strip).forEach(i => { i.draggable = false; });
    const stepW = () => { const c = $('.shot', strip); return c ? c.getBoundingClientRect().width + 16 : 240; };
    const go = d => strip.scrollBy({ left: d * stepW(), behavior: reduce ? 'auto' : 'smooth' });
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth - 2, x = strip.scrollLeft;
      prev.disabled = x <= 2; next.disabled = x >= max;
      w.classList.toggle('no-overflow', max <= 0); w.classList.toggle('at-start', x <= 2); w.classList.toggle('at-end', x >= max);
    };
    prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
    strip.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
    strip.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { go(1); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); } });
    let down = null;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = { x: e.clientX, left: strip.scrollLeft }; dragMoved = false; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!dragMoved && Math.abs(dx) > 6) { dragMoved = true; strip.classList.add('dragging'); }
      if (dragMoved) strip.scrollLeft = down.left - dx;
    });
    addEventListener('pointerup', () => { if (!down) return; down = null; strip.classList.remove('dragging'); setTimeout(() => { dragMoved = false; }, 0); });
  });

  // viewer: photos and videos, arrows, keyboard, swipe or drag
  const lb = $('#lb'), lbmedia = $('#lbmedia'), lbcap = $('#lbcap'), lbcount = $('#lbcount');
  const zoomables = []; let lbList = zoomables, li = 0, lastFocus = null;
  const capOf = el => { const fig = el.closest('figure'), c = fig && fig.querySelector('figcaption span, figcaption b'); return c ? c.textContent.trim() : (el.alt || ''); };
  $$('.shot .frame img').forEach(im => {
    const fig = im.closest('figure'), frame = im.closest('.frame');
    if (fig && fig.dataset.gal != null) {
      const list = GAL[+fig.dataset.gal].map(g => ({ src: g.src, video: g.video, poster: g.poster, cap: g.caption || '' }));
      frame.addEventListener('click', e => { if (!dragGuard(e)) openLb(list, 0); });
      return;
    }
    const z = { src: im.getAttribute('src'), cap: capOf(im) }; zoomables.push(z);
    frame.addEventListener('click', e => { if (!dragGuard(e)) openLb(zoomables, zoomables.indexOf(z)); });
  });
  $$('.proj').forEach(p => { const z = { src: p.dataset.zoom, cap: p.dataset.cap }; zoomables.push(z); p.addEventListener('click', () => openLb(zoomables, zoomables.indexOf(z))); });
  $$('.render img').forEach(im => { const z = { src: im.getAttribute('src'), cap: im.alt }; zoomables.push(z); im.style.cursor = 'zoom-in'; im.addEventListener('click', () => openLb(zoomables, zoomables.indexOf(z))); });
  const stopVideos = () => $$('video', lbmedia).forEach(v => v.pause());
  function renderLb() {
    const it = lbList[li];
    stopVideos();
    lbmedia.innerHTML = it.video
      ? `<video src="${esc(it.video)}"${it.poster ? ` poster="${esc(it.poster)}"` : ''} controls playsinline preload="metadata"></video>`
      : `<img src="${esc(it.src)}" alt="${esc(it.cap || '')}" draggable="false">`;
    lbcap.textContent = it.cap || '';
    lbcount.textContent = lbList.length > 1 ? `${li + 1} / ${lbList.length}` : '';
    lb.classList.toggle('single', lbList.length < 2);
    const nx = lbList[(li + 1) % lbList.length];                       // warm the next photo
    if (nx && nx !== it && !nx.video && nx.src) { const pre = new Image(); pre.src = nx.src; }
  }
  function openLb(list, i) { if (i < 0) return; if (!lb.classList.contains('open')) lastFocus = document.activeElement; lbList = list; li = i; renderLb(); lb.classList.add('open'); $('#lbx').focus(); }
  function closeLb() { stopVideos(); lb.classList.remove('open'); lastFocus && lastFocus.focus(); }
  const step = d => { if (lbList.length < 2) return; li = (li + d + lbList.length) % lbList.length; renderLb(); };
  lb.addEventListener('click', e => { if (e.target === lb || e.target.id === 'lbx') closeLb(); });
  $('#lbp').onclick = e => { e.stopPropagation(); step(-1); }; $('#lbn').onclick = e => { e.stopPropagation(); step(1); };
  addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  /* swipe (touch) or drag (mouse) the photo sideways to move through the gallery */
  let sw = null;
  lbmedia.addEventListener('pointerdown', e => { if (lbList.length < 2) return; if (e.target.tagName === 'VIDEO' && e.offsetY > e.target.clientHeight - 56) return; sw = { x: e.clientX, y: e.clientY, on: false }; });
  lbmedia.addEventListener('pointermove', e => {
    if (!sw) return;
    const dx = e.clientX - sw.x;
    if (!sw.on && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - sw.y)) sw.on = true;
    if (sw.on) lbmedia.style.transform = `translateX(${dx}px)`;
  });
  const endSwipe = e => { if (!sw) return; const dx = e.clientX - sw.x, on = sw.on; sw = null; lbmedia.style.transform = ''; if (on && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); };
  lbmedia.addEventListener('pointerup', endSwipe);
  lbmedia.addEventListener('pointercancel', () => { sw = null; lbmedia.style.transform = ''; });

  function findBlock(type, el) {
    // locate the data block that produced this element (by chapter + order of that type)
    const art = el.closest('.chapter'), c = chapters[+art.dataset.index];
    const all = $$(`[data-${type === 'scrubber' ? 'scrub' : type}]`, art);
    const flat = []; (function walk(bs) { bs.forEach(b => { if (b.type === type) flat.push(b); if (b.left) walk(b.left); if (b.right) walk(b.right); }); })(c.blocks || []);
    return flat[all.indexOf(el)];
  }

  /* ---------------------------------------------------------------- HUD state */
  const hud = $('#hud'), feed = $('#feed'), transit = $('#transit');
  /* flight footage behind the HUD: chapter n flies in on clip n (wrapping round); only the clip in use loads, the next is prefetched */
  const TRANSIT = HUD.transitVideos && HUD.transitVideos.length ? HUD.transitVideos : [HUD.transitVideo || 'media/flight.mp4'];
  const clipFor = i => TRANSIT[((i % TRANSIT.length) + TRANSIT.length) % TRANSIT.length];
  const posterFor = src => src.replace(/\.mp4$/i, '.jpg');
  let transitSrc = null, transitIdx = 0;
  const prefetched = new Set();
  function loadTransit(i = transitIdx) {
    if (reduce) return;
    const src = clipFor(i);
    if (src === transitSrc) return;
    transitSrc = src;
    if (TRANSIT.length > 1) transit.poster = posterFor(src);        // first frame shows instantly, so a clip change never flashes
    transit.src = src; transit.load();
  }
  function prefetchClip(i) {
    const src = clipFor(i);
    if (reduce || src === transitSrc || prefetched.has(src)) return;
    prefetched.add(src);
    const l = document.createElement('link'); l.rel = 'prefetch'; l.as = 'video'; l.href = src; document.head.appendChild(l);
  }
  function setTransit(on, i) {
    if (i != null) transitIdx = i;
    transit.classList.toggle('on', on);
    if (on) { loadTransit(transitIdx); prefetchClip(transitIdx + 1); const p = transit.play(); if (p && p.catch) p.catch(() => {}); }
    else if (!transit.paused) transit.pause();
  }
  const H = { volt: $('[data-hud=volt]'), bat: $('[data-hud=bat]'), time: $('[data-hud=time]'), wp: $('[data-hud=wp]'), name: $('[data-hud=name]'), dist: $('[data-hud=dist]'), msg: $('[data-hud=msg]'), horizon: $('[data-hud=horizon]') };
  const navBtns = $$('.hud-nav button');
  let goggles = false;
  function setGoggles(on) { if (goggles === on) return; goggles = on; document.body.classList.toggle('in-goggles', on); hud.classList.toggle('show', on); if (!on) setTransit(false); }
  const isLight = el => /\bon-paper\b/.test(el.className);   // every theme is dark now; kept for a future light section
  function setHudTheme(el) { hud.classList.toggle('light', isLight(el)); }
  function setWP(i) {
    const c = chapters[i]; if (!c) return;
    H.wp.textContent = `WP ${c.num}/${String(chapters.length - 1).padStart(2, '0')}`; H.name.textContent = c.title.toUpperCase();
    navBtns.forEach((b, k) => b.classList.toggle('here', k === i));
  }
  function setJourney(p) {
    const secs = p * (HUD.flightSeconds || 3273); H.time.textContent = fmtTime(secs);
    const v = HUD.voltageStart + (HUD.voltageEnd - HUD.voltageStart) * p; H.volt.textContent = v.toFixed(1) + 'V';
    const frac = (v - HUD.voltageEnd + 0.4) / (HUD.voltageStart - HUD.voltageEnd + 0.4); H.bat.style.width = Math.max(6, Math.min(100, frac * 100)) + '%';
    hud.classList.toggle('low', p > 0.9);
  }
  function stageMsg(list, p, from, to) {
    if (p < from || p > to) { H.msg.textContent = ''; H.msg.classList.remove('on'); return; }
    const idx = Math.min(list.length - 1, Math.floor((p - from) / (to - from) * list.length));
    H.msg.textContent = list[idx]; H.msg.classList.add('on');
  }

  /* ---------------------------------------------------------------- 5. scroll scenes */
  const hasGSAP = window.gsap && window.ScrollTrigger;
  const canvas = $('#gl');
  const gl = (!reduce && window.HeroGL) ? HeroGL.create(canvas, D.hero) : null;
  const heroImg = $('#hero-img');
  if (!gl) { canvas.remove(); heroImg.src = D.hero.image; heroImg.hidden = false; heroImg.style.transformOrigin = `${D.hero.lens[0] * 100}% ${D.hero.lens[1] * 100}%`; }
  const glSet = o => gl && gl.set(o);
  const glActive = b => { if (gl) gl.setActive(b); else heroImg.style.visibility = b ? 'visible' : 'hidden'; };

  if (hasGSAP && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('motion');
    const heroEl = $('#hero'), heroUI = $('.hero-ui'), heroWords = $$('#hero h1 .w');
    const enterTexts = HUD.enterText || ['NO SIGNAL', 'LINK OK'], exitTexts = HUD.exitText || ['LANDED'];

    /* HERO: zoom into the lens, then switch the HUD on */
    ScrollTrigger.create({
      trigger: '#hero-space', start: 'top top', end: 'bottom bottom', scrub: 0.4,
      onEnterBack: () => { glActive(true); heroEl.style.visibility = 'visible'; },
      onLeave: () => { glActive(false); heroEl.style.visibility = 'hidden'; },
      onUpdate: self => {
        const p = self.progress;
        if (gl) gl.enter(p);
        else { const z = Math.pow(gsap.utils.clamp(0, 1, (p - 0.1) / 0.7), 3); heroImg.style.transform = `scale(${1 + z * 15})`; heroImg.style.filter = `brightness(${1 - gsap.utils.clamp(0, 1, (p - 0.8) / 0.15)})`; }
        const uiOp = gsap.utils.clamp(0, 1, 1 - (p - 0.04) / 0.18);
        heroUI.style.opacity = uiOp; heroUI.style.visibility = uiOp < 0.02 ? 'hidden' : 'visible';   // faded buttons must not catch clicks
        heroUI.style.transform = `translateY(${-p * 80}px)`;
        stageMsg(enterTexts, p, 0.86, 0.99);
        if (p > 0.3) loadTransit(0);
        setGoggles(p > 0.9);
        if (p > 0.9) setTransit(true, 0);
      }
    });

    /* ASSEMBLY drawings: frame first, then each part mates, then one shape is weighed against another */
    function setupAssembly(sec) {
      const q = s => $$(s, sec), frame = $('.as-frame rect', sec), steps = q('.as-steps li');
      const len = frame.getTotalLength ? frame.getTotalLength() : 600;
      gsap.set(frame, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set($('.as-frame .as-label', sec), { opacity: 0 });
      gsap.set($('.as-fc', sec), { y: -60, opacity: 0 });
      gsap.set(q('.as-beam'), { x: 70, opacity: 0.3 }); gsap.set(q('.as-motor'), { x: 140, opacity: 0.3 }); gsap.set(q('.as-prop'), { x: 210, opacity: 0.25 });
      gsap.set(q('.as-alt'), { opacity: 0 }); gsap.set(q('.as-l3'), { opacity: 0 });
      gsap.set(q('.as-ring'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
      const setStep = p => { const k = p < 0.3 ? 0 : p < 0.66 ? 1 : 2; steps.forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', j < k); }); };
      setStep(0);
      gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: mobile ? '+=140%' : '+=180%', pin: true, scrub: 0.5, onUpdate: s => setStep(s.progress) } })
        .to(frame, { strokeDashoffset: 0, duration: 0.16, ease: 'none' }, 0.02)
        .to($('.as-frame .as-label', sec), { opacity: 1, duration: 0.05 }, 0.12)
        .to($('.as-fc', sec), { y: 0, opacity: 1, duration: 0.08 }, 0.18)
        .to(q('.as-beam'), { x: 0, opacity: 1, duration: 0.1, stagger: 0.025 }, 0.32)
        .to(q('.as-ring.r1'), { opacity: 1, scale: 1, duration: 0.03, stagger: 0.025 }, 0.38)
        .to(q('.as-ring.r1'), { opacity: 0, duration: 0.04, stagger: 0.025 }, 0.42)
        .to(q('.as-motor'), { x: 0, opacity: 1, duration: 0.08, stagger: 0.02 }, 0.45)
        .to(q('.as-prop'), { x: 0, opacity: 1, duration: 0.08, stagger: 0.02 }, 0.52)
        .to(q('.as-ring.r2'), { opacity: 1, scale: 1, duration: 0.03, stagger: 0.02 }, 0.56)
        .to(q('.as-ring.r2'), { opacity: 0, duration: 0.04, stagger: 0.02 }, 0.6)
        .to(q('.as-mate'), { opacity: 0, duration: 0.06 }, 0.58)
        .to(q('.as-alt'), { opacity: 0.95, duration: 0.06 }, 0.7)
        .to(q('.as-l3'), { opacity: 1, duration: 0.05 }, 0.72)
        .to(q('.as-beam .as-label, .as-motor .as-label, .as-prop .as-label, .as-frame .as-label'), { opacity: 0, duration: 0.05 }, 0.68)
        .to($('.as-arm.hl .as-beam path', sec), { stroke: '#FF5A1F', duration: 0.05 }, 0.76)
        .to(q('.as-alt'), { opacity: 0.25, duration: 0.08 }, 0.88)
        .to($('.as-other', sec), { opacity: 0.35, duration: 0.08 }, 0.88)
        .to(q('.as-blades'), { rotation: 720, transformOrigin: '50% 50%', duration: 0.32, ease: 'none' }, 0.66);
    }

    /* CHAPTERS: each waypoint flies in */
    const chapterST = [];
    $$('.chapter').forEach((art, i) => {
      const wp = $('.wp', art), card = $('.wp-card', art), pic = $('.wp-card img', art), tag = $('.wp-tag', art), tx = $('.wp-tx', art);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wp, start: 'top top', end: mobile ? '+=110%' : '+=140%', pin: true, scrub: 0.5,
          onToggle: s => { setTransit(s.isActive || false, i); if (!s.isActive) hud.classList.remove('cruise'); },
          onUpdate: s => { if (!s.isActive) return; hud.classList.toggle('cruise', s.progress < 0.6); H.dist.textContent = s.progress >= 0.999 ? 'ON WP' : `DIST ${String(Math.round((1 - Math.min(1, s.progress / 0.62)) * 1200)).padStart(4, ' ')} m`; }
        }
      });
      chapterST.push(tl.scrollTrigger);
      tl.fromTo(card, { scale: 0.08, yPercent: 26, opacity: 0, borderRadius: '24px' }, { scale: 1, yPercent: 0, opacity: 1, borderRadius: '0px', ease: 'power2.in', duration: 0.62 }, 0);
      if (pic) tl.fromTo(pic, { scale: 1.3 }, { scale: 1, ease: 'power2.in', duration: 0.62 }, 0);
      gsap.set(tag, { xPercent: -50, yPercent: -50, y: 96 });
      tl.fromTo(tag, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.06 }, 0)
        .to(tag, { opacity: 0, y: 40, duration: 0.12 }, 0.42);
      tl.fromTo(tx, mobile ? { yPercent: 110 } : { xPercent: 105 }, mobile ? { yPercent: 0, ease: 'power3.out', duration: 0.28 } : { xPercent: 0, ease: 'power3.out', duration: 0.28 }, 0.6);
      tl.from($$('.wp-tx > div > *', art), { y: 26, opacity: 0, stagger: 0.03, duration: 0.25 }, 0.68);
      tl.to({}, { duration: 0.12 });
      ScrollTrigger.create({ trigger: art, start: 'top 55%', end: 'bottom 55%', onToggle: s => { if (s.isActive) setWP(i); } });
      $$('.assembly', art).forEach(setupAssembly);
      ScrollTrigger.create({ trigger: wp, start: 'top bottom', end: 'bottom top', onToggle: s => setTransit(s.isActive, i) });
    });

    /* HUD colour follows the section under the crosshair */
    $$('.wp, .blk').forEach(sec => ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => { if (s.isActive) setHudTheme(sec); } }));

    /* journey progress → timer + battery */
    ScrollTrigger.create({ trigger: '#journey', start: 'top bottom', end: 'bottom bottom', onUpdate: s => setJourney(s.progress) });

    /* horizon tilt from scroll velocity */
    const tiltTo = gsap.quickTo(H.horizon, 'rotate', { duration: 0.5, ease: 'power2.out' });
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => tiltTo(gsap.utils.clamp(-7, 7, s.getVelocity() / 500)) });
    ScrollTrigger.addEventListener('scrollEnd', () => tiltTo(0));

    /* nav: land where the cover and its text are fully in */
    goTo = i => { const st = chapterST[i]; if (st) window.scrollTo({ top: Math.round(st.start + (st.end - st.start) * 0.97), behavior: 'auto' }); };
    navBtns.forEach((b, i) => b.addEventListener('click', () => goTo(i)));

    /* EXIT: pull back out of the goggles */
    const exitTx = $('.exit-tx');
    /* the exit mirrors the entrance, still seen through the goggles:
       0–0.22  the feed keeps flying (LOW BATTERY → RTH → LANDED), battery blinking
       0.22–0.3 feed cuts, DISARMED, the view turns back from the screens to the eyecups
       0.3–1   goggles off: out through the eyecup and back across the photo */
    const EXIT_FEED = 0.22, EXIT_HUD = 0.3;
    ScrollTrigger.create({
      trigger: '#exit', start: 'top top', end: '+=300%', pin: true, scrub: 0.4,
      onEnter: () => glActive(true),                             /* onUpdate sets the full GL state */
      onLeaveBack: () => { glActive(false); setTransit(false); },
      onUpdate: self => {
        const p = self.progress;
        if (gl) gl.exit(p);
        else { const z = Math.pow(1 - gsap.utils.clamp(0, 1, (p - 0.3) / 0.6), 3); heroImg.style.transform = `scale(${1 + z * 15})`; heroImg.style.filter = `brightness(${gsap.utils.clamp(0, 1, (p - 0.3) / 0.2)})`; }
        setGoggles(p < EXIT_HUD);
        setTransit(p < EXIT_FEED && goggles, chapters.length);    // the next clip in the rotation flies us home
        stageMsg(exitTexts, p, 0, EXIT_HUD - 0.02);
        hud.classList.toggle('low', p < EXIT_HUD);
        exitTx.style.opacity = gsap.utils.clamp(0, 1, (p - 0.8) / 0.15);
      }
    });

    /* reveals */
    ScrollTrigger.batch('.rv', { start: 'top 88%', onEnter: els => {
      gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', overwrite: 'auto' });
      els.forEach((el, k) => {                                    // photos wipe open and settle; chips pop in after
        el.style.setProperty('--d', (k * 0.08) + 's'); el.classList.add('in');
        const im = el.matches('.shot') && $('.frame img', el);
        if (im) gsap.fromTo(im, { scale: 1.18 }, { scale: 1, duration: 1.3, delay: k * 0.08, ease: 'power3.out', clearProps: 'transform' });
      });
    } });

    /* section headings rise out of a mask */
    $$('.blk h2').forEach(h2 => {
      const s = document.createElement('span'); s.className = 'h2-in';
      while (h2.firstChild) s.appendChild(h2.firstChild);
      h2.appendChild(s); h2.classList.add('h2-mask');
      gsap.from(s, { yPercent: 105, duration: 0.9, ease: 'power4.out', scrollTrigger: { trigger: h2, start: 'top 92%', once: true } });
    });

    /* project cards lean toward the pointer */
    if (matchMedia('(hover: hover)').matches) $$('.proj').forEach(el => {
      gsap.set(el, { transformPerspective: 800 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2.out' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 10); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    $$('.process').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 75%', onEnter: () => el.classList.add('in') }));
    $$('[data-bigquote]').forEach(q => { const ws = $$('.w', q); ScrollTrigger.create({ trigger: q, start: 'top 85%', end: 'bottom 45%', onUpdate: s => { const n = Math.round(s.progress * ws.length); ws.forEach((w, k) => w.classList.toggle('lit', k < n)); } }); });

    addEventListener('load', () => ScrollTrigger.refresh());
    if (gl) gl.ready.then(() => ScrollTrigger.refresh());
  } else {
    /* ------------------------------------------------------------ 6. reduced motion / no GSAP: plain scroll */
    document.documentElement.classList.add('reduce');
    if (gl) gl.set({ motion: false });
    $$('.rv').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.process').forEach(el => el.classList.add('in'));
    $$('[data-bigquote] .w').forEach(w => w.classList.add('lit'));
    navBtns.forEach((b, i) => b.addEventListener('click', () => $$('.chapter')[i].scrollIntoView()));
    const ioWP = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setWP(+e.target.dataset.index); }), { rootMargin: '-45% 0px -45% 0px' });
    $$('.chapter').forEach(a => ioWP.observe(a));
    const ioTheme = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setHudTheme(e.target); }), { rootMargin: '-50% 0px -50% 0px' });
    $$('.wp, .blk').forEach(a => ioTheme.observe(a));
    const onScroll = () => {
      const j = journey.getBoundingClientRect(), top = scrollY + j.top, hgt = journey.offsetHeight;
      const p = gsapless(0, 1, (scrollY + innerHeight * 0.5 - top) / hgt);
      setGoggles(p > 0 && p < 1); setJourney(p); H.dist.textContent = 'ON WP';
    };
    const gsapless = (a, b, v) => Math.max(a, Math.min(b, v));
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();

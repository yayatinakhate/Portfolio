/* fx.js — the visible design layer on top of app.js. Runs only when motion is on.
   1. progress line across the top
   2. a big outlined title band after every chapter cover, driven by scroll speed
   3. an FPV-style ring that follows the pointer and grows over anything clickable
   4. photos drift slightly as they cross the screen */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('motion') || !window.gsap || !window.ScrollTrigger) return;
  var D = window.PORTFOLIO, chapters = (D && D.chapters) || [];
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* 1. progress line */
  var prog = document.createElement('div'); prog.id = 'prog'; prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) { prog.style.transform = 'scaleX(' + s.progress + ')'; } });

  /* 2. title bands */
  var bands = [];
  $$('.chapter').forEach(function (art, i) {
    var c = chapters[i]; if (!c) return;
    var wp = art.querySelector('.wp'); if (!wp) return;
    var after = wp.parentElement.classList.contains('pin-spacer') ? wp.parentElement : wp;
    var words = [c.num + ' ' + c.title, c.role || '', (c.methods || []).join(' · ')].filter(Boolean);
    var band = document.createElement('div'); band.className = 'mq'; band.setAttribute('aria-hidden', 'true');
    var track = document.createElement('div'); track.className = 'mq-track';
    for (var r = 0; r < 4; r++) words.forEach(function (w, k) {
      var s = document.createElement('span'); s.textContent = w; if (k === 0) s.className = 'f';
      track.appendChild(s);
      var d = document.createElement('i'); d.textContent = '◆'; track.appendChild(d);
    });
    band.appendChild(track); after.insertAdjacentElement('afterend', band);
    bands.push({ el: band, track: track, x: 0, dir: i % 2 ? 1 : -1, w: 0, on: false });
  });
  var measure = function () { bands.forEach(function (b) { b.w = b.track.scrollWidth / 4; }); };
  measure(); window.addEventListener('resize', measure);
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var b = bands.find(function (x) { return x.el === e.target; }); if (b) b.on = e.isIntersecting; }); }, { rootMargin: '100px 0px' });
  bands.forEach(function (b) { io.observe(b.el); });
  var vel = 0, lastY = window.scrollY;
  gsap.ticker.add(function (t, dtMs) {
    var y = window.scrollY, dt = Math.min(dtMs, 100) / 1000;
    vel += ((y - lastY) / Math.max(dt, 0.016) - vel) * (1 - Math.exp(-dt * 8)); lastY = y;   // time-based easing, so slow frame rates settle just as fast
    bands.forEach(function (b) {
      if (!b.on || !b.w) return;
      b.x += b.dir * (40 + Math.min(900, Math.abs(vel)) * 0.9) * dt * (vel < -20 ? -1 : 1);
      b.x = ((b.x % b.w) + b.w) % b.w;
      b.track.style.transform = 'translate3d(' + (-b.x) + 'px,0,0) skewX(' + Math.max(-8, Math.min(8, vel / 250)) + 'deg)';
    });
  });

  /* 3. pointer ring */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cur = document.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    var cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' }), cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cx(e.clientX); cy(e.clientY); cur.classList.add('on');
      var hot = e.target.closest && e.target.closest('a, button, .frame, .stage, model-viewer, .bench');
      cur.classList.toggle('hot', !!hot);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
  }

  /* 4. photo drift: the frame holds still, the wrapper figure slides a little */
  $$('.strip .shot, .mosaic .shot').forEach(function (fig, k) {
    gsap.fromTo(fig, { yPercent: 0 }, { yPercent: (k % 2 ? -6 : -12), ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  });

  ScrollTrigger.refresh();
})();

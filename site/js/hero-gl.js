/* hero-gl.js — the hero photo as a cel-shaded, depth-parallax illustration, with a
   drone-like camera that flies across the scene to the goggles, passes through the
   faceplate, turns 180° inside to face the screens, and dives into one.
   Plain WebGL1, one quad, one fragment shader. No dependencies.

   API: const h = HeroGL.create(canvas, cfg); await h.ready; h.enter(p); h.exit(p); h.setActive(bool)
   cfg = { image, depth?, lens:[x,y], figure:[cx,cy,rx,ry], toon?: { levels, edge, saturation, strength } } */
window.HeroGL = (function () {
  const VS = `attribute vec2 p; varying vec2 v;
    void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

  const FS = `precision mediump float;
    varying vec2 v;
    uniform sampler2D uTex, uDepth;
    uniform vec2 uRes, uImg, uCenter, uPivot, uOff;
    uniform vec4 uFig;           /* figure ellipse: centre x, centre y (GL), width, height */
    uniform float uSlim;
    uniform float uZoom, uRoll, uPar, uShake, uTime;
    uniform float uToon, uEdge, uLevels, uSat, uGrain, uGlitch, uAber;
    uniform float uInside, uYaw, uBoot, uDive;
    uniform float uIris, uDark, uNoise;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
    vec3 tap(vec2 uv){ return texture2D(uTex, clamp(uv, 0.002, 0.998)).rgb; }

    /* ---- the photograph, cel-shaded ---- */
    vec3 photo(vec2 uv, vec2 texel, float depth){
      /* soften first: the source is small and noisy */
      vec2 bo = texel * 1.4;
      vec3 c = tap(uv)*0.28 + (tap(uv+vec2(bo.x,0.0)) + tap(uv-vec2(bo.x,0.0)) + tap(uv+vec2(0.0,bo.y)) + tap(uv-vec2(0.0,bo.y)))*0.12
             + (tap(uv+bo) + tap(uv-bo) + tap(uv+vec2(bo.x,-bo.y)) + tap(uv+vec2(-bo.x,bo.y)))*0.06;
      /* colour fringing from the lens */
      vec2 dir = (uv - uCenter) * uAber;
      c.r = mix(c.r, tap(uv + dir).r, 0.6); c.b = mix(c.b, tap(uv - dir).b, 0.6);
      /* ink edges: Sobel on luminance */
      vec2 e = texel * 2.0;
      float tl = lum(tap(uv+vec2(-e.x, e.y))), t = lum(tap(uv+vec2(0.0, e.y))), tr = lum(tap(uv+vec2(e.x, e.y)));
      float l  = lum(tap(uv+vec2(-e.x, 0.0))),                                   r  = lum(tap(uv+vec2(e.x, 0.0)));
      float bl = lum(tap(uv+vec2(-e.x,-e.y))), b = lum(tap(uv+vec2(0.0,-e.y))), br = lum(tap(uv+vec2(e.x,-e.y)));
      float gx = (tr + 2.0*r + br) - (tl + 2.0*l + bl), gy = (tl + 2.0*t + tr) - (bl + 2.0*b + br);
      float figure = smoothstep(0.45, 0.8, depth);                       /* 1 on her, 0 on the ground */
      float edge = smoothstep(0.22, 0.55, length(vec2(gx, gy)) * uEdge) * mix(0.18, 1.0, figure);
      /* flat colour bands that keep the hue */
      float L = lum(c);
      float Lq = floor(L * uLevels + 0.5) / uLevels;
      vec3 banded = c * (mix(L, Lq, mix(0.45, 0.85, figure)) / max(L, 0.02));
      banded = mix(vec3(lum(banded)), banded, uSat);
      banded = (banded - 0.5) * 1.12 + 0.5;
      banded *= vec3(1.04, 1.0, 0.95);
      vec3 toon = banded * (1.0 - edge * 0.8);
      return mix(c, toon, uToon);
    }

    /* ---- inside the goggles: an analytic box, screens on the front wall, eyecups on the back ---- */
    vec3 interior(vec2 sc, float time){
      vec3 rd = normalize(vec3(sc.x, sc.y, 1.15));
      float cy = cos(uYaw), sy = sin(uYaw);
      rd = vec3(rd.x*cy + rd.z*sy, rd.y, -rd.x*sy + rd.z*cy);
      vec3 ro = vec3(-0.42*uDive, 0.0, -0.36*uDive);               /* the dive moves toward the left screen */
      vec3 bmin = vec3(-1.0, -0.6, -0.5), bmax = vec3(1.0, 0.6, 0.5);
      vec3 tv = (mix(bmin, bmax, step(0.0, rd)) - ro) / rd;
      float tt = min(min(tv.x, tv.y), tv.z);
      vec3 p = ro + rd * tt;
      vec3 col = vec3(0.045, 0.042, 0.05) * (0.8 + 0.4*hash(floor(p.xy*30.0 + p.zz*30.0)));
      vec2 sL = vec2(-0.45, 0.0), sR = vec2(0.45, 0.0);
      float glow = uBoot * 0.5 / (1.0 + 5.0*min(distance(p.xy, sL), distance(p.xy, sR)) + 3.0*abs(p.z + 0.5));
      col += vec3(0.08, 0.2, 0.17) * glow;
      if (tt == tv.z && rd.z < 0.0) {                               /* front wall: the two screens */
        float r = min(distance(p.xy, sL), distance(p.xy, sR));
        vec2 q = (distance(p.xy, sL) < distance(p.xy, sR)) ? p.xy - sL : p.xy - sR;
        float bezel = smoothstep(0.36, 0.33, r) * smoothstep(0.29, 0.31, r);
        col = mix(col, vec3(0.16, 0.16, 0.18), bezel);
        if (r < 0.30) {
          float st = 0.55 + 0.45*hash(floor(q*90.0) + floor(time*24.0));
          vec3 scr = vec3(0.02, 0.05, 0.05) + vec3(0.22, 0.62, 0.52) * st * uBoot;
          scr *= 1.0 - 0.28*step(0.5, fract(q.y*110.0));
          scr += vec3(0.4) * pow(max(0.0, 1.0 - length(q - vec2(-0.1, 0.1))/0.18), 2.0) * 0.25;
          col = scr;
        }
      } else if (tt == tv.z && rd.z > 0.0) {                        /* back wall: the eyecups */
        float r = min(distance(p.xy, sL), distance(p.xy, sR));
        float foam = smoothstep(0.42, 0.38, r) * smoothstep(0.30, 0.33, r);
        col = mix(col, vec3(0.17, 0.16, 0.16) * (0.8 + 0.4*hash(floor(p.xy*60.0))), foam);
        if (r < 0.31) col = vec3(0.09, 0.06, 0.045) * (1.0 - r/0.31) * 0.8;
        float nose = step(abs(p.x), 0.14 + (p.y + 0.15)*0.8) * step(p.y, -0.15);
        col = mix(col, vec3(0.0), nose);
      }
      return col;
    }

    void main(){
      vec2 frag = v * uRes;
      float scl = max(uRes.x/uImg.x, uRes.y/uImg.y);
      vec2 disp = uImg * scl;
      vec2 uv0 = (frag - (uRes - disp)*0.5) / disp;
      float asp = uImg.x/uImg.y;
      vec2 texel = 1.0 / uImg;

      /* camera: look at the pivot, bank, zoom, hand-held shake */
      vec2 s = (uv0 - uPivot) * vec2(asp, 1.0);
      float cr = cos(uRoll), sr = sin(uRoll);
      s = vec2(s.x*cr - s.y*sr, s.x*sr + s.y*cr) / uZoom;
      s += (vec2(hash(vec2(floor(uTime*28.0), 1.0)), hash(vec2(2.0, floor(uTime*28.0)))) - 0.5) * uShake;
      vec2 uv = uPivot + s / vec2(asp, 1.0);
      /* slim: squeeze the figure horizontally toward its centre line; flat across the body, easing out into the background */
      vec2 fr = (uv - uFig.xy) / (uFig.zw * vec2(1.0, 0.575));
      float fw = 1.0 - smoothstep(0.4, 1.0, length(fr));
      uv.x = uFig.x + (uv.x - uFig.x) * (1.0 + uSlim * fw);
      float d = texture2D(uDepth, clamp(uv, 0.0, 1.0)).r;
      uv += uOff * (d - 0.45) * uPar / sqrt(uZoom);
      float row = floor(v.y * 24.0);
      float slice = step(1.0 - uGlitch * 0.35, hash(vec2(row, floor(uTime * 6.0)))) * uGlitch;
      uv.x += (hash(vec2(row, 7.0)) - 0.5) * 0.08 * slice;

      vec3 col = photo(uv, texel, d);
      float outside = step(0.0, -uv.x) + step(1.0, uv.x) + step(0.0, -uv.y) + step(1.0, uv.y);
      col = mix(col, vec3(0.02), min(1.0, outside));

      if (uInside > 0.0) {
        vec2 sc = (v - 0.5) * vec2(uRes.x/uRes.y, 1.0) * 1.3;
        col = mix(col, interior(sc, uTime), uInside);
      }

      float gr = hash(v * uRes + fract(uTime * 13.0) * 100.0) - 0.5;
      col += gr * uGrain * (0.6 + 0.4 * (1.0 - dot(col, vec3(0.33))));

      vec2 aspS = vec2(uRes.x/uRes.y, 1.0);
      vec2 cs = mix((uPivot*disp + (uRes-disp)*0.5) / uRes, vec2(0.5), uInside);
      float r = length((v - cs) * aspS);
      float iris = smoothstep(uIris*0.75, uIris*1.35 + 0.03, r);
      col *= 1.0 - iris*0.97;
      col *= 1.0 - 0.3*smoothstep(0.55, 1.15, length((v-0.5)*aspS));

      float n = hash(floor(v*uRes/2.0) + fract(uTime*9.0)*vec2(13.0,7.0));
      float band = 0.85 + 0.15*step(0.5, fract(v.y*uRes.y/3.0));
      col = mix(col, vec3(0.0), uDark);
      col = mix(col, vec3(n*band), uNoise);
      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(gl, type, src) {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }

  function proceduralDepth(w, h, fig) {
    const W = 256, H = Math.max(64, Math.round(256 * h / w));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#141414'); g.addColorStop(0.28, '#2a2a2a'); g.addColorStop(1, '#c8c8c8');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const [fx, fy, rx, ry] = fig || [0.5, 0.6, 0.3, 0.8];
    x.save(); x.translate(fx * W, fy * H); x.scale(rx * W * 0.5, ry * H * 0.5);
    const rg = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    rg.addColorStop(0, 'rgba(250,250,250,1)'); rg.addColorStop(0.55, 'rgba(225,225,225,0.95)'); rg.addColorStop(1, 'rgba(200,200,200,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill(); x.restore();
    return c;
  }

  /* cubic Bézier helpers for the flight path */
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const bezD = (a, b, c, d, t) => { const u = 1 - t; return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c); };

  function create(canvas, cfg) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    const prog = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VS), fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return null; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ['uTex', 'uDepth', 'uRes', 'uImg', 'uCenter', 'uPivot', 'uOff', 'uZoom', 'uRoll', 'uPar', 'uShake', 'uTime', 'uToon', 'uEdge', 'uLevels', 'uSat', 'uGrain', 'uGlitch', 'uAber', 'uInside', 'uYaw', 'uBoot', 'uDive', 'uIris', 'uDark', 'uNoise', 'uFig', 'uSlim']
      .forEach(n => U[n] = gl.getUniformLocation(prog, n));

    function tex(unit, src) {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }

    const lens = cfg.lens || [0.5, 0.5];
    const FIG = cfg.figure || [0.5, 0.6, 0.3, 0.8];
    const slimPct = Math.max(0, Math.min(0.25, cfg.slim || 0));     /* fraction narrower, capped at 25% */
    const SLIM = slimPct > 0 ? 1 / (1 - slimPct) - 1 : 0;              /* sampling stretch that gives that narrowing */
    /* the same squeeze in JS, so the camera still lands exactly on the goggles */
    const slimW = (px, py) => { const r = Math.hypot((px - FIG[0]) / (FIG[2] * 1.0), (py - FIG[1]) / (FIG[3] * 0.575)); const t = Math.max(0, Math.min(1, (r - 0.4) / 0.6)); return 1 - t * t * (3 - 2 * t); };
    const unslim = (px, py) => FIG[0] + (px - FIG[0]) / (1 + SLIM * slimW(px, py));
    const toonCfg = Object.assign({ levels: 6, edge: 1.0, saturation: 1.35, strength: 1.0 }, cfg.toon || {});
    const state = {
      zoom: 1, pivot: [0.5, 0.52], roll: 0, par: 0.05, shake: 0, grain: 0.06, aber: 0.004,
      inside: 0, yaw: 0, boot: 0, dive: 0, iris: 2.5, dark: 0, noise: 0, flightOff: [0, 0],
      active: true, motion: true
    };
    let imgW = 1, imgH = 1, ready = false, raf = 0, nextGlitch = 2.5, glitchUntil = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, last: 0 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }

    function frame(t) {
      raf = 0;
      if (!ready || !state.active) return;
      resize();
      const time = t / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      const idle = Math.min(1, (performance.now() - mouse.last) / 2500);
      const sway = state.motion ? idle * 0.5 : 0;
      if (state.motion && time > nextGlitch) { glitchUntil = time + 0.14; nextGlitch = time + 3 + Math.random() * 4; }
      const glitch = time < glitchUntil ? 1 : 0;
      const ox = mouse.x * 0.9 + Math.sin(time * 0.55) * sway + state.flightOff[0];
      const oy = mouse.y * 0.9 + Math.cos(time * 0.41) * sway * 0.7 + state.flightOff[1];
      const breath = state.motion ? 1 + Math.sin(time * 0.8) * 0.01 + Math.sin(time * 0.13) * 0.015 : 1;
      gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform2f(U.uImg, imgW, imgH);
      gl.uniform2f(U.uCenter, lens[0], 1 - lens[1]); gl.uniform2f(U.uPivot, state.pivot[0], 1 - state.pivot[1]); gl.uniform2f(U.uOff, ox, oy);
      gl.uniform1f(U.uZoom, state.zoom * breath); gl.uniform1f(U.uRoll, state.roll + (state.motion ? Math.sin(time * 0.3) * 0.004 : 0));
      gl.uniform1f(U.uPar, state.par); gl.uniform1f(U.uShake, state.motion ? state.shake : 0); gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uToon, toonCfg.strength); gl.uniform1f(U.uEdge, toonCfg.edge); gl.uniform1f(U.uLevels, toonCfg.levels); gl.uniform1f(U.uSat, toonCfg.saturation);
      gl.uniform1f(U.uGrain, state.grain); gl.uniform1f(U.uGlitch, glitch); gl.uniform1f(U.uAber, state.aber * Math.min(3, state.zoom));
      gl.uniform1f(U.uInside, state.inside); gl.uniform1f(U.uYaw, state.yaw); gl.uniform1f(U.uBoot, state.boot); gl.uniform1f(U.uDive, state.dive);
      gl.uniform1f(U.uIris, state.iris); gl.uniform1f(U.uDark, state.dark); gl.uniform1f(U.uNoise, state.noise);
      gl.uniform4f(U.uFig, FIG[0], 1 - FIG[1], FIG[2], FIG[3]); gl.uniform1f(U.uSlim, SLIM);
      gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uDepth, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (state.motion || state.noise > 0 || state.grain > 0) schedule();
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      mouse.tx = (e.clientX / innerWidth - 0.5) * 2; mouse.ty = -(e.clientY / innerHeight - 0.5) * 2; mouse.last = performance.now(); schedule();
    }, { passive: true });
    addEventListener('resize', () => { resize(); schedule(); });

    const C = x => Math.max(0, Math.min(1, x)), sm = x => x * x * (3 - 2 * x);
    /* flight path over the photo: wide on her, swing low-left, bank right, settle on the goggles */
    const P = [[0.5, 0.52], [0.3, 0.66], [0.72, 0.4], lens];
    function flight(f, dir) {
      const x = bez(P[0][0], P[1][0], P[2][0], P[3][0], f), y = bez(P[0][1], P[1][1], P[2][1], P[3][1], f);
      const dx = bezD(P[0][0], P[1][0], P[2][0], P[3][0], f), dy = bezD(P[0][1], P[1][1], P[2][1], P[3][1], f);
      state.pivot = [unslim(x, y), y];
      state.roll = Math.max(-0.16, Math.min(0.16, -dx * 0.22 * dir)) * Math.sin(Math.PI * f);
      state.flightOff = [dx * 0.9 * dir, -dy * 0.6 * dir];
    }
    /* one timeline, used forwards for the hero and backwards for the exit.
       q: 0 wide shot … 0.6 at the faceplate … 0.68 inside … 0.84 turned round … 1 in the screen */
    function timeline(q, dir) {
      const f = sm(C((q - 0.06) / 0.54));
      flight(f, dir);
      state.zoom = 1 + f * f * 1.2 + Math.pow(C((q - 0.42) / 0.22), 3) * 9;
      state.shake = 0.004 * C((q - 0.4) / 0.2) + 0.006 * C((q - 0.84) / 0.1);
      state.iris = q < 0.5 ? 2.5 : (q < 0.68 ? 2.5 - 2.38 * sm(C((q - 0.5) / 0.15)) : (q < 0.86 ? 2.5 : 2.5 - 2.4 * sm(C((q - 0.86) / 0.08))));
      state.inside = sm(C((q - 0.64) / 0.04));
      state.yaw = Math.PI * sm(C((q - 0.68) / 0.16));
      state.boot = C((q - 0.7) / 0.2);
      state.dive = sm(C((q - 0.84) / 0.1));
      const dip = Math.max(0, 1 - Math.abs((q - 0.66) / 0.025));
      state.dark = Math.max(dip, C((q - 0.9) / 0.08));
      state.noise = Math.max(0, 1 - Math.abs((q - 0.94) / 0.07)) * 0.9;
      state.par = 0.05 * (1 - f * 0.5);
      schedule();
    }

    const api = {
      ready: new Promise(res => {
        const im = new Image(); im.decoding = 'async';
        im.onload = () => {
          imgW = im.naturalWidth; imgH = im.naturalHeight; tex(0, im);
          const useDepth = d => { tex(1, d); ready = true; resize(); schedule(); res(api); };
          if (cfg.depth) { const dm = new Image(); dm.onload = () => useDepth(dm); dm.onerror = () => useDepth(proceduralDepth(imgW, imgH, cfg.figure)); dm.src = cfg.depth; }
          else useDepth(proceduralDepth(imgW, imgH, cfg.figure));
        };
        im.onerror = () => res(null);
        im.src = cfg.image;
      }),
      enter(p) { timeline(p, 1); },
      exit(p) { timeline(1 - p, -1); },
      set(o) { Object.assign(state, o); schedule(); },
      setActive(b) { state.active = b; canvas.style.visibility = b ? 'visible' : 'hidden'; if (b) schedule(); },
      get state() { return state; }
    };
    return api;
  }

  return { create };
})();

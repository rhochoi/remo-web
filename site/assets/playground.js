// REMO OS 놀이터: 열 명이 각자의 모양 그대로 선 하나로 맞물린다. (얼굴 없는 도형판: plan-17)
// 물리: Matter.js 0.20.0 (MIT, vendor/matter.min.js, 화면 근처에 올 때만 불러온다). 데이터: data/relations.json (이름 없음).
// 설계·근거: docs/plan-15-playground.md
(() => {
  const host = document.getElementById('play'); if (!host) return;
  const svg = host.querySelector('svg'), read = document.getElementById('read');
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mk = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const label = { synergy: '같이 하면 강해지는', cover: '서로 메워주는', collab: '손발이 맞는' };
  const mood = { synergy: '서로 힘을 더해요', cover: '서로의 빈자리를 메워요', collab: '손발을 맞춰요' };
  const ptr = { x: -999, y: -999, on: false };
  let W = 0, H = 0, sc = 1, data = null, type = 'synergy', M = null, engine = null, walls = [], springs = [], drag = null, tilt = null, running = false, t0 = performance.now();
  const P = [];                                     // 도형
  const ropes = mk('g', { class: 'ropes' }, svg), chars = mk('g', { class: 'chars' }, svg), bub = mk('g', { class: 'bubble', opacity: 0 }, svg);
  const bRect = mk('rect', { rx: 16, height: 32 }, bub), bText = mk('text', { y: 21, 'text-anchor': 'middle' }, bub);

  /* ── 10가지 도형: 얼굴 없이, 같은 둥근 문법 안에서 서로 다른 형태. 노드 n마다 하나씩 (plan-17: 시안 01 도형 구슬) ── */
  const SHAPES = [
    r => `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`,                                                                                           // 원
    r => { const k = r * .82, c = r * .3; return `M${-k + c} ${-k}H${k - c}Q${k} ${-k} ${k} ${-k + c}V${k - c}Q${k} ${k} ${k - c} ${k}H${-k + c}Q${-k} ${k} ${-k} ${k - c}V${-k + c}Q${-k} ${-k} ${-k + c} ${-k}Z`; },   // 둥근 사각
    r => `M0 ${-r}Q${r * .25} ${-r} ${r * .95} ${r * .62}Q${r} ${r * .85} ${r * .72} ${r * .85}H${-r * .72}Q${-r} ${r * .85} ${-r * .95} ${r * .62}Q${-r * .25} ${-r} 0 ${-r}Z`,   // 둥근 삼각
    r => `M${-r} ${-r * .55}H${r}A${r * .55} ${r * .55} 0 0 1 ${r} ${r * .55}H${-r}A${r * .55} ${r * .55} 0 0 1 ${-r} ${-r * .55}Z`,                                // 알약
    r => `M${-r} ${r * .55}A${r} ${r} 0 0 1 ${r} ${r * .55}Z`,                                                                                                    // 반원
    r => { let d = '', n = 6; for (let i = 0; i < n; i++) { const a = i / n * 6.2832; d += (i ? 'Q' + (Math.cos(a - .52) * r * 1.18).toFixed(1) + ' ' + (Math.sin(a - .52) * r * 1.18).toFixed(1) + ' ' : 'M') + `${(Math.cos(a) * r * .72).toFixed(1)} ${(Math.sin(a) * r * .72).toFixed(1)}`; } return d + 'Z'; },   // 꽃
    r => `M0 ${-r}Q${r * .3} ${-r * .3} ${r} 0Q${r * .3} ${r * .3} 0 ${r}Q${-r * .3} ${r * .3} ${-r} 0Q${-r * .3} ${-r * .3} 0 ${-r}Z`,                              // 반짝이
    r => { const a = r * .34, b = r; return `M${-a} ${-b}H${a}V${-a}H${b}V${a}H${a}V${b}H${-a}V${a}H${-b}V${-a}H${-a}Z`; },                                       // 더하기
    r => `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}ZM0 ${-r * .42}A${r * .42} ${r * .42} 0 1 0 0 ${r * .42}A${r * .42} ${r * .42} 0 1 0 0 ${-r * .42}Z`,       // 고리
    r => `M${-r * .6} ${-r}H${r * .6}A${r * .6} ${r * .6} 0 0 1 ${r * .6} ${r}H${-r * .6}A${r * .6} ${r * .6} 0 0 1 ${-r * .6} ${-r}Z`,                                // 세운 알약
  ];

  function makePerson(n, i) {
    const g = mk('g', { class: 'person', tabindex: 0, role: 'img' }, chars), rot = mk('g', {}, g);
    mk('path', { class: 'body', d: SHAPES[i % SHAPES.length](30), 'fill-rule': 'evenodd' }, rot);
    const p = { n, i, g, rot, x: 0, y: 0, ang: 0, R: 30, deg: 0, sq: 0 };
    g.addEventListener('pointerdown', e => grab(e, p));
    g.addEventListener('pointerenter', () => { p.hover = true; });
    g.addEventListener('pointerleave', () => { p.hover = false; });
    g.addEventListener('focus', () => { p.hover = true; }); g.addEventListener('blur', () => { p.hover = false; });
    g.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (k && p.body) { e.preventDefault(); M.Body.setVelocity(p.body, { x: k[0] * 9, y: k[1] * 9 }); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(p); }
    });
    return p;
  }

  /* ── 레이아웃·크기 ── */
  const sizeNow = () => { const b = host.getBoundingClientRect(); return [Math.max(280, b.width), Math.max(300, b.height)]; };
  const radius = p => p.r0 * 2.0 * sc;
  function layout(first) {
    const [nw, nh] = sizeNow(), ow = W, oh = H; W = nw; H = nh; sc = clamp(W / 470, .88, 1.4);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    P.forEach(p => {
      const R0 = p.R; p.R = radius(p);
      if (first) { p.x = W * (.12 + .76 * (p.dx)); p.y = H * (.1 + .8 * (p.dy)); }
      else { p.x *= W / ow; p.y *= H / oh; }
      if (p.body) { M.Body.scale(p.body, p.R / R0, p.R / R0); M.Body.setPosition(p.body, { x: p.x, y: p.y }); }
    });
    if (M) buildWalls();
  }
  function buildWalls() {
    if (walls.length) M.Composite.remove(engine.world, walls);
    const t = 300, o = { isStatic: true, restitution: .5, friction: .02 };
    walls = [M.Bodies.rectangle(W / 2, H + t / 2, W + 2 * t, t, o), M.Bodies.rectangle(W / 2, -t / 2, W + 2 * t, t, o), M.Bodies.rectangle(-t / 2, H / 2, t, H + 2 * t, o), M.Bodies.rectangle(W + t / 2, H / 2, t, H + 2 * t, o)];
    M.Composite.add(engine.world, walls);
  }

  /* ── 관계: 선택한 유형의 간선이 곧 스프링이다 ── */
  const active = () => data.edges.filter(e => e.tp === type);
  function setType(t) {
    type = t; document.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
    ropes.replaceChildren(); P.forEach(p => { p.deg = 0; });
    const byN = Object.fromEntries(P.map(p => [p.n, p])), es = active(); const act = new Set();
    es.forEach(e => {
      const a = byN[e.s], b = byN[e.t]; a.deg++; b.deg++; act.add(a.n); act.add(b.n);
      const o = mk('path', { class: 'rope-o' }, ropes), i = mk('path', { class: 'rope-i ' + t }, ropes);
      e.el = { o, i, chev: t === 'cover' ? mk('path', { class: 'chev', d: 'M-5 -6L7 0L-5 6Z' }, ropes) : null }; e.a = a; e.b = b;
      if (!reduce) { o.style.opacity = i.style.opacity = 0; requestAnimationFrame(() => requestAnimationFrame(() => { o.style.transition = i.style.transition = 'opacity 400ms ease-out'; o.style.opacity = i.style.opacity = 1; })); }
    });
    P.forEach(p => { p.solo = !act.has(p.n); p.g.classList.toggle('solo', p.solo); p.g.setAttribute('aria-label', `구성원. 이름은 비공개. "${label[type]}" 관계 ${p.deg}개`); });
    read.textContent = `${label[type]}: 관계 ${es.length}개, 연결된 사람 ${act.size}명. 도형을 잡아 던져 보세요.`;
    if (M) {
      M.Composite.remove(engine.world, springs); springs = [];
      es.forEach(e => {
        const len = (e.a.R + e.b.R) * 2.15 + (e.w === 3 ? 0 : 22 * sc);
        springs.push(M.Constraint.create({ bodyA: e.a.body, bodyB: e.b.body, length: len, stiffness: e.w === 3 ? .014 : .008, damping: .06 }));
      });
      M.Composite.add(engine.world, springs);
      P.forEach(p => M.Body.setVelocity(p.body, { x: p.body.velocity.x + (Math.random() - .5) * 3, y: p.body.velocity.y + (Math.random() - .5) * 3 }));   // 살짝 흔들어 새 관계로 재배치
    }
  }

  /* ── 입력: 잡기·던지기·콩 뛰기 ── */
  const local = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function grab(e, p) {
    if (!M || drag) return; e.preventDefault(); const q = local(e);
    const c = M.Constraint.create({ pointA: q, bodyB: p.body, pointB: { x: 0, y: 0 }, stiffness: .16, damping: .1, length: 0 });
    M.Composite.add(engine.world, c); drag = { p, c, x0: q.x, y0: q.y, t: performance.now(), id: e.pointerId, moved: 0 };
    p.g.classList.add('held'); p.g.setPointerCapture?.(e.pointerId);
  }
  addEventListener('pointermove', e => { const q = local(e); ptr.x = q.x; ptr.y = q.y; ptr.on = true; if (drag && e.pointerId === drag.id) { drag.c.pointA = q; drag.moved = Math.max(drag.moved, Math.hypot(q.x - drag.x0, q.y - drag.y0)); } }, { passive: true });
  const release = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    M.Composite.remove(engine.world, drag.c); const { p } = drag, b = p.body, v = Math.hypot(b.velocity.x, b.velocity.y);
    if (v > 26) M.Body.setVelocity(b, { x: b.velocity.x * 26 / v, y: b.velocity.y * 26 / v });
    p.g.classList.remove('held'); if (drag.moved < 6 && performance.now() - drag.t < 350) jump(p); drag = null;
  };
  addEventListener('pointerup', release); addEventListener('pointercancel', release);
  function jump(p) {
    const up = reduce ? 4 : 9; M.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -up }); p.cheer = performance.now();
    active().forEach(e => { const o = e.a === p ? e.b : e.b === p ? e.a : null; if (o) setTimeout(() => { M.Body.setVelocity(o.body, { x: o.body.velocity.x, y: -up * .6 }); o.cheer = performance.now(); }, 140); });   // 이어진 사람들이 뒤따라 뛴다
  }
  document.getElementById('shake')?.addEventListener('click', () => { if (!M) return; P.forEach(p => M.Body.setVelocity(p.body, { x: (Math.random() - .5) * 26, y: (Math.random() - .5) * 26 })); read.textContent = '흔들었어요. 이어진 사람끼리 다시 모입니다.'; });
  document.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => data && setType(b.dataset.t)));
  const tiltBtn = document.getElementById('tilt');
  if (tiltBtn && matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window) {
    tiltBtn.hidden = false;
    tiltBtn.addEventListener('click', async () => {
      if (tilt) { removeEventListener('deviceorientation', tilt); tilt = null; engine.gravity.scale = 0; tiltBtn.setAttribute('aria-pressed', 'false'); return; }
      try { if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') return; } catch { return; }
      tilt = ev => { engine.gravity.x = clamp((ev.gamma || 0) / 40, -1, 1); engine.gravity.y = clamp((ev.beta || 0) / 40, -1, 1); engine.gravity.scale = .0011; };
      addEventListener('deviceorientation', tilt); tiltBtn.setAttribute('aria-pressed', 'true');
    });
  }

  /* ── 그리기 ── */
  const route = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, ax = Math.abs(dx), ay = Math.abs(dy), sx = Math.sign(dx), sy = Math.sign(dy), d = Math.min(ax, ay); return ax >= ay ? `M${a.x} ${a.y}H${a.x + sx * (ax - d) / 2}L${a.x + sx * ((ax - d) / 2 + d)} ${b.y}H${b.x}` : `M${a.x} ${a.y}V${a.y + sy * (ay - d) / 2}L${b.x} ${a.y + sy * ((ay - d) / 2 + d)}V${b.y}`; };
  const bez = (a, c, b, t) => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  function draw(now) {
    const k = now / 1000;
    ropes.childNodes.length && active().forEach((e, idx) => {
      const a = e.a, b = e.b, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, rest = (a.R + b.R) * 2.15, slack = clamp((rest - d) / rest, 0, 1), sag = (4 + slack * 34 * sc) * (idx % 2 ? 1 : -1);
      const c = { x: (a.x + b.x) / 2 - dy / d * sag, y: (a.y + b.y) / 2 + dx / d * sag }, dd = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      const dr = host.classList.contains('static') ? route(a, b) : dd; e.el.o.setAttribute('d', dr); e.el.i.setAttribute('d', dr); e.el.o.style.strokeWidth = (e.w === 3 ? 10 : 8) + 'px'; e.el.i.style.strokeWidth = (e.w === 3 ? 5 : 3.4) + 'px';
      if (type === 'collab' && !reduce) e.el.i.style.strokeDashoffset = (-k * 14) % 20;
      if (e.el.chev) { const m = bez(a, c, b, .55), n = bez(a, c, b, .58); e.el.chev.setAttribute('transform', `translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${(Math.atan2(n.y - m.y, n.x - m.x) * 57.3).toFixed(1)})`); }
    });
    let hov = null;
    P.forEach(p => {
      if (p.body) { p.x = p.body.position.x; p.y = p.body.position.y; p.ang = p.body.angle; }
      const grown = reduce ? 1 : clamp((now - t0 - p.i * 70) / 420, 0, 1), s = (p.R / 30) * (1 - Math.pow(1 - grown, 3));
      const speed = p.body ? Math.hypot(p.body.velocity.x, p.body.velocity.y) : 0, cheer = now - (p.cheer || -1e9) < 700;
      p.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${s.toFixed(3)})`);
      // 속도에 따라 진행 방향으로 살짝 늘어나고 직각으로 눌린다(얼굴 대신 몸짓으로 살아 있음을 보여 준다)
      const sq = reduce ? 0 : Math.min(.1, speed * .011); p.sq += (sq - p.sq) * .25;
      const va = p.body ? Math.atan2(p.body.velocity.y, p.body.velocity.x) * 57.3 : 0;
      p.rot.setAttribute('transform', `rotate(${(p.ang * 57.3).toFixed(1)}) rotate(${va.toFixed(1)}) scale(${(1 + p.sq).toFixed(3)} ${(1 - p.sq).toFixed(3)}) rotate(${(-va).toFixed(1)})`);
      if (p.hover) hov = p;
    });
    if (hov) {
      const txt = hov.solo ? `이 유형에서는 혼자 있어요` : `${label[type]} 관계 ${hov.deg}개. ${mood[type]}`; if (bText.textContent !== txt) { bText.textContent = txt; const w = txt.length * 12.5 + 28; bRect.setAttribute('width', w); bRect.setAttribute('x', -w / 2); bText.setAttribute('x', 0); }
      const w = +bRect.getAttribute('width'), bx = clamp(hov.x, w / 2 + 6, W - w / 2 - 6), by = Math.max(6, hov.y - hov.R - 46);
      bub.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)})`); bub.setAttribute('opacity', 1);
    } else bub.setAttribute('opacity', 0);
  }

  /* ── 루프: 화면에 보일 때만 ── */
  let visible = false, last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); if (!visible) { last = now; return; }
    if (M) {
      const dt = Math.min(33, now - last);
      if (!tilt) P.forEach(p => { const b = p.body; M.Body.applyForce(b, b.position, { x: (W / 2 - b.position.x) * b.mass * 0.35e-6, y: (H / 2 - b.position.y) * b.mass * 0.35e-6 }); });   // 가운데로 은은히 모인다
      M.Engine.update(engine, dt || 16.7);
      P.forEach(p => {                                  // 빠르게 던져도 벽을 뚫고 나가지 않게 안쪽으로 되돌린다
        const b = p.body, r = p.R, ox = b.position.x, oy = b.position.y, x = clamp(ox, r, W - r), y = clamp(oy, r, H - r);
        if (x !== ox || y !== oy) { M.Body.setPosition(b, { x, y }); M.Body.setVelocity(b, { x: x !== ox ? 0 : b.velocity.x, y: y !== oy ? 0 : b.velocity.y }); }
      });
    }
    last = now; draw(now);
  }

  function startPhysics() {
    M = window.Matter; engine = M.Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
    P.forEach(p => {
      p.body = M.Bodies.circle(p.x, p.y, p.R * .94, { restitution: .62, friction: .04, frictionAir: reduce ? .12 : .035, density: .0015 });
      M.Composite.add(engine.world, p.body);
    });
    buildWalls(); setType(type); host.classList.add('live');
  }
  function loadMatter() {
    if (window.Matter) return startPhysics();
    const s = document.createElement('script'); s.src = 'assets/vendor/matter.min.js'; s.onload = startPhysics;
    s.onerror = () => { host.classList.add('static'); P.forEach(p => { p.x = Math.round(p.x / 40) * 40; p.y = Math.round(p.y / 35) * 35; }); }; document.head.appendChild(s);       // 실패하면 정지 그림으로 남는다
  }

  fetch('data/relations.json').then(r => r.json()).then(d => {
    data = d; document.getElementById('cap').textContent = d.caption.replace('팀 진단 도구(REMO OS)의 관계 데이터. ', '').replace(' 노드에 이름은 없다.', '') + ' 노드에 이름은 없습니다.';
    const xs = d.nodes.map(n => n.x), ys = d.nodes.map(n => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    d.nodes.forEach((n, i) => { const p = makePerson(n.n, i); p.r0 = n.r; p.dx = (n.x - x0) / (x1 - x0); p.dy = (n.y - y0) / (y1 - y0); P.push(p); });
    layout(true); setType(type);
    new ResizeObserver(() => { if (host.clientWidth && Math.abs(host.clientWidth - W) + Math.abs(host.clientHeight - H) > 2) layout(false); }).observe(host);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !M && !host.classList.contains('static')) loadMatter(); }, { rootMargin: '300px' }).observe(host);
    requestAnimationFrame(frame);
  }).catch(() => { read.textContent = '관계 데이터를 불러오지 못했습니다.'; });
})();

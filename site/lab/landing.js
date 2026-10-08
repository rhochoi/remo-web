// REMO 인터랙티브 랜딩 시안. 라이브러리 0. 설계: docs/plan-14-landing-doodle.md
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ptr = { x: innerWidth / 2, y: innerHeight / 3 };
  addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });

  const toSvg = (svg, cx, cy) => { const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const p = new DOMPoint(cx, cy).matrixTransform(m.inverse()); return { x: p.x, y: p.y }; };

  /* ── 눈: 포인터 쪽으로 최대 max 만큼 움직인다 ── */
  const lookAt = (svg, eyes, origin, max) => {
    const p = toSvg(svg, ptr.x, ptr.y);
    eyes.forEach(e => {
      const cx = +e.dataset.cx, cy = +e.dataset.cy, dx = p.x - origin.x - cx, dy = p.y - origin.y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 80) * max;
      e.__tx = dx / d * k; e.__ty = dy / d * k;
    });
  };
  const placeEyes = (eyes, blink) => eyes.forEach(e => {
    const cx = +e.dataset.cx, cy = +e.dataset.cy, s = blink;
    e.setAttribute('transform', `translate(${(e.__tx || 0).toFixed(2)} ${(e.__ty || 0).toFixed(2)}) translate(${cx} ${cy}) scale(1 ${s}) translate(${-cx} ${-cy})`);
  });
  const prep = eyes => eyes.forEach(e => { e.dataset.cx = e.getAttribute('cx'); e.dataset.cy = e.getAttribute('cy'); });

  /* ── 0. 워드마크 ── */
  const wm = $('#wm'), letters = $$('.L', wm).map(g => ({ g, cx: +g.dataset.cx, cy: +g.dataset.cy, x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, drag: null }));
  const rL = letters.find(l => l.g.id === 'L-R'), eyes = $$('.eye', rL.g); prep(eyes);
  const K = reduce ? 900 : 170, C = reduce ? 60 : 20;
  letters.forEach(L => {
    L.g.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { L.g.classList.add('hot'); L.ts = 1.035; } });
    L.g.addEventListener('pointerleave', () => { L.g.classList.remove('hot'); L.ts = 1; });
    L.g.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') { L.vs = 2.4; L.g.classList.add('hot'); setTimeout(() => L.g.classList.remove('hot'), 350); return; }   // 터치는 스크롤을 지키려고 드래그 대신 눌림
      e.preventDefault(); const p = toSvg(wm, e.clientX, e.clientY); L.drag = { px: p.x - L.x, py: p.y - L.y }; L.ts = 1.06; wm.setPointerCapture?.(e.pointerId);
    });
  });
  addEventListener('pointermove', e => { letters.forEach(L => { if (L.drag) { const p = toSvg(wm, e.clientX, e.clientY); L.x = clamp(p.x - L.drag.px, -170, 170); L.y = clamp(p.y - L.drag.py, -120, 120); } }); }, { passive: true });
  const release = () => letters.forEach(L => { if (L.drag) { L.drag = null; L.ts = L.g.classList.contains('hot') ? 1.035 : 1; } });
  addEventListener('pointerup', release); addEventListener('pointercancel', release);

  // 궤도: 타원 위를 천천히 돈다. 호버·포커스 중에는 멈춘다
  const nodes = $$('.node', wm).map((a, i) => ({ a, th: [-1.0, .15, 1.95, 3.55][i] }));
  const OC = { x: 503, y: 232, rx: 530, ry: 205, rot: -8 * Math.PI / 180 };
  let paused = false;
  nodes.forEach(n => { ['pointerenter', 'focus'].forEach(t => n.a.addEventListener(t, () => paused = true)); ['pointerleave', 'blur'].forEach(t => n.a.addEventListener(t, () => paused = false)); });
  const placeNode = n => { const ex = OC.rx * Math.cos(n.th), ey = OC.ry * Math.sin(n.th), c = Math.cos(OC.rot), s = Math.sin(OC.rot); n.a.setAttribute('transform', `translate(${(OC.x + ex * c - ey * s).toFixed(1)} ${(OC.y + ex * s + ey * c).toFixed(1)})`); };

  let blinkAt = performance.now() + 3000, blinkT = 0;

  /* ── 문의 섹션의 R: 워드마크의 R을 복제해 눈만 따라오게 한다 ── */
  const peek = $('#peek'); const rClone = rL.g.cloneNode(true); rClone.removeAttribute('id'); rClone.removeAttribute('class'); peek.appendChild(rClone);
  const peyes = $$('.eye', rClone); prep(peyes);

  /* ── 2. 관계 그래프 ── */
  const graph = $('#graph'), read = $('#read'), label = { synergy: '같이 하면 강해지는', cover: '서로 메워주는', collab: '손발이 맞는' };
  let G = null, type = 'synergy', hoverNode = null;
  const mk = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const gEyes = [];
  const draw = () => {
    $$('.edge', graph).forEach(e => e.remove());
    const eg = $('#edges', graph); const active = new Set(); let count = 0;
    G.edges.filter(e => e.tp === type).forEach(e => {
      const a = G.pos[e.s], b = G.pos[e.t], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, k = .12;
      const p = mk('path', { class: 'edge', d: `M${a.x} ${a.y}Q${mx - dy * k} ${my + dx * k} ${b.x} ${b.y}`, 'stroke-width': e.w === 3 ? 4 : 2.4, pathLength: 1 });
      p.dataset.s = e.s; p.dataset.t = e.t; eg.appendChild(p); active.add(e.s); active.add(e.t); count++;
      if (!reduce) p.animate([{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }], { duration: 480, easing: 'ease-out' });   // 끝나면 점선 없이 실선으로 돌아온다. 애니메이션이 안 돌아도 선은 보인다
    });
    $$('.person', graph).forEach(g => g.classList.toggle('on', active.has(+g.dataset.n)));
    G.active = active; G.count = count; sayDefault();
  };
  const sayDefault = () => { read.textContent = `${label[type]} 관계 ${G.count}개. 연결된 사람 ${G.active.size}명.`; };
  fetch('../data/relations.json').then(r => r.json()).then(d => {
    $('#cap').textContent = d.caption.replace('팀 진단 도구(REMO OS)의 관계 데이터. ', '').replace(' 노드에 이름은 없다.', '') + ' 노드에 이름은 없습니다.';
    G = { pos: {}, edges: d.edges };
    const eg = mk('g', { id: 'edges' }); graph.appendChild(eg);
    d.nodes.forEach(n => { G.pos[n.n] = { x: n.x, y: n.y }; });
    d.nodes.forEach(n => {
      const r = n.r * 1.2, g = mk('g', { class: 'person', 'data-n': n.n, transform: `translate(${n.x} ${n.y})` });
      g.appendChild(mk('circle', { class: 'face', r }));
      [-1, 1].forEach(sd => { const c = mk('circle', { class: 'pupil', cx: sd * r * .32, cy: -r * .08, r: r * .13 }); g.appendChild(c); gEyes.push({ c, g, cx: sd * r * .32, cy: -r * .08, r }); });
      g.addEventListener('pointerenter', () => { hoverNode = n.n; g.style.transform = 'scale(1.12)'; g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center'; $$('.edge', graph).forEach(e => e.classList.toggle('dim', !(+e.dataset.s === n.n || +e.dataset.t === n.n))); const c = G.edges.filter(e => e.tp === type && (e.s === n.n || e.t === n.n)).length; read.textContent = `이 사람은 "${label[type]}" 관계가 ${c}개입니다.`; });
      g.addEventListener('pointerleave', () => { hoverNode = null; g.style.transform = ''; $$('.edge', graph).forEach(e => e.classList.remove('dim')); sayDefault(); });
      graph.appendChild(g);
    });
    draw();
  }).catch(() => { read.textContent = '관계 데이터를 불러오지 못했습니다.'; });
  $$('[data-t]').forEach(b => b.addEventListener('click', () => { type = b.dataset.t; $$('[data-t]').forEach(x => x.setAttribute('aria-pressed', x === b)); if (G) draw(); }));

  /* ── 힌트: 입력 방식에 맞춰 ── */
  if (matchMedia('(pointer: coarse)').matches) $('#hint').textContent = '글자를 눌러 보세요. 궤도의 점은 지금 하는 프로젝트입니다.';

  /* ── 루프: 화면에 보이는 것만 갱신 ── */
  const vis = new Set(); const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)), { rootMargin: '80px' });
  [wm, peek, graph].forEach(el => io.observe(el));
  let last = performance.now();
  (function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (vis.has(wm)) {
      letters.forEach(L => {
        const tx = L.drag ? L.x : 0, ty = L.drag ? L.y : 0;
        if (!L.drag) { L.vx += (-K * L.x - C * L.vx) * dt; L.vy += (-K * L.y - C * L.vy) * dt; L.x += L.vx * dt; L.y += L.vy * dt; } else { L.vx = L.vy = 0; }
        L.vs += (K * (L.ts - L.s) - C * L.vs) * dt; L.s += L.vs * dt;
        L.g.setAttribute('transform', `translate(${(L.x + L.cx).toFixed(2)} ${(L.y + L.cy).toFixed(2)}) scale(${L.s.toFixed(4)}) translate(${-L.cx} ${-L.cy})`);
      });
      if (!reduce && !paused) nodes.forEach(n => { n.th += dt * .035; });
      nodes.forEach(placeNode);
      if (!reduce && now > blinkAt) { blinkT = now; blinkAt = now + 3500 + Math.random() * 3000; }
      const b = reduce ? 1 : (now - blinkT < 140 ? .08 : 1);
      lookAt(wm, eyes, { x: rL.x, y: rL.y }, 6.5); placeEyes(eyes, b);
    }
    if (vis.has(peek)) { lookAt(peek, peyes, { x: 0, y: 0 }, 6.5); placeEyes(peyes, 1); }
    if (vis.has(graph) && gEyes.length) gEyes.forEach(o => {
      const m = graph.getScreenCTM(); if (!m) return; const pos = G.pos[+o.g.dataset.n], p = new DOMPoint(ptr.x, ptr.y).matrixTransform(m.inverse()), dx = p.x - pos.x - o.cx, dy = p.y - pos.y - o.cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 120) * o.r * .14;
      o.c.setAttribute('transform', `translate(${(dx / d * k).toFixed(2)} ${(dy / d * k).toFixed(2)})`);
    });
  })(last);
})();

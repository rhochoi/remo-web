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


  /* ── 페이지 위치 pager (plan-16 B): 어느 장에 있는지 알려 주는 정보 ── */
  const pager = $('#pager'), secs = $$('[data-pager]');
  if (pager) {
    secs.forEach((sec, i) => { const a = document.createElement('a'); a.href = '#' + sec.id; a.dataset.t = sec.dataset.pager; a.setAttribute('aria-label', `${secs.length}장 중 ${i + 1}장, ${sec.dataset.pager}`); pager.appendChild(a); });
    const dots = $$('a', pager);
    const mark = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) dots.forEach((d, i) => d.setAttribute('aria-current', String(secs[i] === e.target))); }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(sec => mark.observe(sec));
  }

  /* ── 실행의 장면: 이전·다음 버튼 ── */
  const deck = $('#deck'), prev = $('#sc-prev'), next = $('#sc-next');
  if (deck) {
    const step = () => (deck.querySelector('.slide')?.getBoundingClientRect().width || 300) + 16;
    const upd = () => { prev.disabled = deck.scrollLeft < 8; next.disabled = deck.scrollLeft + deck.clientWidth >= deck.scrollWidth - 8; };
    prev.addEventListener('click', () => deck.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => deck.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    deck.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ── 힌트: 입력 방식에 맞춰 ── */
  if (matchMedia('(pointer: coarse)').matches) $('#hint').textContent = '글자를 눌러 보세요. 궤도의 점은 지금 하는 프로젝트입니다.';

  /* ── 루프: 화면에 보이는 것만 갱신 ── */
  const vis = new Set(); const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)), { rootMargin: '80px' });
  [wm, peek].forEach(el => io.observe(el));
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
  })(last);
})();

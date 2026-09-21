// REMO Portfolio — 모바일 메뉴 sheet · 프로젝트 필터(URL query 유지) · 문의 폼 · toast. 스펙: pencil-new.pen "Interaction & Responsive Spec"
(function () {
  // 모바일 메뉴: full-screen sheet
  var sheet = document.getElementById('menu-sheet'), open = document.getElementById('menu-open'), close = document.getElementById('menu-close');
  if (sheet && open && close) {
    var toggle = function (on) { if (on) sheet.setAttribute('open', ''); else sheet.removeAttribute('open'); open.setAttribute('aria-expanded', String(on)); document.body.style.overflow = on ? 'hidden' : ''; (on ? close : open).focus(); };
    open.addEventListener('click', function () { toggle(true); });
    close.addEventListener('click', function () { toggle(false); });
    sheet.addEventListener('click', function (e) { if (e.target.tagName === 'A') toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.hasAttribute('open')) toggle(false); });
  }

  // toast
  var toastEl = document.getElementById('toast'), toastT;
  window.remoToast = function (msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 3000); };

  // 프로젝트 필터: ?filter=슬러그 를 읽고 쓴다. 결과 없음이면 초기화 CTA
  var filters = document.querySelector('.filters');
  if (filters) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-kind]')), empty = document.querySelector('.empty');
    var apply = function (key, push) {
      filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === key)); });
      var n = 0; cards.forEach(function (c) { var show = key === 'all' || c.dataset.kind.split(' ').indexOf(key) > -1; c.hidden = !show; if (show) n++; });
      if (empty) { if (n) empty.removeAttribute('data-show'); else empty.setAttribute('data-show', ''); }
      if (push) { var u = new URL(location.href); if (key === 'all') u.searchParams.delete('filter'); else u.searchParams.set('filter', key); history.replaceState(null, '', u); }
    };
    filters.addEventListener('click', function (e) { var b = e.target.closest('button[data-filter]'); if (b) apply(b.dataset.filter, true); });
    if (empty) empty.addEventListener('click', function (e) { if (e.target.closest('[data-reset]')) { e.preventDefault(); apply('all', true); } });
    var init = new URL(location.href).searchParams.get('filter');
    apply(init && filters.querySelector('[data-filter="' + init + '"]') ? init : 'all', false);
  }

  // 문의 폼 — AJAX 제출, 실패 시 입력값 유지 (plan-04). 성공 시 success toast (스펙 STATES)
  var form = document.querySelector('.form');
  if (form && window.fetch) {
    var ok = document.getElementById('form-ok'), err = document.getElementById('form-error'), btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      err.textContent = ''; btn.disabled = true; btn.textContent = '보내는 중…';
      fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status);
          form.querySelectorAll('.field, .consent, button').forEach(function (el) { el.hidden = true; });
          ok.textContent = '받았습니다. 적어 주신 이메일로 답합니다.'; window.remoToast('문의를 보냈습니다.'); })
        .catch(function () { err.textContent = '보내지 못했습니다. 잠시 후 다시 시도하거나, 노션 링크로 연락해 주세요.'; btn.disabled = false; btn.textContent = '보내기'; });
    });
  }
})();

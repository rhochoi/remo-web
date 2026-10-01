// Existing project anchors open their native disclosure before focus moves.
function revealProject(hash = location.hash) {
  const target = document.getElementById(hash.slice(1));
  if (target && target.matches('details.project')) {
    target.open = true;
    target.querySelector('summary').focus({preventScroll: true});
  }
}
window.addEventListener('hashchange', () => revealProject());
document.querySelectorAll('a[href^="#p-"]').forEach(link => {
  link.addEventListener('click', () => requestAnimationFrame(() => revealProject(link.hash)));
});
revealProject();
// Track the topmost visible section, without controlling scrolling.
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) links.forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-15% 0px -65% 0px'});
  links.forEach(link => observer.observe(document.querySelector(link.hash)));
  observer.observe(document.querySelector('.hero'));
}
    // 문의 폼 — AJAX 제출, 실패 시 입력값 유지. 근거: plan-04
    (function () {
      var form = document.querySelector('.contact-form');
      if (!form || !window.fetch) return;
      var ok = document.getElementById('form-ok');
      var err = document.getElementById('form-error');
      var btn = form.querySelector('button[type="submit"]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        err.textContent = '';
        btn.disabled = true; btn.textContent = '보내는 중…';
        fetch(form.dataset.endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.querySelectorAll('.field, .two, .req, button').forEach(function (el) { el.hidden = true; });
          ok.textContent = '받았습니다. 적어 주신 연락처로 답합니다.';
        }).catch(function () {
          err.textContent = '보내지 못했습니다. 잠시 후 다시 시도하거나, 아래 노션 링크로 연락해 주세요.';
          btn.disabled = false; btn.textContent = '보내기';
        });
      });
    })();

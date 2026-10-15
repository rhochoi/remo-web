// 공개 접근 — 비밀번호 없음. POST만 받고, 같은 IP의 분당 호출을 제한한다(서버리스 인스턴스별 최선 노력).
// 비용 상한은 /api/ask의 DB 일일 한도(ASK_DAILY_LIMIT)가 인스턴스와 무관하게 맡는다.
const WINDOW = 60_000;
const hits = new Map(); // `${name}:${ip}` → [횟수, 창 시작 시각]

// 통과하면 true. 막으면 응답까지 보내고 false
export function guard(req, res, { name, perMinute }) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).json({ ok: false }); return false; }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const k = `${name}:${ip}`, now = Date.now();
  const h = hits.get(k);
  if (!h || now - h[1] > WINDOW) hits.set(k, [1, now]);
  else if (++h[0] > perMinute) { res.status(429).json({ ok: false, error: 'too-many' }); return false; }
  if (hits.size > 5000) for (const [key, v] of hits) if (now - v[1] > WINDOW) hits.delete(key); // 메모리 누수 방지
  return true;
}

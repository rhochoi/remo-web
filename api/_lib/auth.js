// 내부 검색 공용 인증 — 공유 비밀번호(SEARCH_PASSWORD), x-search-key 헤더
import { createHash, timingSafeEqual } from 'node:crypto';

const FAIL_MAX = 10, FAIL_WINDOW = 10 * 60_000;
const fails = new Map(); // ip → [횟수, 시작 시각]. 인스턴스별 최선 노력 — 강한 비밀번호가 본 방어선
const sha = (s) => createHash('sha256').update(s).digest();

// 통과하면 true. 실패하면 응답까지 보내고 false
export async function authorize(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).json({ ok: false }); return false; }

  const secret = process.env.SEARCH_PASSWORD;
  if (!secret) { res.status(503).json({ ok: false, error: 'not-configured' }); return false; }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const f = fails.get(ip);
  if (f && Date.now() - f[1] > FAIL_WINDOW) fails.delete(ip);
  else if (f && f[0] >= FAIL_MAX) { res.status(429).json({ ok: false, error: 'too-many' }); return false; }

  const key = typeof req.headers['x-search-key'] === 'string' ? req.headers['x-search-key'] : '';
  if (!timingSafeEqual(sha(key), sha(secret))) {
    const g = fails.get(ip);
    fails.set(ip, g ? [g[0] + 1, g[1]] : [1, Date.now()]);
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ ok: false, error: 'auth' });
    return false;
  }
  fails.delete(ip);
  return true;
}

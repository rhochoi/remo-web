// 내부 노션 검색 — 공유 비밀번호 인증, 외부 전송 없는 Postgres 키워드 검색. 스키마 db/search.sql
import { neon } from '@neondatabase/serverless';
import { authorize } from './_lib/auth.js';
import { retrieve } from './_lib/retrieve.js';

export default async function handler(req, res) {
  if (!(await authorize(req, res))) return;
  const q = req.body && typeof req.body.q === 'string' ? req.body.q : '';
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    const { mode, rows } = await retrieve(sql, q, 20);
    const results = rows.map(({ path, title, doc_date, idx, snippet }) => ({ path, title, date: doc_date, idx, snippet }));
    return res.status(200).json({ ok: true, mode, results });
  } catch (e) {
    console.error('search failed', e.message);
    return res.status(500).json({ ok: false });
  }
}

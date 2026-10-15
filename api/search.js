// 노션 키워드 검색 — 비밀번호 없는 공개 접근, 외부 전송 없는 Postgres 검색. private 문서는 공개되지 않도록 항상 제외. 스키마 db/search.sql
import { neon } from '@neondatabase/serverless';
import { guard } from './_lib/guard.js';
import { retrieve } from './_lib/retrieve.js';

export default async function handler(req, res) {
  if (!guard(req, res, { name: 'search', perMinute: 40 })) return;
  const q = req.body && typeof req.body.q === 'string' ? req.body.q : '';
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    const { mode, rows } = await retrieve(sql, q, 20, { publicOnly: true });
    const results = rows.map(({ path, title, doc_date, idx, snippet }) => ({ path, title, date: doc_date, idx, snippet }));
    return res.status(200).json({ ok: true, mode, results });
  } catch (e) {
    console.error('search failed', e.message);
    return res.status(500).json({ ok: false });
  }
}

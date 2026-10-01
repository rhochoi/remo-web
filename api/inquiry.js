// 문의 폼 → Neon(Vercel Postgres) 저장. Formspree(메일 알림)와 병행 — 스키마 db/schema.sql
import { neon } from '@neondatabase/serverless';

const KINDS = ['프로젝트 의뢰', '협업 제안', '커피챗'];
let ready; // 테이블 생성은 인스턴스당 한 번 — db/schema.sql과 같은 정의
const MAX ={ org: 200, email: 254, problem: 5000, tried: 3000, timeline: 200, budget: 200 };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  if (b._gotcha) return res.status(200).json({ ok: true }); // 허니팟 — 봇에게는 성공처럼 보인다

  const v = (k) => (typeof b[k] === 'string' ? b[k].trim() : '');
  const row = {
    org: v('소속과 역할'), email: v('email'), problem: v('해결하려는 문제'),
    tried: v('지금까지 시도한 것'), kind: v('협업 형태'), timeline: v('일정 범위'), budget: v('예산 범위'),
  };
  const bad = !row.org || !row.problem || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
    || v('개인정보 동의') !== '동의'
    || (row.kind && !KINDS.includes(row.kind))
    || Object.keys(MAX).some((k) => row[k].length > MAX[k]);
  if (bad) return res.status(400).json({ ok: false });

  try {
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    ready ||= sql`create table if not exists inquiries (
      id bigint generated always as identity primary key,
      created_at timestamptz not null default now(),
      org text not null, email text not null, problem text not null,
      tried text, kind text, timeline text, budget text)`.catch((e) => { ready = null; throw e; });
    await ready;
    await sql`insert into inquiries (org, email, problem, tried, kind, timeline, budget)
      values (${row.org}, ${row.email}, ${row.problem}, ${row.tried || null}, ${row.kind || null}, ${row.timeline || null}, ${row.budget || null})`;
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error('inquiry insert failed', e.message);
    return res.status(500).json({ ok: false });
  }
}

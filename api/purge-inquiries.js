// 동의문 "1년간 보관" — 만료 문의 삭제. Vercel Cron이 매일 호출 (vercel.json crons)
// CRON_SECRET 환경변수가 있으면 Vercel이 보내는 Bearer 토큰을 확인한다. 하는 일은 만료분 삭제뿐이고 데이터를 돌려주지 않는다
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ ok: false });
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    const rows = await sql`delete from inquiries where created_at < now() - interval '1 year' returning id`;
    console.log('purged inquiries', rows.length);
    return res.status(200).json({ ok: true, deleted: rows.length });
  } catch (e) {
    console.error('purge failed', e.message);
    return res.status(500).json({ ok: false });
  }
}

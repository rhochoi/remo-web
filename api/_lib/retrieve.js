// notion_chunks 검색 — 모든 단어가 든 청크 우선, 없으면 하나라도 든 청크. 문서(doc)당 최고 청크 하나. 스키마 db/search.sql
const MARK_OPEN = '', MARK_CLOSE = ''; // 강조 표식 — 클라이언트가 textContent로 렌더해 HTML 주입이 없다
const MAX_TOKENS = 8, MAX_TOKEN_LEN = 40;

export function tokenize(q) {
  return [...new Set(String(q).normalize('NFC').split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, '').slice(0, MAX_TOKEN_LEN)).filter(Boolean))].slice(0, MAX_TOKENS);
}

// publicOnly: private 문서 제외 — 외부 LLM으로 보낼 검색에서만 켠다
export async function retrieve(sql, q, limit = 20, { publicOnly = false } = {}) {
  const tokens = tokenize(q);
  if (!tokens.length) return { mode: 'all', rows: [] };
  const pats = tokens.map((t) => `%${t}%`);
  const phrase = tokens.join(' ');
  for (const op of ['&', '|']) {
    const tsq = tokens.map((t) => `${t}:*`).join(` ${op} `);
    const match = op === '&' ? 'all' : 'any'; // 고정 화이트리스트만 SQL 문자열에 들어간다
    const rows = await sql.query(
      `with hit as (
         select id, doc, path, title, doc_date, idx, content,
                ts_rank(tsv, to_tsquery('simple', $1)) * 2
                + word_similarity($2, content)
                + case when title ilike all($3) then 1 else 0 end as score
         from notion_chunks
         where (title || ' ' || content) ilike ${match}($3) ${publicOnly ? 'and not private' : ''}
       ), best as (
         select distinct on (doc) * from hit order by doc, score desc
       ), top as (
         select * from best order by score desc limit ${Number(limit)}
       )
       select doc, path, title, to_char(doc_date, 'YYYY-MM-DD') as doc_date, idx, content, score,
              ts_headline('simple', content, to_tsquery('simple', $1), $4) as snippet
       from top order by score desc`,
      [tsq, phrase, pats, `StartSel=${MARK_OPEN}, StopSel=${MARK_CLOSE}, MaxFragments=1, MinWords=12, MaxWords=40`]);
    if (rows.length || op === '|') return { mode: match, rows };
  }
}

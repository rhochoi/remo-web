// 노션 내보내기(Markdown & CSV 압축 해제 폴더) → notion_chunks 전체 교체.
// 사용: DATABASE_URL=... node scripts/index-notion.mjs <내보내기 폴더> [--dry]
// 내용은 이 저장소에 복사하지 않는다. 비밀번호·토큰처럼 보이는 값은 색인 전에 가린다.
import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import { neon } from '@neondatabase/serverless';

const CHUNK = 900, BATCH = 100;
const dir = process.argv[2];
const dry = process.argv.includes('--dry');
const listPrivate = process.argv.includes('--list-private');
const privateFile = process.argv.includes('--private-file') ? process.argv[process.argv.indexOf('--private-file') + 1] : null;
if (!dir) { console.error('사용법: node scripts/index-notion.mjs <내보내기 폴더> [--dry] [--list-private] [--private-file 규칙파일]'); process.exit(1); }

const stripHash = (s) => s.replace(/\s[0-9a-f]{32}(?=\.|$)/g, '');
// 질문(외부 LLM 전송) 대상에서 뺄 문서 규칙 — 하나라도 걸리면 문서 전체가 private. 검색(내부 키워드)에는 계속 나온다
const PRIVATE_RULES = [
  // 단어가 아니라 "값이 붙은 형태"만 잡는다 — 회의록이 '계약서', '비밀번호 요구 앱'을 언급하는 것만으로는 걸리지 않게
  ['급여·연봉', /연봉|급여|월급/],
  ['주민·여권번호', /주민등록번호|주민번호|여권번호|외국인등록번호/],
  ['계좌', /계좌\s?번호\s*[:：]?\s*[\d-]{6,}|(?<![\d-])\d{3,6}-\d{2,6}-\d{4,8}(?![\d-])/],
  ['비밀번호', /(?:비밀번호|패스워드|password|passwd|pw)\s*[:：=]\s*\S+/i],
  ['전화번호', /01[016789][- ]?\d{3,4}[- ]?\d{4}/],
  ['이메일', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['사업자번호', /사업자등록번호\s*[:：]?\s*\d|(?<![\d-])\d{3}-\d{2}-\d{5}(?![\d-])/],
];
// --private-file: 줄마다 규칙. `path:폴더나 파일명 일부`(경로 일부 일치, 대소문자 무시) 또는 `re:정규식`(본문·제목). `#`은 주석
const userRules = privateFile
  ? (await readFile(privateFile, 'utf8')).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) =>
      l.startsWith('re:') ? ['사용자 정규식', new RegExp(l.slice(3), 'i')] : ['사용자 경로', l.replace(/^path:/, '').toLowerCase()])
  : [];
const privateHits = new Map();
function privateReason(path, text) {
  for (const [name, rule] of [...PRIVATE_RULES, ...userRules]) {
    const hit = typeof rule === 'string' ? path.toLowerCase().includes(rule) : rule.test(text);
    if (hit) { privateHits.set(name, (privateHits.get(name) || 0) + 1); return name; }
  }
  return null;
}

let redacted = 0;
const redact = (t) => t
  .replace(/((?:password|passwd|pw|비밀번호|패스워드)\s*[:：=]\s*)\S+/gi, (_, pre) => { redacted++; return `${pre}[가림]`; })
  .replace(/\b(?:sk|pk|ghp|gho|xox[bpa])[-_][A-Za-z0-9_-]{16,}/g, () => { redacted++; return '[가림]'; });

// 문서 날짜 — 파일명 → 본문 앞부분 순서로 첫 일치. "2026년 4월 28일", "2026-04-28", "25.9.8" 형식
function findDate(...texts) {
  const forms = [
    /(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
    /(?<!\d)(20\d{2})[-./](\d{1,2})[-./](\d{1,2})(?!\d)/,
    /(?<!\d)(2\d)\.(\d{1,2})\.(\d{1,2})(?!\d)/,
  ];
  for (const t of texts) for (const re of forms) {
    const m = t.match(re);
    if (!m) continue;
    const y = +m[1] < 100 ? 2000 + +m[1] : +m[1], mo = +m[2], d = +m[3];
    if (y >= 2020 && y <= 2030 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

function chunk(text) {
  const out = [];
  let cur = '';
  for (const para of text.split(/\n{2,}/)) {
    for (let p = para; p.length; p = p.slice(CHUNK)) {
      const piece = p.slice(0, CHUNK);
      if (cur && cur.length + piece.length + 2 > CHUNK) { out.push(cur); cur = ''; }
      cur += (cur ? '\n\n' : '') + piece;
    }
  }
  if (cur) out.push(cur);
  return out;
}

async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (['.md', '.csv'].includes(extname(e.name).toLowerCase())) yield p;
  }
}

const rows = []; // [doc, path, title, doc_date, idx, content, private] — doc = 파일 하나. 해시를 뗀 경로가 겹쳐도 페이지는 따로 센다
// 노션 내보내기는 같은 페이지를 "(1)" 복사본·"제목 없음" 폴더·아카이브에 여러 번 담는다(이번 데이터는 38%가 중복).
// 본문이 같으면 경로가 가장 짧은 파일 하나만 남긴다 — 안 그러면 검색 결과와 LLM 근거가 같은 문서 사본으로 채워진다
const paths = [];
for await (const f of walk(dir)) paths.push(f);
paths.sort((a, b) => a.length - b.length || a.localeCompare(b));
const seen = new Map(); // 본문 키 → 남긴 문서 번호
const forcePrivate = new Set(); // 사본 중 하나라도 private이면 남긴 문서도 private — 경로 규칙이 사본마다 다르게 걸려도 새지 않게
let files = 0, dupes = 0;
for (const f of paths) {
  files++;
  const raw = (await readFile(f, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
  const path = relative(dir, f).split('/').map(stripHash).join('/').replace(/^개인 페이지 & 공유된 페이지\//, '');
  const name = stripHash(basename(f, extname(f)));
  const heading = extname(f) === '.md' && raw.match(/^# (.+)$/m);
  const title = (heading ? heading[1] : name).trim().slice(0, 300);
  const text = heading ? raw.replace(heading[0], '').trim() : raw;
  // 링크 주소와 공백을 지운 본문이 같으면 같은 문서. 본문이 거의 없는 페이지는 제목까지 같아야 중복
  const norm = text.replace(/\]\([^)]*\)/g, ']').replace(/\s+/g, '');
  const key = norm.length < 40 ? `${title}\u0000${norm}` : norm;
  if (seen.has(key)) {
    dupes++;
    if (privateReason(path, `${title}\n${raw}`)) forcePrivate.add(seen.get(key));
    continue;
  }
  seen.set(key, files);
  const body = redact(text);
  const date = findDate(name, body.slice(0, 800));
  const reason = privateReason(path, `${title}\n${raw}`);
  if (reason && listPrivate) console.log(`[${reason}] ${path}`);
  const parts = chunk(body);
  (parts.length ? parts : ['']).forEach((c, i) => rows.push([files, path, title, date, i, c, !!reason]));
}
for (const r of rows) if (forcePrivate.has(r[0])) r[6] = true;
const pages = new Set(rows.map((r) => r[0])).size;
console.log(`질문 제외(private) 문서 ${new Set(rows.filter((r) => r[6]).map((r) => r[0])).size}개 — ` + ([...privateHits].map(([k, v]) => `${k} ${v}`).join(', ') || '없음'));
console.log(`날짜를 읽은 페이지 ${new Set(rows.filter((r) => r[3]).map((r) => r[0])).size}개`);
console.log(`중복 제거 ${dupes}개`);
console.log(`파일 ${files}개 → 페이지 ${pages}개, 청크 ${rows.length}개, 가린 값 ${redacted}곳`);
if (dry || listPrivate) process.exit(0);

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error('DATABASE_URL이 없습니다.'); process.exit(1); }
const sql = neon(url);
const ddl = (await readFile(new URL('../db/search.sql', import.meta.url), 'utf8'))
  .replace(/--.*$/gm, '').split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
for (const stmt of ddl) await sql.query(stmt);

const batches = [];
for (let i = 0; i < rows.length; i += BATCH) {
  const part = rows.slice(i, i + BATCH);
  batches.push(sql.query(
    'insert into notion_chunks (doc, path, title, doc_date, idx, content, private) select * from unnest($1::int[], $2::text[], $3::text[], $4::date[], $5::int[], $6::text[], $7::boolean[])',
    [0, 1, 2, 3, 4, 5, 6].map((c) => part.map((r) => r[c]))));
}
// 한 트랜잭션 — 실패하면 기존 색인이 그대로 남는다
await sql.transaction([sql.query('truncate notion_chunks restart identity'), ...batches]);
console.log('색인 완료');

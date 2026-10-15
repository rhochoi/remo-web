-- 내부 노션 검색. scripts/index-notion.mjs가 실행 때 같은 정의로 만든다(수동 실행도 가능).
-- 문의 데이터(inquiries)와 섞지 않는다 — 별도 테이블, 전체 재색인 시 통째로 교체.
create extension if not exists pg_trgm;

create table if not exists notion_chunks (
  id      bigint generated always as identity primary key,
  doc     int  not null,   -- 내보내기 파일 하나당 번호(경로가 겹쳐도 페이지를 구분)
  path    text not null,   -- 노션 내보내기 경로(해시 제거)
  title   text not null,
  private boolean not null default false,  -- true면 /api/ask(외부 LLM 전송)에서 제외. 키워드 검색에는 나온다
  doc_date date,           -- 문서에서 읽은 날짜(회의 날짜 등). 없으면 null — 시간순 정리에 쓴다
  idx     int  not null,   -- 같은 페이지 안의 청크 순번
  content text not null,
  tsv     tsvector generated always as (to_tsvector('simple', title || ' ' || content)) stored
);

-- 이전 버전 테이블이 이미 있으면 새 컬럼을 보강한다(전체 재색인이 값을 채운다)
alter table notion_chunks add column if not exists doc int not null default 0;
alter table notion_chunks add column if not exists doc_date date;
alter table notion_chunks add column if not exists private boolean not null default false;

-- 한국어는 조사가 붙어 형태소 분석 없이는 FTS가 약하다 → 부분 일치(trigram)로 후보를 뽑고, FTS 접두어 일치로 순위를 매긴다
create index if not exists notion_chunks_trgm on notion_chunks using gin ((title || ' ' || content) gin_trgm_ops);
create index if not exists notion_chunks_tsv on notion_chunks using gin (tsv);

-- /api/ask 호출 기록 — 하루 호출 수 상한(ASK_DAILY_LIMIT)을 인스턴스와 무관하게 세기 위한 것. 질문 내용은 저장하지 않는다
create table if not exists ask_log (
  created_at timestamptz not null default now()
);
create index if not exists ask_log_created on ask_log (created_at);

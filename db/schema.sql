-- 문의 저장 테이블. api/inquiry.js가 첫 요청 때 자동 생성한다(같은 정의 유지). 수동 생성도 가능.
create table if not exists inquiries (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),  -- 제출 = 개인정보 동의 시각
  org        text not null,   -- 소속과 역할
  email      text not null,
  problem    text not null,   -- 해결하려는 문제
  tried      text,            -- 지금까지 시도한 것
  kind       text,            -- 협업 형태
  timeline   text,            -- 일정 범위
  budget     text             -- 예산 범위
);

-- 동의문의 "1년간 보관" — 만료분 삭제 (월 1회 수동 실행)
-- delete from inquiries where created_at < now() - interval '1 year';

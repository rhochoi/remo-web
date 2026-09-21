# 계획 11 — pencil-new.pen 구현 (2026-09-21)

계기: 팀장이 Pencil로 직접 그린 `pencil-new.pen`("REMO Portfolio · Home Final / Home Mobile / Projects Index / Project Detail Template / People Page / Contact Sheet / Interaction & Responsive Spec")을 "이걸 토대로 코드를 짜볼래?".
파일 안의 "Variation" 보드 4장(Team Portfolio Home · Archive · Studio Journal · Exhibition)은 대안 시안으로 보고 쓰지 않았다.
형식: 결정 / 이유 / 근거 / 기각안.

## 1. 구조 — 원페이지 → 4페이지

| 파일 | .pen 프레임 | 내용 |
|---|---|---|
| `index.html` | Home Final · Home Mobile | 내비 → 사진 히어로 560/344 → WHAT WE DO 카드 3 → SELECTED PROJECTS 카드 4(모바일은 행 리스트) → 잉크 밴드(팀) → 오렌지 밴드(문의) |
| `projects.html` | Projects Index | 필터 칩(URL `?filter=` 유지) → 380px 카드 → 결과 없음 CTA |
| `people.html` | People Page + Contact Sheet 상단 | 이름 카드 10(사진 자리 4:5) → 사진 + 비전·의사결정·분기 목표 |
| `contact.html` | Contact Sheet + 기존 폼 | 스펙 카드 4 + Formspree 폼 → 사진 + 썸네일 3 자리 |
| `assets/site.css` · `site.js` | Spec | 공통 스타일, 메뉴 sheet·필터·폼·toast |

Project Detail Template은 만들지 않았다 — 상세 본문이 노션에 있고 사이트에서 복제하면 출처가 둘이 된다(README 콘텐츠 기준). 카드는 노션으로 간다.

## 2. 결정

| 항목 | 결정 | 이유 | 근거 | 기각안 |
|---|---|---|---|---|
| 콘텐츠 | .pen의 카피(REMO DESIGN · LEINN · PJ 공유회 · 지민/서윤/민재 · "질문을 만들고…")는 쓰지 않고 노션 원문·팀 확인 사실로 교체 | 없는 사례·역할·사람을 만들지 않는다. 시안의 글은 자리표시로 판단 | README 콘텐츠 기준 · 결정 권한 1 | 시안 카피 그대로 — 사이트 전체가 거짓말이 됨 |
| WHAT WE DO 3 | 데이터 분석 / 디자인 / 프로토타입 | 팀 확인(2026-09-17)된 산출물 유형 3개가 시안의 "3카드"와 정확히 맞는다 | structure.md §첫 화면 | 브랜드 경험/교육과 문화/커뮤니티(시안) — 리모의 일이 아님 |
| 프로젝트 카드 이미지 | 이미지 없음 → 색 타일(블루·오렌지·그린·흰). `<img>`만 넣으면 오버레이 카드로 전환 | 사진 1장을 4번 돌려 쓰면 "썸네일 있는 척". Studio Journal 보드의 색 타일이 같은 파일 안에 있는 대안 | 콘텐츠 기준 · .pen Journal 프레임 | 팀 사진 4회 반복 — 정직하지 않음 |
| People 카드 | 사진 자리는 근백색 타일 + 번호, 역할 칸은 "리모 · 협동조합원" | 역할 미게시는 팀 결정(포지션 비움). 사진은 팀이 고르는 대로 채움 | 팀 결정 · plan-02 | 시안 역할(Creative Direction 등) — 없는 정보 |
| 오렌지 | 채움·사진/잉크 위 글자 `#FF5A1F`, 근백색 위 작은 글자 `#B93A08` | 원값 on 근백색 2.88:1 — 12px 키커에 못 쓴다 | 명암 계산(plan-10 §3) · 권한 1 > 4 | 원값 전면 — AA 실패 |
| 서체 | Pretendard | Funnel Sans는 한글 없음 | 가이드 v4 | — |
| 히어로 h1 | `.sr-only` | 시안 히어로는 사진 + 눈썹 라벨뿐. 문서 제목은 보조기기·검색에 필요 | WCAG 2.4.6 · plan-08 §6 | 보이는 h1 — 시안과 다름 |
| 로고 | 텍스트 워드마크 "REMO CORE"(시안대로). PNG 로고는 이 라운드에서 미사용 | 팀장 시안이 텍스트 워드마크. README "로고 60% 이상" 규칙은 **보류**로 표기 | 취향(팀장) | PNG 유지 — 시안과 충돌 |
| 내비 | sticky 78/64px, 아래 1px 라인, 모바일은 36px 원형 버튼 → full-screen sheet(ESC·링크 클릭으로 닫힘) | Spec NAVIGATION | .pen Spec | — |
| 필터 | `?filter=` 읽고 `replaceState`로 쓰기, 결과 없음이면 초기화 CTA | Spec INTERACTION · STATES | .pen Spec | — |
| 반응형 | ≥1280 3열(홈 4열) / 768–1279 2열 / <768 1열, 모바일 홈은 행 리스트 | Spec RESPONSIVE + Home Mobile | .pen | — |

## 3. 검증 (2026-09-21, 로컬 8765)

1440: 히어로 560px, 내비 라인 `#D8D6CE`, 콘솔 오류 0, 4페이지 렌더. `?filter=brand` → Moodism만 표시·칩 pressed.
390: 히어로 344px, 가로 넘침 0, 카드 그리드 숨김·행 리스트 표시, 메뉴 버튼 표시, sheet open/close·ESC 동작.

## 4. 남는 것

- 프로젝트 화면·팀원 사진·로고 벡터가 오면 `.pcard`/`.person .photo`에 `<img>`만 추가하면 시안 그대로가 된다.
- README의 "로고 60%" 규칙과 "라운드 0" 규칙은 이 시안과 충돌 — 팀장 확인 후 README 개정.
- 문의 성공 toast는 실제 전송으로는 미검증(로컬에서 Formspree POST 안 함).

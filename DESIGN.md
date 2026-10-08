---
version: alpha
name: REMO-web
description: 리모(REMO) 학생 협동조합 포트폴리오 사이트의 디자인 시스템. 종이색 바탕, 잉크 글자, 주황 한 가지 강조색. 둥근 모서리와 굵은 Pretendard. 목적은 설득이 아니라 필터이므로 장식은 정보를 나를 때만 쓴다.

colors:
  ink: "#1A1A1A"
  paper: "#F7F6F2"
  soft: "#EEECE5"
  line: "#D8D6CE"
  muted: "#6C6A64"
  white: "#FFFFFF"
  orange-500: "#FF6A00"
  orange-700: "#9A3D00"
  orange-100: "#FFDACB"
  blue-600: "#3659E3"
  blue-700: "#2742B5"
  blue-200: "#ABC4FF"

typography:
  display:   { fontFamily: Pretendard, fontSize: "clamp(34px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: -0.04em }
  title:     { fontFamily: Pretendard, fontSize: 31px, fontWeight: 800, lineHeight: 1.13, letterSpacing: -0.035em }
  card-title: { fontFamily: Pretendard, fontSize: 21px, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.02em }
  body:      { fontFamily: Pretendard, fontSize: 15px, fontWeight: 400, lineHeight: 1.5 }
  caption:   { fontFamily: Pretendard, fontSize: 13px, fontWeight: 400, lineHeight: 1.4 }
  label:     { fontFamily: Pretendard, fontSize: 12px, fontWeight: 800, letterSpacing: 0.12em }

rounded: { card: 12px, tile: 10px, field: 10px, pill: 999px }
spacing: { gutter: "clamp(20px, 4.2vw, 60px)", grid-gap: 14px, section: "50px 60px", nav: 78px }

components:
  button-primary: { backgroundColor: "{colors.ink}", textColor: "{colors.white}", rounded: "{rounded.pill}", height: 44px, padding: "11px 17px" }
  button-accent:  { backgroundColor: "{colors.orange-500}", textColor: "{colors.ink}", rounded: "{rounded.pill}" }
  card-info:      { backgroundColor: "{colors.white}", border: "1px solid {colors.line}", rounded: "{rounded.card}", padding: 18px }
  card-project:   { backgroundColor: "{colors.ink-2}", textColor: "{colors.white}", rounded: "{rounded.tile}", padding: 18px }
  field:          { backgroundColor: "{colors.paper}", border: "1px solid {colors.line}", rounded: "{rounded.field}", padding: "12px 14px" }
  chip:           { backgroundColor: "{colors.white}", border: "1px solid {colors.line}", rounded: "{rounded.pill}", height: 38px }
---

# DESIGN.md: REMO-web

이 파일은 `site/assets/site.css`의 실제 값과 [브랜드 가이드 v4](docs/brand-guide-v4.md)를 에이전트가 읽을 수 있는 형태로 옮긴 것이다. 값의 출처는 항상 코드이고, 이 문서와 코드가 다르면 코드가 맞다. 형식은 [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)의 Notion 항목을 구조 참고로 삼았다(섹션 순서, 토큰 front matter, Do/Don't, Known Gaps). Notion의 색·서체 값은 가져오지 않았다. 리모의 정체성은 브랜드 가이드 v4가 정한다.

## Overview

- **모드(Impeccable):** Experience. 포트폴리오라서 작업물이 먼저 보이고 인터페이스는 물러난다.
- **다이얼(taste-skill):** DESIGN_VARIANCE 6 · MOTION_INTENSITY 3 · VISUAL_DENSITY 3. 근거는 [REMO-OVERRIDES](.claude/skills/REMO-OVERRIDES.md).
- **대상:** 잠재 클라이언트·파트너. 사이트는 설득이 아니라 필터다([decisions.md](docs/decisions.md)).
- **한 문장:** 형태는 유쾌하게, 운용은 절제되게.
- **색 비율(홈 배경 면적):** 종이 약 63% · 블루 13% · 구획 11% · 주황 12%. 글자와 선(잉크)은 별도.

## Colors

원값은 로고 파일(820px PNG)에서 실측한 3색뿐이고, 나머지는 OKLCH에서 명도만 바꿔 만든 파생 스케일이다. 정의와 검사는 `docs/tools/color-tokens.py` → `site/assets/tokens.css`(자동 생성, 직접 고치지 않는다). 근거와 이론은 [plan-18](docs/plan-18-color.md).

| 역할 | 토큰 | 값 | 용도 |
|---|---|---|---|
| 잉크 | `--ink` | `#1A1A1A` | 글자, 외곽선 3px, 기본 버튼. 순흑 아님 |
| 종이 | `--paper` / `--soft` | `#F7F6F2` / `#EEECE5` | 바탕 / 구획 바탕 |
| 주황 | `--orange` (= orange-500) | `#FF6A00` | **채움면**과 포인트. 글자 색으로 밝은 바탕에 쓰지 않는다 |
| 주황 글자 | `--orange-text` (= orange-700) | `#9A3D00` | 밝은 바탕 위 작은 주황 라벨. 종이·구획·흰 바탕 모두 4.5:1 이상 |
| 블루 | `--blue` (= blue-600) | `#3659E3` | 섹션 모드(관계)와 타일. 위 글자는 흰색만 |
| 블루 톤 | `--blue-tint` (= blue-200) | `#ABC4FF` | 블루 위 비활성 도형(투명도 대신) |
| 보조 글자 | `--muted` | `#6C6A64` | 종이 5.0, 구획 4.6 |

규칙:
- **한 번에 한 색.** 종이 위에서는 주황이 포인트, 블루 섹션 안에서는 블루가 바탕이고 주황은 상태 표시에만 쓴다.
- **주황과 블루를 맞닿게 두지 않는다.** 두 색은 보색에 가까워(색상각 차 137°) 경계에서 진동한다. 사이에 잉크 3px 선이나 종이 구획을 둔다.
- **주황 면에는 잉크 외곽선.** 주황과 종이의 대비는 2.7:1이라 면 단독으로는 경계가 약하다.
- **블루 위 글자는 흰색.** 잉크/블루는 3.1:1이라 외곽선(그래픽)에만 쓴다.
- **상태를 색만으로 알리지 않는다.** 선택된 칩은 주황 채움 + ✓.
- 다크 모드는 정의하지 않는다(라이트 단일).

## Typography

Pretendard dynamic-subset 한 가지. 위계는 크기보다 굵기(800)와 자간(-0.02 ~ -0.04em)으로 만든다. 본문은 `word-break: keep-all`. 제목은 `text-wrap: balance`. 라벨은 12px/800/0.12em 대문자.

## Layout

- 콘텐츠 최대폭 1440px, 좌우 gutter `clamp(20px, 4.2vw, 60px)`.
- 정보 섹션은 좌 490px 고정 열과 우 가변 열(`.head`). 1023px 이하에서 1열.
- 프로젝트 그리드는 4열, 1279px 이하 2열, 767px 이하 모바일에서는 행 리스트(`.plist`)로 바뀐다.
- 균등 3열 카드는 기본값이 아니다. 3열 카드(`.cards3`)는 "하는 일 3가지"라는 내용이 3개라서만 쓴다.

## Elevation & Depth

그림자는 토스트 하나뿐이다. 깊이는 1px 선과 바탕색 차이(paper → soft → white)로 만든다. 카드 안에 카드를 넣지 않는다.

## Shapes

카드 12px, 프로젝트 타일 10px, 입력 10px, 버튼·칩 pill. 둥근 정도는 브랜드 가이드의 "통통한" 성격에서 온다. 각진 모서리를 섞지 않는다.

## Components

- **내비:** 78px(모바일 64px), sticky, 1px 하단선, 현재 페이지는 주황 밑줄. 모바일은 전체 화면 시트.
- **버튼:** primary(잉크 pill), accent(주황 pill). 최소 높이 44px. 눌림은 `translateY(1px)` 120ms.
- **프로젝트 카드:** 사진 + 검정 오버레이 + 흰 제목, 사진이 없으면 색 타일. 사진이 밝으면 오버레이를 .66으로 올려 7.3:1을 맞춘다.
- **히어로:** 사진 풀블리드 560px(모바일 344px). 위쪽 스크림 .62를 깔아야 주황 라벨이 읽힌다.
- **폼:** 흰 카드 안 2열, 입력 16px(iOS 확대 방지), 포커스는 잉크 테두리 + 주황 링.
- **칩 필터:** `aria-pressed`로 상태 표현, URL query 유지.

## Motion

예산은 작다. 허용: 카드 hover(translateY -3px), 화살표 4px 이동(링크임을 알리는 정보), 눌림 1px, 히어로 진입(900ms, 오버슈트 없는 ease-out), 하는 일 카드 3장의 스크롤 진입(opacity .35에서 시작, 순수 CSS `animation-timeline: view()`). 금지: 바운스·엘라스틱 이징, JS 애니메이션 라이브러리, 정보를 가리는 진입. 전부 `prefers-reduced-motion`에서 꺼진다.

## Do's and Don'ts

Do
- 없는 값은 비운다. 그럴듯한 가짜 이름·수치를 넣지 않는다.
- 새 색을 만들기 전에 위 토큰으로 되는지 먼저 본다. 색을 바꿀 때는 `color-tokens.py`의 대비 검사를 통과시킨다.
- 사진 위 글자는 대비를 계산해서 오버레이를 정한다.
- 한 번 바꿀 때마다 `docs/`에 근거와 재검토 조건을 남긴다.

Don't
- CTA 문구로 설득하지 않는다(필터 전제).
- em-dash(—)를 구분자로 쓰지 않는다. 문장을 다시 쓴다.
- 보라·파랑 그라디언트, 카드 중첩, 아이콘 타일, 3열 균등 카드로 채우지 않는다.
- 프레임워크·애니메이션 라이브러리를 들이지 않는다(라이브러리 0 예산).

## Responsive Behavior

브레이크포인트 767 / 1023 / 1279. 터치 대상 최소 44px(칩 필터는 38px로 예외, 재검토 대상). 390px에서 가로 스크롤 0.

## Iteration Guide

1. 이 파일과 `REMO-OVERRIDES.md`를 먼저 읽는다.
2. 스킬이 "금지"라고 하면 판정표에서 찾고, 없으면 근거를 평가해 판정표에 추가한다.
3. 변경은 `docs/plan-*.md`에 남긴 뒤 커밋한다.

## Known Gaps

- 히어로 h1은 `sr-only`라 첫 화면에 보이는 문장이 없다. 필터 전제에 따른 결정이지만 검색 결과 미리보기는 `<title>`에 의존한다.
- 칩 필터 높이 38px(터치 44px 미달).
- 다크 토큰 없음. 브랜드 가이드 v5에서 정의되면 추가.
- 팀 사진과 역할 문구는 팀이 확인하기 전까지 비워 둔다.

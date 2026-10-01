# 리모 웹 디자인 검토본 v2

2026-09-17. 기존 codex/design-polish 브랜치의 미커밋 변경을 이어 수정했다. GitHub 푸시와 Sites 등록·업로드·배포는 수행하지 않았다.

## 반영한 기준

- 사용자 제공 Drive > Remo design > REMO LOGO.png와 REMO_Brand_Design_Guide_v4.md를 확인했다. 원본 PNG의 형태와 색을 보존하고 투명 여백만 CSS 프레임으로 표시한다. 벡터 로고를 생성하거나 다른 폰트로 대체하지 않았다.
- 브랜드 가이드 원문은 brand-guide-v4.md. 프로젝트의 블루 단일 운용과 3D 금지를 유지한다. 가이드의 검정 위 블루 조합은 일반 텍스트에 적용하지 않으며, 본문은 밝은 바탕/잉크 또는 어두운 바탕/근백색으로 표시한다.
- Impeccable 공식 README의 shape/critique/typeset/layout 관점을 참고해 자료 우선, 반복 카드 제거, 타이포 위계와 여백 정리를 적용했다. Impeccable 스킬·CLI·훅은 설치하거나 실행하지 않았다.
- Open Props의 props.sizes.js에서 필요한 간격 변수만 채택했다. 전체 패키지·normalize·색상 테마는 추가하지 않았다. MIT 고지: site/assets/OPEN-PROPS-LICENSE.txt.
- Phosphor core Bold SVG 3개를 이동·펼치기에 사용한다. MIT 고지: site/assets/PHOSPHOR-LICENSE.txt.
- PhotoSwipe는 실제 프로젝트 이미지가 없으므로 추가하지 않았다. 사진·성과·역할·실험 결과를 만들지 않는다.

## 실제 동작

- 네 프로젝트 제목과 설명을 기본 노출하고, native details로 단계·참여자·노션 링크를 펼친다. JavaScript 없이도 펼칠 수 있다.
- 참여자 이름은 팀원으로, 팀원 옆 프로젝트 링크는 해당 항목을 열어 이동한다. 같은 해시를 다시 선택해도 열리며 키보드 초점은 제목으로 이동한다.
- 핵심 정보를 hover 뒤에 숨기지 않는다. 작은 화면은 로고/정의문/작업 순서로 재배치한다.
- 기존 문의 폼과 제출 코드는 보존했다. 실제 Formspree ID 전까지 hidden, 검색 noindex 유지.

## 검증과 범위

Chrome Playwright: 320×568, 390×667, 667×390, 768×1024, 1024×768, 1440×960.
가로 넘침, 이미지 로드, 클릭/Enter 펼치기, 같은 앵커 재선택, 팀원 이동, 스킵 링크 초점, 모션 감소, root 글자 크기 200% 레이아웃, JS 비활성 상태를 검사한다.
axe-core 4.10.3 WCAG 2 A/AA, 2.1 AA, 2.2 AA 태그 자동 검사: 위반 0건. 자동 검사는 전체 접근성 보증이 아니다. iOS Safari 실기기·네이티브 앱 빌드·스크린리더·실제 폼 전송·외부 노션 권한은 검증하지 않았다.

실행: 로컬 서버를 켠 뒤 Playwright를 사용할 수 있는 환경에서 `AXE_PATH=/path/to/axe.min.js node tests/layout.cjs`.
현재 미리보기: http://127.0.0.1:8765

## Sites 인계

Sites portable static 흐름을 확인하고 configure-execution-profile을 실행했다(configured=false: 기존 정적 프로젝트 유지).
승인 뒤 신규 Site 등록을 한 번 수행하고 project_id를 보존한다. site/ 내용을 dist/로 복사한 정적 산출물을 사용하며 .openai/hosting.json의 static.directory는 dist로 설정한다. 원본 GitHub Pages용 site/는 유지한다.
실제 로고를 포함한 소스의 외부 업로드·배포는 사용자 AGENTS.md의 직전 승인 조건에 따라 대기한다. 기본 검토 대상은 owner-only 비공개로 제안하며, 공개 사이트 전환은 별도 결정이다.

## 남은 자료

- 로고 벡터: PNG는 확보, SVG/AI 미확보.
- 프로젝트의 실제 산출물 이미지와 결정 기록.
- 팀원별 역할 및 공개 가능한 본인 소개.
- Formspree 실제 엔드포인트와 외부 전송 테스트 승인.

## 출처

- 사용자 자료: https://drive.google.com/drive/folders/1w1Ao4Ut7iFSD0zdgthzgW1K_uN99TJpG
- https://github.com/pbakaus/impeccable
- https://github.com/argyleink/open-props/blob/main/src/props.sizes.js
- https://github.com/phosphor-icons/core
- https://github.com/dequelabs/axe-core

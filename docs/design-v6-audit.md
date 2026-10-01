# v6 작업물 중심 개편 — 2026-09-17

## 목표별 검증 기준과 결과

1. 첫 화면: 무디즘 실제 차콜 2차 샘플, PLN 실제 노션 화면, 활동 사진을 동시에 배치. 활동 사진이 첫 화면을 독점하던 구조 제거. 의류 전체 형태 보존.
2. 프로젝트: 의류는 실물 및 샘플 과정, 템플릿은 실제 화면과 설계 의도로 표현. 주요 내용은 article에 항상 표시, details는 출처만. K-Pipe는 사용자가 구현 전임을 확인했으므로 가짜 소프트웨어 화면을 만들지 않고 기획 단계로 표기. DATAFLOW 2는 조사 기록으로 구분.
3. 로고: 데스크톱 94px/모바일 82px의 상단 서명. 원본 비율·색·윤곽 유지.
4. 사람: 열 명 이름 나열 제거. 각 작업에 참여자와 보고서의 실제 선택·고민 연결. 무디즘 팀의 브랜드 관점 인용, PLN 팀의 HTML 임베드·회고 설계 이유 요약. 팀 기록을 특정 개인의 단독 발언으로 바꾸지 않음.
5. 과정: 무디즘 1차 샘플→2차 디테일, 보고서의 치수 측정/전사/원단 문제, 수축률 테스트 원문 연결. 장식적 흔들림·가짜 실패·수치 없음. 서로 다른 사진의 크기와 비율은 전체 옷/봉제 디테일/디지털 화면을 읽기 위한 차이.

## 확인된 출처

- 2차 샘플(2026-09-08): https://remo-core.notion.site/2-3d64e56fc730803a9c88eea4c7b2694e
- 1차 샘플(2026-08-25): https://remo-core.notion.site/1-3c74e56fc73080fdb2d4f556ac6041ce
- 수축률 테스트(2026-08-26): https://remo-core.notion.site/3c94e56fc7308036be23f351fe236d55
- 전사 테스트(2026-09-07): https://remo-core.notion.site/3d64e56fc7308031a465c691273dd9a9
- 무디즘 보고서(2026-09-08): https://docs.google.com/document/d/1PkXrYlPzbInCpfbcrDUd5jqIhuu45j8Gui1UL2VnhAY/edit
- PLN 노션 메인페이지: https://drive.google.com/file/d/13NttwmhDnybhQZ_qs537JKYEtZPXGGW7/view
- PLN 보고서(본문 2026-09-08): https://docs.google.com/document/d/1f3U2Uze5Qnhixw7UC_D2CuijbhYZQcnn9kcoJFHOXdg/edit
- K-Pipe 기획: https://remo-core.notion.site/K-Pipe-3bd4e56fc730801fa19cf713a1ccbfc7

## 정보 경계

첫 샘플에서 2차 샘플로 특정 문제가 해결됐다고 단정하지 않음. 수축률 숫자/구체적 수정 원인은 원문 확인 불가하므로 생성하지 않음. 보고서의 재무 수치·사업자 연락처·개인 실명은 홈페이지에 옮기지 않음. 공개 노션을 읽어 확보한 자료이며 외부 재게시 승인은 별도. 이전 v5는 archive-before-v6에 보존.

## 검증

tests/concept.cjs: 6개 너비, 4개 상시 공개 프로젝트, 로고 크기, 이름 목록 제거, 이미지 로드와 확대/Escape/포커스 복귀, 과정 이동, 출처 펼침, JS 없는 정보 열람, reduced-motion, axe WCAG. 시각 검토는 v6-desktop/mobile/process PNG로 별도 기록. 이 검증은 브랜드에 대한 사용자 만족을 증명하지 않는다.

최종 결과: 테스트 PASS, git diff --check PASS, index/concept 일치. 데스크톱 첫 화면·과정 화면·390px 모바일을 브라우저에서 직접 확인. 신규 원본 PNG는 docs/source-assets-v6에 보존하고 페이지에는 최적화 JPG 사용.

# 리모 웹 v4 — 2026-09-17

실제 활동 사진 → 프로젝트 내용·참여자 → 사람들 순서로 수정. 큰 슬로건과 장식 라벨을 줄이고 사진 확대와 기본 details 펼침 사용.

- 구현: site/index.html, site/concept.html
- 이전 시안: docs/archive-before-v4/
- 검증: tests/concept.cjs. 320/390/600/768/1024/1440 가로 넘침, 이미지 로드, 사진 열기/Escape/포커스 복귀, 키보드 펼침, 링크 이동, JS 비활성 details 동작. axe WCAG 자동 위반 0.
- 브라우저 확인: docs/previews/v4-desktop.png, v4-mobile.png
- Design Report: remo-design-report.docx. 원본 템플릿 복제, 6페이지 전체 렌더 육안 확인.
- 한글 렌더: Apple SD Gothic Neo 지정 및 렌더 프로세스 FONTCONFIG_FILE에 시스템 폰트 경로 포함. 시스템 설정 변경 없음. 원본 styles.xml 보존.
- 미완료 범위: 개인별 작업 관점, 실제 제품 이미지, 수정 전후 실험 기록. 자료 없이 생성하지 않음.
- 외부 업로드·배포·Git push 미수행. 로컬 미리보기만 검증.

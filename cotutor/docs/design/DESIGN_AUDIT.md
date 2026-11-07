# 디자인 감사 — 지난 공모전 웹앱의 디자인 언어와 함께반에 적용할 규칙

작성일 2026-11-06. 목적: 함께반 v1 화면(폼 + 표)이 사용자가 지난 공모전에서 써 온 디자인 언어와 맞지 않아, 지난 작업을 직접 보고 공통 규칙을 뽑아 v2에 옮긴다.
범위: `대학교/3학년/` 아래 웹 프로젝트. 모든 원본 폴더는 읽기만 했다(정적 서버는 `python3 -m http.server --directory <dist>`로 띄우고 스크린샷은 스크래치 폴더에만 저장).

## 1. 무엇을 봤나

### 눈으로 본 것 (스크린샷)

| 프로젝트 | 본 화면 | 경로 |
|---|---|---|
| **마대 통과증 (masdae-pass)** — 기준 | 한눈에(밝음·어두움·390px), 에이전트 팀, 마대 통과증, 마대 입력 | `AI Innovation 공모전/masdae-pass/docs/screenshots/overview.png`, `overview-dark.png`, `overview-390.png`, `agent-team.png`, `pass-card.png`, `intake.png` |
| 닿는 경보 (TTA-Service) | 시나리오 선택 → 검증 루프 → 채널 카드 → 표준 표 | `TTA 공모전/TTA-Service/artifacts/qa/v2-A-01.png` |
| 이어받기 (경영정보학회·윤슬) | 대시보드, 에이전트 팀 | `경영정보학회/docs/screenshots/overview-1440.png`, `agents-1440.png` |
| SafePass (금융 AI 해커톤) | 팀 구성(오케스트레이터 → 단계별 역할 카드 → 사용자 확인 게이트) | `금융 AI 공모전 해커톤/제출 보고서/_generator/shots/post-04-agents.png` |
| H2L-Forge (신약개발 해커톤) | 실행 모니터(좌 단계 레일 + 우 근거 비평, KPI 줄, 근거·출처 카드) | `신약개발해커톤/portfolio/screenshots/01-research-console.png` |
| MoveValue (부산 데이터) | 좌 조건 패널 + 우 지도 | `부산 데이터 분석 공모전/deliverables/screenshots/01-main-screen.png` |
| 성남 3D 여행 (KAIST 성남) | 3D 지도 + 떠 있는 카드 패널 | `KAIST 성남 시 공모전/제출자료_작업/shot-story.png` |
| 폐기물 데이터 중간보고 (HTML 보고서) | 번호 매긴 절 + 표 + 차트 | `AI Innovation 공모전/reports/30차_HTML_개별시각화/qa_desktop.png` |
| masdae-market (dist 서빙) | 판매자·구매자·운송기사 3폰 로딩 화면(녹색 일러스트) | 스크래치 `design_audit/masdae-market.png` |
| TRITON (dist 서빙) | 어두운 갈색 사이드바, 그룹 메뉴(재판/에이전트/규칙과 기록), 로고 타일 + 자간 넓은 워드마크 | 스크래치 `design_audit/triton.png` (API 없음 → 404 배너) |
| 누리지킴이 (dist 서빙) | 좌 사이드바 + 일러스트 히어로 + 탐지 기법 칩 + 3칸 상태 카드 + 우측 도우미 패널 | 스크래치 `design_audit/nurijikimi.png` |
| SL 보행부담 경로 (dist 서빙) | 좌 조건 패널(세그먼트 버튼·레이어 체크) + 지도 + 범례 | 스크래치 `design_audit/sl-prototype.png` |
| 스마트시티 HESTIA (dist 서빙) | 어두운 시뮬레이터 셸(서버 없음 → 연결 대기 모달만 보임) | 스크래치 `design_audit/smartcity.png` |

### 코드만 본 것

| 프로젝트 | 본 파일 |
|---|---|
| masdae-pass | `frontend/tailwind.config.js`, `src/index.css`, `index.html`, `app/Layout.tsx`, `app/StatusChip.tsx`, `app/nav.ts`, `app/useTheme.ts`, `shared/ui/{Card,Badge,Section,StatusPill}.tsx`, `shared/theme/colors.ts`, `features/overview/{index,HowTo,KpiCards,TeamGlyph,NewsList}.tsx`, `features/agent-team/{FlowRail,AgentCard,TeamColumn,GatePanel,OrchestratorCard}.tsx` |
| 이어받기(윤슬) | `frontend/tailwind.config.js` (색 하나에 뜻 하나, `night.*`는 밤 영역에만) |
| 닿는 경보 | `src/styles.css` CSS 변수(`--accent #2E70E5`, `--line #D6E2EC`, Pretendard + 모노) |
| 트라이톤 공모전 | `app/.artifacts/dist`는 브라우저 확장 산출물이라 웹 화면 없음 |
| AI Platform Build Challenge | dist 없음, 웹 화면 확인 못 함 |

## 2. 반복되는 디자인 시스템

### 레이아웃 셸
- **왼쪽 고정 사이드바 240px**(masdae-pass, 이어받기, 누리지킴이, TRITON, H2L-Forge, SafePass): 맨 위 **로고 타일(32px, 둥근 사각, 브랜드색) + 제품명(굵게) + 모노 부제**(`agent harness · v0.1`). 메뉴는 **그룹 제목(11px 회색) + 아이콘 16px + 라벨**, 활성 항목은 브랜드 연한 배경. 맨 아래에 면책 한두 줄.
- **얇은 상단 바(56px)**: 오른쪽에 **AI 상태 알약**(점 + CPU 아이콘 + "LLM 켜짐" + 모노 모델명, 보라 톤)과 **다크 토글**(테두리 버튼). 모바일은 햄버거 + 로고.
- 본문 `max-w-[1280px]`, 카드 사이 `gap 20px`, 회색 바탕(slate-50) 위 흰 카드.

### 색
- 바탕 `slate-50`, 카드 `white` + `slate-200` 테두리 + `shadow-sm`, 어두움은 `slate-950` / `slate-900` / `slate-800`.
- **브랜드 = teal 1색**(`teal-600 #0d9488`, 히어로 강조 `teal-300 #5eead4`, 버튼 `teal-400`).
- **뜻 색은 하나에 하나**: 보라 = LLM/AI, 초록(emerald) = 통과·완료, 호박(amber) = 경고·확인 필요, 장미(rose) = 막힘·위반, 하늘(sky) = 실행 중. 팀/학년마다 고유 색(분석 sky, 연결 emerald, 검증 amber)으로 열 전체를 연하게 칠한다.
- 히어로만 **어두운 남색 판(slate-900) + 24px 격자 무늬 + 오른쪽 위 teal 번짐**.

### 글자
- **Pretendard Variable**(전 프로젝트 공통) + **JetBrains Mono / ui-monospace**(ID·코드·ms·숫자).
- 단계: 히어로 34px/800, 페이지 제목 24px/800, 카드 제목 15px/700, 본문 14px, 캡션 11~12px. eyebrow는 **모노 11px 대문자 자간 0.14em teal**(`ORCHESTRA`, `PASS`, `INTAKE`).
- `word-break: keep-all`, `tnum`.

### 부품
- **Section 카드**: 제목 15px + 한 줄 설명 12px + 오른쪽 액션.
- **KPI 타일**: 아이콘 + 라벨 → 모노 28px 숫자 + 단위 → 출처 캡션 → 아래 teal 그라데이션 2px 선.
- **"이렇게 씁니다" 띠**: 번호 타일(teal 정사각 36px, 모노 숫자) + 아이콘 + 제목 + 한 줄 + 오른쪽 꺾쇠.
- **흐름 레일(stepper)**: 원 28px(완료 = 색 + 체크, 실행 = 링 + ping, 대기 = 회색) + 굵은 라벨 + 회색 부제, 사이를 2px 선(진행 중이면 흐르는 점선).
- **에이전트 카드**: 이름 + 모노 id + 상태 알약 → 3줄 요약 → 구분선 아래 `414 ms · 주장 10 · LLM`(모노).
- **게이트 패널**: ShieldCheck/ShieldX 아이콘 행 + 통과/막음 배지, 최종 결과는 teal 연한 상자.
- **배지**: `rounded-md px-1.5 text-[11px] ring-1 ring-inset` 연한 배경. 상태 알약은 `rounded-full` + 점.
- **근거 목록**: 굵은 제목 + 외부 링크 아이콘 → 회색 사실 한 줄 → 모노 `출처 · 날짜`.
- 번호 매긴 절(`00`, `01` … 모노 teal 숫자 + 제목, 절 사이 점선) — 통과증, TTA(`1단계`), 보고서 공통.

### 움직임
- `rise`(6px 아래에서 0.35초), `pulse`/`ping`(실행 중 점), `shimmer`(실행 중 카드 윗선), `flow`(흐르는 점선). 카드 호버는 `-translate-y-0.5` + 그림자. 그 이상은 쓰지 않는다.

### 정보 밀도와 이야기 순서
- 첫 화면 = **히어로(문제 한 문장 + 강조 단어) → 3단계 사용법 → KPI 4칸(출처 캡션) → 차트·근거 기사 → 최근 실행**.
- 실행 화면 = **흐름 레일 → 지휘/계획 카드 → 팀별 색 열 → 검증 게이트와 요약**. "AI가 한 것"과 "규칙이 한 것"을 배지로 나눈다(LLM 보라 / 규칙 회색).
- 모든 숫자에 출처를 붙이고, 확인 안 된 수치는 배지로 표시한다("원문 확인 필요", "템플릿 요약").
- 면책·한계는 숨기지 않되 작게(사이드바 아래, 섹션 캡션).

## 3. 함께반 v2에 적용할 규칙

1. **셸**: masdae-pass `Layout`을 옮긴다. 사이드바 그룹 `수업`(한눈에 / 수업 설계 / 타임라인) · `교실`(질문함 / 다음 차시) · `근거`(성취기준 / 데이터·원칙). 로고 타일 + "함께반" + 모노 `co-teacher · v0.2`. 상단 오른쪽 AI 알약(`live·ollama ax4-light` / `replay·녹화` / `rules`) + 데모 리셋 + 다크 토글.
2. **토큰**: `brand` = Tailwind teal 값 그대로. 뜻 색은 masdae-pass와 같게(보라 AI, 초록 통과, 호박 경고, 장미 위반). **학년 고유색**: 낮은 학년 = blue, 높은 학년 = orange, 함께(★) = teal. 이 세 색은 학년 말고 다른 뜻으로 쓰지 않는다.
3. **글자**: Pretendard Variable + JetBrains Mono(CDN, 오프라인이면 시스템 글꼴로 내려감). 성취기준 코드·시각·ms·세션 코드는 모두 모노.
4. **한눈에(새 화면)**: 어두운 히어로 + teal 강조 단어 "20분" + CTA 2개 + 오른쪽 4단계 루프 도식 → "이렇게 씁니다" 4칸 → KPI 4칸(출처 캡션·확인 필요 배지) → 오늘 수업 미리보기 + 현장 근거 → 최근 AI 실행.
5. **수업 설계**: AI 파이프라인을 에이전트 팀 화면처럼 — 흐름 레일 6단계 + 단계 카드 6장(상태 알약, ms, `AI` 보라 / `코드` 회색 배지). 과정안은 표 대신 **두 레인 수업 보드**(★ 행은 두 열을 가로지르고, 분리 구간은 학년 색 카드). 검사·수리는 **검증 게이트** 패널.
6. **타임라인**: 범례 띠, 둥근 블록, 위반 구간 점선 하이라이트, R1~R12는 게이트 행(방패 아이콘 + 통과/위반 배지)과 숫자 타일.
7. **질문함**: 어두운 QR 카드(히어로와 같은 판) + 큰 모노 코드, 실시간 숫자 타일, 학년 색 열, 묶음 카드는 왼쪽 학년 색 띠.
8. **다음 차시**: 인쇄 카드처럼 — 번호 원 단계, 승인 도장(teal), 반려는 흐리게, 초안은 호박 테두리.
9. **학생 페이지**: 로고 타일 + 큰 질문 카드, 학년 버튼은 학년 색, 터치 영역 52px 이상, 밝은 화면 고정.
10. **인쇄**: 다크 변형은 `@media screen`에서만 켜서 인쇄는 늘 밝은 화면. 사이드바·상단 바는 `no-print`.
11. 움직임은 masdae-pass 4종(rise, ping, shimmer, flow)만.

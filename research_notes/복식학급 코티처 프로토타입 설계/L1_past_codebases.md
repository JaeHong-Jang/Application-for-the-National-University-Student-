# L1. 과거 공모전·해커톤 코드베이스 분석: 복식학급 코티처 프로토타입에 재사용할 것

- 작성일: 2026-11-06
- 방법: 읽기 전용 조사. `package.json`·`pyproject.toml`, README, CLAUDE.md/AGENTS.md, LLM 호출 코드, UI 토큰을 직접 열어 보았다. 빌드·설치·실행은 하지 않았다. node_modules, .venv*, dist, .next, .cache, 데이터 덤프는 건너뛰었다.
- 경로 약어: `$R` = `/mnt/c/Users/User/Desktop/대학교/3학년`. 이 문서의 경로는 모두 `$R` 아래의 절대 경로다.
- 목표 프로토타입: 교사용 복식학급 수업 설계 → 직접/간접지도 타임라인 → 학생 QR 질문 제출 → AI 군집화와 다음 차시 학년별 보충·심화 활동 생성. 팀은 2~4인이고 개발 시간은 6~22시간이다.

---

## 0. 한 줄 결론

이 학생은 **"React 19 + TypeScript + Vite(또는 Next) 화면, 얇은 Node·Python 서버, LLM은 JSON 스키마 강제 구조화 출력, 규칙과 목(mock)으로 폴백, 계약 문서(contracts) 먼저 작성"** 패턴을 여러 프로젝트에서 반복해 왔다. 새 프로토타입에 그대로 옮기기 좋은 부품은 네 가지다.

1. **윤슬(경영정보학회)**: Zod 기반 Claude 구조화 호출(`llm.ts`), SSE 실시간 피드(`server.ts`와 `live.tsx`), 시연 자동 재생(`demo.ts`), 역할별 사이드바(`nav.ts`).
2. **masdae-market**: QR 생성·스캔 컴포넌트와 Vite 멀티 엔트리(교사 화면과 학생 화면 분리).
3. **TTA-Service**: replay/live LLM 어댑터와 "생성 → 검증 → 재생성 → 폴백" 루프. 키 없이 시연하는 장치다.
4. **masdae-pass**: Tailwind 카드·버튼·FlowRail 컴포넌트, 인쇄 CSS, snapshot/fixtures/live 3모드 API 클라이언트.

---

## 1. 프로젝트별 분석

### 1-1. AI Innovation 공모전 / masdae-market (잔재미, 마대 장터)
- **목적**: 산업 부산물 거래 앱. 판매자(공장)·구매자(재활용업체)·운송기사 3역할로 구성했고, Microsoft "산업자원 순환 AI Agent" 과제에 냈다.
- **스택**: React **19.3** + TS + Vite 멀티 페이지(buyer/carrier/seller 3개 엔트리), 손으로 쓴 CSS(Tailwind 아님), leaflet, maplibre-gl, `qrcode`, `jsqr`. 테스트는 vitest, Testing Library, jsdom을 썼다.
  - 근거: `$R/AI Innovation 공모전/masdae-market/frontend/package.json`, `$R/AI Innovation 공모전/masdae-market/frontend/vite.config.ts`(rollupOptions.input에 4개 엔트리, `/mnt/c`용 `usePolling`)
- **백엔드/DB**: FastAPI + SQLAlchemy 2 + Pydantic 2. 기본 DB는 SQLite이고 Postgres도 지원한다. JWT 인증.
  - `$R/AI Innovation 공모전/masdae-market/backend/pyproject.toml`
- **AI 통합**
  - Provider 프로토콜은 `chat(system, user, schema)`이고, `LLM_PROVIDER=off|mock|ollama|claude`로 고른다. `$R/AI Innovation 공모전/masdae-market/backend/app/llm/base.py`, `claude.py`, `mock.py`, `ollama.py`
  - Claude는 공식 `anthropic` SDK의 `output_config.format = json_schema`로 구조화 출력을 받는다. 15초 벽시계 데드라인을 스레드로 강제한다(`call_with_deadline`).
  - 에이전트 팀, 흐름, 게이트는 YAML 하나로 선언한다. `$R/AI Innovation 공모전/masdae-market/harness/harness.yaml`(모델 `claude-sonnet-5-5`, 로컬 `ax4-light:q4_K_M`)
  - 게이트 3종: 근거·금지 표현·개인정보(전화·이메일·주민번호 정규식). `$R/AI Innovation 공모전/masdae-market/backend/app/harness/gates.py`. LLM 요약이 게이트에 걸리면 1회 재요청하고, 다시 걸리면 템플릿 요약을 쓴다.
- **디자인**: 브랜드 #286347, 바탕 #FAF8F3, 금색 #F2B544. 터치 영역은 최소 44px, 주요 버튼은 52px, 보조 글자는 14px 이상. `$R/AI Innovation 공모전/masdae-market/docs/DESIGN.md`, `$R/AI Innovation 공모전/masdae-market/frontend/src/shared/theme.css`
- **재사용 후보**
  - `$R/AI Innovation 공모전/masdae-market/frontend/src/shared/ui/QrCode.tsx`: `qrcode`로 DataURL을 만들고 이미지 저장 버튼을 붙였다.
  - `$R/AI Innovation 공모전/masdae-market/frontend/src/shared/ui/QrScanner.tsx`: 카메라(jsqr 지연 로드), 사진, 수동 입력 3모드를 지원하고 https가 아니면 안내한다. 학생 측은 QR을 휴대폰 카메라 앱으로 찍어 URL만 열면 되므로 **스캐너는 필요 없을 가능성이 높다.**
  - `$R/AI Innovation 공모전/masdae-market/frontend/src/shared/ui/`: BottomSheet, EmptyState, FilterChips, StepIndicator, Navigation(BottomTabs). 모바일 학생 화면에 쓸 만하다.
- **품질**: 테스트 파일 55개, 인수 테스트 디렉터리 있음. DESIGN.md에 "Vite 포트 바인딩(EPERM)과 Chromium 실행이 거부되어 브라우저 캡처를 하지 못했다"고 적혀 있다. 즉 **실화면 검증이 빠진 상태로 마감했다.**
- **주의**: `QrCode.tsx`는 한 줄짜리 압축 포맷(JS에서 변환한 흔적)이라 그대로 붙이면 읽기 어렵다. 옮길 때 다시 포맷한다.

### 1-2. AI Innovation 대승보 / AI-Bootcamp-develop-b
- masdae-market과 **같은 저장소**(`github.com/JaeHong-Jang/AI-Bootcamp`)의 다른 브랜치 사본이다. `assistant.py` 에이전트가 추가됐고 Flutter는 `archive/legacy`로 옮겼다. 로컬 실행은 `deploy/run_local.sh`(pgserver)로 한다.
  - `$R/AI Innovation 대승보/AI-Bootcamp-develop-b/README.md`, `$R/AI Innovation 대승보/AI-Bootcamp-develop-b/DESIGN.md`
- 시사점: 같은 코드의 사본이 여러 폴더에 흩어져 있어 어느 쪽이 최신인지 헷갈린다(약점 3-6 참고).

### 1-3. AI Innovation 공모전 / masdae-pass (마대 통과증)
- **목적**: 폐기물 마대 정보를 넣으면 에이전트 9개(분석·연결·검증 팀)가 법 기준 판정과 근거를 내고 대시보드에 보여 준다.
- **스택**: React **18.3** + Vite + **Tailwind 3**(darkMode class) + lucide-react + recharts + cytoscape + react-router 6. 백엔드는 **Fastify 5**(TS, tsx), 공통 타입은 `shared/contracts.ts`에 둔다.
  - `$R/AI Innovation 공모전/masdae-pass/frontend/package.json`, `$R/AI Innovation 공모전/masdae-pass/backend/package.json`, `$R/AI Innovation 공모전/masdae-pass/frontend/tailwind.config.js`(Pretendard Variable, JetBrains Mono, rise/shimmer/flow 애니메이션)
- **AI**: Ollama `format:'json'`을 쓰고, 모델이 없으면 대체 모델로 넘어가며, 꺼져 있으면 규칙 계획과 템플릿 요약으로 동작한다. `$R/AI Innovation 공모전/masdae-pass/backend/src/harness/llm/ollama.ts`
  - README에 "LLM을 붙였지만 4개 로컬 모델 모두 규칙 대비 추가 발견 0건(0/9)"이라는 **정직한 측정**이 있다. `$R/AI Innovation 공모전/masdae-pass/README.md`
- **데모 장치**: API 클라이언트가 `live`(Vite 프록시), `snapshot`(`VITE_SNAPSHOT=1`, 정적 JSON 재생), `fixtures` 3모드로 동작한다. `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/api/client.ts`. 데모 입력 상수는 `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/demo.ts`에 있다.
- **재사용 후보**
  - `$R/AI Innovation 공모전/masdae-pass/frontend/src/index.css`: `.btn-primary`, `.btn-ghost`, `.input`, `.label`, `.th/.td`, `@media print`(no-print, print-plain). **수업안 인쇄에 바로 쓸 수 있다.**
  - `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/ui/`: Card, Badge, StatusPill, Section, EmptyState, Tooltip, CopyButton, chart.tsx
  - `$R/AI Innovation 공모전/masdae-pass/frontend/src/features/agent-team/FlowRail.tsx`: 5단계 진행 레일(대기, 진행 중, 완료 애니메이션). **"공통 도입 → 학년별 분리 → 공통 정리" 흐름 표시나 AI 생성 단계 표시에 맞는다.**
  - `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/theme/colors.ts`: 팀(=학년)별 Tailwind 색 지도. JIT가 찾을 수 있게 클래스 문자열을 통째로 적어 두었다.
  - `$R/AI Innovation 공모전/masdae-pass/frontend/src/app/Layout.tsx`(100줄), `useTheme.ts`(다크 모드)
- **품질**: 백엔드 테스트 46개 통과(LLM 목)가 README에 기록돼 있다. 1440·390px, 라이트·다크 스크린샷도 확인했다고 적혀 있다.

### 1-4. AI Innovation 공모전 / observatory
- **목적**: Claude Code 작업 기록(transcripts)을 읽어 지식 그래프, 시스템 동작, 타임라인으로 보여 주는 **개발 과정 관측소**다. 제품이 아니라 개발 도구다.
- **스택**: 바닐라 JS(`app.js` 936줄) + d3 + force-graph + marked(CDN), `server.mjs`. `$R/AI Innovation 공모전/observatory/web/index.html`, `$R/AI Innovation 공모전/observatory/config.json`
- 이번 해커톤에서는 "AI를 어떻게 활용해 만들었나"를 발표할 때 보조 자료로만 쓸 수 있다. 제품 기능에는 필요 없다.

### 1-5. AI Platform Build Challenge (isa-jikimi, 이사 견적 지킴이)
- **목적**: 이사 견적서 원문을 내 조건과 대조해 추가 비용 지점을 찾고 업체 문의문을 만든다.
- **스택**: **Next.js 16.3.4** + React 19.3 + **zod 4** + force-graph + lucide. CSS는 손으로 쓴 토큰(`globals.css`, 진남색 팔레트, 다크 테마).
  - `$R/AI Platform Build Challenge/web/package.json`, `$R/AI Platform Build Challenge/web/src/app/globals.css`
- **AI**: 로컬 Ollama만 쓴다(qwen3:4b, ax4-light). WSL에서 Windows 게이트웨이 IP를 자동으로 찾고, `format`에 JSON 스키마를 넘긴다("`format:'json'`은 스키마를 무시"라는 실측 메모가 있다). GPU 하나를 쓰므로 호출을 직렬 큐로 줄 세운다. 콜드 스타트 37~112초를 실측해 두었다.
  - `$R/AI Platform Build Challenge/web/src/lib/ollama.ts`
  - API 라우트는 zod로 입력을 검증하고 `maxDuration=300`이다. `$R/AI Platform Build Challenge/web/src/app/api/inspect/route.ts`
- **평가 하네스**: 합성 견적 20건과 답변 20건으로 만든 평가셋, holdout 리포트. 라벨 작성자와 한계를 정직하게 적었다. `$R/AI Platform Build Challenge/web/eval/README.md`, `run.mts`, `REPORT.md`
- **개발 운영**: 멀티 모델 "오케스트라"(Opus 지휘, GPT/Gemini 검증, Sonnet 실무), brief → 조사 → 분석 → 상호 검증 → 판정 파이프라인, 관측소 훅.
  - `$R/AI Platform Build Challenge/AGENTS.md`, `$R/AI Platform Build Challenge/CLAUDE.md`
- **약점**: 로컬 GPU와 Ollama 의존이 커서 배포할 수 없다. 6~22시간 해커톤에서 이 운영 체계는 과하다.

### 1-6. KAIST 성남 시 공모전 / 성남 타임스토리 (`-2026-2nd-Seongnam-KAIST-AI-Competition`)
- **목적**: 관광지 공식 근거를 묶어 카드뉴스 4장을 만들고, 문장 단위로 사실 검수한 뒤 담당자가 승인하고 PNG·ZIP을 내려받는다. 3D 성남 지도도 있다.
- **스택**: **Next.js 16.3.4** + React 19.3 + zod 4 + three 0.186 + `@fontsource/noto-sans-kr` + fflate + Playwright. 저장은 **`node:sqlite`(Node 24 내장)**를 쓴다.
  - `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/package.json`(스크립트: `eval`, `eval:claims`, `eval:live`, `eval:smoke`, `test:e2e`)
  - `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/store.ts`: SQLite WAL에 runs 테이블 하나와 JSON payload를 둔다. **해커톤용 영속화로 가장 가볍다.**
- **AI**: SDK 없이 `fetch("https://api.anthropic.com/v1/messages")`를 직접 호출하고, `output_config.format.json_schema`에 `z.toJSONSchema(schema)`를 넣는다. API가 받지 않는 키워드(minLength 등)를 지우는 `apiSchema()` 정규화가 있다.
  - `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/provider.ts`: 비용 상한, 호출 횟수 상한, 예약 비용 처리, `stop_reason` 검사
  - `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/budget.ts`
  - 프롬프트는 버전 상수로 관리한다(`PROMPT_VERSION`). 결정, 작성, 원자 검수 프롬프트가 나뉘어 있고 "쉬운 설명(readingStyle easy)" 변환 규칙이 있다. `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/prompts.ts`. **초등 학년별 난이도 조절 프롬프트를 쓸 때 참고할 만하다.**
  - 데모 모드는 API 키 없이 fixture로 카드를 만든다. `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/fixture.ts`
  - QR: `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/story-qr.ts`. QR 인코더를 **직접 구현**했다(GF(256) Reed–Solomon). 재사용하지 말고 `qrcode` 패키지를 쓴다.
- **디자인**: 초록·크림·금색, Noto Sans KR. 접근성과 반응형 규칙이 상세하다. `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/DESIGN.md`
- **Next 16 경고**: AGENTS.md에 "This is NOT the Next.js you know"가 들어 있다. Windows 스마트 앱 컨트롤이 Turbopack 네이티브 모듈을 막아 dev에서도 webpack을 쓴다. `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/README.md`
- **품질**: 테스트 파일 59개, e2e 있음. 마감도는 높지만 범위가 크게 부풀었다(3D 도시에 건물 32,300개, 캐릭터 "타미" 등).

### 1-7. TRITON (AI 법정, 제2회 TRAITHON)
- **목적**: 낚시성 기사를 검사·변호 에이전트가 다투게 하고 사람 판사가 판결한다. 신뢰도 장부를 남긴다.
- **스택**: 프론트는 React 19.3 + Vite + **Tailwind 4**(`@tailwindcss/vite`, `@theme` 토큰) + zustand 5 + react-router 7, Playwright 스크린샷 스크립트. 백엔드는 FastAPI(Python, uv).
  - `$R/TRITON/apps/frontend/package.json`, `$R/TRITON/apps/frontend/src/index.css`(Pretendard Variable 로컬 woff2, 적·청·목재·황동 팔레트)
- **AI**: Ollama A.X 4.0 Light. `format`에 스키마를 넘기고 temperature 0, seed 7로 결정적으로 돌린다. `$R/TRITON/apps/backend/court/llm.py`. 실시간 갱신은 폴링으로 한다(`$R/TRITON/apps/frontend/src/console/usePoll.ts`).
- **개발 규칙**: 계약(`docs/contracts/`)을 먼저 쓰고, 주석은 한 줄 명사형으로 쓰며, 계층 의존 방향은 `lint_harness.py`가 검사한다. 편집 훅과 `tools/checks/verify.sh`(--ui), `tools/progress.json`으로 진행을 관리한다.
  - `$R/TRITON/AGENTS.md`, `$R/TRITON/CLAUDE.md`, `$R/TRITON/apps/frontend/AGENTS.md`
- **재사용 후보**: `$R/TRITON/apps/frontend/src/ui/`(Badge, Feedback, Forms, useAsync), `$R/TRITON/apps/frontend/src/console/ConsoleShell.tsx`(운영 콘솔 셸), `$R/TRITON/apps/frontend/src/features/court/InstanceStepper.tsx`(단계 스테퍼)
- **품질**: 테스트 파일 32개. 운영 콘솔이 9개 화면이라 범위가 크다.

### 1-8. TTA 공모전 / TTA-Service (닿는 경보 CAP2ALL)
- **목적**: 재난 경보 하나를 청각장애인·시각장애인·외국인·고령자용 5개 채널로 변환하고, TTA 표준 검증기로 확인한다.
- **스택**: React 19 + Vite + 손으로 쓴 CSS, fast-xml-parser, vitest. 백엔드는 없다(브라우저 단독).
  - `$R/TTA 공모전/TTA-Service/package.json`(스크립트: `verify:standards`, `check:blind`, `agent:record`, `package:submit`, `ci`)
- **AI 패턴, 이번 해커톤에 가장 쓸모 있음**
  - **replay/live 어댑터**: 기본값이 replay(녹화된 fixture JSON)라서 심사자가 키 없이, 인터넷 없이 모든 기능을 실행할 수 있다. `$R/TTA 공모전/TTA-Service/src/agent/llm.ts`
  - **녹화 스크립트**: 앱이 실제로 쓰는 파이프라인을 그대로 돌리며 요청을 가로채 녹화한다. 기본은 dry-run이고 `--live`일 때 `ANTHROPIC_API_KEY`를 쓴다. `$R/TTA 공모전/TTA-Service/scripts/record-fixtures.mjs`
  - **검증 루프**: 생성 → 검증 → 위반 사유를 되먹여 재생성(최대 3회) → 원문 폴백. 승인 대기는 fail-closed로 막는다. `$R/TTA 공모전/TTA-Service/src/agent/loop.ts`. **"성취기준 코드가 실제 목록에 있나", "학년별 활동이 모두 있나" 같은 검증기를 꽂아 쓸 수 있다.**
- **품질**: 테스트 파일 36개, golden 평가, 개인정보 블라인드 검사 스크립트. 제출 패키징까지 자동화했다.

### 1-9. SL 프로젝트 / prototype/frontend
- 바닐라 JS + Vite + maplibre-gl 단일 페이지(`app.js`, `demo-cases.json`). 지도 데모 프로토타입이다. `$R/SL 프로젝트/prototype/frontend/package.json`
- 이번 과제와 관련은 낮다. "바닐라로 빠르게 찍는" 방식도 써 본 적이 있다는 정도만 참고한다.

### 1-10. 스마트시티 프로젝트 (SmartCity)
- **목적**: 여러 사람이 실시간으로 함께 짓는 3D 도시 시뮬레이터와 AI 건설 도우미.
- **스택**: npm workspaces 모노레포(apps/web, apps/server, packages/shared, sim). 웹은 React 19.3 + three + camera-controls, 서버는 Node `ws` WebSocket과 `@anthropic-ai/sdk`. vitest와 Playwright를 쓴다.
  - `$R/스마트시티 프로젝트/package.json`, `$R/스마트시티 프로젝트/apps/server/package.json`
- **AI**: 수동 tool-use 루프. 턴, 토큰, 시간 상한을 루프가 직접 관리하고, 모델은 샌드박스 사본만 바꾼다. 사용자가 미리보기로 확인하고 승인해야 실제 반영된다.
  - `$R/스마트시티 프로젝트/apps/server/src/ai/agent.ts`, `tools.ts`
  - `$R/스마트시티 프로젝트/apps/server/src/ai/model.ts`: `claudeModel()`은 `thinking:{type:'adaptive'}`, `output_config.effort:'medium'`, 서버 측 fallbacks를 쓰고, 테스트용으로 결정적인 `scriptedModel`이 있다. `SC_AI_FAKE=1`이면 키 없이 흐름만 확인할 수 있다.
  - 키는 서버에만 둔다. `.env.example`에 `ANTHROPIC_API_KEY`가 있다.
- **재사용 후보**: 실시간 방(room) 개념, 즉 `?room=` URL로 같은 방에 접속하는 구조. **"반(학급) 세션 코드 → QR" 설계에 개념을 차용할 수 있다.** 다만 이번 과제는 SSE로 충분하다(학생은 POST, 교사는 SSE 구독).
- **품질**: 테스트 파일 96개로 가장 많다. 오프라인 모드, 백업, 복구까지 있어 범위가 매우 크다.

### 1-11. 금융 AI 공모전 해커톤 (SafePass 피싱 골든타임 행동 비서)
- **목적**: 피싱 피해 직후 사건을 구조화하고 기관 전달 패키지와 후속 행동을 추적한다.
- **스택**: 백엔드는 FastAPI가 React 빌드를 **같은 오리진**에서 서빙한다. 프론트는 `frontend/app`(React 19 + Vite + vitest, happy-dom)과 바닐라 ESM 프로토타입(`frontend/prototype/*.mjs`) 두 벌이다.
  - `$R/금융 AI 공모전 해커톤/README.md`, `$R/금융 AI 공모전 해커톤/frontend/app/package.json`
- **AI**: 구조화 호출 한 곳으로 모은다. 모든 provider(Anthropic, OpenAI 호환 Groq, Ollama)가 "JSON Schema 하나를 주고 dict 하나를 받는" 계약을 따른다. 실패, 타임아웃, 계약 위반은 예외 대신 `None`을 돌려주고 호출자는 반드시 결정적 폴백을 가진다. 프롬프트와 원문 응답은 로그에 남기지 않는다.
  - `$R/금융 AI 공모전 해커톤/backend/app/services/llm.py`: Anthropic은 **strict tool + `tool_choice` 강제**로 구조화하고, 목적별 시간 예산 배수(understanding 1.0, clarification 0.6 등)를 둔다.
  - SSE: `$R/금융 AI 공모전 해커톤/backend/app/api/cases.py`(text/event-stream), 클라이언트는 `$R/금융 AI 공모전 해커톤/frontend/prototype/harness.mjs`(EventSource, `?from=` 시퀀스로 재개)
  - STT: faster-whisper 로컬 또는 Groq 원격.
- **배포, 실제 배포 경험 있음**
  - Render Blueprint: Docker 멀티 스테이지(node:22로 프론트 빌드, python:3.12로 런타임), `numInstances: 1`(SSE 상태가 메모리에 있음), `autoDeployTrigger: checksPass`, 비밀값은 `sync:false`로 둔다.
  - `$R/금융 AI 공모전 해커톤/render.yaml`, `$R/금융 AI 공모전 해커톤/deploy/Dockerfile`, `$R/금융 AI 공모전 해커톤/.github/workflows/ci.yml`, `keepalive.yml`(무료 인스턴스 깨우기)
  - **URL: https://finance-ai-challenge.onrender.com** (`/health`)
- **품질**: 백엔드 테스트 20개, 프론트 46개. 헤드리스 Chrome 렌더 확인 스크립트 `scripts/render_check.mjs`가 있다.
- **보안 경고**: 프로젝트 루트에 `금융 API 키.txt`가 있다(내용은 열어 보지 않았다). 커밋 위험이 있다.

### 1-12. 경영정보학회 / 윤슬 (매장 위키 AI)
- **목적**: 숙련 직원의 판단 이유를 사례 카드로 쌓고, 신입 질문에 근거를 붙여 답하며, 모르는 질문은 점장에게 넘긴다. 점장의 답은 다시 카드가 된다.
  - **이번 과제 구조와 거의 같다**: 학생 질문 → AI가 기존 지식으로 답하거나 묶음 → 교사 확인 → 다음 활동.
- **스택**: 프론트는 React 18.3 + Vite + Tailwind 3 + lucide + recharts + cytoscape(fcose) + react-router 6(masdae-pass 템플릿 재사용). 백엔드는 **Express 5 + `@anthropic-ai/sdk` + zod 4**(TS, tsx), 공통 타입은 `shared/contracts.ts`.
  - `$R/경영정보학회/frontend/package.json`, `$R/경영정보학회/backend/package.json`
- **AI, 가장 깔끔한 TS 구현**
  - `$R/경영정보학회/backend/src/harness/llm.ts`: `client.beta.messages.parse({ output_config: { effort, format: betaZodOutputFormat(zodSchema) }, betas:['server-side-fallback-2026-07-01'], fallbacks:'default' })`. refusal과 parsed_output 누락을 검사하고, 실패하면 `null`을 돌려준다. 에이전트는 `null`을 받으면 같은 모양의 규칙 결과를 만든다. 모드는 `AI_MODE=rules`, `LLM_PROVIDER=ollama`, 키가 있으면 claude로 정해진다.
  - 모델 설정은 `$R/경영정보학회/harness/harness.config.json`에 있다(`claude-opus-5-5`, ollama `ax4-light:q4_K_M`).
  - 에이전트 파일: `$R/경영정보학회/backend/src/agents/answer.ts`, `capture.ts`, `verify.ts`, `keeper.ts`. 흐름은 `$R/경영정보학회/backend/src/flows/index.ts`.
- **실시간**: SSE. 최근 이벤트를 먼저 재생하고 5초마다 ping을 보내며, 처음에 `: connected`를 바로 보내 Vite 프록시 지연을 막는다.
  - 서버: `$R/경영정보학회/backend/src/server.ts`(약 93~108행 `/api/stream`)
  - 클라이언트: `$R/경영정보학회/frontend/src/shared/api/live.tsx`. EventSource가 CLOSED가 되면 직접 재연결하고, 재연결 때 화면 기록을 비워 중복을 막는다.
  - 이벤트 버스(replay와 subscribe): `$R/경영정보학회/backend/src/harness/trace.ts`
- **저장**: JSON 파일 하나(`var/store.json`)에 두고, 시드에서 리셋할 수 있다. `$R/경영정보학회/backend/src/store/db.ts`
- **시연**: `$R/경영정보학회/backend/src/demo.ts`의 `playDay()`가 가상 인물로 하루 흐름을 자동 재생한다. `$R/경영정보학회/backend/src/sim/customers.ts`(가상 손님). **"가상 학생 10명이 QR로 질문을 보내는" 시연 버튼으로 바로 바꿀 수 있다.**
- **UI**: 역할별 사이드바와 모바일 탭은 `$R/경영정보학회/frontend/src/app/nav.ts`(신입·숙련·점장을 교사·학생·관리로 치환)와 `Layout.tsx`(151줄), 공통 UI는 `$R/경영정보학회/frontend/src/shared/ui/index.tsx`(202줄).
- **품질**: README에 스크린샷이 있지만 "데모 매장이 바뀌어 새 캡처는 아직"이라고 적혀 있다. 테스트 파일은 2개뿐이다.

### 1-13. 공공 웹사이트 불법광고 탐지 개발 공모전 / 누리지킴이
- **목적**: 공공 누리집의 숨은 불법광고를 탐지하는 Windows 도구(exe 패키징).
- **스택**: **유일한 shadcn/ui 프로젝트**다. React 19.2 + Vite + Tailwind 4 + shadcn(style `radix-nova`, neutral, cssVariables) + radix-ui + sonner + zustand 5 + motion + recharts 3 + pretendard + react-router 8 + oxlint. 백엔드는 FastAPI.
  - `$R/공공 웹사이트 불법광고 탐지 개발 공모전/frontend/package.json`, `$R/공공 웹사이트 불법광고 탐지 개발 공모전/frontend/components.json`, `$R/공공 웹사이트 불법광고 탐지 개발 공모전/frontend/src/index.css`
- **재사용 후보**: `$R/공공 웹사이트 불법광고 탐지 개발 공모전/frontend/src/components/ui/`(avatar, badge, button, card, chart, dialog, dropdown-menu, input, progress, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs). **shadcn을 쓰기로 하면 이 폴더와 index.css를 통째로 복사하는 것이 가장 빠르다.** `RemediationStepper.tsx`, `FindingDetailSheet.tsx`(상세 시트)도 쓸 만하다.
- **AI**: `$R/공공 웹사이트 불법광고 탐지 개발 공모전/backend/agent/llm/claude.py`, `config.py`(기본 `claude-haiku-4-5-20251001`). fakes를 둔 테스트가 있다.
- 원격 저장소: `github.com/ljh02/illegal-advertisement`. 팀원 저장소라 프론트를 다른 사람이 만들었을 수 있다. 학생 본인의 shadcn 숙련도는 확인이 필요하다.

### 1-14. 원티드 AI 공모전 / 첫출근 First Day (같은 코드 3벌)
- **목적**: AI 후보 3명에게 같은 업무를 맡기고, 실행 근거를 비교해 채용·배치한다. 16:10 사무실 시뮬레이션이 있다.
- **스택**: **Next.js 14.2** + React 18.3 + Tailwind 3 + shadcn 스타일(radix dialog/slot/switch, cva, clsx, tailwind-merge) + zustand 4 + three.
  - `$R/원티드 AI 공모전/Wanted-AI-Championship/package.json`(paper-agent와 ui-preview도 동일)
- **AI**: provider 추상화(ollama 또는 anthropic). fetch를 직접 쓰고 `output_config.format.json_schema`의 enum으로 다음 행동을 고른다. 키는 서버에만 둔다. `$R/원티드 AI 공모전/Wanted-AI-Championship/lib/agents/provider.ts`(`claude-sonnet-5`)
- **배포**: Render(`npx next start --port $PORT`). **URL: https://wanted-ai-agent.onrender.com** (`/api/health`). `$R/원티드 AI 공모전/Wanted-AI-Championship/render.yaml`
- **품질**: 테스트 파일 54개, 키 없이 `npm run dev`가 바로 된다.
- **보안 경고**: `$R/원티드 AI 공모전/ai 키.txt`가 있다(열어 보지 않았다).

### 1-15. 한국관광공사 데이터랩 활용 경진대회 (crowdcast)
- 모노레포(apps/web, packages/contracts, services/forecast·gateway·knowledge·records). 웹은 React 19 + Vite + Tailwind 4 + zustand 5 + react-three-fiber + pmtiles/d3-geo + ajv + Biome + axe-core Playwright 접근성 테스트.
  - `$R/한국관광공사 데이터랩 활용 경진대회/apps/web/package.json`
- 데이터 분석 대회가 본업이다. 이번 과제와는 접근성 테스트(axe) 아이디어 정도만 관련 있다.

### 1-16. 기타 (웹 프로토타입 아님, 또는 관련 낮음)
- `$R/vista`, `$R/VISTA 교수님 프로젝트`: Expo 57 / React Native 0.86 + react-native-web 제주 내비. FastAPI 경로·음성 API를 Render로, 웹은 Vercel(`$R/vista/vercel.json`, outputDirectory `front/dist`)로 배포하도록 설정했다. Anthropic 의도 분류는 `$R/vista/backend/intent/anthropic_client.py`에 있다.
- `$R/디지털노마드 프로젝트/reapple`: React Native 0.83 + LiveKit + STOMP(Spring 백엔드). 모바일 스트리밍 앱이다.
- `$R/트라이톤 공모전/app`: 브라우저 자동화 에이전트(Playwright). 웹 제품이 아니다.
- `$R/신약개발해커톤/Artificial-Intelligence-New-Drug-Development-Competition/web_dongseop`: React 19 + Vite + RDKit WASM.
- `$R/Google AI`: Kaggle Gemma 4 SWE 에이전트(오프라인 하네스·평가). 웹 아님.
- `$R/학습튜터링`: R·Python 실습 자료. 웹 아님. `$R/창업(개인 맞춤형 AI 동반자 서비스)`: 리서치·보고서만 있다. `$R/현대 차 앱 개발`: 빈 폴더.
- `/mnt/c/Users/User/Desktop/대학교/UI 및 프로젝트 아이디어/민원 자동 개선 AI Agent/민원 개선 AI .png`: "Feedloop" 랜딩 시안. 피드백 → AI 분류 → 수정안 → 반영 알림의 4단 흐름과 루프 대시보드(들어온 피드백 47, AI가 분류 41 등 KPI)로 구성했다. **이번 "질문 → AI 군집 → 보충·심화 → 다음 차시" 흐름의 시각 레퍼런스로 쓸 만하다.** 코드는 없다.

---

## 2. 배포 URL 목록 (README·render.yaml에서 확인)

| 프로젝트 | URL | 근거 |
|---|---|---|
| 금융 AI(SafePass) | https://finance-ai-challenge.onrender.com (`/health`) | `$R/금융 AI 공모전 해커톤/render.yaml`, README |
| 원티드(첫출근) | https://wanted-ai-agent.onrender.com (`/api/health`) | `$R/원티드 AI 공모전/Wanted-AI-Championship/render.yaml` |
| VISTA | Vercel·Render 설정만 있고 URL 기록은 찾지 못함 | `$R/vista/vercel.json`, `$R/vista/render.yaml` |
| 그 외 | 문서에 배포 URL 없음(모두 localhost) | README 실행 절차 |

참고: 실제 접속 여부(현재 살아 있는지)는 확인하지 않았다. GitHub 원격 저장소는 `JaeHong-Jang/{AI-Bootcamp, TRITON, SmartCity, Finance-AI-Challenge, Management-Information-Systems, AI-Platform-Build-Challenge}`, `LSB-afk/{-2026-2nd-Seongnam-KAIST-AI-Competition, TTA-Service, Wanted-AI-Championship}`, `ljh02/illegal-advertisement`, `aim-lab-js/vista`다.

---

## 3. 종합

### (a) 사실상의 선호 스택과 패턴

| 영역 | 반복해서 쓴 선택 | 근거 프로젝트 |
|---|---|---|
| 언어 | TypeScript(프론트·Node 백엔드), Python(FastAPI 백엔드) | 거의 전부 |
| 프론트 | **React 19 + Vite**(9건 이상). SSR·API가 필요할 때 Next 16 또는 14 | masdae-*, TRITON, TTA, 윤슬, 누리지킴이 / KAIST, Platform, 원티드 |
| 스타일 | Tailwind(3이 3건, 4가 4건) 또는 손으로 쓴 CSS 토큰. shadcn은 1~2건 | masdae-pass, 윤슬, TRITON, 누리지킴이, 원티드 |
| 폰트 | **Pretendard Variable**(주력), Noto Sans KR | masdae-pass, TRITON, 누리지킴이, KAIST |
| 아이콘·차트 | lucide-react, recharts, cytoscape·force-graph(지식 그래프) | 다수 |
| 상태 | 대체로 useState와 커스텀 훅(useAsync, useRun, usePoll), 필요할 때 zustand | TRITON, 누리지킴이, 원티드 |
| 백엔드 | FastAPI(Python) 또는 Express·Fastify(TS). 프론트 빌드를 같은 오리진에서 서빙 | 금융 AI, masdae-market, 윤슬, masdae-pass |
| 저장 | SQLite(SQLAlchemy 또는 `node:sqlite`) 또는 **JSON 파일 하나** | masdae-market, KAIST, 윤슬 |
| 실시간 | **SSE**(EventSource, replay + ping) 또는 폴링. 협업이 필요할 때 WebSocket | 윤슬, 금융 AI / TRITON / 스마트시티 |
| LLM 호출 | **JSON 스키마 강제 구조화 출력**(Claude `output_config.format` / Zod `messages.parse` / strict tool). Ollama는 `format=스키마` | 전 프로젝트 |
| LLM 공급자 | Claude(sonnet 계열이 주력) + 로컬 Ollama(A.X 4.0 Light `ax4-light:q4_K_M`, qwen) 이중화 | 전 프로젝트 |
| 폴백 | `LLM_PROVIDER=off/mock/rules`, 실패하면 null을 받아 규칙·템플릿 결과, replay fixture, snapshot 정적 빌드 | 금융 AI, 윤슬, TTA, masdae-pass, KAIST |
| 검증 | 게이트(근거·금지 표현·개인정보), 생성-검증-재생성 루프, 합성 평가셋과 REPORT | masdae-*, TTA, Platform eval |
| 하네스 문서 | AGENTS.md(지도) + CLAUDE.md(@AGENTS.md) + ARCHITECTURE·contracts + DESIGN.md + harness.yaml/json(에이전트 선언) | TRITON, masdae, 윤슬, Platform |
| 테스트 | vitest(+Testing Library), pytest, Playwright e2e | 대부분 |
| 배포 | **Render**(Docker 또는 node, Blueprint, keepalive), Vercel(정적) | 금융 AI, 원티드, vista |
| 화면 문구 | 짧은 평서문·명사형 한국어, "AI 조언"과 규칙 결과를 구분해 표시, 근거·출처 칩 | masdae DESIGN, KAIST, 윤슬 |

### (b) 새 프로토타입에 재사용할 파일·모듈 (우선순위순)

| 순위 | 파일(절대 경로) | 쓰임새 | 이유 |
|---|---|---|---|
| 1 | `$R/경영정보학회/backend/src/harness/llm.ts` | AI 군집화·활동 생성의 Claude 호출 한 곳 | Zod 스키마 하나로 구조화 출력, 실패하면 null, 규칙 폴백, rules·ollama·claude 모드 전환. 60줄 남짓이라 그대로 옮기기 쉽다 |
| 2 | `$R/경영정보학회/backend/src/server.ts`(`/api/stream`) + `$R/경영정보학회/frontend/src/shared/api/live.tsx` + `$R/경영정보학회/backend/src/harness/trace.ts` | 학생 QR 질문이 교사 화면에 실시간으로 쌓이는 피드 | SSE 재생·ping·재연결이 이미 디버깅돼 있다(Vite 프록시 지연 대응 포함) |
| 3 | `$R/AI Innovation 공모전/masdae-market/frontend/src/shared/ui/QrCode.tsx` + `$R/AI Innovation 공모전/masdae-market/frontend/vite.config.ts`(멀티 엔트리) | 교사 화면에 반·차시 QR 표시, `/student/` 별도 엔트리 | `qrcode` 패키지 사용과 이미지 저장 버튼. 멀티 엔트리로 교사 앱과 학생 앱의 번들을 나눌 수 있다 |
| 4 | `$R/TTA 공모전/TTA-Service/src/agent/llm.ts` + `$R/TTA 공모전/TTA-Service/scripts/record-fixtures.mjs` | 시연용 replay 모드 | 해커톤장의 네트워크나 키 문제에도 시연이 멈추지 않는다. 미리 녹화한 군집·활동 결과를 재생한다 |
| 5 | `$R/TTA 공모전/TTA-Service/src/agent/loop.ts` | 생성 → 검증(성취기준 코드 존재, 두 학년 모두 존재, 분량) → 재생성 → 폴백 | 2022 개정 성취기준 정합성을 **코드로** 검증하는 장치. 심사 때 "AI가 지어낸 성취기준" 위험을 막는다 |
| 6 | `$R/경영정보학회/backend/src/demo.ts` + `$R/경영정보학회/backend/src/sim/customers.ts` | "가상 학생 질문 보내기" 시연 버튼 | 3분 발표에서 휴대폰 여러 대 없이도 질문이 쌓이는 장면을 보여 준다 |
| 7 | `$R/AI Innovation 공모전/masdae-pass/frontend/src/index.css` + `$R/AI Innovation 공모전/masdae-pass/frontend/tailwind.config.js` + `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/ui/{Card,Badge,StatusPill,Section,EmptyState,CopyButton}.tsx` | 교사용 대시보드 기본 부품, 인쇄용 CSS | Tailwind 3과 Pretendard, `@media print`가 있어 수업안이나 활동지를 출력할 수 있다 |
| 8 | `$R/AI Innovation 공모전/masdae-pass/frontend/src/features/agent-team/FlowRail.tsx` + `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/theme/colors.ts` | 수업 흐름 레일(공통 도입 → 학년별 분리 → 공통 정리), 학년별 색 | 단계 상태 애니메이션이 있고, 팀 색 지도를 학년 색 지도로 바꾸기만 하면 된다 |
| 9 | `$R/경영정보학회/frontend/src/app/{nav.ts,Layout.tsx}` | 역할별 메뉴(교사: 수업 설계·타임라인·질문함·다음 차시 / 학생: 질문하기) | 모바일 탭과 데스크톱 사이드바가 다 있다 |
| 10 | `$R/AI Innovation 공모전/masdae-pass/frontend/src/shared/api/client.ts` | live·snapshot·fixtures 3모드 API 클라이언트 | 백엔드가 늦게 붙어도 프론트를 먼저 개발할 수 있고, 정적 배포 백업본도 만들 수 있다 |
| 11 | `$R/금융 AI 공모전 해커톤/render.yaml` + `$R/금융 AI 공모전 해커톤/deploy/Dockerfile` + `$R/금융 AI 공모전 해커톤/.github/workflows/keepalive.yml` | 단일 컨테이너 Render 배포 | QR은 **학생 휴대폰이 접속할 수 있는 공개 URL**이 있어야 동작한다. 실제 배포에 성공한 설정이다 |
| 12 | `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/prompts.ts` | 학년별 쉬운 설명 규칙, 프롬프트 버전 관리 | "날짜·수치·조건은 보존하고 표현만 쉽게" 같은 규칙 문장을 학년 수준 조절에 옮겨 쓴다 |
| 13 | `$R/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/store.ts` | (선택) `node:sqlite` 영속화 | 의존성 없이 테이블 하나와 JSON payload로 끝난다. Node 22.5 이상(플래그 필요 여부는 버전마다 다름), KAIST는 Node 24 기준 |
| 14 | `$R/공공 웹사이트 불법광고 탐지 개발 공모전/frontend/src/components/ui/` + `components.json` + `src/index.css` | (선택) shadcn 키트 | 시트, 탭, 테이블, 토스트를 바로 쓸 수 있다. Tailwind 4 기준이라 7번(Tailwind 3)과 섞지 말고 둘 중 하나만 고른다 |
| 15 | `$R/AI Innovation 공모전/masdae-market/backend/app/harness/gates.py` | (선택) 개인정보 게이트(전화·이메일·주민번호 정규식) | 학생 질문 원문에 개인정보가 섞일 때 걸러 낸다 |

### (c) 반복되는 약점 (피해야 할 것)

1. **범위 팽창, 과잉 구현**: KAIST는 카드뉴스 공모전에 3D 도시(건물 32,300개)와 캐릭터를 넣었고 QR 인코더까지 직접 구현했다(`story-qr.ts`). 스마트시티는 백업·복구 체계까지, 원티드는 직원 21명이 있는 사무실을, TRITON은 콘솔 9화면을 만들었다. 22시간 안에는 **핵심 4화면**만 만든다.
2. **로컬 Ollama와 WSL 의존**: `172.20.32.1:11434`를 하드코딩했고(masdae harness.yaml), 콜드 스타트가 37~112초였다(Platform `ollama.ts`). 배포 불가, 시연 불안정으로 이어진다. 이번에는 **Claude API와 replay 폴백**만 쓴다.
3. **LLM의 실제 기여가 약함**: masdae-pass README의 자체 측정에서 LLM 추가 기여가 0/9였다. 규칙이 다 하고 LLM은 요약만 하는 구조가 반복됐다. 이번 과제는 군집화와 학년별 활동 생성이 **LLM이 꼭 필요한 일**이므로, AI 몫을 시연에서 분명히 보여 준다(군집 전후 비교, 근거 질문 인용).
4. **실화면 검증 누락**: masdae-market DESIGN.md에 "브라우저 캡처 수행하지 못함"이 두 번 적혀 있고, 윤슬은 "새 캡처는 아직 찍지 않았다"고 적었다. **마감 2시간 전에 배포 URL을 휴대폰 실물로 QR 스캔하는 리허설**을 필수 체크리스트에 넣는다.
5. **문서 과다**: DESIGN.md가 픽셀 좌표(로딩 트럭 x=82 등)까지 기술하고 README가 수천 자다. 해커톤에서는 README 1쪽과 contracts.ts면 충분하다.
6. **사본 난립과 버전 혼선**: masdae-market과 AI-Bootcamp-develop-b, 원티드 3벌. 해커톤 저장소는 **하나만** 두고 브랜치로 관리한다.
7. **키 파일 방치**: `$R/금융 AI 공모전 해커톤/금융 API 키.txt`, `$R/원티드 AI 공모전/ai 키.txt`, `$R/Notion Backup Codes.txt`가 있다. 새 저장소는 시작할 때부터 `.env`와 `.gitignore`를 두고 `.env.example`만 커밋한다.
8. **스타일 시스템을 매번 새로 만듦**: 손 CSS, Tailwind 3, Tailwind 4, shadcn이 프로젝트마다 다르다. 이번에는 처음에 하나로 정하고 디자인 토큰 파일 하나만 쓴다.
9. **모델 ID 표기 불일치**: `claude-sonnet-5-5`, `claude-sonnet-5`, `claude-opus-5-5`, `claude-haiku-4-5-20251001`, `claude-opus-4-8`이 섞여 있다. 환경변수 `MODEL` 하나로 모으고, 시작할 때 health 체크로 실제 호출 가능한지 확인한다(원티드 `providerReady()` 방식).
10. **Next 16과 Windows 마찰**: 스마트 앱 컨트롤이 Turbopack을 막아 webpack으로 우회했다(KAIST README). 버전별 breaking change 경고도 있다. 짧은 해커톤에서는 Vite가 더 안전하다.
11. **`/mnt/c` 파일 감시 문제**: 모든 Vite 설정에 `usePolling`이 들어 있다. 새 프로젝트도 WSL에서 하면 처음부터 넣는다(또는 리눅스 홈 디렉터리에서 작업한다).
12. **팀 정보 미기입**: 금융 AI README의 팀 표가 빈칸이다. 제출 문서 체크리스트에 넣는다.

### (d) 새 프로토타입 권장 스택

**권장안 A: Vite React SPA와 Express 단일 서버를 Render에 배포**

| 층 | 선택 | 이유와 재사용 원본 |
|---|---|---|
| 프론트 | React 19 + TS + **Vite 멀티 엔트리**(`/` 교사, `/s/` 학생 모바일) | 가장 많이 쓴 조합. masdae-market `vite.config.ts` |
| 스타일 | **Tailwind 3 + masdae-pass 토큰·컴포넌트**(또는 shadcn 키트 하나만) + Pretendard + lucide-react | 이미 다듬어진 Card·Badge·btn·print CSS를 바로 쓴다 |
| 차트·타임라인 | recharts(군집 막대·학년별 이해도). 직접/간접지도 **타임라인은 CSS grid 2행(학년별 레인) × 분 단위 열**로 직접 그린다 | 간트 라이브러리를 새로 배우는 시간을 아낀다. FlowRail 패턴으로 확장한다 |
| QR | `qrcode` 패키지(교사 화면에서 생성). 학생은 휴대폰 기본 카메라로 URL `/s/?session=XXXX`를 연다 | masdae `QrCode.tsx`. 스캐너는 만들지 않는다 |
| 백엔드 | **Express 5 + zod 4 + `@anthropic-ai/sdk`**, 프론트 `dist`를 같은 오리진에서 정적 서빙 | 윤슬 백엔드 구조를 그대로 쓴다. 같은 오리진이라 CORS·프록시 문제가 없다 |
| 실시간 | **SSE**(학생 POST `/api/questions` → bus → 교사 EventSource) | 윤슬 `server.ts`와 `live.tsx`. WebSocket은 필요 없다 |
| 저장 | JSON 파일 1개와 시드(윤슬 `db.ts`). 필요하면 `node:sqlite` | Render 디스크는 휘발성이지만 시연에는 충분하다. 재시작하면 시드를 다시 읽는다 |
| AI | Claude 구조화 출력(Zod): ① 수업안 생성(성취기준 코드 포함) ② 질문·학습지 결과 군집화 ③ 학년별 보충·심화 활동 생성. 각 호출에 검증 루프(TTA `loop.ts`)를 붙인다 | 성취기준 목록 JSON(교육과정 원문)을 코드로 대조해 **지어낸 코드를 막는다** |
| 폴백 | `AI_MODE=live|replay|rules`. replay는 녹화된 fixture JSON, rules는 키워드 기반 단순 군집 | TTA `llm.ts`, 윤슬 `ask()`가 null을 돌려주는 패턴 |
| 시연 | "가상 학생 질문 보내기" 버튼(서버에서 시차를 두고 POST) | 윤슬 `demo.ts` |
| 배포 | Render web service 1개(`numInstances: 1`, SSE 메모리 상태), 비밀값은 대시보드에서 입력, keepalive. **현장 백업으로 `cloudflared` 터널과 로컬 실행**을 준비한다 | 금융 AI `render.yaml`. 무료 플랜은 잠들면 깨어나는 데 시간이 걸리므로 발표 직전에 health로 깨운다 |
| 검증 | vitest(군집·검증기 단위 테스트 몇 개), 휴대폰 실기기 QR 리허설 | 약점 4 대응 |

**대안 B: Next.js 단일 앱을 Vercel에 배포** (팀원이 Next에 익숙하면)
- 장점은 API route와 화면이 한 저장소에 있고 Vercel 배포가 쉽다는 점이다.
- 단점은 Vercel 서버리스에서 **메모리 SSE 상태와 JSON 파일 저장이 유지되지 않는다**는 점이다. 질문 저장에 외부 DB(Supabase 등)가 필요해져 셋업 시간이 늘어난다. 이 학생은 Next를 주로 로컬과 Render에서 썼고(원티드), Next 16의 Windows Turbopack 이슈도 겪었다. 해커톤이 사전 스캐폴딩을 허용하면 고려할 수 있지만 **기본 권장은 A**다.

**권장 화면 4개 (범위 고정)**
1. 수업 설계: 두 학년 선택, 교과·단원 선택 → AI가 공통 도입 / 학년별 분리 / 공통 정리 초안과 성취기준 칩을 제안 → 교사가 편집. 인쇄를 지원한다.
2. 타임라인: 학년 2레인 × 40분. 직접지도와 간접지도(자기주도) 블록을 교차 배치하고, 충돌(두 학년 동시 직접지도)을 경고한다. 규칙만으로 처리하고 LLM은 쓰지 않는다.
3. 질문함(실시간): QR 표시, 학생 질문이 SSE로 쌓인다 → "AI로 묶기" → 군집 카드(대표 질문, 학년, 질문 수, 원문 인용).
4. 다음 차시: 군집과 학습지 결과를 바탕으로 학년별 보충·심화 활동 카드를 만들고 성취기준 검증 배지를 붙인다 → 다음 수업안에 끼워 넣는다.

학생 화면(모바일): 반 코드 확인 → 학년 선택 → 질문 입력과 전송 → 완료. 로그인은 없다.

---

## 4. 확인하지 못한 것 / 가정
- 배포 URL 2개가 지금도 접속되는지는 확인하지 않았다(네트워크 호출 안 함).
- 공공 웹사이트 프로젝트(ljh02 저장소)와 KAIST·TTA·원티드(LSB-afk 저장소)는 팀원 저장소다. 해당 코드를 학생 본인이 작성한 비율은 알 수 없다.
- 코드에 적힌 모델 ID(`claude-sonnet-5-5` 등)와 beta 플래그(`server-side-fallback-2026-07-01`)가 해커톤 당일에도 유효한지는 착수할 때 health 호출로 확인해야 한다.
- 키 파일(`금융 API 키.txt`, `ai 키.txt`)은 내용을 열지 않았고 존재만 확인했다.

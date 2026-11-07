# 빌드 프롬프트: 복식·소인수 학급 수업 코티처 「함께반(가칭)」 프로토타입

> 사용법: 새 폴더 `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/cotutor/`를 만들고 그 안에서 새 Claude Code 세션을 연 뒤, 아래 `---` 이후 전체를 붙여 넣는다. 사전 개발이 허용되지 않으면 Phase 0만 미리 하고, 나머지는 현장 계획(§10)대로 진행한다.

---

너는 이 폴더(`cotutor/`)에서 해커톤 프로토타입을 만드는 빌드 에이전트다. 아래 지시를 그대로 따른다. 지시와 실제 상황이 다르면(파일이 없거나, SDK 시그니처가 다르거나, 규칙이 충돌하면) 추측하지 말고 멈춰서 사용자에게 무엇이 다른지 구체적으로 묻는다.

## 0. 먼저 읽을 것 (작업 전에 반드시)

| 문서 | 절대 경로 | 왜 |
|---|---|---|
| 종합 설계 보고서 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/reports/복식학급 코티처 프로토타입 설계.md` | 결정 사항 요약, 재사용 목록, 라이선스, 열린 질문 |
| AI 설계·교육과정 노트 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/research_notes/복식학급 코티처 프로토타입 설계/W3_ai_design_curriculum.md` | 타임라인 규칙 R1~R12(§3.5), 파이프라인(§4.2), 스키마·프롬프트 초안(§4.11), 충북 매뉴얼 요약(§3.1) |
| 과거 코드 분석 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/research_notes/복식학급 코티처 프로토타입 설계/L1_past_codebases.md` | 옮겨 올 파일의 맥락 |
| 수업설계 레포 조사 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/research_notes/복식학급 코티처 프로토타입 설계/W1_repos_lesson_planning.md` | 차용 패턴, 라이선스 |
| 실시간·타임라인 레포 조사 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/research_notes/복식학급 코티처 프로토타입 설계/W2_repos_classroom_realtime.md` | QR·SSE·인쇄 패턴 |
| 과거 제출물 교훈 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/research_notes/복식학급 코티처 프로토타입 설계/L2_past_submissions.md` | 화면 문구·디자인 규칙(§6-4) |
| 시장·경쟁 분석 | `/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/reports/해커톤 후보 시장 경쟁사 분석.md` | 포지셔닝, 데모 동선 |

Claude API 코드를 쓰기 전에는 `claude-api` 스킬을 읽는다. SDK 함수 이름·import 경로는 추측하지 말고 스킬 문서나 설치된 SDK 타입으로 확인한다.

## 1. 목표와 한 줄 포지셔닝

- 제품: 강원 소규모 초등학교에서 **두 학년을 한 교실에서 혼자 가르치는 담임교사**용 웹앱.
- 한 줄: "두 학년을 혼자 맡은 선생님이 다른 학년에 가 있는 20분까지 설계하고, 그 20분 동안 나온 질문을 다음 차시 학년별 보충·심화 카드로 돌려주는 AI 수업 코티처."
- 대비 문장: **"ChatGPT는 수업안을 쓰고, 함께반은 선생님의 동선을 짭니다."**
- 핵심 루프 4개
  1. 2022 개정 성취기준에 맞춘 두 학년 수업 설계: 공통 도입(★) → 학년별 분리(■직접/□간접 교차) → 공통 정리(★). 충청북도교육청 「초등학교 복식학급 운영 도움자료」(2025)의 부분통합 모형을 따른다.
  2. 직접/간접지도 2레인 타임라인과 **코드로 하는** 충돌 검사(R1~R12).
  3. QR로 학생 질문·답 수집(학생 계정 없음).
  4. AI가 응답을 묶고, 다음 차시 학년별 보충·심화 카드(간접지도 시간에 교사 없이 하는 10분 카드)를 만든다. 교사가 승인해야 인쇄된다.
- AI가 할 일(생성·군집)과 코드가 할 일(판정·필터·골격·검사·검증)을 섞지 않는다. 데모에서 "검사기가 AI 초안을 잡아 고쳤다"가 보여야 한다.

## 2. 사용자와 90초 데모 스토리

주 사용자는 복식학급 담임교사 1명이다. 학생은 휴대폰 카메라로 QR을 찍어 웹 페이지만 연다. 데모 시나리오는 충북 매뉴얼 예시와 같은 **3학년 사회 `[4사01-02]` + 4학년 사회 `[4사05-02]`**(같은 학년군, 부분통합, 40분)이다.

| 시간 | 장면 | 화면 | 보여 줄 것 |
|---|---|---|---|
| 0~20초 | 교사가 3·4학년, 사회, 단원 2개를 고르고 "초안 만들기" | S1 수업 설계 | 학년쌍 배지 "같은 학년군", FlowRail 6단계(맥락 → 계획 → 골격 → 채움 → 검사 → 수리), "검사 1건 위반 → 수리 1회 → 통과" 기록, ■□★ 과정안, 성취기준 칩 |
| 20~35초 | 3학년 직접지도 끝을 +5분 옮긴다 → 4학년 직접지도와 20~25분이 겹쳐 빨간 경고 → 되돌리거나 블록을 간접지도로 바꿔 해결 | S2 타임라인 | 한국어 경고 "3학년 직접지도와 4학년 직접지도가 20~25분 겹칩니다", error 0이 되면 승인 버튼 활성 |
| 35~55초 | 심사위원이 QR을 찍어 질문을 보낸다. "가상 학생 보내기"로 질문 10여 개가 더 쌓인다 | S3 질문함 + 학생 페이지 | 1초 안에 학년별 열에 카드가 뜬다. 전화번호가 들어간 질문은 마스킹돼 보인다 |
| 55~70초 | "AI로 묶기" | S3 | 군집 카드: 교사용 진단 문장 라벨, 포함 기준, 학년, 연결 성취기준, 대표 질문 원문 인용, 질문 수 |
| 70~85초 | 다음 차시 카드 생성 → 교사가 한 단어 고치고 승인 | S4 다음 차시 | 학년별 보충 1·심화 1, 근거 군집·성취기준·목표 성취수준(A/B/C), 다음 차시 타임라인의 간접지도 블록에 들어간 미리보기 |
| 85~90초 | 학년별 학습지 인쇄 미리보기 | S4 인쇄 | 학생판에는 교사 메모가 없다 |

## 3. 범위 (고정)

### 3-1. 화면: 교사 4개 + 학생 1개. 이 밖의 화면은 만들지 않는다

인쇄는 별도 화면이 아니라 S1·S4의 인쇄용 레이아웃(`@media print` + `window.print()`)이다.

**S1 수업 설계 (`/`)** 수용 기준
- [ ] 학년 2개(1~6, 서로 다름), 교과, 학년별 단원(`data/units.demo.csv` 기반 선택), 수업 시간(기본 40, 30~80 가변), 협력강사 토글을 입력한다.
- [ ] 학년쌍 유형 배지가 입력 즉시 뜬다(3·4 → 같은 학년군, 4·5 → 학년군 걸침, 3·6 → 격리 학년).
- [ ] "초안 만들기"를 누르면 FlowRail이 단계별로 진행되고, 각 단계가 끝나면 "✓ + 한 일 한 줄"을 남긴다("대기"만 보이는 상태가 없어야 한다).
- [ ] 결과에 공통 주제, 학년별 성취기준 칩(코드 + DB 원문 툴팁 + `원문 확인됨/확인 중` 배지), ■□★ 과정안 표, 학년별 ◎○△ 평가 기준이 있다.
- [ ] 검사·수리 기록(위반 규칙 ID, 수리 횟수)이 보인다.
- [ ] 모든 AI 텍스트에 "AI 초안" 배지가 붙고, 승인하면 배지가 "교사 승인"으로 바뀐다. 승인 전후 diff가 저장된다(M4용).
- [ ] `AI_MODE=replay`에서 3초 안에 결과가 나온다. live에서는 걸린 시간을 작은 글씨로 표시한다.
- [ ] 인쇄 버튼으로 과정안이 A4 1~2쪽에 잘리지 않고 나온다.

**S2 타임라인 (`/timeline`)** 수용 기준
- [ ] 학년 2레인 × D분 CSS grid(1분 = n px). 학년별 색, ■ 직접은 진한 색, □ 간접은 빗금, ★ 통합은 두 레인을 가로지르는 한 블록.
- [ ] 블록을 클릭하면 상세(활동, 자료, 소음, 간접지도 카드)가 열리고, 모드 전환(직접 ↔ 간접)과 같은 학년 인접 블록과의 **경계 ±5분 이동**을 할 수 있다. 드래그앤드롭은 기본 범위가 아니다(22시간안의 선택 기능).
- [ ] 편집할 때마다 검사기(`shared/check/`, 클라이언트·서버 공용 순수 함수)가 즉시 다시 돈다. error는 빨간 테두리와 겹친 구간 하이라이트, warn은 노란색, 메시지는 한국어 한 문장이다.
- [ ] R1~R12 결과 패널, 전환 횟수, 학년별 직접지도 분을 보여 준다. error가 0일 때만 승인 버튼이 활성화된다.
- [ ] 간접으로 바꾼 블록에 카드가 없으면 R4 error가 뜨고, "카드 만들기" 버튼(단일 블록 Filler 호출, replay/rules 폴백)으로 채울 수 있다.

**S3 질문함 (`/live`)** 수용 기준
- [ ] "수업 시작"으로 세션(4자리 코드)을 만들고 큰 QR, 코드, URL을 보여 준다. QR URL의 호스트가 `localhost`, `127.0.0.1`, 사설 IP면 빨간 경고를 띄운다.
- [ ] "지금 질문"(예: "지도에서 헷갈리는 것을 적어 보세요")을 설정하면 학생 페이지에 보인다.
- [ ] 학생 제출이 SSE로 1초 안에 학년별 열에 나타난다. 연결이 끊기면 자동 재연결하고 중복 카드가 생기지 않는다.
- [ ] PII가 마스킹된 텍스트만 보이고(원문은 교사가 펼쳐 볼 수 있음), SAFETY 플래그는 군집에서 빠지고 화면 상단 알림으로만 뜬다.
- [ ] "가상 학생 보내기"가 시드 질문 12개를 0.5~1.5초 간격으로 보낸다.
- [ ] "AI로 묶기" 결과: 라벨(교사용 진단 문장), 포함 기준, 학년, 연결 성취기준 칩, 유형, 질문 수, 대표 질문 원문 인용, 미분류 목록. 교사가 라벨을 고치고 질문을 다른 군집으로 옮길 수 있다(선택 상자, 드래그 아님).

**S4 다음 차시 (`/next`)** 수용 기준
- [ ] 학년별 보충 1 + 심화 1 카드: 제목, 근거 군집, 목표 성취기준, 목표 성취수준(A/B/C, DB 진술 인용), 누구와·단계·끝 신호·막힐 때·산출물·안내 역할, 분량(분), 교사 메모.
- [ ] 편집·승인·반려. 승인된 카드는 다음 차시 골격의 분리 구간 간접지도 블록에 들어간 미리보기로 보이고, 그 미리보기도 검사기를 통과한다.
- [ ] 승인 전에는 인쇄 버튼이 비활성이다. 학생판 인쇄(학년별 A4)에는 교사 메모·정답 힌트가 없다(DOM에서 제거 + 문자열 검사 2중 방어, worksheet-grab 패턴). 교사판 인쇄는 전부 포함한다.

**학생 페이지 (`/s/?c=ABCD`)** 수용 기준
- [ ] 390px 폭에서 가로 스크롤이 없다. 터치 영역 48px 이상, 본문 16px 이상, 명암비 4.5:1 이상.
- [ ] 세션 학년 버튼 2개, 지금 질문 표시, 텍스트 입력(200자), 보내기, 완료 화면, 다시 보내기. "이름은 쓰지 마세요" 안내가 있다.
- [ ] 이름·로그인 입력칸이 없다. localStorage 랜덤 ID만 쓴다. 전송에 실패하면 폰에 보관했다가 재시도한다.
- [ ] AI가 만든 어떤 내용도 학생 페이지에 표시하지 않는다.

### 3-2. 비목표 (만들지 않는다. 요청이 와도 먼저 사용자에게 확인한다)
로그인·회원가입, 학생 계정, 학생부 문장·평가 점수, 학생과 AI의 대화, 다중 학교·다중 교사, Postgres·Supabase 같은 DB 서버, 벡터 DB·임베딩, 드래그앤드롭(22시간안 선택), HWPX 내보내기(선택), 연간 계획·A·B년도 모드, NEIS 연동, 음성, 3D·장식 애니메이션, 다크 모드, 다국어, 관리자 콘솔, 자동 최적화 솔버(OR-Tools 등), 학생 사진 업로드, QR 스캐너 구현, QR 인코더 직접 구현.

## 4. 스택과 폴더 구조

| 층 | 선택 | 원본 |
|---|---|---|
| 프론트 | React 19 + TypeScript + Vite 멀티 엔트리(`index.html` 교사, `s/index.html` 학생), react-router(교사 4경로) | masdae-market `vite.config.ts` |
| 스타일 | **Tailwind 3 + masdae-pass 토큰·컴포넌트 하나만**. shadcn(Tailwind 4)은 섞지 않는다. Pretendard, lucide-react | masdae-pass |
| QR | `qrcode` 패키지 | masdae-market `QrCode.tsx` |
| 서버 | Node 22 + Express 5 + zod 4 + `@anthropic-ai/sdk`, 빌드된 프론트를 같은 오리진에서 정적 서빙 | 윤슬 backend |
| 실시간 | SSE(학생 POST → 이벤트 버스 → 교사 EventSource), 막히면 2초 폴링 폴백 | 윤슬 `server.ts`, `trace.ts`, `live.tsx` |
| 저장 | JSON 파일 1개(`var/store.json`) + 시드 리셋 | 윤슬 `store/db.ts` |
| AI 모드 | `AI_MODE=live\|replay\|rules` | TTA `llm.ts`, 윤슬 `llm.ts` |
| 테스트 | vitest(검사기·판정·PII·파이프라인 replay), Playwright(e2e + 스크린샷) | |
| 배포 | Render web service 1개(`numInstances: 1`) + cloudflared 터널 백업 | 금융 AI `render.yaml` |

대안(주 경로 아님): Next.js + Supabase(Postgres + Realtime) + Vercel(W2). **여러 학교가 동시에 쓰는 시범 운영, 재시작 후에도 남아야 하는 저장, 다중 인스턴스가 필요해질 때** 전환한다. 해커톤 프로토타입에서는 전환하지 않는다.

WSL에서 `/mnt/c` 아래 작업하므로 Vite `server.watch.usePolling: true`를 처음부터 넣는다.

```
cotutor/
  package.json              # scripts: dev, build, start, test, e2e, data:build, record:fixtures, eval, typecheck
  vite.config.ts            # 2엔트리, usePolling, /api 프록시 → :8787
  index.html                # 교사 앱
  s/index.html              # 학생 페이지
  tailwind.config.js  postcss.config.js
  shared/
    contracts.ts            # zod 스키마 + 타입 (§5)
    check/timeline.ts       # R1~R9, R11 (순수 함수)
    check/standards.ts      # R10, 학년쌍 판정, 코드 정규화
    check/pii.ts            # R12, 마스킹
    skeleton.ts             # 지도방법별 골격 템플릿
  src/
    teacher/                # main.tsx, App.tsx, pages/{Design,Timeline,Live,Next}.tsx, components/
    student/                # main.tsx, App.tsx
    ui/                     # masdae-pass에서 옮긴 Card·Badge·StatusPill·Section·EmptyState·CopyButton·FlowRail
    print.css
  server/
    index.ts                # Express, 정적 서빙, /health
    routes/                 # lessons, sessions, responses, clusters, cards, demo, stream
    ai/llm.ts               # 윤슬 llm.ts 기반 단일 호출 지점
    ai/prompts/             # planner.ts, filler.ts, cluster.ts, nextCards.ts, critic.ts (PROMPT_VERSION 상수)
    ai/pipeline/            # context.ts, planner.ts, filler.ts, repair.ts, cluster.ts, nextCards.ts, critic.ts
    ai/fixtures.ts          # replay 조회·녹화
    ai/rules/               # rules 모드 결정적 대체 출력
    live/bus.ts             # 이벤트 버스(재생 + 구독)
    store/db.ts
    demo/fakeStudents.ts
  data/
    standards.index.json    # 초등 성취기준 611건(kr-curriculum 변환)
    standards.demo.json     # NCIC 대조 완료분
    units.demo.csv          # 교과서 단원 ↔ 성취기준 ↔ 학년 (직접 작성, 본문 없음)
    seed/                   # lesson.seed.json, questions.seed.json, broken-draft.json
  fixtures/<route>/<hash>.json
  eval/                     # scenarios.json, rubric.csv, run.ts, baseline/manual/, REPORT.md
  tests/                    # vitest
  e2e/demo.spec.ts          # Playwright
  scripts/                  # build-standards.ts, record-fixtures.ts
  docs/phase0/              # Phase 0 산출 문서
  THIRD_PARTY_NOTICES.md  LICENSES/
  .env.example  .gitignore  render.yaml  README.md
```

## 5. 데이터 모델 (`shared/contracts.ts`, zod 4)

도메인 스키마(앱 내부 검증용)와 LLM 출력 스키마(구조화 출력용)를 나눈다. **LLM 출력 스키마에는 `.min/.max/.length`, 재귀, optional을 쓰지 않는다**(구조화 출력 미지원이거나 optional 24개 한도). 필요한 값은 `.nullable()` + required로 두고, 범위는 검사기에서 확인한다.

```ts
import { z } from 'zod';

export const Grade = z.number().int();                    // 1~6, 범위는 코드로 검사
export const Lane = z.enum(['A', 'B', 'ALL']);           // A=낮은 학년, B=높은 학년
export const Mode = z.enum(['JOINT', 'DIRECT', 'INDIRECT']);
export const PairType = z.enum(['SAME_BAND', 'CROSS_BAND', 'NON_ADJACENT']);
export const LessonType = z.enum(['복수교과병행', '단일교과복수활동', '단일교과단일활동수준별', '단일교과단일활동통합']);
export const Method = z.enum(['분리', '부분통합', '시간차']);
// 코드는 괄호 없이 저장('4사01-02'), 화면에는 '[4사01-02]'로 표시
export const StdCode = z.string().regex(/^[246](국|수|사|과|영|도|실|미|음|체|바|슬|즐)\d{2}-\d{2}$/);

export const StandardRef = z.object({ code: StdCode, lane: Lane, why: z.string() });

export const IndirectCard = z.object({
  withWhom: z.enum(['혼자', '짝', '모둠']),
  steps: z.array(z.string()),          // 2~5개, 해당 학년이 읽을 수 있는 문장 (개수는 R4가 검사)
  doneSignal: z.string(),              // 끝났다는 신호
  ifStuck: z.string(),                 // 교사를 부르지 않는 방법 우선
  output: z.string(),                  // 산출물
  guideRole: z.string(),               // 안내 역할(실명 금지)
  physicalRisk: z.string().nullable(), // 가위·실험도구 등 (Aila Physical 범주 참고)
});

export const Segment = z.object({
  id: z.string(), kind: z.enum(['JOINT_INTRO', 'SPLIT', 'JOINT_WRAP']),
  startMin: z.number().int(), endMin: z.number().int(),
});

export const TimelineBlock = z.object({
  id: z.string(), segmentId: z.string(), lane: Lane,
  startMin: z.number().int(), endMin: z.number().int(), mode: Mode,
  phase: z.enum(['도입', '전개', '정리']),
  activity: z.string(), materials: z.array(z.string()),
  noise: z.enum(['quiet', 'normal', 'loud']),
  card: IndirectCard.nullable(), standardCodes: z.array(StdCode),
});

export const Assessment = z.object({
  lane: z.enum(['A', 'B']), code: StdCode,
  excellent: z.string(), good: z.string(), needsSupport: z.string(), method: z.string(), // ◎ ○ △
});

export const Lesson = z.object({
  id: z.string(), gradeA: Grade, gradeB: Grade, subject: z.string(),
  units: z.object({ A: z.string().nullable(), B: z.string().nullable() }),
  pairType: PairType, lessonType: LessonType, method: Method,
  durationMin: z.number().int(), hasAssistant: z.boolean(),
  commonTheme: z.string(), standards: z.array(StandardRef),
  segments: z.array(Segment), blocks: z.array(TimelineBlock), assessment: z.array(Assessment),
  status: z.enum(['draft', 'approved']),
  aiMeta: z.object({ mode: z.enum(['live', 'replay', 'rules']), model: z.string().nullable(),
    promptVersion: z.string(), repairs: z.number().int(), violationsFixed: z.array(z.string()), ms: z.number() }),
  edits: z.array(z.object({ path: z.string(), before: z.unknown(), after: z.unknown(), at: z.string() })),
  previousLessonId: z.string().nullable(),
});

export const StudentResponse = z.object({
  id: z.string(), sessionCode: z.string(), grade: Grade, kind: z.enum(['question', 'answer']),
  promptId: z.string().nullable(), text: z.string(),        // 마스킹된 본문 (LLM에는 이것만)
  rawText: z.string(),                                     // 교사만, 보관기간 후 삭제
  piiFlags: z.array(z.enum(['PHONE', 'EMAIL', 'RRN', 'NAME_LIKE', 'ADDRESS_LIKE'])),
  safety: z.boolean(), clientId: z.string(), createdAt: z.string(),
});

export const ClusterType = z.enum(['오개념', '절차 실수', '어휘', '호기심·확장', '수업 운영', '기타']);
export const Cluster = z.object({
  id: z.string(), sessionCode: z.string(), label: z.string(), criteria: z.string(),
  lane: Lane, linkedCode: StdCode.nullable(), type: ClusterType,
  questionIds: z.array(z.string()), representativeId: z.string(), teacherEdited: z.boolean(),
});

export const NextLessonCard = z.object({
  id: z.string(), lessonId: z.string(), lane: z.enum(['A', 'B']), kind: z.enum(['보충', '심화']),
  title: z.string(), targetCode: StdCode, targetLevel: z.enum(['A', 'B', 'C']),
  basedOnClusterIds: z.array(z.string()), minutes: z.number().int(),
  card: IndirectCard, teacherNote: z.string(),             // teacherNote는 학생판 인쇄에서 제거
  status: z.enum(['draft', 'approved', 'rejected']),
});

export const Violation = z.object({
  rule: z.enum(['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11','R12']),
  severity: z.enum(['error', 'warn']), blockIds: z.array(z.string()),
  range: z.object({ startMin: z.number(), endMin: z.number() }).nullable(), message: z.string(),
});
```

**LLM 출력 스키마** (각 라우트에 1개씩 고정, 바꾸면 그 라우트의 캐시가 깨진다)
- `PlannerOut`: `{ commonTheme, lessonType, method, standards: StandardRef[], integrationPoints: string[], splitPoints: { A: string, B: string } }`
- `FillerOut`: `{ blocks: { id, phase, activity, materials, noise, card: IndirectCard|null, standardCodes }[], assessment: Assessment[] }` — **시간 필드는 없다**(골격에서 고정).
- `ClusterOut`: `{ clusters: { label, criteria, lane, linkedCode|null, type, questionIds, representativeId }[], flags: { questionId, kind: 'SAFETY'|'PII' }[], unclustered: string[] }`
- `NextCardsOut`: `{ cards: { lane, kind, title, targetCode, targetLevel, basedOnClusterIds, minutes, card, teacherNote }[] }`
- `CriticOut`: `{ scores: { id: 'C1'..'C6', score: number, evidenceBlockIds: string[] }[], suggestion: string }`

`StdCode`의 정규식 알터네이션(`(국|수|…)`)이 구조화 출력에서 거부되면, LLM 출력 스키마에서는 정규식을 빼고 `z.string()`으로 받은 뒤 R10으로 검사한다. 이 결과를 `docs/phase0/api-checks.md`에 기록한다.

## 6. AI 파이프라인

### 6-1. 호출 지점 하나: `server/ai/llm.ts`
`/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/harness/llm.ts`를 복사해서 고친다. 원본은 `client.beta.messages.parse({ model, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', output_config: { effort, format: betaZodOutputFormat(schema) }, system, messages })`를 쓰고, refusal·`parsed_output` 누락이면 `null`을 돌려준다. 다음을 바꾼다.

- Ollama 분기를 지운다.
- 시그니처: `ask(route, { model, system: FIXED_SYSTEM, user, schema, effort, timeoutMs })`. `system`은 `[{ type: 'text', text: FIXED_SYSTEM, cache_control: { type: 'ephemeral' } }]` 배열로 보내 캐싱한다. 변하는 내용(성취기준 부분집합, 교사 입력, 골격, 위반 목록)은 user 메시지에만 넣는다.
- 모델은 환경변수로만 정한다: `MODEL_LESSON=claude-sonnet-5-5`(Planner·Filler·Next-lesson), `MODEL_CLUSTER=claude-haiku-5-5`, `MODEL_JUDGE=claude-opus-5-5`(Critic·평가). 날짜 접미사를 붙이지 않는다.
- `betas`/`fallbacks`는 Opus·Sonnet 5.5 호출에만 붙인다. **Haiku 5.5는 서버 측 fallback이 없으므로** 붙이지 않고, 실패하면 replay → rules로 내려간다.
- **보내지 않는 것**: 강제 `tool_choice`(any/tool, 5.5 Opus·Sonnet에서 400), `thinking: {type: 'disabled'}`(Sonnet·Opus 5.5에서 400), `budget_tokens`, `temperature`/`top_p`/`top_k`, assistant prefill. thinking 파라미터 자체를 생략하고 `output_config.effort`로만 조절한다.
- effort 기본값: Planner·Filler·Next-lesson `low`(지연 측정 후 `medium` 검토), Clusterer `low`, Critic `high`.
- 매 응답 `stop_reason`을 확인한다(`refusal`, `max_tokens`이면 폴백). `usage.cache_read_input_tokens`, `output_tokens`, 소요 시간을 로그에 남긴다(프롬프트·원문 응답은 남기지 않는다).
- 시작 시 health 호출 1회로 모델 ID와 SDK 동작을 확인하고 `/api/ai/status`에 노출한다.
- 설치된 SDK 버전에서 `betaZodOutputFormat` import(`@anthropic-ai/sdk/helpers/beta/zod`)나 `fallbacks` 타입이 맞지 않으면, `claude-api` 스킬 문서로 확인한다. 비베타 경로는 `client.messages.parse()` + `zodOutputFormat()`(`@anthropic-ai/sdk/helpers/zod`)이다.

### 6-2. AI_MODE와 폴백

| 모드 | 동작 |
|---|---|
| `live` | Claude 호출. `AI_TIMEOUT_MS`(기본 20000)를 넘기거나 실패하면 같은 입력 해시의 fixture → 라우트 기본 fixture → rules 순으로 대체하고, 화면 구석에 "녹화 응답" 또는 "규칙 모드" 표시를 남긴다 |
| `replay` | `fixtures/<route>/<sha256(route+PROMPT_VERSION+정규화 입력)>.json` 재생. 없으면 라우트 기본 fixture, 그것도 없으면 rules |
| `rules` | `server/ai/rules/`의 결정적 출력. 수업: 골격 + 단원명 기반 템플릿 활동 + 템플릿 간접지도 카드. 군집: 한국어 2-gram 자카드 유사도로 묶고 라벨은 최빈 명사. 다음 차시: 성취수준 C→B 진술을 이용한 템플릿 카드 |

키가 없으면 자동으로 `rules`가 된다. 모든 경로의 출력은 같은 zod 스키마를 통과해야 한다.

**fixture 녹화**: `/mnt/c/Users/User/Desktop/대학교/3학년/TTA 공모전/TTA-Service/scripts/record-fixtures.mjs` 방식을 따른다. `npm run record:fixtures`는 기본 dry-run(무엇을 녹화할지 목록만 출력), `-- --live`일 때만 키를 쓴다. 앱이 실제로 쓰는 파이프라인 함수를 그대로 돌려 저장하고, `recordedWith: { model, effort, at, promptVersion }`을 함께 기록한다. 품질 좋은 골든 응답이 필요하면 `-- --model claude-opus-5-5`로 녹화할 수 있지만, 그 경우 화면의 "녹화 응답" 표시에 모델명을 남긴다.

### 6-3. 단계별 구현

**① Context Builder (코드)**
- `band(g) = g<=2 ? 2 : g<=4 ? 4 : 6`. 학년쌍 판정: 같은 band → `SAME_BAND`, |차이|=1이고 band가 다름 → `CROSS_BAND`, 그 밖 → `NON_ADJACENT`.
- 성취기준 필터: `subject × band(gradeA) ∪ band(gradeB)`. 교사가 단원을 고르면 `units.demo.csv`의 코드를 우선 후보로 표시한다.
- 추천표(충북 매뉴얼 요약, W3 §3.1(b)(f)): 국어·수학·사회·과학·영어 + 같은 학년군 → `단일교과복수활동` 또는 `단일교과단일활동수준별`, 기본 지도방법 `부분통합`. 도덕·체육·음악·미술·실과 → `단일교과단일활동통합`. 학년군 걸침·격리 → `복수교과병행` 후보도 함께 제시.

**② Planner (LLM, `MODEL_LESSON`)** 고정 시스템 프롬프트(캐시 대상):
```
당신은 한국 초등 복식학급(두 학년이 한 교실) 담임교사의 수업 설계 동료입니다. 산출물은 교사가 검토·수정한 뒤에만 쓰이는 초안입니다.
할 일: 두 학년이 함께 배울 공통 주제와, 학년별로 겨냥할 성취기준을 고릅니다.
원칙
- 같은 학년군이면 같은 성취기준 안에서 학년별 깊이를 달리하는 방안을 먼저 검토합니다. 학년군이 다르면 같은 영역 번호의 수직 연계를 찾고, 없으면 복수교과 병행을 제안합니다.
- 공통 도입과 공통 정리는 두 학년 모두에게 의미가 있어야 합니다.
금지
- <standards>에 없는 코드를 쓰지 않습니다. 성취기준 문장을 새로 쓰거나 바꾸지 않습니다. 코드만 인용합니다.
- 교과서 쪽수, 출판사 고유 활동명, 학생 이름을 지어내지 않습니다.
- 교사가 준 단원명 외의 단원명을 만들지 않습니다.
```
user: `<pair>`(학년, 쌍 유형, 추천 수업유형·지도방법), `<standards>`(코드 + 원문), `<units>`, `<last_clusters>`(있으면). R10 실패 시 `<violations>`를 붙여 1회 재요청.

**③ Skeleton Builder (코드, `shared/skeleton.ts`)** D=40 기준(다른 D는 비율로 조정, 5분 단위 반올림):
- 부분통합(기본): ★ 0–7 │ A■ 7–20 / B□ 7–20 │ A□ 20–33 / B■ 20–33 │ ★ 33–40
- 분리: A■ 0–20 / B□ 0–20 │ A□ 20–40 / B■ 20–40
- 시간차: A ■0–8 □8–20 ■20–28 □28–40 / B □0–8 ■8–20 □20–28 ■28–40

**④ Filler (LLM, `MODEL_LESSON`)** 고정 시스템 프롬프트(W3 §4.11(b)를 그대로 쓴다):
```
당신은 한국 초등 복식학급(두 학년이 한 교실) 담임교사의 수업 설계 동료입니다.
산출물은 교사가 검토·수정한 뒤에만 사용되는 초안입니다.

[원칙]
- 수업은 '공통 도입(★) → 학년별 분리(■직접/□간접 교차) → 공통 정리(★)'를 기본으로 합니다.
- 교사는 한 시점에 한 학년만 직접지도할 수 있습니다. 협력강사는 직접 수업을 하지 않고 보조만 합니다.
- 간접지도(□) 블록은 교사 없이 학생이 스스로 끝까지 할 수 있어야 합니다.
  각 간접 블록에는 반드시 카드를 작성합니다: 누구와(혼자/짝/모둠), 단계(2~5개, 해당 학년이 읽을 수 있는 문장),
  끝났다는 신호, 막혔을 때 할 일(교사를 부르지 않는 방법 우선), 산출물, 안내 역할(학생 실명 금지).
- 간접 블록은 직접지도 중인 다른 학년을 방해하지 않도록 소음 수준을 표시합니다.
- 학생 특성은 "부족하다"가 아니라 구체적인 오개념이나 다음 단계로 씁니다.

[금지]
- 아래 <standards>에 없는 성취기준 코드를 쓰지 마십시오. 성취기준 문장을 새로 쓰거나 바꾸지 마십시오.
- 교과서 쪽수, 출판사 고유 활동명, 학생 이름을 지어내지 마십시오.
- 주어진 블록의 id와 시간 구성을 바꾸지 마십시오.

[평가]
- 학년별로 ◎/○/△ 3단계 기준을 성취기준에 맞춰 각각 작성합니다.
```
user: `<pair>`, `<plan>`(②의 결과), `<standards>`, `<units>`, `<skeleton>`(블록 id·lane·mode·시간), `<violations>`(수리 때만).

**⑤ Constraint Checker → 수리 루프**: Filler 결과를 골격에 합친 뒤 R1~R12를 돌린다. error가 있으면 위반 JSON을 `<violations>`로 넣어 Filler를 다시 부른다. **최대 2회**. 그래도 남은 error는 해당 블록에 "교사 확인 필요" 표시를 붙이고 rules 템플릿으로 그 필드만 채운다. warn은 그대로 UI에 보인다. 루프 구조는 `/mnt/c/Users/User/Desktop/대학교/3학년/TTA 공모전/TTA-Service/src/agent/loop.ts`를 참고한다. 각 단계 진행은 SSE `pipeline.step` 이벤트로 FlowRail에 보낸다.

**⑥ Critic (선택, `MODEL_JUDGE`, effort high)**: 데모 중에는 끄거나 비동기로 돌린다. 루브릭 C1~C6(1~4점): C1 성취기준 정합, C2 통합의 타당성, C3 간접지도 실행 가능성, C4 인지 수준, C5 평가 연계, C6 안전·적합성. 기준별 점수, 근거 블록 ID, 개선 제안 1개만 낸다. 자동 반영하지 않는다.

**⑦~⑨ 질문 수집 → 필터 → Clusterer (`MODEL_CLUSTER`, 1회 호출)**
- 제출 즉시 `shared/check/pii.ts`로 마스킹(전화·이메일·주민번호 정규식은 `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-market/backend/app/harness/gates.py`에서 옮긴다. "○○이가/○○가 때렸" 같은 호명 패턴은 `NAME_LIKE`로 마스킹). 위기 키워드(자해, 죽고 싶, 때려, 괴롭혀 등) 사전 플래그.
- 시스템 프롬프트 요지: "질문은 초등학생이 쓴 것이라 맞춤법이 틀릴 수 있다. 의미 기준으로 묶어라. 군집 라벨은 교사용 진단 문장으로, 포함 기준은 한 문장으로 써라. 연결 성취기준은 <lesson_codes> 안에서만 고르고 없으면 null. 이름이나 개인정보가 보이면 PII 플래그를 달아라. 자해·학대·괴롭힘을 암시하면 SAFETY 플래그만 달고 해석하거나 군집하지 마라."
- 코드 검사: `questionIds`와 `representativeId`가 실제 ID의 부분집합인지, `linkedCode`가 이번 차시 코드인지, 한 질문이 두 군집에 들어가지 않았는지. 위반 항목은 제거하고 미분류로 옮긴다.

**⑩ Next-lesson Generator (`MODEL_LESSON`)**
- 입력: 교사가 확인한 군집, 차시 성취기준과 성취수준 A/B/C 진술(DB), 학년별 응답 수.
- 학년 판정 보조(Claw-ED `adaptive.py` 아이디어): 학년별로 오개념 군집 질문 비율이 높으면 보충을 "재지도형"(10분 다른 방식), 낮으면 "복습형"(5분 워밍업)으로 지시문에 주입한다. 임계값은 설정값이다.
- 지시 요지: "학년별로 보충 1개(가장 큰 오개념 군집 대상)와 심화 1개(호기심·확장 군집 또는 성취기준의 다음 단계 대상)를 만든다. 모두 다음 차시 분리 구간의 간접지도 블록(10분 내외)에서 교사 없이 수행할 수 있는 카드여야 한다. 보충은 목표 성취기준 범위를 유지한 채 지원을 늘리고(더 쉬운 주제로 바꾸지 않는다), 심화는 더 많이가 아니라 더 깊게 생각하게 한다. 근거 군집 ID, 성취기준 코드, 목표 성취수준을 적는다. 학생에게 수준 라벨을 보이지 않는다." (k12-teacher-skills 개별화 규칙 R2·R3·R6, Claw-ED tiered 프롬프트를 번안. §8 라이선스 규칙 적용)
- 검사: R4(카드 필수 요소), R10(코드), R12(PII), `basedOnClusterIds ⊂ 실제 군집`.

### 6-4. 타임라인 규칙 R1~R12 (`shared/check/`, 출처 W3 §3.5)

| ID | 규칙 | 심각도 |
|---|---|---|
| R1 | 각 학년의 0~D분이 빈틈·겹침 없이 정확히 한 번씩 덮인다(`ALL` 블록은 두 학년 모두를 덮는다) | error |
| R2 | 같은 분에 DIRECT는 최대 1개(담임 1명, 협력강사가 있어도 동일) | error |
| R3 | JOINT 블록은 `lane: 'ALL'`이고, `ALL` 블록은 JOINT만 가능 | error |
| R4 | 모든 INDIRECT 블록에 카드가 있고 단계 2~5개, 나머지 필드가 비어 있지 않다 | error |
| R5 | 교사 전환(わたり) 횟수 ≤ N(기본 3). 매 분의 교사 초점(ALL/A/B, 둘 다 간접이면 없음)이 바뀌는 횟수를 센다 | warn |
| R6 | 분리 구간에서 학년별 DIRECT 시간이 각각 분리 구간 길이의 30% 이상 | warn |
| R7 | INDIRECT 블록은 5분 이상, 1~2학년은 15분 이하 | warn |
| R8 | 분리 구간을 INDIRECT로 시작하는 학년은 직전에 JOINT 블록이 있어야 한다(과제 안내) | warn |
| R9 | `noise: 'loud'`인 INDIRECT가 다른 학년 DIRECT와 겹치지 않는다 | warn |
| R10 | 인용한 성취기준 코드가 `standards.index.json`에 있고 학년군이 맞다(3학년 → `4..`) | error |
| R11 | 학년별 블록 길이 합 = D | error |
| R12 | 학생 이름·전화번호 등 PII 패턴이 없다 | error |

R6·R7의 기본값은 현직 교사 확인 전 가정값이다. 설정 파일로 빼고 UI에 "기본값(교사 검토 필요)"이라고 적는다.

## 7. 데이터 준비 (Phase 0에서 끝낸다)

1. **성취기준 인덱스**: `bobthecodebuilder88/kr-curriculum-2022`의 `data/초/*.jsonl`(10개 교과, 611건: 과학·국어·도덕·미술·사회·수학·실과·영어·음악·체육)을 `scripts/build-standards.ts`로 `data/standards.index.json`에 변환한다. 필드: `code`(괄호 없음), `band`(2|4|6), `subject`, `domainNo`, `statement`, `levels`(초등은 대부분 A/B/C 3단계, 6건은 수준 없음), `needsReview`, `textVerified:false`, `source: "교육부 고시 제2022-33호, 한국교육과정평가원(NCIC) / kr-curriculum-2022"`. 코드 중복 0건을 테스트로 확인한다.
   - 이 데이터셋에는 1·2학년 통합교과(바·슬·즐) 파일이 없다. 1·2학년 복식은 데모·평가에서 국어·수학만 쓴다.
2. **데모 원문 대조**: 데모에 쓰는 코드(최소 3·4학년 사회 `4사01-*`, `4사05-*`, 3·4학년 수학 `4수01-*`)를 NCIC PDF와 한 줄씩 대조해 `data/standards.demo.json`(`textVerified:true`)으로 만든다. NCIC 다운로드 예: 수학 `https://ncic.re.kr/inv/org/download.do?year=2022&seq=10003559&orgType=ogi4`, 사회 `seq=10003800`, 국어 `seq=10003553`, 과학 `seq=10003551`. 알려진 추출 흔적: `4사01-02` "…방안을 탐 색한다."(띄어쓰기). PDF를 직접 받을 수 없으면 사용자에게 받아 달라고 요청한다.
3. **단원 매핑**: `data/units.demo.csv` 열: `grade,subject,semester,unit,lesson,codes,month,note`. 교과서 본문은 넣지 않고 단원명만 쓴다. 데모 행은 3학년 「우리가 사는 곳」(`4사01-02`), 4학년 「지도로 만나는 우리 지역」(`4사05-02`)부터 시작하고, 평가 12시나리오의 단원을 추가한다. 출판사별로 단원 순서가 다르므로 `note`에 "예시 매핑, 학교 채택 교과서로 교사가 수정"이라고 적는다.
4. **(선택) 선수관계**: `taehyeonglim/korean-elementary-learning-map-mcp`의 `data/kr/dependencies.json`에서 데모 코드의 선수 코드만 뽑아 `data/prereq.demo.json`. 화면에는 "추천 구조"라고 표기한다. 이 레포의 `standard-texts.json` 진술문은 쓰지 않는다(표 추출 잡음).
5. **시드**: `data/seed/lesson.seed.json`(데모 수업), `data/seed/broken-draft.json`(R10 위반 코드 1개 + R9 위반 1개가 들어간 Filler 초안, 수리 장면용), `data/seed/questions.seed.json`(3학년 6개, 4학년 6개. 사회 지도 단원의 실제 아이 말투: "방위표가 뭐에요", "지도에 우리집은 왜 없어요", "축척이 머예요" 등. 1개는 `010-1234-5678`이 섞인 PII 예시. **위기 신호 예시는 단위 테스트에만 두고 라이브 시드에는 넣지 않는다**).

## 8. 재사용 지침과 라이선스

### 8-1. 학생 본인 파일 (복사해서 고친다. 모두 존재 확인함)

| 원본 | 목적지 | 할 일 |
|---|---|---|
| `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/harness/llm.ts` | `server/ai/llm.ts` | §6-1대로 수정 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/server.ts`(`/api/stream` 부분), `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/harness/trace.ts` | `server/routes/stream.ts`, `server/live/bus.ts` | 최근 이벤트 재생, 5초 ping, 첫 `: connected` 즉시 전송 유지. `session` 쿼리로 필터 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/frontend/src/shared/api/live.tsx` | `src/teacher/live.tsx` | CLOSED 시 재연결, 중복 제거 유지. SSE 실패 시 2초 폴링 폴백 추가 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/store/db.ts` | `server/store/db.ts` | 시드 리셋 연결 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/demo.ts`, `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/backend/src/sim/customers.ts` | `server/demo/fakeStudents.ts` | 가상 손님 → 가상 학생 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/경영정보학회/frontend/src/app/nav.ts`, `.../Layout.tsx`, `.../src/shared/ui/index.tsx` | `src/teacher/` | 메뉴 4개(수업 설계, 타임라인, 질문함, 다음 차시) |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-market/frontend/src/shared/ui/QrCode.tsx` | `src/ui/QrCode.tsx` | 한 줄 압축 포맷이므로 다시 포맷 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-market/frontend/vite.config.ts` | `vite.config.ts` | 멀티 엔트리·`usePolling` 부분만 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-pass/frontend/src/index.css`, `.../tailwind.config.js` | 같은 이름 | 버튼·입력·표·`@media print` 클래스. 색은 새 브랜드 1색 + slate(다른 대회 색 복사 금지) |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-pass/frontend/src/shared/ui/{Card,Badge,StatusPill,Section,EmptyState,CopyButton}.tsx` | `src/ui/` | 그대로 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-pass/frontend/src/features/agent-team/FlowRail.tsx`, `.../src/shared/theme/colors.ts` | `src/ui/FlowRail.tsx`, `src/ui/gradeColors.ts` | 팀 색 → 학년 색 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-pass/frontend/src/shared/api/client.ts` | 참고만 | live/snapshot/fixtures 3모드 아이디어 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/TTA 공모전/TTA-Service/src/agent/llm.ts`, `.../scripts/record-fixtures.mjs`, `.../src/agent/loop.ts` | `server/ai/fixtures.ts`, `scripts/record-fixtures.ts`, `server/ai/pipeline/repair.ts` | replay 키를 입력 해시로, 루프 최대 2회 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/금융 AI 공모전 해커톤/render.yaml`, `.../deploy/Dockerfile`, `.../.github/workflows/keepalive.yml`, `.../scripts/render_check.mjs` | `render.yaml` 등 | Node 단일 런타임으로 단순화 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition/src/lib/prompts.ts`, `.../src/lib/provider.ts` | 참고만 | `PROMPT_VERSION`, 비용·호출 상한 |
| `/mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/web/eval/run.mts`, `.../eval/README.md` | `eval/` 틀 | 정직한 라벨·한계 표기 |

**절대 열지도 복사하지도 않는 파일**: `/mnt/c/Users/User/Desktop/대학교/3학년/금융 AI 공모전 해커톤/금융 API 키.txt`, `/mnt/c/Users/User/Desktop/대학교/3학년/원티드 AI 공모전/ai 키.txt`, `/mnt/c/Users/User/Desktop/대학교/3학년/Notion Backup Codes.txt`. 원본 프로젝트 폴더의 `.env`도 복사하지 않는다. 원본 폴더는 읽기만 하고 수정하지 않는다.

### 8-2. 외부 레포 (패턴 차용)

클론 사본(세션 임시 폴더라 지워졌을 수 있다. 없으면 GitHub에서 `git clone --depth 1`로 `cotutor/` 밖 임시 폴더에 받는다):
`/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---2026-AI----------/1351a5c8-ebff-4c98-9d83-c0acfc4faee1/scratchpad/repos/`

| 레포 | 클론 폴더(위 경로 아래) | GitHub | 라이선스 | 가져올 것 |
|---|---|---|---|---|
| kr-curriculum-2022 | `bobthecodebuilder88_kr-curriculum-2022/` | https://github.com/bobthecodebuilder88/kr-curriculum-2022 | 코드 MIT / 데이터 공공누리 | `data/초/*.jsonl`, `scripts/verify.py` 규칙(TS로 재구현), `SKILL.md` 절대 규칙(기억으로 쓰지 말 것, 진술문 한 글자도 바꾸지 말 것) |
| k12-teacher-skills | `anthropics_k12-teacher-skills/` | https://github.com/anthropics/k12-teacher-skills | Apache-2.0 | 개별화 규칙 R1~R8, 자산 기반 언어, `evals/k12-lesson-differentiation/rubrics/differentiation.csv` 등 루브릭(P1~P4) |
| Aila | `aila/` | https://github.com/oaknational/oak-ai-lesson-assistant | MIT(이름·로고·Oak 콘텐츠 제외) | `packages/aila/src/protocol/schema.ts`의 `.describe()` 작성 규칙 방식, 그룹 단위 생성, `packages/core/src/utils/ailaModeration/moderationCategories.json`의 Physical 범주 |
| Claw-ED | `SirhanMacx_Claw-ED/` | https://github.com/SirhanMacx/Claw-ED | MIT | `clawed/adaptive.py`(재지도 판정), `clawed/prompts/tiered_assignments.txt` |
| worksheet-grab | `pblsketch_worksheet-grab/` | https://github.com/pblsketch/worksheet-grab | MIT | `src/domain/Variant.js`, `src/usecases/BuildVariants.js`(학생판 정답 제거 2중 방어) |
| learning-map | `taehyeonglim_korean-elementary-learning-map-mcp/`, `neohum_korean-elementary-learning-map-mcp/` | https://github.com/taehyeonglim/korean-elementary-learning-map-mcp , https://github.com/neohum/korean-elementary-learning-map-mcp | MIT | `data/kr/dependencies.json`, `src/normalize.mjs`, `src/gap-diagnosis.mjs`(선택) |
| QuizWeaver | `Robyn-Collie_QuizWeaver/` | https://github.com/Robyn-Collie/QuizWeaver | MIT | `src/deterministic_layers.py` 철학만 |
| live-qa-board | (클론 없음) | https://github.com/jinnyjiinlee/live-qa-board | MIT | TOPIC 모드, 승인 후 노출 UX |
| class-feedback | (클론 없음) | https://github.com/NADTEST45/class-feedback | MIT | localStorage ID, 실패 시 재시도, localhost QR 경고 |
| LLooM | (클론 없음) | https://github.com/michelle123lam/lloom | BSD-3 | "개념 + 포함 기준 + 응답 ID" 군집 출력 형식 |

**라이선스 규칙**
- MIT/BSD 코드를 옮기면 `THIRD_PARTY_NOTICES.md`에 레포, 저작권자, 라이선스, 옮긴 파일을 적는다.
- k12-teacher-skills(Apache-2.0)의 문구·루브릭을 번안해 쓰면 `LICENSES/k12-teacher-skills/`에 LICENSE와 NOTICE 사본을 두고 "한국어로 번안·수정함"을 적는다.
- 성취기준 데이터는 화면 하단과 README에 "성취기준 원문: 교육부 고시 제2022-33호(한국교육과정평가원 NCIC). 코드 인덱스: kr-curriculum-2022(MIT), 비공식 기계 추출본을 사람이 대조함"을 표기한다.
- **코드·프롬프트 문구 복사 금지**: sargupta/sahayakai(Proprietary), Adhish-Krishna/Sudar, Minjin-Son/AI-UDL-PLAN, JushBJJ/Mr.-Ranedeer-AI-Tutor, geo-2026/M-TRAIN(라이선스 없음), saniales/ai-lesson-planner(GPL-3.0), ClaperCo/Claper(AGPL). 이들의 공개된 아이디어(교대 지도표 등)만 우리 말로 다시 구현한다.
- "Aila" 이름과 Oak 로고·UI 문구를 쓰지 않는다.

## 9. 단계별 계획과 수용 기준

**각 Phase 끝에서 아래 "검증"을 실제로 돌리고, 결과(명령, 통과 수, 스크린샷 경로)를 사용자에게 보고한 뒤 다음 Phase로 간다.** 다단계 작업이므로 저장소 루트에서 `python3 C:/Users/User/.claude/plugins/fablize/scripts/goals.py`(create → next → checkpoint → 최종 검증 게이트)로 진행 상태를 남긴다. 실행 경로가 WSL에서 맞지 않으면 `/mnt/c/Users/User/.claude/plugins/fablize/scripts/goals.py`로 시도하고, 그래도 안 되면 사용자에게 알린다.

### Phase 0. 준비 (코드 없음, 사전 개발 규칙과 무관하게 지금 해도 됨)
산출물은 `docs/phase0/`와 `data/`, `eval/`에 둔다. 소스 코드(`.ts/.tsx`)는 만들지 않는다.
1. `data/standards.index.json`(§7-1. 변환은 일회성 데이터 작업으로 보고, 사전 개발이 금지되면 변환 스크립트는 현장에서 다시 쓴다), `data/standards.demo.json`, `data/units.demo.csv`, `data/seed/*.json`
2. `docs/phase0/prompts.md`: §6의 시스템 프롬프트 5종(Planner, Filler, Clusterer, Next-lesson, Critic)과 평가 기준선 프롬프트 최종본, `PROMPT_VERSION`
3. `docs/phase0/schemas.md`: §5 스키마를 표로 정리
4. `docs/phase0/wireframes.md`: 4화면 + 학생 페이지 와이어프레임(ASCII 또는 이미지), 화면별 수용 기준
5. `docs/phase0/demo-script.md`: 90초 데모 대본(§2) + 3분 확장판 + 장애 시 대본(replay 전환 멘트)
6. `eval/scenarios.json`(12개: 학년쌍 3종 × 교과 4종. 예: 3·4 사회, 3·4 수학, 5·6 과학, 5·6 국어 / 4·5 수학, 4·5 국어, 2·3 국어, 4·5 도덕 / 3·6 도덕, 3·6 체육, 2·5 수학, 1·4 국어), `eval/rubric.csv`(C1~C6 + k12 P1~P4 번안)
7. `docs/phase0/fixtures-plan.md`: 녹화할 라우트·입력 목록
8. `.env.example`, `.gitignore`(`.env`, `var/`, `node_modules/`, `artifacts/`), `README.md` 1쪽 초안
- **검증**: `standards.index.json` 611건·중복 0, 데모 코드 전부 `textVerified:true`, 시나리오 12개 JSON 파싱 성공, `.gitignore`에 `.env` 포함.

### Phase 1. 뼈대 + 학생 페이지 + QR + 실시간 질문함 (AI 없이 한 바퀴)
- Vite 2엔트리, Express, JSON 저장, `/health`, `/api/ai/status`, 세션 생성, 학생 제출(PII 마스킹 포함), SSE, 가상 학생, 데모 리셋.
- 교사 화면 보호: `TEACHER_KEY` 환경변수. 교사 앱은 최초 `?k=`로 받아 localStorage에 두고 헤더로 보낸다. 공개 라우트는 `GET /api/sessions/:code`, `POST /api/sessions/:code/responses`뿐. 공개 POST는 IP당 분당 20회, 본문 200자 제한.
- **검증**: vitest(PII 마스킹, 세션 코드, 제출 검증) 통과. Playwright: 교사 `/live`와 학생 `/s/?c=` 두 페이지를 열고 학생 제출이 1초 안에 교사 화면에 뜨는 것을 확인, 1440px·390px 스크린샷 저장 후 **직접 열어 본다**.

### Phase 2. 검사기 + 타임라인 화면
- `shared/check/*`, `shared/skeleton.ts`, S2 화면(경계 ±5분, 모드 전환, 위반 하이라이트).
- **검증**: 규칙마다 통과 예시 1개 + 위반 예시 1개 이상(최소 24케이스), 3개 골격 템플릿이 D=40·45·80에서 R1·R11 통과, `broken-draft.json`에서 R10·R9가 정확히 잡힘. Playwright로 경계 +5분 → R2 빨간 경고 → 되돌림 → 경고 사라짐을 스크린샷 2장으로 남긴다.

### Phase 3. 수업 생성 파이프라인 + 수업 설계 화면
- ①~⑤(+⑥ 선택), `AI_MODE` 3종, fixture 조회, FlowRail 진행, S1 화면, 승인·diff 저장, 과정안 인쇄.
- 첫 live 호출 때 확인할 것: 구조화 출력 정규식 알터네이션 허용 여부, Sonnet 5.5 effort low 지연(5회 p50/p95), `cache_read_input_tokens`가 두 번째 호출부터 0이 아닌지. 결과를 `docs/phase0/api-checks.md`에 적는다.
- **검증**: replay 모드 통합 테스트(데모 입력 → 검사 error 0), rules 모드에서도 같은 스키마 통과, 키 없이 `npm run dev`가 동작. live 1회 성공 로그. S1 스크린샷 확인.

### Phase 4. 군집 + 다음 차시 카드 + 승인 + 인쇄
- ⑨⑩, S3 군집 UI, S4 화면, 승인 → 다음 차시 골격 삽입 미리보기, 학생판·교사판 인쇄.
- **검증**: 군집 코드 검사 단위 테스트(없는 ID 제거, 중복 소속 제거, SAFETY 제외), 학생판 인쇄 DOM에 `teacherNote` 문자열이 0회 등장하는 테스트, 승인 전 인쇄 버튼 비활성. Playwright로 §2 데모 전 과정을 replay 모드에서 끝까지 돌리고 장면별 스크린샷 6장을 확인한다. 브라우저 인쇄 미리보기는 `page.pdf()`로 A4 PDF를 만들어 한글 깨짐·잘림을 확인한다.

### Phase 5. 배포 + fixture 녹화 + 평가 + 리허설
- Render 배포(§12), cloudflared 백업, `npm run record:fixtures -- --live`, `npm run eval`(§11), 실제 휴대폰 QR 리허설.
- **검증**: 배포 URL `/health` 200, 휴대폰 2대 이상에서 QR → 제출 → 교사 화면 표시 확인(사용자에게 확인을 요청하고 결과를 기록), `AI_MODE=replay`와 네트워크 차단 상태(로컬 실행)에서 데모 완주, `eval/REPORT.md` 생성.

## 10. 현장 일정 (사전 개발이 허용되지 않을 때)

공통: Phase 0은 미리 끝내 둔다(데이터·프롬프트·시드·시나리오·와이어프레임). 11/16 OT에서 작업 가능 시간과 반입 범위를 확인하고 아래 중 하나를 고른다. 사전 개발이 허용되면 Phase 1~5를 11/12~11/18에 끝내고, 현장에서는 교사 피드백 반영·평가 실행·리허설만 한다. **11/11 17:00 소개서 마감이 Phase 0보다 우선이다.**

### 6시간안 (팀 2~4명, 기능 우선순위가 곧 잘라낼 순서의 역순)

| 시각(상대) | 할 일 | 끝 기준 |
|---|---|---|
| 0:00–0:30 | 스캐폴드 + §8-1 파일 복사, `npm run dev` | 교사·학생 엔트리가 뜬다 |
| 0:30–1:30 | Phase 1 | 학생 제출이 교사 화면에 1초 안에 뜬다 |
| 1:30–2:30 | Phase 2(드래그 없음) | R1~R12 테스트 통과, 겹침 경고 시연 가능 |
| 2:30–4:00 | Phase 3(Critic 제외) | replay·live로 데모 수업 생성 |
| 4:00–5:00 | Phase 4 | 군집 → 카드 → 승인 → 인쇄 |
| 5:00–5:30 | 배포 + cloudflared + fixture 녹화 | 공개 URL에서 QR 동작 |
| 5:30–6:00 | Playwright 데모 완주 + 휴대폰 리허설 + 발표용 스크린샷 | 장면별 스크린샷 6장 |

뒤처지면 이 순서로 잘라낸다: Critic → 평가 스크립트(사전에 Phase 0 문서로 대체) → 선수관계 → 교사판 인쇄 → 질문 군집 수동 이동. **QR → 질문함 → 묶기 → 카드 승인과 겹침 경고는 자르지 않는다.**

### 22시간안 (11:00 시작, 다음 날 09:30 발표자료 제출)

| 시각 | 할 일 |
|---|---|
| 11:00–17:00 | 6시간안 전체 |
| 17:00–20:00 | 평가 스크립트 + 12시나리오 실행 + `eval/REPORT.md`, Critic 비동기 |
| 20:00–23:00 | 품질: 빈 상태·오류 상태·접근성·인쇄 품질, (선택) dnd-kit 드래그 편집 5분 스냅 |
| 23:00–03:00 | 교대 휴식. 남은 사람은 fixture 재녹화, 버그 수정 |
| 03:00–06:00 | 리허설 3회(라이브/replay/네트워크 차단), 지연 실측 반영 |
| 06:00–07:30 | 발표 스크린샷·비교 슬라이드("같은 요청, 두 결과") 반영, **07:30 코드 동결** |
| 07:30–09:30 | 배포 재확인, `/health` 깨우기, 발표자료 제출 |

## 11. 평가 스크립트 (`eval/run.ts`, `npm run eval`)

- 실행: `npm run eval -- --mode both --judge --max-usd 5`. 비용 상한(`EVAL_MAX_USD`)을 넘으면 멈춘다(KAIST `provider.ts`의 상한 패턴).
- **기준선(범용 챗봇)**: 같은 `MODEL_LESSON`에 성취기준 목록·골격·검사기 없이 "초등 {a}·{b}학년 복식학급 {교과} {D}분 수업안을 써 주세요. 학년별 2022 개정 성취기준 코드와 분 단위 시간표(교사 직접지도/간접지도)를 포함하세요."만 보낸다. 실제 ChatGPT 웹 출력을 쓰고 싶으면 `eval/baseline/manual/<scenarioId>.md`에 붙여 넣으면 그것을 우선 쓴다.
- **우리**: 앱 파이프라인 함수를 그대로 호출한다.
- **M1 코드 환각률**: 출력 전체에서 `/\[?([246](?:국|수|사|과|영|도|실|미|음|체|바|슬|즐)\d{2}-\d{2})\]?/g`로 코드를 뽑아 `standards.index.json`에 없거나 학년군이 틀린 비율(결정적).
- **M2 타임라인 위반**: 기준선 줄글은 Haiku로 "고치지 말고 그대로" `TimelineBlock[]`에 옮긴 뒤 R1~R11 검사. 옮기지 못한 부분은 "구조화 불가"로 따로 센다. 우리는 수리 후 결과.
- **M3 루브릭**: `MODEL_JUDGE`(effort high)가 C1~C6을 채점. 두 출력의 제시 순서를 무작위로 바꾸고 출처를 가린다. 교사 채점용 `eval/teacher_sheet.csv`(출처 가린 쌍)를 함께 내보내고, 교사 점수가 들어오면 교사-LLM 단순 일치율을 계산한다.
- **M4 교사 수정률**: `store`의 승인 diff에서 바뀐 필드 비율. 파일럿 데이터가 없으면 "측정 예정"으로 표기한다.
- 출력: `eval/REPORT.md`(시나리오 12개 표, M1~M4 평균, 모델·effort·날짜, "파일럿 측정, 시나리오 12개, 교사 채점자 n명" 한계 문구)와 `eval/results.json`.

## 12. 배포

- **Render**: web service 1개, `runtime: node`, `buildCommand: npm ci && npm run build`, `startCommand: npm start`, `numInstances: 1`(SSE 상태가 메모리에 있다), `healthCheckPath: /health`. 무료 플랜은 잠들므로 발표 10분 전·2분 전에 `/health`를 호출해 깨운다(유료 starter 사용 여부는 사용자가 정한다). 디스크는 재배포 때 초기화되므로 시드에서 다시 시작한다.
- **환경변수**: `ANTHROPIC_API_KEY`(`sync: false`, 대시보드에서만 입력), `AI_MODE`, `MODEL_LESSON=claude-sonnet-5-5`, `MODEL_CLUSTER=claude-haiku-5-5`, `MODEL_JUDGE=claude-opus-5-5`, `EFFORT_LESSON=low`, `AI_TIMEOUT_MS=20000`, `PUBLIC_BASE_URL`, `TEACHER_KEY`, `RETENTION_DAYS=7`, `PORT`, `DATA_DIR`. `.env.example`에는 값 없이 키 이름만 둔다.
- **QR URL**: `PUBLIC_BASE_URL`이 있으면 그것, 없으면 `window.location.origin`. localhost·사설 IP면 경고.
- **cloudflared 백업**: 로컬에서 `npm run build && npm start` 후 `cloudflared tunnel --url http://localhost:8787`. 나온 `https://*.trycloudflare.com` 주소를 `PUBLIC_BASE_URL`로 두고 재시작한다. 핫스팟을 함께 준비한다.
- **비밀값**: 키는 서버에서만 쓴다. 저장소·로그·스크린샷·fixture에 키나 프롬프트 원문을 남기지 않는다. 커밋 전 `git grep -n "sk-ant"`가 0건인지 확인한다. 커밋은 사용자가 요청할 때만 한다.

## 13. 개인정보·윤리 요구사항 (기능으로 구현하고 화면 하단 "데이터 원칙" 링크에 요약)

1. 교사 승인 전에는 학생에게 아무것도 나가지 않는다. 학생 페이지에는 AI 출력이 없다.
2. 학생 계정·이름·사진을 받지 않는다. 세션 코드와 학년만 쓴다.
3. 제출 즉시 PII 마스킹. LLM에는 마스킹본만 보낸다. 원문은 교사만 보고 `RETENTION_DAYS` 뒤 삭제한다.
4. 위기 신호는 AI가 해석·응답하지 않는다. 군집에서 빼고 교사 알림만 띄운다.
5. 학생부 문장·평가 점수를 만들지 않는다.
6. 모든 제안에 근거(성취기준 코드 + DB 원문, 근거 질문 ID)를 붙인다.
7. 'AI 초안' 배지와 교사 수정 이력을 남긴다.
8. LLM API 서버가 국외일 수 있으므로 개인정보를 보내지 않는다는 원칙을 README에 적는다.
9. 근거 문서(피치용): 교육부 「교육분야 인공지능 윤리원칙」(2022), 전북교육청 AI 교육 가이드라인(2026.8, 교사 최종 판단), 개인정보보호법 제22조의2(14세 미만), 학습지원 SW 개인정보 체크리스트 보도(2026.2). 세부 표기는 보고서 §5를 따른다.

## 14. 테스트와 실제 브라우저 확인 (완료 선언의 조건)

- `npm run typecheck`, `npm test`(vitest), `npm run e2e`(Playwright)가 모두 통과해야 한다.
- Playwright는 Chromium으로 §2 데모 전 과정을 replay 모드에서 돌리고, 1440px(교사)·390px(학생) 스크린샷을 `artifacts/screenshots/`에 저장한다. **저장한 스크린샷을 직접 열어 보고**, 잘림·겹침·빈 상태·한글 깨짐을 고친 뒤 다시 찍는다. 정적 검사나 테스트 통과만으로 "화면이 된다"고 말하지 않는다.
- WSL에서 Chromium 실행이 막히면(과거 masdae-market에서 있었던 문제) `npx playwright install --with-deps chromium`을 시도하고, 그래도 안 되면 막힌 사실을 그대로 보고하고 사용자에게 Windows 쪽 실행을 요청한다. 확인하지 못한 화면을 확인했다고 쓰지 않는다.
- 실제 휴대폰 QR 스캔은 에이전트가 할 수 없으므로 사용자에게 체크리스트(§15)로 요청하고 결과를 기록한다.

## 15. 데모 신뢰성 체크리스트

- [ ] `AI_MODE=replay`로 키·인터넷 없이 데모 전 과정 완주(로컬 + cloudflared)
- [ ] live에서 20초 넘으면 자동으로 녹화 응답으로 대체되고 "녹화 응답" 표시가 뜬다
- [ ] 시드 데이터: 데모 수업, 수리 장면용 broken-draft, 시드 질문 12개
- [ ] 화면 구석 "데모 리셋" 버튼(`TEACHER_KEY` 필요)으로 10초 안에 초기 상태 복귀
- [ ] "가상 학생 보내기"로 휴대폰 없이도 질문이 쌓인다
- [ ] 발표 10분 전·2분 전 예열: `/health`, 스키마 컴파일·캐시 예열용 데모 입력 1회 호출
- [ ] QR이 공개 URL을 가리키는지(localhost 경고 없음) 확인
- [ ] 휴대폰 2대(iOS·Android)로 QR → 제출 → 교사 화면 확인(마감 2시간 전)
- [ ] 핫스팟, 충전기, 녹화 데모 영상(최후 백업)
- [ ] 학교·행사장 망에서 SSE가 막히면 2초 폴링으로 자동 전환되는지

## 16. 작업 규칙

- 결과부터 짧게 보고한다. 각 Phase 보고에는 실행한 명령, 통과/실패 수, 스크린샷 경로, 남은 문제를 넣는다.
- 요청 범위 밖의 리팩터링·기능 추가를 하지 않는다. §3-2 비목표에 해당하면 먼저 묻는다.
- 원본 프로젝트 폴더와 연구 노트는 읽기만 한다. `cotutor/` 밖에 파일을 만들지 않는다(외부 레포 임시 클론 제외).
- 삭제·덮어쓰기·배포·커밋처럼 되돌리기 어려운 작업은 사용자 확인 후에 한다.
- 화면 문구는 짧은 평서문·명사형 한국어로 쓰고, "AI가 분석했어요"·보라 그라데이션·반짝이 아이콘처럼 AI 티 나는 장식을 쓰지 않는다. 에이전트 상태는 "✓ 완료 + 한 일 + 근거"로 보인다(L2 §6-4).
- 모르는 것은 모른다고 쓰고, 확인 방법을 함께 적는다.

# W1. 유사 오픈소스 레포 조사: AI 수업설계·개별화·학습지 도구

> 대상 프로토타입: **복식·소인수 학급 수업 코티처**
> (① 두 학년 동시 수업 설계 + 2022 개정 성취기준 정렬, ② 학년별 학습지(인쇄 PDF), ③ 직접/간접 지도 타임라인, ④ 학생 결과 기반 다음 차시 학년별 보충·심화 생성)
> 조사일: 2026-11-06 · 조사자: Claude(서브에이전트)

---

## 0. 한 줄 결론

- 그대로 포크해서 쓸 만한 "복식학급 코티처" 오픈소스는 **없다.** 복식(multigrade)을 표방하는 레포는 인도 해커톤산 소형 프로젝트뿐이고, 대부분 라이선스가 없거나 내용이 부실하다.
- 대신 **부품 조립**이 현실적이다. 아래 5개만 가져오면 4개 기능을 모두 덮을 수 있다.
  1. **`anthropics/k12-teacher-skills`** (Apache-2.0): Claude용 수업설계·3단계 개별화·형성평가 프롬프트와 LLM-judge 루브릭
  2. **`bobthecodebuilder88/kr-curriculum-2022`** (코드 MIT, 데이터 공공누리): 성취기준 3,294건, **성취수준 A~E**, 인용 검증기
  3. **`oaknational/oak-ai-lesson-assistant` (Aila)** (MIT): 섹션 단위 zod 스키마, planner→section agent 구조, JSON Patch 스트리밍, 모더레이션 카테고리
  4. **`pblsketch/worksheet-grab`** (MIT): 한국어 학습지 블록, 학생용/교사용 분리(정답 누출 차단), Chrome 기반 A4 PDF
  5. **`neohum/korean-elementary-learning-map-mcp`** (MIT): 초등 선수학습 그래프와 **역방향 결손 진단**(④ 보충 차시 근거)
- 한국 특화 자산으로 `Lily-Yu-Kor/deep-lessonplan-hwpx`(MIT)도 쓸 만하다. 교육부 '깊이있는 수업' 지도안 양식을 HWPX로 내보내고 성취기준 해설과 적용 시 고려사항 데이터를 담고 있다. 학교 현장 시연 효과가 크다.

---

## 1. 조사 방법과 열람 수준 표기

- **검색 경로**: WebSearch(영/한 키워드), GitHub Search API(`api.github.com/search/repositories`, 비인증. 호출 한도에 걸려 일부 메타데이터는 클론의 `git log`로 대체), GitHub topics(`lesson-plan`, `lesson-planning`, `teacher-tools`), 한국어 키워드(지도안, 성취기준, 학습지, 교사 AI) 검색
- **사용 키워드**: lesson plan generator, lesson planner ai, multigrade, teacher assistant llm, worksheet generator ai, differentiated instruction/worksheet, quiz generator llm, rubric generator, curriculum standards alignment, khanmigo, sahayak, teacher copilot, 지도안, 성취기준, 학습지, 교사 AI
- **열람 수준 표기**
  - **[클론]**: `git clone --depth 1`로 코드를 직접 열어 확인함(가장 신뢰도 높음)
  - **[페이지]**: GitHub 페이지나 공식 문서를 WebFetch로 열람함
  - **[API]**: GitHub API 메타데이터(별, 라이선스, 최근 push, 설명)만 확인함
  - **[스니펫]**: 검색 결과 요약으로만 확인함. 코드는 보지 않음
- 별 수와 날짜는 2026-11-06 기준 근사값이다. "최근 커밋"은 클론의 HEAD 커밋 날짜 또는 API의 `pushed_at`이다.

---

## 2. 랭킹 표 (상위 16)

평가 기준은 4개 기능 적합도(40%), 재사용 가능 라이선스(25%), 스택 적합성(Next.js/TS 또는 Python, Claude 전환 용이성, 15%), 품질과 유지보수(20%)이다.

| # | 레포 | 열람 | ★ | 최근 커밋 | 라이선스 | 스택 | ①설계/성취기준 | ②학습지/PDF | ③타임라인 | ④보충차시 | 한 줄 평 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [oaknational/oak-ai-lesson-assistant](https://github.com/oaknational/oak-ai-lesson-assistant) (Aila) | 클론 | 35 | 2026-11-05 | **MIT** | Next.js 16, TS, tRPC, Prisma+pgvector, OpenAI, Turborepo | ◎ | ○ (Google Docs/Slides) | ○ (cycle별 분) | △ | 실제 운영 중인 정부 지원 수업설계 AI. 아키텍처와 스키마의 교과서 |
| 2 | [anthropics/k12-teacher-skills](https://github.com/anthropics/k12-teacher-skills) | 클론 | (API 한도로 미확인) | 2026-10-13 | **Apache-2.0** | Claude Skills(MD) + Python 렌더러 | ◎ | ◎ (HTML/DOCX, 흑백 인쇄 고려) | ○ | ◎ (CFU→응답별 다음 조치) | Claude for Teachers 공식 스킬. 개별화 규칙 R1~R8과 평가 루브릭이 핵심 |
| 3 | [bobthecodebuilder88/kr-curriculum-2022](https://github.com/bobthecodebuilder88/kr-curriculum-2022) | 클론 | 1 | 2026-08-01 | **코드 MIT / 데이터 공공누리** | Python, JSONL | ◎ (성취기준+성취수준) | - | - | ◎ (A~E 수준) | 성취기준 환각 방지용 DB와 검증 CLI. 필수 데이터 |
| 4 | [pblsketch/worksheet-grab](https://github.com/pblsketch/worksheet-grab) | 클론 | 8 | 2026-08-12 | **MIT** | Node 24 ESM(무의존), Chrome headless | ○ (성취기준 CSV) | ◎ | - | △ | 한국 교사용 학습지 생성기. 학생/교사판 분리와 A4 PDF 완성도 높음 |
| 5 | [neohum/korean-elementary-learning-map-mcp](https://github.com/neohum/korean-elementary-learning-map-mcp) | 클론 | 3 | 2026-10-18 | **MIT** (+원문 출처표기) | Node MCP 서버 | ○ | - | - | ◎ (결손 역추적) | 초등 620 성취기준, 선수관계 2,293, `diagnose_learning_gap` |
| 6 | [SirhanMacx/Claw-ED](https://github.com/SirhanMacx/Claw-ED) (구 EDUagent) | 클론 | 64 | 2026-09-18 | **MIT** | Python 3.11, FastAPI형 serve, weasyprint/reportlab | ○ | ○ (PDF/DOCX/PPTX) | ○ (time_estimates) | ◎ (`adaptive.py`) | 출구평가→다음 차시 조정 루프를 코드로 구현한 유일한 레포 |
| 7 | [Lily-Yu-Kor/deep-lessonplan-hwpx](https://github.com/Lily-Yu-Kor/deep-lessonplan-hwpx) | 클론 | (미확인) | 2026-10-08 | **코드 MIT / 데이터 교육부 공공저작물** | Python | ◎ (핵심아이디어·내용요소·해설) | ○ (HWPX 지도안) | ○ (process) | - | '깊이있는 수업' 지도안 양식 JSON→HWPX 변환. 한국 현장 맞춤 |
| 8 | [taehyeonglim/korean-elementary-learning-map-mcp](https://github.com/taehyeonglim/korean-elementary-learning-map-mcp) | 클론 | 15 | 2026-08-27 | **MIT** | Node MCP | ○ | - | - | ○ | #5의 원본. 원문 텍스트에 PDF 추출 잡음이 있음(아래 경고) |
| 9 | [Robyn-Collie/QuizWeaver](https://github.com/Robyn-Collie/QuizWeaver) | 클론 | 8 | 2026-03-13 | **MIT** | Python Flask, reportlab, python-docx, 멀티 LLM(Claude 포함) | ○ | ○ | - | ○ (gap analysis) | "LLM은 쓰고, 규칙이 검증하고, 교사가 결정한다". 결정적 검증 레이어 참고용 |
| 10 | [THU-MAIC/OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) | 클론(일부) | 42.8k | 2026-11-06 | **MIT** | Next.js, pnpm, Postgres, 멀티 프로바이더(Anthropic 포함), **ko-KR 로캘** | △ | ○ (PPTX/HTML) | △ | - | 학생용 AI 교실. outline→scene 2단계 생성 파이프라인만 참고. 통째로 쓰기엔 과함 |
| 11 | [oaknational/oak-ai-autoeval-tools](https://github.com/oaknational/oak-ai-autoeval-tools) | 페이지 | 17 | 2026-06-11 | **MIT** (문서 OGL) | Python Streamlit, Postgres | - | - | - | - | 지도안 LLM-as-judge 벤치마크 도구. 데모용 품질 근거 |
| 12 | [myvipbackup2/china-k12-teacher-skills](https://github.com/myvipbackup2/china-k12-teacher-skills) | 클론 | 3 | 2026-09-12 | **Apache-2.0** | Agent Skills(MD) | ○ | ○ | - | ○ | #2를 중국 교육과정에 현지화한 사례. 우리가 한국판을 만들 때 그대로 따라갈 템플릿 |
| 13 | [sargupta/sahayakai](https://github.com/sargupta/sahayakai) | 클론 | 0 | 2026-10-26 | **없음**(스킬에 "Proprietary") | Next.js 15, Genkit+Gemini, Firebase, jspdf | ○ | ○ | ◎ (복식 회전표) | △ | 복식학급 "Parallel Rotation Plan" 아이디어만 참고. 코드 복사 금지 |
| 14 | [LQ458/lesson-plan-generator](https://github.com/LQ458/lesson-plan-generator) | 클론 | 2 | 2026-07-29 | **MIT** | Next.js + Express, pnpm, RAG 패키지 | ○ (bounded RAG) | △ | - | - | 출처 메타데이터를 강제하는 "bounded context" RAG 패턴이 깔끔함 |
| 15 | [pblsketch/gepai-mcp](https://github.com/pblsketch/gepai-mcp) | 클론 | 3 | 2026-08-10 | **MIT** | TS MCP, Cloudflare Worker | ○ | - | - | - | 교육부 연구사업 산출물. "한 번에 질문 하나, 선택지와 추천 제시" 대화형 설계 원칙 |
| 16 | [Adhish-Krishna/Sudar](https://github.com/Adhish-Krishna/Sudar) | 클론 | 1 | 2026-01-17 | **없음** | FastAPI, Ollama, RAG, MCP | △ | ○ | - | ○ (학생별 다음 학습지) | 복식학급용 학생 성과 기반 학습지 난이도 조정. 아이디어만 참고 |

범례: ◎ 직접 재사용 가능 · ○ 부분 참고 · △ 약함 · - 해당 없음

---

## 3. 전체 후보 목록 (36개)

| 레포 | 열람 | ★ | 라이선스 | 최근 | 메모 |
|---|---|---|---|---|---|
| oaknational/oak-ai-lesson-assistant | 클론 | 35 | MIT | 2026-11 | 상세 §4.1 |
| oaknational/oak-ai-autoeval-tools | 페이지 | 17 | MIT | 2026-06 | LLM-judge 평가 |
| anthropics/k12-teacher-skills | 클론 | ? | Apache-2.0 | 2026-10 | 상세 §4.2 |
| bobthecodebuilder88/kr-curriculum-2022 | 클론 | 1 | MIT/공공누리 | 2026-08 | 상세 §4.3 |
| taehyeonglim/korean-elementary-learning-map-mcp | 클론 | 15 | MIT | 2026-08 | 학습 그래프 원본 |
| neohum/korean-elementary-learning-map-mcp | 클론 | 3 | MIT | 2026-10 | 결손 진단 추가 |
| raphysicst-create/korean-vocational-learning-map-mcp | API | 2 | NOASSERTION | 2026-08 | 특성화고용. 범위 밖 |
| pblsketch/worksheet-grab | 클론 | 8 | MIT | 2026-08 | 상세 §4.4 |
| pblsketch/gepai-mcp | 클론 | 3 | MIT | 2026-08 | 환경교육 수업설계 MCP |
| Lily-Yu-Kor/deep-lessonplan-hwpx | 클론 | ? | MIT/교육부 | 2026-10 | 상세 §4.7 |
| SirhanMacx/Claw-ED | 클론 | 64 | MIT | 2026-09 | 상세 §4.6 |
| Robyn-Collie/QuizWeaver | 클론 | 8 | MIT | 2026-03 | 결정적 검증 레이어 |
| THU-MAIC/OpenMAIC | 클론 | 42.8k | MIT | 2026-11 | 학생용 멀티에이전트 교실 |
| HKUDS/DeepTutor | API | 55.7k | Apache-2.0 | 2026-11 | 학습자용 개인 튜터. 교사용 설계와 거리 멂 |
| JushBJJ/Mr.-Ranedeer-AI-Tutor | API | 29.5k | **없음** | 2025-09 | 프롬프트 하나로 된 튜터. 라이선스 없음 |
| myvipbackup2/china-k12-teacher-skills | 클론 | 3 | Apache-2.0 | 2026-09 | Anthropic 스킬 현지화 |
| ichangting/taotao-skills | 클론 | 21 | MIT(일부 Apache 파생) | 2026-07 | 중국 중학 국어 스킬 12종, 분층(개별화) 스킬 포함 |
| seyen37/tw-taxonomy | 클론 | 2 | **CC BY 4.0** | 2026-07 | 대만 108과강 지식그래프, 3단계 과제 |
| sargupta/sahayakai | 클론 | 0 | **없음** | 2026-10 | 복식 회전표 스킬 |
| raj45alok/SahayakAI | 클론 | 1 | MIT | 2026-09 | AWS Bedrock 해커톤작. 학습지 Word/PDF, 과제 채점 |
| ramnayudu/sahayak-ai | API | 1 | 없음 | 2025-07 | "rural multi-grade co-teacher", Gemini |
| adithipenugonda/AI-Sahayak | API | 1 | 없음 | 2026-03 | 복식 교실 보조, 개별화 학습지 |
| Adhish-Krishna/Sudar | 클론 | 1 | **없음** | 2026-01 | 복식학급 학생별 적응형 학습지 |
| saniales/ai-lesson-planner | 클론 | 20 | **GPL-3.0** | 2026-02 | Copilot 에이전트 + MARP 슬라이드 PDF |
| LQ458/lesson-plan-generator | 클론 | 2 | MIT | 2026-07 | 중국 K-12 RAG 지도안, 스트리밍 |
| Abhi-boostin/lessonai | API | 0 | 없음 | 2025-09 | Next.js + Gemini, PDF 내보내기 |
| llegomark/betterlessons | API | 4 | MIT | 2023-10 | Next.js + OpenAI. 오래됨 |
| fanhaoxiang1/LessonPlanner | API/스니펫 | 6 | 없음 | 2024-08 | arXiv 2408.01102 연구 프로토타입(Vue) |
| wyuc/TeachCraft | API | 4 | 없음 | 2026-01 | 교수설계 연구 프로토타입 |
| Apomera/AlloFlow | API | 4 | NOASSERTION | 2026-11 | 개별화 엔진(Gemini canvas). 클론 실패 |
| DemirBucukoglu/Worksheet_AI | 스니펫 | ? | ? | ? | 영어 학습지와 시험 docx 생성 |
| Khan/DifferentiatedWorksheetGenerator | API | 0 | 없음 | 2017-04 | Khan 연구용 프로토. 참고 가치 낮음 |
| ecdedios/lesson-plan-maker | API | 0 | MIT | 2024-01 | TEKS 정렬 + 수용별 학습지(노트북) |
| Cfsthk/layered-worksheet-generator | API | 0 | 없음 | 2026-09 | 홍콩 초등 분층 학습지(Qwen) |
| grafa166/class-act | API | 0 | 없음 | 2026-10 | 영국 NC 개별화 학습지 |
| Minjin-Son/AI-UDL-PLAN | 클론 | 0 | **없음** | 2026-10 | 한국어 UDL 지도안(Vite+Gemini, AI Studio 템플릿) |
| AI-Deokslife/Rubric · mindm1ner/dodal · RuneDaeg/munhang-map(MIT) · ZZombie04/hwpx_new(MIT) · insightflo/edu-deck-skills(Apache) · EDU-Forest/FOREST(SSAFY 최우수상) · greatsong/ai-chat-for-students | API | 0~11 | 혼재 | 2023~2026 | 한국 교사 도구 생태계. 성취기준 기반 평가, 성취기준 검색, HWPX 생성, 학습지 관리 등 |

> **복식학급 특화 레포 검색 결과**: GitHub에서 `multigrade`로 검색해도 의미 있는 결과는 인도의 "Sahayak" 계열(Google Agentic AI Day 2025 해커톤 출품작으로 추정)뿐이다. 모두 별 0~4개에 라이선스가 없거나 구현이 얕다. **우리 아이디어의 차별성 근거로 쓸 수 있다.**

---

## 4. 레포별 상세 노트

### 4.1 oaknational/oak-ai-lesson-assistant (Aila) [클론] ★ 최우선 아키텍처 참고

**개요**: 영국 정부 출연기관 Oak National Academy의 교사용 AI 수업설계 도우미. 영국 정부 알고리즘 투명성 기록(ATRS)에 등재된 공식 서비스다. 1,200회 이상 커밋했고 2026-11-05에 v1.86.2를 릴리스해 **매우 활발**하다. README는 "주로 내부용"이라고 밝히고 있어 외부에서 셋업하기는 어렵다(Doppler 시크릿, Clerk 인증, Oak 레슨 DB 필요).

**스택**: Turborepo + pnpm, `apps/nextjs`(Next 16), `packages/{aila, api(tRPC 11), core, db(Prisma 7 + Postgres/pgvector), rag, exports, gsuite, teaching-materials, lesson-adapters, ...}`. LLM은 `openai` SDK와 Vercel `ai` SDK(`@ai-sdk/openai`)를 함께 쓴다. 투명성 기록에 따르면 생성 모델은 GPT-4o, 재순위화는 Cohere Rerank다. 코드에서 Cohere 재순위화는 현재 주석 처리돼 있다.

**① 수업 스키마**: `packages/aila/src/protocol/schema.ts`(558줄, zod)
- `CompletedLessonPlanSchema = { title, keyStage, subject, topic, learningOutcome, learningCycles[1..3], priorKnowledge[1..5], keyLearningPoints[3..4], misconceptions[], keywords[1..5], basedOn, starterQuiz, cycle1, cycle2, cycle3|null, exitQuiz, additionalMaterials }`
- `CycleSchema = { title, durationInMinutes, explanation{spokenExplanation, accompanyingSlideDetails, imagePrompt, slideText}, checkForUnderstanding[{question, answers, distractors}], practice, feedback }` → **③ 타임라인의 원형.** 사이클마다 분 단위 시간과 "설명→이해 확인→연습→피드백" 구조가 있다.
- 각 필드의 `.describe()`에 **목소리(voice) 규칙**(TEACHER_TO_PUPIL_SLIDES, PUPIL, EXPERT_TEACHER), 글자 수 상한, "I can ..."으로 시작하기 같은 작성 규칙이 들어 있다. 스키마 자체가 프롬프트 역할을 한다.
- `LessonPlanSchema = Completed.partial()`: 부분 완성 상태를 허용하므로 섹션 단위로 점진 생성할 수 있다.

**프롬프트 아키텍처**: `packages/aila/src/lib/agentic-system/`
- `plannerAgent/plannerAgent.instructions.ts`: 계획 에이전트가 `"plan"` 또는 `"exit"` 중 하나로만 응답한다. 섹션을 **5개 그룹**(①제목·학년단계·교과 → ②학습목표·사이클 목표 → ③선수지식·핵심학습점·오개념·키워드 → ④시작퀴즈·사이클1~3·종료퀴즈 → ⑤추가자료)으로 나눈다. "다음 미완성 그룹만 생성"이 규칙이고, 사용자가 명시할 때만 그룹을 넘나든다. 범위 밖 대화는 거절한다.
- `sectionAgents/`: 섹션마다 전용 에이전트(`titleAgent`, `misconceptionsAgent`, `cycleAgent`, `starterQuizAgent` 등)가 `*.instructions.ts`와 `*.schema.ts` 쌍으로 있다. `sectionAgentRegistry.ts`로 등록한다.
- `sharedPromptParts/*.part.ts`: 프롬프트 조각을 모듈화했다(`currentDocument`, `relevantLessons`(RAG), `basedOnContent`, `messageHistory`, `userMessage`, `exemplarContent`, `errors` 등). **조각 조립식 프롬프트**라 Claude로 옮기기 쉽다.
- `britishEnglishCorrectorAgent`: 출력 후처리 교정 에이전트. 우리는 **"초등 학년별 어휘 수준 교정 에이전트"**로 바꾸면 된다.
- `protocol/jsonPatchProtocol.ts`: LLM 출력을 RFC6902 JSON Patch(`add`/`replace`, 경로 화이트리스트 `/title`, `/cycle1` 등)로 받아 문서에 적용한다. 그래서 채팅 옆 문서 패널이 섹션 단위로 실시간 갱신된다.

**RAG**: `packages/rag/getRelevantLessonPlans/getRelevantLessonPlans.ts`
- 제목 임베딩(OpenAI) → pgvector 검색 + **keyStage/subject 메타데이터 필터** → (재순위화 비활성) → 상위 레슨을 `relevantLessons` 프롬프트 조각에 넣는다. 사용자가 하나를 고르면 `basedOn`으로 고정된다.
- 우리 버전에서는 "학년군 + 교과" 필터와 성취기준 코드 검색으로 대체하면 된다. 해커톤 규모에서는 벡터 DB 없이 **JSONL 키워드 조회만으로 충분하다**(§4.3).

**모더레이션**: `packages/core/src/utils/ailaModeration/moderationCategories.json` + `moderationPrompt.ts`
- 6개 그룹, 1~5 리커트 척도: Language & discrimination(l/), Violence & crime(v/), Upsetting/sensitive(u/), Nudity & sex(s/), Physical(p/: 도구 사용, 모방 가능 행동, 외부 콘텐츠, 신체 활동), **Toxic(t/: 자해·무기·불법 안내)**. Toxic만 생성을 차단하고 나머지는 "성인 지도 권장" 같은 콘텐츠 안내 라벨을 붙인다.
- "학년단계(나이)를 고려해 채점하라", "점수 5여도 근거를 적어라" 같은 지시가 있다. 비동기로 독립 실행되며, 사용자는 판정에 이의를 제기할 수 있다(투명성 기록).
- **Physical 그룹은 초등 복식학급에 특히 유용하다.** 간접 지도 시간에 교사 없이 하는 활동의 안전 위험(가위, 실험도구 등)을 표시할 수 있다.
- 위협 탐지(프롬프트 인젝션)는 Lakera와 Google Model Armor 같은 외부 유료 서비스에 의존한다. 우리는 생략해도 된다.

**기타 패키지**
- `packages/lesson-adapters/src/agents/classifierAgent.ts`: 수업 수정 요청을 의도로 분류한다(`changeReadingAge`, `translateLesson`, `removeNonEssentialContent`, ...). **④ 보충 차시에서 "읽기 수준 낮추기" 같은 의도 분류에 그대로 응용할 수 있다.**
- `packages/teaching-materials/src/documents/teachingMaterials/{glossary, comprehension, starterQuiz, exitQuiz}`: 부가 자료 생성 프롬프트(`build*Prompt.ts`)와 스키마
- `packages/exports/`: 내보내기는 **Google Docs/Slides 템플릿 기반**이다(`exportDocsWorksheet.ts`, `exportSlidesFullLesson.ts`). PDF 렌더러가 아니라서 우리 ②에는 직접 쓰기 어렵다.
- UI: `apps/nextjs/src/components/AppComponents/{Chat, SectionContent, download, static-lesson-plan-renderer.tsx}`. 왼쪽 채팅, 오른쪽 섹션 문서 레이아웃이고 "Continue" 버튼으로 다음 그룹 생성

**가져갈 것 / 버릴 것**
- 가져갈 것: zod 스키마 설계 방식(`.describe()`에 작성 규칙 넣기), 그룹 단위 점진 생성 planner, 섹션 에이전트 + 프롬프트 조각 구조, JSON Patch 스트리밍, 모더레이션 카테고리 JSON, cycle 구조(분 단위)
- 버릴 것: Turborepo 전체, Prisma/pgvector, Doppler, Clerk, Google Workspace 내보내기, Inngest/Sentry/Avo 등 운영 인프라. **포크하지 말고 패턴만 이식하는 편이 낫다.**

### 4.2 anthropics/k12-teacher-skills [클론] ★ Claude 프롬프트 직접 이식

**개요**: "Claude for Teachers"에 탑재된 공식 스킬 4종의 원본이다. Anthropic과 Learning Commons가 공동 개발했고 Apache-2.0이다. 2026-10-13에 커밋됐다.

| 스킬 | 기능 | 우리 기능 매핑 |
|---|---|---|
| `k12-lesson-plan-creation` | 성취기준 정렬 지도안 + 학생 자료 + 관찰 기록지 생성 | ① ② ③ |
| `k12-lesson-differentiation` | 기존 수업을 Below/At/Above 3단계로 개별화. 교사용 계획 1부 + 학생용 3부 | ② ④ |
| `k12-check-for-understanding` | 수학 형성평가 1~3문항. **오답 선택지를 문서화된 오개념에서 가져오고, 응답별 다음 조치를 교사 가이드로 제공** | ④의 입력 설계 |
| `k12-lesson-prep` | 기존 수업 사전 준비 메모 | - |

**핵심 설계 요소**
- **`shared` 레지스트리 + `documents[]` 구조**(`references/lesson-json.md`): 여러 문서에 나오는 내용은 `shared`에 한 번만 등록하고 `{type:"from_shared", key}`로 참조한다. 값은 `{teacher, student, stimulus}` 면(facet)으로 나뉜다. 교사용 페이지는 교사 스크립트와 "학생이 보는 문구"를, 학생용 페이지는 학생 면만 렌더링한다. **교사용 지도안과 학년별 학습지가 서로 어긋나지 않게 하는 구조라 ②③ 동시 생성에 딱 맞다.**
- 개별화 규칙 R1~R8(`k12-lesson-differentiation/references/math.md` 등 교과별 파일)
  - R2 성취기준 범위 유지(가장 어려운 사례는 Below 단계에서도 빼지 않고 스캐폴딩한다)
  - R3 Below는 **이름을 밝힌 선수 성취기준**으로 끌어올리고, Above는 후속 성취기준으로 확장한다
  - R4 하위 단계 스캐폴드(CRA: 구체물→그림→추상)
  - R5 모든 학습지는 성찰 질문으로 끝낸다
  - R6 "보이지 않는 수정"(학생에게 단계 라벨을 노출하지 않음)
  - R7 단계 내 점진적 스캐폴드 감소
  - R8 범위와 기본값(학습자 정보가 없으면 UDL 기본 지원 적용)
- **자산 기반 언어 규칙**: "weak", "struggling", "behind" 같은 표현을 금지하고 구체적 오개념으로 기술한다("분모를 각 부분의 크기가 아니라 부분의 개수로 이해함"). **한국어 버전 학생 피드백에도 적용할 가치가 있다.**
- 교사에게 기술 용어(JSON, 렌더링 등)를 노출하지 않는다는 진행 안내 규칙
- 렌더러: `scripts/render_lesson_html.py`, `render_lesson_docx.py`, `theme.css`. **흑백 인쇄를 고려해** 색 대신 아이콘 접두를 쓰고 학생 학습지는 무채색으로 만든다. 블록 타입은 paragraph, callout, table, fill_in, workspace, checklist, page_break 등이다.
- **평가 루브릭**(`evals/*/rubrics/*.csv`): ID, Bucket, Criterion, 통과 조건으로 구성된 LLM-judge용 기준이다. 예를 들어 P1 성취기준 범위 유지, P2 선수/후속 근거, P3 스캐폴드가 답을 주지 않음, P4 학습양식(VAK)이 아니라 **숙달도 기반 개별화**. **데모 때 "품질 자동평가" 근거로 바로 쓸 수 있다.**
- `plugin/.mcp.json`: MagicSchool, Diffit, Eedi, Brisk 등 상용 교사 도구의 MCP 엔드포인트가 들어 있다. MagicSchool 등은 오픈소스가 아니라 MCP로만 연동된다는 뜻이다.

**한국화 포인트**: Learning Commons KG(미국 성취기준) 호출을 `kr-curriculum-2022`의 `lookup.py`나 JSONL 조회로 바꾸면 된다. 중국판 `myvipbackup2/china-k12-teacher-skills`가 정확히 같은 방식으로 현지화했으니(`UPSTREAM.md`, `COMPARISON.md`, `profiles/`) 구조를 그대로 따르면 된다.

**라이선스 주의**: Apache-2.0이다. 재배포할 때 `LICENSE`와 `NOTICE`(Anthropic, Learning Commons 저작권)를 유지하고 수정 사실을 표시해야 한다.

### 4.3 bobthecodebuilder88/kr-curriculum-2022 [클론] ★ 성취기준 데이터 1순위

- 2022 개정 교육과정 성취기준 3,294건(초 611, 중 704, 고 1,979)을 담고 있다. 형식은 `data/<학교급>/<교과>.jsonl`(36개 파일)이다.
- 레코드 예시(초 수학):
  `{"code":"2수01-01","subject":"수학","statement":"수의 필요성을 인식하면서 0과 100까지의 수 개념을 이해하고, 수를 세고 읽고 쓸 수 있다.","school":"초","grade_band":"초1-2","levels":{"A":"...","B":"...","C":"..."},"statement_verified":true,"needs_review":false}`
- **`levels`(성취수준 A~E)가 핵심이다.** ④ 보충·심화 차시에서 "이 학생은 C수준 진술에 해당하니 B수준 과제로 끌어올린다"처럼 **공식 수준 기술에 근거한 개별화**가 가능해진다.
- `scripts/lookup.py`(교과, 학교급, 키워드 조회)와 `scripts/verify.py`(문서에 인용된 성취기준 코드와 진술문이 원문과 같은지 검증. 없는 코드, 변형된 문장, 없는 수준(LVLMISS)을 잡아냄)
- `SKILL.md`의 "절대 규칙"(기억으로 쓰지 말 것, 진술문을 한 글자도 바꾸지 말 것, 고유키는 (교과, 코드), 미수록 39건은 비워 두고 알릴 것)은 **우리 시스템 프롬프트에 그대로 옮길 가치가 있다.**
- 품질 메모: 초등 레코드의 `source` 필드에 "중학교[별책8]"처럼 학교급 표기 오류가 섞여 있다(메타데이터 문제일 뿐 진술문은 정상). 진술문 미수록 39건과 `needs_review` 플래그를 UI에서 처리해야 한다.
- 라이선스: 코드는 MIT, 데이터는 교육부 고시 원문(공공누리)이다. **출처(교육부, 한국교육과정평가원) 표기가 필수다.**

### 4.4 pblsketch/worksheet-grab [클론] ★ 학습지와 PDF

- 한국 초·중·고 교사용 **로컬 학습지 생성, 편집, 검수, 내보내기 도구**(v0.6.0-beta.2). Claude Code나 Codex가 요청을 해석하고, 무의존 Node CLI가 구조, 검수, 인쇄를 맡는다. **API 키가 필요 없는 하네스형**이라 웹앱에 붙이려면 CLI나 usecase를 서버에서 호출해야 한다.
- `data/achievement-standards.csv`: 성취기준 3,285행(학교, 과목, 학년군, 코드, 내용)
- `blocks/core/*.html`: 학습지 블록 40여 종(KWL, 벤다이어그램, 프레이어 모델, 피시본, exit 3-2-1, stoplight, rubric, answer-line 등)과 교과팩(`pack-math`, `pack-korean`, ...), `archetypes.json`(학습지 원형)
- `schema/worksheet-object.schema.json`: 페이지(flow/float) + 닫힌 개체 카탈로그 12종 + 문항 유형 7종
- `src/domain/Variant.js` + `src/usecases/BuildVariants.js`: **단일 HTML에서 학생용과 교사용 2벌을 만든다. 학생용은 `.answer` 내용을 물리적으로 제거하고 grep으로 한 번 더 막는 2중 방어를 쓴다.** 누출이 감지되면 출력을 중단한다.
- `src/adapters/ChromeRenderer.js`, `PaginationMeasurer.js`: Chrome `--headless=new --print-to-pdf`로 A4 PDF를 만든다. **페이지 넘김을 측정한 뒤 확정해야 내보낼 수 있다**(scaffold 상태 문서는 export 거부).
- `themes/*.css`(교과별 테마), `.claude/agents/{worksheet-planner, designer, reviewer, exporter, curriculum-mapper}.md`: 역할을 나눈 서브에이전트 정의
- 재사용 전략: 해커톤에서는 **블록 HTML/CSS와 테마, 학생/교사판 분리 로직만 가져온다.** PDF는 Next.js API route에서 Playwright `page.pdf()`나 브라우저 `window.print()`로 대체하는 쪽이 가볍다.

### 4.5 neohum / taehyeonglim korean-elementary-learning-map-mcp [클론] ★ ④ 결손 진단

- 초등 11개 교과, 성취기준 620, 미시 주제 1,956, 선수관계(공식 416 + 추천 1,877), 단원 클러스터 152, 학년군 1-2/3-4/5-6
- **neohum판에만 있는 기능**: `src/gap-diagnosis.mjs`, `roadmap.mjs`. `diagnose_learning_gap`이 Kahn 위상정렬로 **역방향 DAG를 탐색**해 고학년 오류의 원인을 이전 학년군 선수 개념(구구단, 자릿값 등)까지 추적하고 보충 로드맵을 만든다. `normalize.mjs`는 `4수 01 08` 같은 코드 표기 변형을 정규화한다.
- **복식 수업에 특히 유용하다.** 3·4학년 복식에서 4학년 학생이 3학년 내용의 결손을 보이면 같은 교실의 3학년 활동에 합류시키는 "학년 간 이동 보충"을 그래프 근거로 제안할 수 있다. 우리 아이디어의 차별점이 된다.
- **품질 경고(taehyeonglim 원본)**: `standard-texts.json` 620건 중 334건이 `pattern-match`로 추출됐다. 일부는 표 열이 섞이거나(예: `[2건01-01]`) 다음 소제목이 끝에 붙어 있다(예: `[4수01-02] ... 설명할 수 있다. 세 자리 수의 덧셈과 뺄셈`). **진술문 원문은 kr-curriculum-2022를 정본으로 쓰고, 이 레포는 그래프(topics, dependencies)만 쓰는 것을 권장한다.**
- 선수관계는 "모델의 추천 구조"라고 명시돼 있다(NOTICE). 데모에서는 "추천"으로 표현해야 한다.

### 4.6 SirhanMacx/Claw-ED [클론] ★ ④ 피드백 루프 코드

- 로컬 우선 Python 교사 도우미(별 64, MIT, 활발). 교사 자료를 수집하고 스타일 프로필을 만든 뒤 지도안, 학생 자료, 슬라이드를 만든다.
- **`clawed/adaptive.py`**(187줄): `analyze_performance(grading_results)`로 숙달률, 인지수준별 약점, `proceed / partial_reteach / full_reteach`를 판정하고, `generate_adjustment_context()`로 **다음 차시 생성 프롬프트에 주입할 텍스트**를 만든다. 숙달률 50% 미만이면 "다른 방식으로 10분 재지도", 50~80%이면 "5분 복습 워밍업"이 들어간다. **④의 최소 구현 그 자체**라서 학년별로 두 번 돌리면 된다.
- `clawed/prompts/tiered_assignments.txt`: 3단계 과제 프롬프트("Tier 1은 더 쉬운 게 아니라 더 지원받는 것, Tier 3는 더 많은 게 아니라 더 깊은 사고", "배점은 단계 간 동일")
- `clawed/prompts/{differentiation, worksheet, rubric, quiz, lesson_plan, iep_modification}.txt`, `clawed/differentiation.py`
- `models.py`의 `DailyLesson`(do_now, direct_instruction, guided_practice, independent_work, exit_ticket, differentiation{struggling, advanced, ell}, `time_estimates`)은 직접/간접 지도 구분이 명시된 수업 모델이다. "학생"을 "학년"으로 바꾸면 ③ 타임라인 스키마가 된다.
- `export_pdf.py`(weasyprint), `export_docx.py`, `export_pptx.py`

### 4.7 Lily-Yu-Kor/deep-lessonplan-hwpx [클론] 한국 지도안 양식

- 『2022 개정 교육과정 기반 수업설계 도움자료』의 '깊이있는 수업' 차시 지도안(40쪽 양식)과 단원 설계안(38쪽)을 **JSON에서 한글(.hwpx)로** 만든다.
- `data/curriculum/<교과>.json`: 핵심 아이디어, 내용 요소(지식·이해 / 과정·기능 / 가치·태도), 성취기준, **성취기준 해설, 적용 시 고려 사항**. kr-curriculum-2022에 없는 해설 텍스트를 보완해 준다.
- 예시 JSON(`examples/초5_영어_길묻고답하기.json`) 키: `meta{grade, subject, topic, durationMin}`, `coreIdeas`, `contentElements`, `standards`, `methods`, `intent`, `inquiryQuestions`, `assessmentTask`, `process`, `sources`. **한국 지도안 필드 설계의 기준점**으로 쓴다.
- 해커톤 시연에서 "한글 파일로 바로 결재 올리기"가 되면 심사위원(교사, 교육청 관계자)의 공감을 얻기 쉽다.
- 데이터는 MIT가 아니라 교육부 공공저작물이라 출처를 표기해야 한다. 기계 추출이라 `needs_review` 항목이 있다.

### 4.8 Robyn-Collie/QuizWeaver [클론]

- 원칙: "LLM은 쓰고, 규칙이 검증하고, 교사가 결정한다." 교사 전용이며 학생 데이터를 LLM에 보내지 않는다.
- `src/deterministic_layers.py`: 학년별 Lexile 대역, Flesch-Kincaid, 인지수준 분포 청사진(Bloom/DOK)을 규칙으로 처리한다. 한국어에서는 **학년별 문장 길이와 한자어 비율 같은 규칙 검사**로 응용할 수 있다.
- `src/critic_validation.py`: 문항 유형별 사전 검증(MC 정답 개수, 빈칸 형식, 순서 문항 등). LLM 출력을 결정적으로 거르는 코드다.
- `src/performance_analytics.py`: `compute_gap_analysis`, `get_standards_mastery`, `identify_weak_areas`(성취기준별 숙달도)
- `prompts/generator_prompt.txt` + `critic_prompt.txt`: 생성기-비평가 2단 구조

### 4.9 THU-MAIC/OpenMAIC [클론(일부)]

- 별 42.8k, MIT, 매일 커밋. 주제나 문서를 "멀티에이전트 인터랙티브 교실"(AI 교사의 음성 강의, 화이트보드, 퀴즈, PBL)로 바꾼다. **학생용 몰입형 경험**이 목적이라 우리(교사용 설계)와는 방향이 다르다.
- 참고 포인트: ① **outline → scenes 2단계 생성 파이프라인**(`@openmaic/generation`, `lib/prompts/templates`), ② `lib/ai/providers.ts`의 Anthropic 등 멀티 프로바이더 추상화, ③ `lib/i18n/locales/ko-KR.json` 존재, ④ PPTX와 오프라인 HTML 내보내기
- 복식학급의 **간접 지도 시간에 학생이 혼자 보는 콘텐츠**(자기주도 학습용)로 활용할 여지는 있지만 해커톤 범위를 넘는다.

### 4.10 sargupta/sahayakai [클론] 복식 아이디어 출처 (코드 사용 금지)

- 인도 11개 언어, 음성 우선 교사 플랫폼(Next.js 15 + Genkit/Gemini + Firebase). `sahayakai-main/src/ai/flows/`에 `lesson-plan-generator`, `worksheet-wizard`, `rubric-generator`, `quiz-generator`, `exam-paper-generator` 등이 있다.
- **`.agent/skills/multigrade-planner/SKILL.md`**: 45분 동안 두 학년을 운영하는 **"Parallel Rotation Plan"**
  ```
  | 시간 | 교사 행동(1학년) | 학생 행동(2학년) |
  | 0-10 | 공통 도입(이야기) | 청취 |
  | 10-25 | 직접지도(1학년) | 자기주도(2학년 워크북) |
  | 25-40 | 자기주도(1학년 연습) | 직접지도(2학년) |
  | 40-45 | 공통 정리 | 공통 정리 |
  ```
  저자원 환경(분필, 칠판, 돌멩이, 나뭇잎) 제약도 있다. 한국 복식수업의 직접·간접 교차(교대) 지도 방식과 같은 구조다(국내 용어와 모형명은 W 시리즈의 교수법 조사로 확인할 것).
- **레포에 LICENSE가 없고 스킬 frontmatter에 `license: Proprietary - SahayakAI Internal`이라고 적혀 있다.** 아이디어(공개된 교수법 구조)만 참고하고 텍스트나 코드는 복사하지 않는다.
- `worksheet-wizard.ts` 스키마의 `chalkboardNote`(칠판 판서 조언) 필드는 착안점으로 쓸 만하다. PDF는 `src/lib/export-pdf.ts`(jspdf + html2canvas)로 만든다.

### 4.11 기타 간단 노트

- **oak-ai-autoeval-tools** [페이지]: Streamlit 기반이다. 지도안 데이터셋을 만들고, 프롬프트 빌더로 judge 테스트를 정의하고, 모델과 프롬프트를 비교한다. 외부 기여는 받지 않는다. 해커톤에서는 §4.2의 루브릭 CSV로 간단한 judge를 만드는 편이 빠르다.
- **myvipbackup2/china-k12-teacher-skills** [클론]: Anthropic 스킬을 기초/향상/도전 3단계로 현지화했다. `profiles/shanghai-primary-it` 같은 지역 프로필 구조다. **우리 "한국 초등 복식 프로필" 설계 템플릿**으로 쓴다.
- **LQ458/lesson-plan-generator** [클론]: Next.js와 Express 스트리밍 프록시. RAG 결과가 비면 명시적으로 처리하고, 모든 응답에 출처 메타데이터를 붙이고, 컨텍스트 길이를 제한한다. 성취기준 근거 표시 UI의 참고 사례.
- **pblsketch/gepai-mcp** [클론]: 교육부·한국환경보전원 연구 산출물. "한 번에 질문 하나, 선택지와 추천 제공, 요약 확인 후 생성"이라는 교사 대화 원칙을 모든 프롬프트에 강제한다. 우리 입력 마법사 UX에 참고한다.
- **Adhish-Krishna/Sudar** [클론]: "복식 교실용"을 표방한다. 교사 코멘트와 이전 학습지 성과로 학생별 다음 학습지 난이도를 조정한다(FastAPI, Ollama, docling RAG, MCP, manim). 라이선스가 없다.
- **seyen37/tw-taxonomy** [클론]: 대만 108과강 지식그래프와 3단계 과제(CC BY 4.0). 한국 learning-map과 같은 계열(Marble Skill Taxonomy에서 영감)이다.
- **saniales/ai-lesson-planner** [클론]: GPL-3.0. Copilot 채팅 에이전트와 MARP 슬라이드 PDF. 코드를 복사하면 전체가 GPL로 감염되므로 주의한다.
- **HKUDS/DeepTutor**, **Mr.-Ranedeer-AI-Tutor** [API]: 별이 많은 학습자용 튜터라서 교사용 설계와 관련성은 낮다. Ranedeer는 라이선스가 없다.

---

## 5. Borrow List (파일·아이디어 단위)

### ① 두 학년 동시 수업 설계 + 성취기준 정렬
| 가져올 것 | 출처 파일 | 적용 방법 |
|---|---|---|
| 성취기준 + 성취수준 DB | `kr-curriculum-2022/data/초/*.jsonl` | 앱 번들에 정적 JSON으로 포함. 학년군(초1-2/3-4/5-6) + 교과 + 키워드로 조회 |
| 성취기준 인용 검증 | `kr-curriculum-2022/scripts/verify.py`, `SKILL.md` "절대 규칙" | 생성 후 코드와 진술문 문자열 일치 검사(TS로 30줄이면 재구현 가능). 불일치하면 재생성하거나 경고 |
| 성취기준 해설·적용 시 고려사항 | `deep-lessonplan-hwpx/data/curriculum/*.json` | 프롬프트 컨텍스트로 주입해 성취기준 해석의 근거로 사용 |
| 섹션 스키마 작성법 | `aila/packages/aila/src/protocol/schema.ts` | zod `.describe()`에 한국어 작성 규칙(목소리, 글자 수, "~할 수 있다" 종결) 삽입 → Claude tool input schema(structured output)로 사용 |
| 그룹 단위 점진 생성 | `aila/.../plannerAgent/plannerAgent.instructions.ts` | 그룹을 ①성취기준 선택 → ②학년별 목표 → ③공통 도입/학년별 활동 → ④타임라인 → ⑤학습지로 재구성 |
| 프롬프트 조각 모듈화 | `aila/.../sharedPromptParts/*.part.ts` | `currentDocument`, `standards`, `classProfile`, `previousResults` 조각으로 구성 |
| 지도안 생성 지침 | `k12-teacher-skills/.../k12-lesson-plan-creation/SKILL.md`, `references/math.md` | 단계(Step 0 라우팅 → 명확화 질문 → 근거 확보 → 생성) 구조를 한국어로 번역하고 각색 |
| 한국 지도안 필드 | `deep-lessonplan-hwpx/examples/*.json` | `coreIdeas`, `contentElements`, `inquiryQuestions`, `assessmentTask`, `process` 필드 차용 |
| 입력 대화 원칙 | `gepai-mcp` README 설계 철학 | "한 번에 질문 하나 + 추천 선택지" 마법사 |

### ② 학년별 학습지(인쇄 PDF)
| 가져올 것 | 출처 | 적용 방법 |
|---|---|---|
| `shared` 레지스트리 + teacher/student 면 | `k12-teacher-skills/.../references/lesson-json.md`, `example_lesson.json` | 교사용 지도안 1부 + 학년A 학습지 + 학년B 학습지를 **하나의 JSON에서** 렌더링해 어긋남을 방지 |
| 흑백 인쇄 친화 렌더 | `k12-teacher-skills/.../scripts/render_lesson_html.py`, `theme.css` | 블록 타입 목록(fill_in, workspace, checklist, page_break 등)을 React 컴포넌트로 옮김 |
| 한국어 학습지 블록 | `worksheet-grab/blocks/core/*.html`, `themes/ko.css`, `templates/math.json` | KWL, 프레이어, exit 3-2-1, stoplight 등을 그대로 포팅(MIT) |
| 정답 누출 차단 | `worksheet-grab/src/domain/Variant.js`, `src/usecases/BuildVariants.js` | 학생판에서 `.answer` 제거 + 2차 문자열 검사 |
| A4 PDF | `worksheet-grab/src/adapters/ChromeRenderer.js` | 서버에서는 Playwright `page.pdf({format:'A4'})`, 클라이언트에서는 `@media print` + `window.print()`. **Noto Sans KR/Pretendard 폰트 임베드 필수** |
| 3단계 과제 프롬프트 | `Claw-ED/clawed/prompts/tiered_assignments.txt` | 학년 내 2~3단계(보충/기본/심화)로 축소해 사용 |
| 판서 노트 필드 | sahayakai `worksheet-wizard.ts`(아이디어만) | `boardNote` 필드를 우리 스키마에 직접 정의 |

### ③ 직접/간접 지도 타임라인
| 가져올 것 | 출처 | 적용 방법 |
|---|---|---|
| 사이클 분 단위 구조 | Aila `CycleSchema.durationInMinutes` | 슬롯마다 `{start, end, gradeA:{mode:'direct'|'indirect'|'joint', activity}, gradeB:{...}}` |
| 교대 지도 모형 | sahayakai `multigrade-planner/SKILL.md`(아이디어만) | 공통 도입 → A직접/B간접 → 교대 → 공통 정리 |
| 수업 단계 시간 기본값 | Claw-ED `DailyLesson.time_estimates` | 40분 기준 기본 템플릿 |
| **결정적 제약 검증** | QuizWeaver `deterministic_layers.py` 철학 | "교사 직접 지도는 동시에 한 학년만", "슬롯 합계 = 40분", "간접 지도 활동에 Physical 위험 표시" 규칙을 코드로 검사(LLM이 아닌 규칙) |

### ④ 학생 결과 기반 다음 차시 학년별 보충·심화
| 가져올 것 | 출처 | 적용 방법 |
|---|---|---|
| 성과→다음 차시 프롬프트 주입 | `Claw-ED/clawed/adaptive.py` | 학년별로 `analyze_performance` → `proceed/partial_reteach/full_reteach` → 컨텍스트 주입 |
| 형성평가 설계(오개념 오답지 + 응답별 다음 조치) | `k12-teacher-skills/.../k12-check-for-understanding/SKILL.md`, `references/math.md` | 차시 끝 출구평가를 이 형식으로 생성하면 학생 응답을 오개념에 바로 매핑할 수 있음 |
| 성취수준 A~E | `kr-curriculum-2022` `levels` | 학생 결과를 수준으로 매핑하고 다음 차시 목표 수준을 설정 |
| 선수 결손 역추적 | `neohum/.../src/gap-diagnosis.mjs`, `roadmap.mjs`, `data/kr/dependencies.json` | 오답 성취기준에서 선수 성취기준을 찾아 보충 활동에 반영. 복식이라 하위 학년 활동 합류도 제안 가능 |
| 수정 의도 분류 | Aila `lesson-adapters/src/agents/classifierAgent.ts` | 교사가 "더 쉽게", "읽기 수준 낮춰" 같은 자유 요청을 하면 의도를 분류 |
| 성취기준별 숙달 집계 | QuizWeaver `performance_analytics.py` | 학년, 성취기준별 숙달률 대시보드 |
| 자산 기반 피드백 언어 | k12-check-for-understanding "Asset-based language" | "부족함" 대신 구체적 오개념 기술. 한국어 금지어 목록 작성 |

### 공통: 안전·품질
| 가져올 것 | 출처 | 적용 방법 |
|---|---|---|
| 모더레이션 카테고리 | Aila `moderationCategories.json`, `moderationPrompt.ts` | 6개 그룹을 한국어로 옮겨 생성 후 별도 Claude 호출(Haiku급)로 비동기 검사 |
| LLM-judge 루브릭 | `k12-teacher-skills/evals/*/rubrics/*.csv` | P1~P4 등 핵심 기준 10개를 골라 데모용 자동 품질 점수 생성 |
| 출력 후처리 교정 | Aila `britishEnglishCorrectorAgent` | "학년 수준 어휘·문장 교정" 에이전트로 각색 |

---

## 6. 라이선스 경고

| 등급 | 레포 | 내용 |
|---|---|---|
| **사용 가능(허용적)** | Aila, autoeval-tools, kr-curriculum-2022(코드), worksheet-grab, learning-map-mcp(두 판 모두), Claw-ED, QuizWeaver, OpenMAIC, deep-lessonplan-hwpx(코드), LQ458, gepai-mcp, raj45alok/SahayakAI, taotao-skills | MIT. 저작권 고지만 유지하면 됨 |
| **사용 가능 + 고지 의무** | anthropics/k12-teacher-skills, china-k12-teacher-skills, DeepTutor | Apache-2.0. `LICENSE`와 `NOTICE` 유지, 변경 사실 표기. k12 스킬은 **Learning Commons 공동 저작권**도 표기 |
| **데이터 출처 표기 필수** | kr-curriculum-2022 `data/`, deep-lessonplan-hwpx `data/curriculum/`, learning-map 원문 텍스트, worksheet-grab CSV | 교육부 고시 제2022-33호 원문이라 MIT 대상이 아님. 공공누리/저작권법 제24조의2에 따라 "교육부·한국교육과정평가원(NCIC)" 출처 표기. **비공식 데이터**이고 기계 추출 오류(미수록 39건, needs_review)가 있음 |
| **CC BY 4.0** | seyen37/tw-taxonomy | 저작자 표시 필수(대만 데이터라 직접 쓸 일은 적음) |
| **카피레프트, 코드 복사 금지** | saniales/ai-lesson-planner (GPL-3.0) | 코드를 섞으면 전체 GPL 의무 발생. 아이디어만 참고 |
| **라이선스 없음 = 모든 권리 유보** | sargupta/sahayakai(명시적 "Proprietary"), Sudar, AI-UDL-PLAN, Mr.-Ranedeer, fanhaoxiang1/LessonPlanner, TeachCraft, lessonai, ramnayudu/sahayak-ai, adithipenugonda/AI-Sahayak 등 | **코드, 프롬프트 텍스트 복사 금지.** 공개된 교수법 구조(교대 지도표 등)를 우리 말로 다시 구현하는 것만 가능 |
| **불명확** | Apomera/AlloFlow (NOASSERTION) | 사용 전 라이선스 파일 확인 필요 |
| **상표·데이터** | Aila | 코드는 MIT지만 Oak 로고와 상표는 제외되고 Oak 레슨 콘텐츠는 별도(OGL) 조건. "Aila" 이름과 UI 문구 그대로 사용 금지 |

---

## 7. 설계 시사점 (조사 중 발견)

1. **학년군 구조와 복식**: 2022 개정 초등 성취기준은 학년군(1-2, 3-4, 5-6) 단위로 고시된다. 흔한 복식 편성(1·2, 3·4, 5·6학년)은 **같은 학년군의 같은 성취기준 집합**을 공유하므로, 두 학년의 차이는 "같은 성취기준의 어느 부분을 어느 학년 교과서 단원에서 가르치는가"(학년별 단원 배치)와 "성취수준"에서 나온다. **조사한 어떤 데이터셋에도 교과서 단원↔성취기준↔학년 매핑은 없다.** 해커톤 데모 교과 1~2개만 수작업으로 매핑표를 만들어야 한다(핵심 차별 자산).
2. **동일 성취기준 + 수준 차등 전략**: 같은 학년군 복식이라면 kr-curriculum-2022의 성취수준(A~E)과 k12 differentiation의 R2(성취기준 범위 유지)/R3(선수·후속 성취기준 명시)를 결합해 "공통 주제, 학년별 목표 수준"을 설계할 수 있다. 학년군이 다른 복식(예: 2·3학년)은 learning-map의 선수관계로 연결한다.
3. **환각 방지가 심사 포인트**: kr-curriculum-2022 README가 보여 주듯 LLM은 `[9수05-08]`처럼 없는 코드를 만들거나 "알고"를 "이해하고"로 바꾼다. **생성 → 검증(verify) → 불일치 시 재생성** 루프를 데모에서 보여 주면 신뢰성을 강조할 수 있다.
4. **Claude 전환 난이도**: Aila는 OpenAI `zodResponseFormat`/`ai` SDK를 쓰고, Claw-ED, QuizWeaver, OpenMAIC은 멀티 프로바이더(Claude 포함)이며, k12 스킬은 Claude 네이티브다. Claude API의 tool use 또는 structured output(JSON schema)으로 zod 스키마를 그대로 쓰는 경로가 가장 매끄럽다(구체 API 사용법은 별도 문서 확인 권장).
5. **PDF 경로 추천**: 해커톤에서는 React로 HTML을 그리고 `@media print` CSS를 적용한 뒤 (a) 클라이언트 `window.print()` 또는 (b) 서버 Playwright `page.pdf()`를 쓰는 조합을 권한다. jspdf+html2canvas(sahayakai 방식)는 래스터화돼 텍스트를 선택할 수 없고 용량이 크다. weasyprint(Claw-ED)는 Python 백엔드일 때 쓴다. 한글 폰트 임베드를 반드시 확인한다.

---

## 8. 한계와 미검증 사항

- GitHub API 비인증 한도(검색 10회/분, 코어 60회/시간)에 걸려 `anthropics/k12-teacher-skills`, `deep-lessonplan-hwpx` 등 일부 레포의 **별 수는 확인하지 못했다**(최근 커밋은 클론으로 확인).
- OpenMAIC은 230MB 규모라 README와 디렉터리 구조만 확인했고 생성 프롬프트 본문은 읽지 않았다.
- Aila는 로컬 실행을 시도하지 않았다(Doppler와 내부 DB 의존). 프롬프트와 스키마 파일만 정적으로 검토했다.
- `Apomera/AlloFlow`는 클론에 실패했다(대용량 추정). 설명만 확인했다.
- MagicSchool, Diffit, Khanmigo의 **오픈소스 대안 중 의미 있는 것은 찾지 못했다.** 상용 도구는 MCP 엔드포인트로만 공개돼 있다(k12-teacher-skills `.mcp.json`).
- 한국 에듀테크 해커톤 수상 레포는 SSAFY 최우수상 `EDU-Forest/FOREST`(온라인 학습지 관리) 외에는 찾지 못했다. LLM 기반 수업설계 수상작은 검색에 걸리지 않았다.
- 성취기준 데이터 3종(kr-curriculum-2022, learning-map, deep-lessonplan-hwpx)은 모두 **비공식 기계 추출본**이다. 데모 교과의 성취기준은 NCIC 원문과 직접 대조할 것을 권한다.

---

## 9. 출처

- Oak Aila 레포: https://github.com/oaknational/oak-ai-lesson-assistant
- Oak Aila 영국 정부 알고리즘 투명성 기록: https://www.gov.uk/algorithmic-transparency-records/oak-national-academy-aila-oaks-ai-lesson-assistant
- Oak AutoEval: https://github.com/oaknational/oak-ai-autoeval-tools
- TES 기사(Aila 오픈소스 언급): https://tes.com/magazine/analysis/general/oak-national-academy-lesson-planning-ai-tool-cuts-teacher-workload
- Anthropic K-12 스킬: https://github.com/anthropics/k12-teacher-skills
- kr-curriculum-2022: https://github.com/bobthecodebuilder88/kr-curriculum-2022
- 초등 학습 맵 MCP: https://github.com/taehyeonglim/korean-elementary-learning-map-mcp · https://github.com/neohum/korean-elementary-learning-map-mcp
- worksheet-grab: https://github.com/pblsketch/worksheet-grab · gepai-mcp: https://github.com/pblsketch/gepai-mcp
- deep-lessonplan-hwpx: https://github.com/Lily-Yu-Kor/deep-lessonplan-hwpx
- Claw-ED: https://github.com/SirhanMacx/Claw-ED · QuizWeaver: https://github.com/Robyn-Collie/QuizWeaver
- OpenMAIC: https://github.com/THU-MAIC/OpenMAIC
- SahayakAI multigrade-planner 스킬 목록: https://skills.sh/sargupta/sahayakai/multigrade-planner · 레포: https://github.com/sargupta/sahayakai
- china-k12-teacher-skills: https://github.com/myvipbackup2/china-k12-teacher-skills · taotao-skills: https://github.com/ichangting/taotao-skills
- 기타: https://github.com/LQ458/lesson-plan-generator · https://github.com/Adhish-Krishna/Sudar · https://github.com/saniales/ai-lesson-planner · https://github.com/seyen37/tw-taxonomy · https://github.com/raj45alok/SahayakAI · https://github.com/HKUDS/DeepTutor · https://github.com/JushBJJ/Mr.-Ranedeer-AI-Tutor · https://github.com/Minjin-Son/AI-UDL-PLAN

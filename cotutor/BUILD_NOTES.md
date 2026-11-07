# BUILD_NOTES — 함께반(가칭) 프로토타입 빌드 기록

빌드 에이전트가 사용자에게 묻지 못하고 진행했기 때문에, 명세(`../PROMPT_코티처_프로토타입_구축.md`)와 다르게 정한 것을 모두 여기에 적는다.
작성일: 2026-11-06.

## 1. 지금 되는 것 (이 세션에서 실제로 돌려 확인)

| 장면 | 상태 | 확인 방법 |
|---|---|---|
| S1 수업 설계 | 학년쌍 배지, FlowRail 6단계(맥락→계획→골격→채움→검사→수리, 단계마다 "✓ + 한 일"), ■□★ 과정안, 성취기준 칩(원문 툴팁 + 원문 확인됨/확인 중), ◎○△ 평가, 검사·수리 기록, AI 초안 → 교사 승인 배지, 편집 diff 저장, A4 인쇄(PDF 2쪽) | e2e `screenshots/01·02`, `S1-lesson-plan.pdf` |
| S2 타임라인 | 2레인 CSS grid, 블록 상세, 직접↔간접 전환, 같은 학년 인접 블록과 경계 ±5분, 되돌리기, R1~R12 패널, 전환 횟수·직접지도 분, error 0일 때만 승인, R4 → "카드 만들기" | e2e `03·04` |
| S3 질문함 | 수업 시작(4자리 코드, 큰 QR, URL, localhost·사설 IP 경고), 지금 질문, SSE 실시간(68~70ms 측정), 재연결·중복 제거·3회 실패 시 2초 폴링, PII 마스킹(원문은 교사만 펼침), SAFETY 상단 알림·군집 제외, 가상 학생 12개, AI로 묶기(라벨·포함 기준·학년·연결 성취기준·유형·질문 수·대표 질문 인용·미분류), 라벨 수정·선택 상자로 옮기기 | e2e `07·08` |
| 학생 페이지 | 390px 가로 스크롤 없음, 버튼 52px, 본문 16px, 이름 입력칸 없음, localStorage 랜덤 ID, 실패 시 폰 보관함 → 5초마다 재전송(sid로 서버 중복 방지), AI 출력 없음 | e2e `05·06` |
| S4 다음 차시 | 학년별 보충 1·심화 1, 근거 군집·성취기준·목표 성취수준(DB 진술 인용), 편집·승인·반려, 다음 차시 골격 미리보기(검사기 통과), 승인 전 인쇄 비활성, 학생판(교사 메모 DOM 제거 + 문자열 검사) / 교사판 | e2e `09·10·11`, `S4-student-grade3.pdf` |
| AI 모드 | `AI_MODE=live|replay|rules`, `LLM_PROVIDER=ollama|anthropic`. live 실패·시간초과·스키마 불일치 → replay fixture → rules. 화면에 결과마다 경로(live·ollama / replay·ollama 녹화 / rules) 표시 | live: `e2e/live-ollama.mjs` + `screenshots/live-*.png` |
| 테스트 | `npm run typecheck` 통과, `npm test` 87개 통과, `npm run e2e` 35/35 통과 | §6 |

## 2. 코디네이터 지시로 바뀐 것

1. **AI 공급자 = Ollama(기본)**. `LLM_PROVIDER=ollama|anthropic`(기본 ollama), `OLLAMA_BASE_URL`(기본 `http://172.20.32.1:11434`, 닿지 않으면 `http://localhost:11434` 시도). Ollama `/api/chat`, `stream:false`, `format`=zod에서 만든 JSON 스키마(`z.toJSONSchema`), `temperature 0.2`, 응답은 zod로 검증하고 실패하면 zod 오류를 넣어 1회 수리 호출. 기본 타임아웃 120초(Ollama) / 20초(Claude).
2. **Anthropic 경로는 구현만 하고 실행 확인은 못 함**(키 없음). `claude-api` 스킬 문서대로: Sonnet/Opus는 `client.beta.messages.parse` + `betaZodOutputFormat` + `betas:['server-side-fallback-2026-07-01']` + `fallbacks:'default'`, Haiku는 `client.messages.parse` + `zodOutputFormat`(fallback 없음). system은 `cache_control: ephemeral` 배열, `thinking`·`temperature`·prefill·강제 `tool_choice`는 보내지 않음, `stop_reason`이 refusal/max_tokens면 폴백. 설치된 `@anthropic-ai/sdk 1.6.0` 타입으로 typecheck만 통과.
3. **기본 모드 = live + ollama**(`AI_MODE` 미설정 시 live). Claude 경로에서 키가 없으면 replay로 둔다(명세의 "키 없으면 rules" 대신: replay가 없으면 어차피 rules로 내려가므로 결과는 같고, 녹화본이 있으면 더 낫다).
4. **fixture는 Ollama 실제 실행에서 녹화**(`npm run record:fixtures -- --live`). 수작업 fixture는 만들지 않았다. 단, **수리 장면용으로 첫 채움(Filler) 초안에 R10 위반 1건(블록 B1에 없는 코드 `4사05-07`)을 수작업으로 넣었다**. 이 파일만 `origin: "ollama-live+hand-edit"`이고 `originNote`에 그 사실을 적었으며, 화면에는 `replay·ollama 녹화+위반 주입`, 하단에는 "replay 수업 초안은 Ollama(로컬 모델) 녹화본에 수리 장면용 위반 1건을 수작업으로 넣은 것"으로 보인다. 수리 호출(위반 목록을 받은 2번째 채움)은 실제 Ollama 응답이다.
   - fixture 출처 현황: `ollama-live` 8개(라우트별 default 포함), `ollama-live+hand-edit` 1개. `hand-authored`(실제 API 녹화 아님) 0개. 수작업 fixture가 생기면 하단에 "수작업 예시 fixture(실제 API 녹화 아님)"가 자동 표시된다.

## 3. 모델 선택 측정 (Ollama, Windows 호스트 GPU, 2026-11-06)

| 작업 | 모델 | 1회차 | 2회차 | 결과 품질(사람 눈) |
|---|---|---|---|---|
| 군집 | qwen3:4b-instruct-2507-q4_K_M | 8.3초 | 4.0초 | 학년별 2~3개, 진단 문장 라벨, 연결 코드 채움 |
| 군집 | ax4-light:q4_K_M | 11.7초 | 6.7초 | 1개짜리 군집 다수, 라벨 "오개념"처럼 짧음, linkedCode "null" 문자열 |
| 수업(계획) | ax4-light | 3.5~9.0초 | | 코드 선택 정확 |
| 수업(채움) | ax4-light | 14~16초 | 수리 13~17초 | 한국어 자연스러움, 카드 단계 3~4개 |
| 다음 차시 카드 | ax4-light | 18~21초 | | 첫 프롬프트에선 카드 누락·코드 형식 오류 → 프롬프트에 예시·"정확히 4개" 추가 후 4장 정상 |

→ 기본값: `MODEL_LESSON=ax4-light:q4_K_M`, `MODEL_CLUSTER=qwen3:4b-instruct-2507-q4_K_M`, `MODEL_JUDGE=qwen2.5:7b`(Critic은 미구현이라 쓰이지 않음).
UI에서 live 전체 흐름 실측(`e2e/live-ollama.mjs`): 수업 19.2초(첫 검사 통과), 군집 8.9초(4개), 다음 차시 카드 18.4초.

**품질 한계**: 7B·4B 로컬 모델이라 Claude보다 품질이 낮다. 군집이 실행마다 달라지고(같은 시드로 3~5개), 3학년 '장소감' 질문에 '지도' 라벨을 붙이는 등 오분류가 있으며, 다음 차시 카드의 끝 신호·산출물이 장황하다. 발표에서는 **운영 목표 = Claude(또는 동급 모델)**, Ollama는 "인터넷·키 없이도 도는 로컬 대체 경로"로 소개하는 것이 정직하다.

## 4. 명세와 다르게 정한 것 (사용자에게 물어야 했던 것)

| # | 명세 | 실제 | 이유 |
|---|---|---|---|
| 1 | Phase마다 보고 후 다음 Phase | 한 번에 끝까지 진행 | 질문 불가, 코디네이터 지시 |
| 2 | `goals.py`로 진행 기록 | 사용하지 않음 | 코디네이터가 우선순위를 직접 지정, 시간 절약 |
| 3 | 데모 코드 NCIC 원문 **사람** 대조 | NCIC PDF(사회 seq=10003800, 수학 seq=10003559)를 받아 pypdf로 텍스트를 뽑고 **공백 제외 자동 대조** → 20건 모두 일치, `textVerified:true`, `verifyNote`에 "자동 대조(사람 최종 대조 전)" | 사람 대조는 에이전트가 못 함. 발표 전 사람이 한 줄씩 확인 필요 |
| 4 | `4사01-02` "탐 색" 추출 흔적 | demo.json에서만 "탐색"으로 바로잡고 `extractionFix`에 기록. index.json 원본 진술은 그대로 | NCIC 원문은 줄바꿈으로 나뉜 한 단어 |
| 5 | "통합교과(바·슬·즐) 파일이 없다" | 클론에 `통합교과.jsonl`(48건)이 있어 611건에 포함됨(10개 교과 + 통합교과 = 611). 코드 중복 0 | 데이터 실제와 명세가 다름. 611건 합계는 같음 |
| 6 | LLM 출력 스키마에 StdCode 정규식 | LLM 스키마에서는 `z.string()`으로 받고 R10으로 검사 | 로컬 모델 grammar(Ollama format)에서 정규식 알터네이션 지원이 불확실, 명세의 대안 경로 |
| 7 | Lesson.aiMeta | `sources`(단계별 AI 경로), `flaggedBlockIds`(교사 확인 필요), `checkLog`(검사 라운드별 규칙)를 더함 | "검사 1건 위반 → 수리 1회 → 통과"와 경로 표시를 화면에 보이기 위해 |
| 8 | replay 미스 → 라우트 기본 fixture | 수업 라우트(planner·filler·blockCard)는 **해시가 정확히 맞을 때만** fixture, 아니면 rules | 다른 교과 입력에 사회 수업 녹화본이 섞이는 것을 막음. 군집·다음 차시는 기본 fixture를 쓰되 질문 텍스트로 재매핑(새 질문은 2-gram 자카드로 가장 비슷한 군집, 없으면 미분류) |
| 9 | Planner 코드 검사 | R10(존재·학년군)에 더해 **교과 일치**도 검사 | 수학 수업에 사회 코드가 들어가는 경우를 막음 |
| 10 | 수리 루프 | 수리 결과는 **위반이 난 블록에만** 반영 | 1차 녹화에서 작은 모델이 멀쩡한 블록을 다시 쓰다 R4를 새로 만듦(수리 2회 필요) → 수정 후 1회로 통과 |
| 11 | R4 | "안내 역할에 학생 이름"(예: "학생 이름")도 R4 위반으로 봄. 다음 차시 카드는 코드가 역할 문장으로 바꿈 | Ollama가 guideRole에 "학생 이름"을 넣는 일이 있었음(명세: 실명 금지) |
| 12 | 파이프라인 파일 구조 `pipeline/{context,planner,filler,repair,…}.ts` | `pipeline/lesson.ts`(①~⑤+수리), `cluster.ts`, `nextCards.ts` 3개 | 한 흐름이라 나누면 오히려 읽기 어려움 |
| 13 | Critic ⑥ | 프롬프트만 두고 미구현 | 명세상 선택·데모 중 끔 |
| 14 | e2e 경로 `e2e/demo.spec.ts`, 스크린샷 `artifacts/screenshots/` | `e2e/demo.mjs`(playwright 라이브러리 직접), `screenshots/` | 코디네이터가 `cotutor/screenshots/` 지정. @playwright/test 러너 대신 단일 스크립트 |
| 15 | 학생 인쇄 미리보기 | 버튼 → 편집 화면을 DOM에서 내리고 학습지만 그린 "인쇄 미리보기" 화면 → 인쇄 버튼이 `window.print()` | DOM 제거 방어를 확실히 하고, headless에서 미리보기를 찍기 위해 |
| 16 | 교사 키 | `TEACHER_KEY`가 없으면 교사 API를 열어 둠(로컬 데모). 있으면 `x-teacher-key` 헤더 또는 `?k=`(SSE) | 로컬 시연 편의. 배포 시 반드시 설정 |
| 17 | 단원 매핑 | `units.demo.csv` 23행. 단원명은 예시(출판사별 다름), `note`에 "예시 매핑 - 학교 채택 교과서로 교사가 수정" | 교과서 확인 불가 |
| 18 | 시드 수업 | `data/seed/lesson.seed.json` = Ollama 녹화 데모 수업(수리 후) | 리셋 직후 S2·S3가 바로 동작하게 |

## 5. 안 된 것 / 남은 일

- **Claude live 호출 미검증**(키 없음): 구조화 출력 정규식 허용 여부, Sonnet 5.5 지연 p50/p95, `cache_read_input_tokens` 확인을 못 함 → `docs/phase0/api-checks.md`에 "미확인"으로 적음.
- **평가 스크립트(M1~M4)**: `eval/run.ts`는 우리 파이프라인의 M1(코드 환각)·M2(타임라인 위반)만 계산한다. 기준선(범용 챗봇)·M3(Judge 루브릭)·M4(교사 수정률)는 "측정 예정". 결과: rules `eval/REPORT.md`, **live·Ollama `eval/REPORT.live.md`**(12시나리오, 평균 22.4초, 첫 검사 error 1/12(S10 3·6 체육 R10 → 수리 2회), 최종 error 0). 주의: M1은 코드 필터·수리를 거친 **최종 출력** 기준이라 0%가 나오는 것이 당연하다. 모델 원출력의 환각률은 아직 따로 재지 않았다.
- Render 배포·cloudflared·실제 휴대폰 QR 리허설: 하지 않음(`render.yaml`만 작성). 휴대폰 확인은 사람이 §15 체크리스트로 해야 한다.
- 선수관계(prereq.demo.json), 드래그앤드롭, HWPX: 하지 않음(선택 범위).
- `docs/phase0/wireframes.md`는 ASCII + 실제 스크린샷 경로로 대신함.
- 위기 신호 사전은 단순 키워드라 놓치거나 과잉 탐지할 수 있다("때려"가 들어간 놀이 설명도 플래그).
- 학생 페이지 명암비 4.5:1은 색 조합으로 맞췄으나(본문 slate-900/600 on white·slate-50) 자동 측정 도구로 재지는 않았다.

## 6. 실행·검증 명령

```bash
cd cotutor
npm install
npm run build && npm start                 # http://localhost:8787 (AI_MODE 기본 live·ollama)
AI_MODE=replay npm start                   # 키·인터넷 없이 녹화본으로 데모
npm run dev                                # vite(5173, 사용 중이면 다음 포트) + tsx watch API(8787)
npm run typecheck                          # 통과
npm test                                   # vitest 87개 통과
AI_MODE=replay npm start & npm run e2e     # Playwright 35/35 (서버를 먼저 띄울 것)
npm run record:fixtures                    # dry-run, `-- --live --seed`로 Ollama 녹화
```

스크린샷: `screenshots/01-S1-design.png` … `11-S4-print-teacher.png`, `S1-lesson-plan.pdf`(A4 2쪽), `S4-student-grade3.pdf`, live 경로 `screenshots/live-01~04*.png`.

## 7. v2 화면 다시 그리기 (2026-11-06)

v1 화면(폼 + 표)이 지난 공모전 앱의 디자인 언어와 달라 다시 그렸다. 지난 앱 감사와 적용 규칙: `docs/design/DESIGN_AUDIT.md`.

- 셸: masdae-pass `app/Layout.tsx`를 옮김. 왼쪽 사이드바(수업: 한눈에·수업 설계·타임라인 / 교실: 질문함·다음 차시 / 근거: 성취기준·데이터·원칙), 상단 AI 경로 알약·데모 리셋·다크 토글(기본 밝은 화면, `cotutor-theme`에 저장). 브랜드색은 teal(마대 통과증과 같은 값), 학년색 3학년(낮은 학년) blue · 4학년 orange · 함께 teal.
- **명세와 다른 점**: 명세 §3-1은 "교사 4개 + 학생 1개 화면, S1은 `/`"이지만 코디네이터 지시로 **한눈에(`/`)를 새로 두고 수업 설계를 `/design`으로 옮겼고**, 근거 메뉴 `성취기준`(`/standards`)·`데이터·원칙`(`/principles`)을 더했다. 새 화면은 기존 API(`/api/lessons/current`, `/api/meta`, `/api/ai/status`, `/api/cards`)만 읽는다. 서버는 SPA 경로 목록만 바뀌었다(`server/index.ts`).
- 한눈에의 KPI·근거 숫자는 `reports/해커톤 후보 시장 경쟁사 분석.md`의 인용 표와 BUILD_NOTES에 있는 것만 썼다. 강원 복식 96학급(2025)은 "원문 확인 필요" 배지를 붙였다.
- 수업 설계의 파이프라인 카드 ms는 SSE 단계 이벤트 시각 차이(실행 중) 또는 저장된 `aiMeta.sources`(새로고침 뒤)에서 온다. 맥락·골격·검사는 코드 단계라 저장본에는 ms가 없어 "— ms"로 보인다.
- 다크 변형은 `@media screen`에서만 켜서(tailwind `darkMode` variant) 인쇄는 늘 밝은 화면이다.
- e2e: 시작을 한눈에(`/`)에서 하고 사이드바로 수업 설계에 들어가도록, 파이프라인 동기화를 `data-testid="step-수리" data-status="done"`(실행분만)으로 바꿨다. 36/36 통과. 스크린샷: `screenshots/v2/`.

## 8. v3 시각 정체성 "칠판과 분필" (2026-11-06)

v2가 masdae-pass(남색 + teal)를 그대로 옮겨 함께반만의 얼굴이 없다는 지적에 따라, 기능·경로·데이터는 그대로 두고 시각 디자인만 다시 했다. 결정과 토큰 전체: `docs/design/DESIGN_CONCEPT.md`.

- 토큰: `src/ui/tokens.js` 한 곳(종이 `#FAF7F0` · 칠판 `#1F3D33` · 분필 노랑 `#F2C94C` · 학년 lo/hi/tg · ok/warn/bad · AI 라벤더). teal·slate 토큰은 `src/`에서 0건.
- AI 초안 = 라벤더 점선 + ✦, 코드 판정 = 초록 실선 + 자, 교사 승인 = 노란 도장.
- 글꼴은 모두 로컬 번들(Pretendard · Yeon Sung · JetBrains Mono, 모두 OFL). CDN 링크를 지워 오프라인에서도 같은 화면.
- 셸 배치 버그 3개 수정: 상단 오른쪽 잘림(알약 truncate·툴팁), 사이드바–본문 사이 빈틈(본문을 사이드바에 왼쪽 정렬, `max-w-[1400px]`), 전체 페이지 캡처에서 사이드바가 중간에 끊김(그리드 칸 + sticky 안쪽).
- 학생 페이지 완료 화면에서 "하나 더 보내기"가 흐리게 보이던 문제: React가 같은 자리의 비활성 "보내기" 버튼을 재사용해 opacity 전환이 남았다 → 두 section에 `key`.
- e2e 셀렉터는 바꾸지 않았다(36/36). 스크린샷: `screenshots/v3/`.

## 9. v4 UI 리뷰 반영 (2026-11-06)

5개 리뷰(`docs/design/ui-review/R0~R5`)의 발견 133건을 80건으로 합쳐 `docs/design/ui-review/UI_FIX_PLAN.md`에 정리하고 배치 1→4 순서로 반영했다(72건 반영 · 3건 일부 · 5건 보류, 이유는 그 문서 §결과 요약).

- **배치 1 토대**: `overflow-wrap:break-word` + `text-wrap:pretty/balance`, Yeon Sung 가짜 굵기 제거, 글자 단계 토큰 하나(`text-2xs`=12px 추가, 임의 px 0개, 모두 rem), 섹션 h2 20px·설명 15px ink-600, 위반 = 빨강(파이프라인 포함), 4학년 주황과 겹치던 위반 표시 → 2px 떨어진 빨간 점선 외곽선 + 진한 잉크 꼬리표, 분필 노랑 = 교사 승인 도장 전용(다크 주 버튼은 칠판 초록), 초점 = board-900 선 + chalk-300 후광, 질문 유형·AI 경로 칩은 중립, 대비 실패 조합 교체, 인쇄 `print-color-adjust`, axe 구조 문제(dl·label·role) 해결, 해요체.
- **배치 2 부품**: `src/ui/Marks.tsx`(AiBadge·CodeBadge·ApprovedStamp·RejectedTag, 히어로 소개 띠도 같은 부품), `StatTile`, `StepNo`, `LanePanel`, `.btn-lg/.btn-icon/.btn-on-board/.btn-link`, `.input-sm/.input-inline`, `components/rules.tsx`(R 번호 → 쉬운 말), `CardView` 재사용, 점선은 AI 초안 전용(묶음 카드도 AI 점선 틀).
- **배치 3 배치**: 본문 가운데 정렬(1920), 타임라인 1280에서 40분 끝까지 보임(게이트는 1360 이상에서만 옆), 390 가로 넘침 0, 데이터·원칙 1024 붕괴 해결, 질문함 왼쪽 칸 sticky·묶음을 위로, 다음 차시 보충/심화 행 정렬(subgrid), 설계는 생성 뒤 조건 폼 접기, 학생 키보드 대응(보내기 sticky), A4 학습지 쪽 채움.
- **배치 4 심사·데모**:
  - **심사 모드**: 헤더 "심사 모드" 토글 또는 `?present=1`(끄기 `?present=0`), localStorage `cotutor-present`. 1920에서 루트 글자 22px(137%), 1280에선 16px 유지(화소가 이미 큼). 사이드바 아이콘만, `.dev` 정보(ms·모델명·프롬프트 버전·AI 호출 경로·꼬리말·최근 AI 실행) 숨김, R 번호는 쉬운 말(툴팁에 번호), 빗금 진하게.
  - **선생님 동선**: 타임라인·한눈에·다음 차시 미리보기에 분필 노랑 선(직접지도 블록을 따라 레인을 건넘) + 이동 번호, 아래 "교사 이동 N번"(검사기 `countTransitions`와 같은 기준). 두 레인 동시 직접지도는 빨간 점선 두 갈래 + "선생님은 한 명이라…".
  - **replay 천천히 재생**: 클라이언트에서 받은 단계 이벤트를 단계당 약 0.7초로 보여 주고, 검사기 적발 순간은 1.1초 머문다(서버·테스트 속도는 그대로). `?pace=0` 또는 localStorage `cotutor-pace=0`이면 바로(e2e 기본). live 모드는 조절하지 않는다.
  - **적발 배너**: 검사 단계가 위반을 찾으면 전폭 빨간 배너 "AI 초안에서 오류 1건 발견 → 자동 수리 중…", 수리 뒤 "자동 수리 · 통과"와 전/후 칩 `[4사05-07] ✗ → [4사05-02] ✓`. 전/후 코드는 실제 기록에서 읽는다(서버가 `aiMeta.firstErrors`에 첫 검사 위반 원문을 남김, 선택 필드라 예전 저장본도 읽힘).
  - **AI 표시 하나로**: 상단 알약과 본문 출처 칩이 같은 낱말 사전(`src/ui/aiLabel.ts`)을 쓴다. replay면 둘 다 "녹화된 AI 응답 재생". 위반 주입은 출처 칩의 각주 `*`(툴팁)와 데이터·원칙 한 곳에서만 밝힌다.
  - **헤드라인 숫자**: 히어로의 "20분"은 데모 데이터에 없는 숫자였다(학년별 간접지도는 13분). 지어낸 숫자를 지우고 **현재 수업에서 계산**한 학년별 간접지도 분을 밑줄에 넣고(데모 13분), 바로 아래 "숫자는 오늘 수업에서 계산했어요: 3학년 13분 · 4학년 13분"을 붙였다. 수업이 없으면 숫자 없이 "시간". 문구를 바꾸는 대신 계산을 고른 이유: 심사위원이 타임라인에서 바로 같은 숫자를 확인할 수 있어서.
  - 질문함: 새 질문이 학년 열 맨 위 + 분필 테두리 깜빡임, 묶기 뒤 묶음으로 자동 스크롤. 다음 차시: 미리보기를 카드 위로, 승인하면 해당 □ 칸으로 스크롤·깜빡임, 도장 찍히는 움직임, 카드마다 "N학년 질문 N건에서 나왔어요" + 학생 원문 2개.
  - 지역: "예시 학교 · 강원 ○○군 소규모 초등 3·4학년 복식"(예시라고 표시, 지어낸 사실 없음).
- **바꾸지 않은 것(정직)**: 녹화된 AI 출력(4학년 카드의 "방위표의 축척" 오류, 학습지 단계의 한다체)은 그대로 두고 데모 대본에서 쓴다. 검사기 위반 문장은 replay 해시 입력이라 합쇼체 그대로. ChatGPT 비교 화면은 만들지 않았다(실제 캡처 필요).
- **검증**: `npm run typecheck` 통과 · `npm test` 87/87 · `npm run e2e` 58/58(기존 36개 검사 유지, 텍스트가 바뀐 2곳만 새 문구 `고칠 곳 0`으로, 새 검사 22개: 헤드라인 숫자, 적발 배너·전폭, AI 표시 일치, 천천히 재생 중 적발 순간, 동선 덮개, 충돌 동선, 위반 꼬리표 색, 해결 순간, 새 질문 맨 위, 묶음 자동 스크롤, 묶음 AI 틀, 카드 근거 질문, 승인 칸 깜빡임, 심사 모드 켜기/끄기·`?present=1`, 1280 타임라인 안 잘림, 교사 7화면 390 넘침 0 등).
- 전/후 측정과 스크린샷: `docs/design/ui-review/UI_FIX_PLAN.md` §결과 요약, `screenshots/v4/`.

## 10. DEMO_SCRIPT — 90초 (심사 모드)

**준비(시연 30분 전)**
1. `npm run build && AI_MODE=replay PUBLIC_BASE_URL=<공개 주소> npm start` (replay로 고정: live는 초안 20초+, 위반이 거의 안 나온다). 공개 주소는 배포 URL 또는 `cloudflared tunnel --url http://localhost:8787`.
2. 휴대폰으로 학생 페이지 접속 확인(질문함 QR의 localhost 경고가 없어야 함).
3. 브라우저에서 `http://<주소>/?present=1` → 상단 "데모 리셋". 프로젝터 1920이면 그대로, 1280×720이면 브라우저 확대 100%.
4. 단계 속도: 기본 0.7초/단계. 혹시 e2e를 돌렸다면 `?pace=700`을 한 번 붙여 되돌린다(e2e는 `cotutor-pace=0`을 남긴다).

**순서**
| 시간 | 화면 | 말 · 동작 |
|---|---|---|
| 0–10초 | 한눈에 | "두 학년을 혼자 맡은 선생님이 다른 학년에 가 있는 **13분**. 이 숫자는 오늘 수업에서 계산했습니다." 오른쪽 띠: AI 초안 → 코드 검사 → 교사 승인. "데모 실행" |
| 10–25초 | 1단계 · 설계 | 단계가 하나씩 켜진다 → **빨간 배너 "AI 초안에서 오류 1건 발견"** → `[4사05-07] ✗ → [4사05-02] ✓`. "AI는 틀립니다. 코드가 잡고, 그 블록만 다시 쓰게 합니다." (정직: "이 녹화본에는 이 오류 유형을 재현하려고 위반 1건을 넣었습니다 — 실제 모델은 12번 중 1번 냈습니다." 출처 칩 `*`) |
| 25–40초 | 2단계 · 검사 | 노란 선 = 선생님 동선, 이동 3번. 3학년 직접 블록을 눌러 "끝 +5분" → 빨간 점선 두 갈래 "선생님은 한 명이라 두 레인에 동시에 있을 수 없어요", 승인 버튼 잠김 → "되돌리기" → "충돌 해결 · 이제 승인할 수 있어요" → 교사 승인 |
| 40–60초 | 3단계 · 질문 모으기 | "수업 시작" → 심사위원 휴대폰으로 QR → 질문이 **열 맨 위**에 깜빡이며 도착(전화번호는 가려짐). "가상 학생 보내기" → "AI로 묶기" → 묶음으로 자동 스크롤, "질문 13개 → 3개 묶음" |
| 60–80초 | 4단계 · 다음 차시 | "카드 만들기" → 카드마다 "4학년 질문 6건에서 나왔어요" + 원문. **교사가 한 단어 고침**: 4학년 보충 카드 5단계 "방위표의 축척(1:1000 등)"은 내용 오류(축척은 지도의 요소) → "단계 고치기"로 "지도의 축척"으로 고치고 승인. "AI 초안은 틀릴 수 있어서 승인이 필요합니다." 승인하면 위 미리보기의 □ 칸이 빛나고 검사 통과 |
| 80–90초 | 인쇄 | "3학년 학생판" → 교사 메모 없음 확인 → A4 학습지 |

**질의응답 메모**: "왜 ChatGPT로는 안 되나" 화면은 아직 없다(실제 ChatGPT 출력을 캡처해 검사기에 넣는 기능은 캡처 자료가 있어야 만든다). 데이터·원칙 화면에 녹화·주입 사실이 그대로 적혀 있다.

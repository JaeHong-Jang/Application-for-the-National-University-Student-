# R3 — 레이아웃·그리드·간격 리듬·반응형 리뷰

> 렌즈: 그리드 일관성, 세로 리듬, 정렬선, 컬럼 균형, 첫 화면(above the fold), 최대 폭, sticky, 1024–1280 넘침, 타임라인 가독성, 모바일·학생 화면, 인쇄.
> 근거: `screenshots/v3/*` + Playwright 실측(390·768·1024·1280·1366·1440·1536·1700·1920, `getBoundingClientRect`). 페이지 이동만 했고 데모 리셋·제출·AI 생성은 하지 않았다.
> 실측 산출물: `/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---2026-AI----------/1351a5c8-ebff-4c98-9d83-c0acfc4faee1/scratchpad/ui-review/` (`measure.json`, `shots/*.png`, `shots/sheet-1280.png`, `shots/sheet-1920.png`, `shots/principles-1024-full.png`, `shots/design-pipeline-1280.png`, `s1-all.png`)
> 참고: 리뷰 도중 서버 AI 모드가 replay에서 live-ollama로 바뀌어 일부 캡처의 상단 칩 문구가 다르다. 레이아웃 판단에는 영향이 없다.

## 요약 판정 — **6.5 / 10**

뼈대는 탄탄하다. 7개 화면 모두 h1이 y=120에 있고, 섹션 간격은 20px(`space-y-5`/`gap-5`), PageHeader 아래 간격은 24px로 같다. 카드 안쪽 여백도 `p-4 sm:p-5`로 거의 통일돼 있다. 1366–1536 노트북 폭에서는 큰 문제가 없다.

점수를 깎은 건 **발표장에서 자주 쓰는 두 폭(1280×720, 1920×1080)과 그 사이 구간에서 생기는 문제들**이다.

1. **1280(프로젝터)**: S2 타임라인 그리드가 잘려서 35–40분 블록과 `40` 눈금이 첫 화면에서 안 보인다(min-w 640 > 가용 574). 한눈에의 compact 타임라인도 31px 잘린다. 한눈에 첫 화면은 히어로와 "이렇게 씁니다"만으로 차서 KPI와 오늘 수업이 보이지 않는다.
2. **1920(프로젝터)**: 본문이 `max-w-[1400px]`인데 `mx-auto`가 없어 왼쪽에 붙고, 오른쪽에 **280px 빈 띠**가 생긴다. 상단 헤더 버튼도 화면 오른쪽 끝이 아니라 x=1608에서 끝난다.
3. **전역 `overflow-wrap: anywhere`**(index.css:35)가 flex 항목의 최소 폭을 글자 한 개 폭까지 줄인다. 그 결과 데이터·원칙@1024에서 라이선스 칸이 **한 줄에 한 글자**로 무너져 문서 높이가 4,386px가 된다. 1024–1280에서는 파이프라인 칩이 "A/I", "코/드", "검/사"로 쪼개지고, 인쇄본에서는 "4학/년"으로 끊긴다.
4. **390 모바일**: 타임라인·다음 차시·질문함 세 화면에서 **페이지 전체가 가로로 스크롤된다**. 원인은 Section 헤더 actions의 `shrink-0`이다.

P0 3건, P1 11건, P2 11건 (총 25건). P0와 P1의 대부분은 클래스 한두 개만 바꾸면 되는 S 난이도라서, 발표 전에 반나절이면 처리할 수 있다.

---

## 화면별 첫 화면(Above the fold)

헤더(56px)를 뺀 실제 가시 영역은 1280×720에서 y≤720, 1920×1080에서 y≤1080이다. 값은 문서 기준 top(px)이다.

| 화면 | 1280×720에서 보이는 것 | 1920×1080에서 보이는 것 | 판정 |
|---|---|---|---|
| 한눈에 `/` | 히어로(89–550) + 이렇게 씁니다(570–738, **아래가 잘림**). KPI(758)와 오늘 수업(948)은 **안 보임** | 히어로 + 이렇게 씁니다 + KPI 4개 + 오늘 수업·현장 근거 머리(925–1080, 약 155px). **오른쪽 280px 빈 띠** | 1280: 문제 제기 숫자와 제품 결과물이 첫 화면에 없음 |
| 수업 설계 `/design` | 머리(89–229) + 수업 조건 폼 + 파이프라인 스테퍼·1행 카드 3장. 과정안 보드(1033)는 **안 보임** | 폼·파이프라인 6카드 전체 + 과정안 머리줄(989)만 | 데모 흐름(파이프라인)은 보이지만 결과물이 접힘 아래 |
| 타임라인 `/timeline` | 머리 + **줄 바꿈된 승인 버튼 줄**(머리 169px) + 그리드(**35분에서 잘림**) + 게이트 R1–R2 | 전체가 거의 다 보임(문서 높이 1165) | **1280에서 핵심 그리드가 잘림 → P0** |
| 질문함 `/live` | 머리 + KPI 4 + QR 카드 위쪽 + 학년 레인별 질문 2–3건 | KPI + QR 전체 + 질문 레인 대부분. 묶음은 접힘 아래 | 양호 |
| 다음 차시 `/next` | 머리 **192px**(actions가 설명 아래로 떨어짐) + 보충 카드 2장 위쪽 절반 | 머리(140) + 보충 카드 2장 대부분 | 머리가 52px 낭비됨 |
| 성취기준 `/standards` | 머리 + KPI 4 + 인용 성취기준 카드 위쪽 | 표 마지막 행 빼고 전부 | 양호 |
| 데이터·원칙 `/principles` | 머리 + 원칙 카드 6장 + AI 경로 머리 | 전부(문서 높이 1080) | 양호(단 1024에서 붕괴, R3-01) |

---

## 발견 사항

| ID | 화면@폭 | 요소 | 문제 | 근거(실측/스크린샷) | 심각도 | 구체적 수정(클래스/값) | 난이도 |
|---|---|---|---|---|---|---|---|
| R3-01 | 데이터·원칙@1024–약1150 | 「출처와 라이선스」 목록 `li` (Principles.tsx:83–86) | 가운데 설명 칸(`min-w-0 flex-1`)이 글자 한 개 폭으로 줄어 **한 줄에 한 글자**로 세로로 늘어진다. 문서 높이 4,386px(768에서는 1,502px) | `shots/principles-1024-full.png`, `measure.json` principles-1024 docH 4386 | **P0** | Principles.tsx:45 `lg:grid-cols-[1fr_1.2fr]` → `xl:grid-cols-[1fr_1.2fr]` / :85 `min-w-0 flex-1` → `min-w-[12rem] flex-1 basis-48` / :86 Badge에 `shrink-0` | S |
| R3-02 | 전역(1024–1280 + 인쇄) | `body { overflow-wrap: anywhere }` (index.css:35) | `anywhere`는 min-content 폭 계산에 들어가서 flex/grid 항목이 줄바꿈 대신 **글자 단위로 쪼개진다**. R3-01, R3-08, R3-22의 공통 원인 | `shots/design-pipeline-1280.png`(06 수리 칩 "A/I", "코/드"), 1024 캡처("검/사", "R1–/R12"), S1 PDF 1쪽 "4학/년" | **P0** | index.css:35 `overflow-wrap: anywhere;` → `overflow-wrap: break-word;`. 긴 URL만 따로 `break-all` 처리(Live QR 주소 줄 등). 바꾼 뒤 390 캡처에서 가로 넘침이 없는지 다시 확인 | S |
| R3-03 | 타임라인@1280 (1280×720 프로젝터) | 메인 그리드 `xl:grid-cols-[minmax(0,1fr)_340px]` (Timeline.tsx:121) + TimelineGrid `min-w-[640px]` (TimelineGrid.tsx:30) | 왼쪽 칸 카드 폭 616, 내부 가용 574 < 640이라 그리드가 **안쪽 가로 스크롤**로 바뀐다. 33–40분 ★통합 블록과 `40` 눈금이 첫 화면에서 잘린다. S2 데모의 핵심 장면이다 | `shots/timeline-1280-fold.png`, overflow-x-auto sw 640 / cw 574 | **P0** | TimelineGrid.tsx:30 `min-w-[640px]` → `min-w-[560px]`, 레인 이름 칸 `84px` → `72px`. 또는 Timeline.tsx:121 `xl:` → `min-[1360px]:grid-cols-[minmax(0,1fr)_320px]`로 바꿔 1280에서는 게이트를 아래로 내린다(두 가지를 같이 적용 권장) | S |
| R3-04 | 한눈에@1280, @1024 | 오늘 수업 compact TimelineGrid | `min-w-[520px]` > 가용 489(1280) / 347(1024). 40분 끝이 잘리고 안쪽 스크롤이 생긴다 | measure: overview-1280 sw 520 / cw 489, overview-1024 520 / 347 | P1 | TimelineGrid.tsx:30 compact `min-w-[520px]` → `min-w-[420px]`, 레인 칸 `76px` → `60px`(레인 알약 `px-2` → `px-1.5`). 1024는 Overview.tsx:404 `lg:grid-cols-[1.25fr_1fr]` → `xl:`로 올려 1열로 둔다 | S |
| R3-05 | 셸@1700/1920 | `COL = 'w-full max-w-[1400px] …'` (App.tsx:170) | `mx-auto`가 없어 본문과 헤더가 왼쪽에 붙는다. 1920에서 **오른쪽 280px**, 1700에서 60px가 비고, 헤더 버튼이 x=1608에서 끝나 화면 끝과 맞지 않는다 | measure: 모든 페이지 1920 rightgap 280, `20-overview-1920.png` | P1 | App.tsx:170 → `'mx-auto w-full max-w-[1400px] min-[1800px]:max-w-[1560px] px-4 sm:px-6 lg:px-8'`. 헤더 줄 COL은 `max-w-none`으로 해서 버튼을 화면 오른쪽 끝에 고정 | S |
| R3-06 | 한눈에@1280×720 | 히어로 높이 461px + HowTo 168px | 첫 화면이 히어로와 사이드바 메뉴를 되풀이하는 HowTo로만 찬다. 문제 크기 숫자(KPI)와 오늘 수업이 접힘 아래에 있다 | hero top 89 / h 461, KPI top 758 > 720 | P1 | Overview.tsx:367 `pb-10 pt-7 sm:pb-12 sm:pt-9` → `pb-8 pt-6 sm:pb-9 sm:pt-7`, `gap-8` → `gap-6`. :372 h1 `sm:text-[30px]` → `sm:text-[28px]`. `<HowTo />`를 `<KpiCards />` 아래로 옮긴다(또는 xl 이상에서만 표시). 목표: 1280×720에서 KPI top ≤ 600 | M |
| R3-07 | 타임라인·다음 차시·질문함@390 | Section actions 컨테이너 `flex shrink-0 flex-wrap` (Section.tsx:13) | actions(TimelineLegend, SourceTag+버튼)가 줄어들지 못해 **페이지 전체 가로 스크롤**이 생긴다. 범례 right=451, 질문함 묶음 actions right=544 (뷰포트 390) | measure: hscroll True(timeline/live/next-390), cap2 출력 | P1 | Section.tsx:13 `flex shrink-0 flex-wrap` → `flex min-w-0 max-w-full flex-wrap`. SourceTag 모델명 span에 `hidden sm:inline`(또는 `whitespace-normal break-all`) | S |
| R3-08 | 수업 설계@1024–1279 | 파이프라인 단계 카드 `sm:grid-cols-2 xl:grid-cols-3` (Pipeline.tsx:143) + `li overflow-hidden` (:100) | 카드 폭 약 183px(1280) / 152px(1024)에서 SourceTag가 잘리고("녹화+위반 주입" → "녹화+위"), AI·코드 칩과 단계명이 쪼개진다 | `shots/design-pipeline-1280.png`, `design-pipeline-1024.png`. li sw 195 / cw 183 | P1 | Pipeline.tsx:143 `xl:grid-cols-3` → `2xl:grid-cols-3`(1536 이상). 칩 span에 `whitespace-nowrap shrink-0`. SourceTag `short`에 `max-w-full truncate` | S |
| R3-09 | 다음 차시@1440+ | 학년 레인 두 개(Next.tsx:98–113) | 두 레인이 따로 쌓여서 **같은 줄 카드끼리 높이가 어긋난다**. 3학년 심화 top 1106, 4학년 심화 top 1156(50px 차이). 보충 카드 높이 738 / 788. 보충끼리, 심화끼리 비교하는 화면인데 정렬선이 없다 | cap2: next cards [285,1106] vs [863,1156], `24-next-1440.png` | P1 | Next.tsx:98 → `grid gap-5 xl:grid-cols-2 xl:grid-rows-[auto_auto_auto]`. :100 section에 `xl:row-span-3 xl:grid xl:grid-rows-subgrid xl:gap-3`. :106 `div.space-y-3` 래퍼를 없애고 카드를 section의 직접 자식으로 둔다(Tailwind 3.4.19라 subgrid 사용 가능) | M |
| R3-10 | 다음 차시@1440, 타임라인@1280 | PageHeader actions (Section.tsx:24–35) | `flex-wrap justify-between` + 설명 `max-w-3xl`(768)이라 actions가 공간이 모자라면 **설명 아래 왼쪽으로 떨어진다**. 머리 높이가 140 → 192(다음 차시)로 늘고, 페이지마다 버튼 위치가 다르다(타임라인@1440은 오른쪽 아래, 질문함은 오른쪽 알약) | cap3: next header h 192, 다른 페이지 115–140. `timeline-1280-fold.png` | P1 | Section.tsx:24 → `flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between`. :33 `max-w-3xl` → `max-w-2xl`. :35 `flex shrink-0 flex-wrap items-center gap-2 lg:justify-end` | S |
| R3-11 | 질문함@1440 | 왼쪽 칸(QR·지금 질문·데모 도구) (Live.tsx:163–164) | 오른쪽 칸은 1,695까지 가는데 왼쪽 내용은 약 1,337에서 끝나 **약 360px 빈 기둥**이 생긴다. 묶음을 보려고 스크롤하면 QR도 화면 밖으로 나간다 | `23-live-1440.png`, cap2 live cols 1330/1330(stretch) | P1 | Live.tsx:164 `space-y-5` → `space-y-5 xl:sticky xl:top-[72px] xl:self-start`. 빈 공간이 사라지고 발표 중에도 QR이 늘 보인다 | S |
| R3-12 | 질문함@768–1279 | 칸 나누기가 `xl:`부터 시작 | 1280 미만에서는 QR 칠판이 **가로 전체(720×537)**를 차지하고 지금 질문·데모 도구가 질문 목록보다 먼저 나온다. 질문은 768에서 y≈1450부터 보인다 | cap3: live768 QR [w720, h537], `shots/live-768-top.png` | P1 | Live.tsx:163 `xl:grid-cols-[340px_minmax(0,1fr)]` → `md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]`. 또는 xl 미만에서는 QR 칠판을 가로형(`sm:flex-row`, QR 160px)으로 줄이고 데모 도구 Section에 `order-last` | M |
| R3-13 | 질문함@768+ | 묶음 3개 `md:grid-cols-2` (Live.tsx:255) | 묶음이 3개라 마지막 카드가 **반 줄을 비운 채 혼자** 놓인다 | `23-live-1440.png` 하단 | P2 | Live.tsx:255 → `grid gap-3 md:grid-cols-2 [&>*:last-child:nth-child(odd)]:md:col-span-2` | S |
| R3-14 | 한눈에@1280 | KPI 카드 머리줄(라벨 + "원문 확인 필요" 배지) | 두 번째 카드만 라벨이 두 줄이 되어 숫자 기준선이 **20px 낮다**(96@823, 나머지@803) | cap2 kpi [803, 823, 803, 803], `20-overview-1280.png` | P2 | Overview.tsx:176–180 배지를 노트 줄(:187)로 옮기거나 `absolute right-3 top-3`로 띄운다. 라벨 span에 `truncate`, 카드에 `relative` | S |
| R3-15 | 한눈에·질문함·성취기준 | 페이지 단위 그리드 간격 | KPI·HowTo 줄은 `gap-3`/`gap-2.5`(12/10px), 그 아래 2단 그리드는 `gap-5`(20px)라 **세로 정렬선이 하나도 맞지 않는다**. 예: 한눈에@1440 KPI 2열 오른쪽 끝 833 vs 오늘 수업 오른쪽 끝 891 / 현장 근거 왼쪽 912 | `20-overview-1440-full.png` | P2 | 페이지 단위 그리드는 모두 `gap-5`로 통일(Overview.tsx:139·171, Live.tsx:156, Standards.tsx:58). 정렬선까지 맞추려면 Overview.tsx:404를 `lg:grid-cols-12`로 바꾸고 오늘 수업 `lg:col-span-8`, 현장 근거 `lg:col-span-4` + KPI `lg:grid-cols-4`(경계 3/6/9칸) | S |
| R3-16 | 공통 | 카드 안쪽 여백 | Section `p-4 sm:p-5`(20px), 한눈에 KPI·Live KPI `p-4`(16px), Next 카드 본문 `p-4`, HowTo 항목 `p-3`. 한 줄에 놓인 카드끼리 제목 x좌표가 4px씩 어긋난다 | Overview.tsx:173, Next.tsx:207 | P2 | KPI Card `p-4` → `p-4 sm:p-5`. 원칙: 페이지 단위 카드는 20, 안에 든 카드는 12로 두 단계만 쓴다 | S |
| R3-17 | 수업 설계@1440 | 과정안 보드: 직접지도 블록 (Design.tsx:219, :259 `mt-auto`) | 같은 행의 간접지도 카드(카드 본문 포함)에 맞춰 늘어나서 **직접지도 블록 안에 약 250px 빈 공간**이 생긴다(높이 385·405, 실제 내용 약 130). 화면에서 가장 큰 덩어리가 빈 공간이다 | cap2 design blocks [511×385], [511×405], `21-design-1440.png` | P2 | 간접지도 카드 본문(CardView)을 화면에서는 `<details>`로 접고(요약: "카드 · 13분 · 짝"), 인쇄에서는 `print:block`으로 펼친다. 또는 직접지도 블록의 빈 영역에 교사 동선 점선(`flow-dash`)과 "선생님이 여기 13분" 세로 배치 | M |
| R3-18 | 데이터·원칙@1440 | 하단 2단 (`self-start`) | AI 경로 409px vs 출처 528px. 왼쪽 아래 약 120px가 비고 카드 아래 모서리가 맞지 않는다 | cap2 princ cols [409, 528] | P2 | Principles.tsx:53 `className="self-start"` 삭제(높이 맞춤). 또는 `lg:grid-cols-[1fr_1.2fr]` → `xl:grid-cols-[1fr_1.4fr]` | S |
| R3-19 | 한눈에@390 | KPI `sm:grid-cols-2` | 모바일에서 1열로 4장이 쌓여 591px를 쓴다. 성취기준·질문함 KPI는 390에서도 `grid-cols-2`라 화면끼리 규칙이 다르다 | measure overview-390 KPI h 591, standards-390 h 282 | P2 | Overview.tsx:171 → `grid grid-cols-2 gap-3 lg:grid-cols-4`. :183 숫자 `text-[36px]` → `text-[28px] sm:text-[36px]`. 노트 `line-clamp-2` | S |
| R3-20 | 한눈에@390 | 히어로 551px + HowTo 382px | 첫 화면(788px) 중 70%를 히어로가 차지하고, 데모 조합 안내(소형 mono)까지 모바일에 그대로 나온다 | measure overview-390 hero h 551 | P2 | Overview.tsx:367 `px-6 pb-10 pt-7` → `px-5 pb-8 pt-6`. :389 `hidden sm:block`. HowTo는 390에서 2×2(`grid-cols-2`, 본문 숨김) | S |
| R3-21 | 학생@390 | 보내기 버튼과 입력창 (student/App.tsx:189–209) | 입력창 487–637, 보내기 687–743(뷰포트 844). iOS·안드로이드 키보드(약 300–340px)가 올라오면 보이는 영역이 약 500px로 줄어 **입력 중에는 보내기가 키보드에 가린다**. 학년 버튼(365–429, 높이 64)과 보내기(높이 56)는 엄지 영역 안에 있어 좋다 | cap3 student 실측, `05-student-390.png` | P1 | 보내기 버튼을 `sticky bottom-0 z-10 -mx-4 bg-paper-card/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur`로 감싼다. textarea `min-h-[150px]` → `min-h-[120px]`. 칠판 머리 `pb-14` → `pb-10`. textarea `onFocus={e => e.currentTarget.scrollIntoView({block:'center'})}` | S |
| R3-22 | 인쇄 S1 과정안(A4) | 과정안 보드 인쇄 (Design.tsx:219 `avoid-break`, :278–281 레인 머리) | ① 1쪽 아래 약 40%가 빈다(7′ 행 전체가 2쪽으로 밀림). ② 바깥 Card 테두리가 쪽 경계에서 열린 채 끊긴다. ③ 레인 머리 "4학년"이 "4학/년"으로 끊긴다. ④ 공통 주제·성취기준 줄이 세로 3단으로 쌓여 1쪽 절반을 쓴다 | `scratchpad/ui-review/s1-all.png`(S1-lesson-plan.pdf 3쪽) | P1 | :280 학년 span에 `shrink-0 whitespace-nowrap`, :281 `min-w-0 truncate`. :359 `lg:grid-cols-[1.1fr_1fr_1fr]`에 `print:grid-cols-[1.1fr_1fr_1fr]` 추가. 과정안 Card에 `print:border-0 print:shadow-none`. 2쪽보다 긴 행은 :219 `avoid-break`를 `print:break-inside-auto`로 풀고 카드 안 CardView에만 `avoid-break` 유지 | M |
| R3-23 | 인쇄 S4 학생판(A4) | 학생 카드 article (Next.tsx:326) | 카드 한 장이 A4의 약 65%만 쓰고 아래 30%는 빈다. "여기에 써 보세요" 칸이 약 50mm라 초등 3학년 손글씨로는 좁다 | `S4-student-grade3.pdf` 1–2쪽 | P2 | :326 article에 `print:flex print:min-h-[269mm] print:flex-col`. 쓰기 칸 div에 `print:flex-1 print:min-h-[100mm]` | S |
| R3-24 | 인쇄 S4 교사판 | 교사판 첫 쪽 | 문서 머리(학년·과목·차시·날짜·"교사용")가 없어 카드부터 바로 시작한다. 한 쪽에 3장 남짓 들어가는 것은 좋다 | `11-S4-print-teacher.png` | P2 | PrintView 교사판 맨 위에 `print-only` 머리: `<header class="mb-4 flex items-end justify-between border-b-2 border-ink-800 pb-2">3·4학년 사회 · 다음 차시 카드 · 교사용 · {날짜}</header>` | S |
| R3-25 | 셸@1024–1279 | 사이드바 `lg:grid-cols-[15rem_…]` (App.tsx:187) | 1024에서 사이드바 240px가 화면의 23%를 차지해 본문이 784px에 그친다. 그래서 R3-01·R3-04·R3-08·R3-12가 모두 이 구간에서 생긴다 | measure: 1024 main w 784 | P2 | App.tsx:187 `lg:grid-cols-[15rem_minmax(0,1fr)]` → `lg:grid-cols-[12.5rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]`. 사이드바 안내문(:197)은 `hidden xl:block` | S |

---

## 잘 된 점 (유지)

- 세로 리듬: 모든 페이지에서 h1 top=120, PageHeader 아래 24px, 섹션 사이 20px가 일정하다(cap3 실측, 한눈에 섹션 간격 [20, 20, 20]).
- sticky 사이드바(`sticky top-0 h-screen`)와 헤더(`sticky top-0 z-30 backdrop-blur`)가 겹치지 않고, 사이드바 배경이 페이지 끝까지 이어진다.
- 1366·1440·1536에서는 가로 넘침과 잘림이 거의 없다(1366 이상은 Live 질문 미리보기 truncate만 의도된 것).
- 학생 화면은 `max-w-md` 한 칸에 터치 영역(64/56px)이 넉넉하고, 학년 버튼이 엄지 영역 안에 있다.
- 학생판 인쇄는 한 쪽에 카드 한 장(`print-break`)이라 나눠 주기 쉽다.

## 우선 처리 순서 (발표 전 반나절)

1. R3-02(전역 overflow-wrap) → R3-01·R3-08·R3-22③이 함께 사라지는지 재캡처
2. R3-03 + R3-04(타임라인 min-w) → 1280×720 재캡처
3. R3-05(1920 중앙 정렬) + R3-06(한눈에 첫 화면)
4. R3-07(모바일 가로 스크롤), R3-10(PageHeader), R3-11(QR sticky)
5. R3-09(다음 차시 행 정렬), R3-21(학생 키보드), R3-22(과정안 인쇄)

## 확인하지 못한 것 / 열린 질문

- 수업 설계에서 「초안 만들기」를 누른 뒤 과정안 보드로 자동 스크롤되는지는 확인하지 못했다(AI 생성 금지 조건). 자동 스크롤이 없다면 1280×720에서는 결과물이 접힘 아래(1033)에 생기므로 `scrollIntoView` 추가를 권한다.
- 학생 화면의 키보드 가림은 실기기가 아니라 뷰포트 계산으로 추정했다. iOS Safari에서 직접 확인해야 한다.
- 다크 모드 레이아웃은 밝은 화면과 클래스가 같아 따로 실측하지 않았다.

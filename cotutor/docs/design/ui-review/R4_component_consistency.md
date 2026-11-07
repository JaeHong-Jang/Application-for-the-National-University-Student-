# R4 — 디자인 시스템·컴포넌트 일관성 (코드 기준)

검토일 2026-11-06 · 범위: `src/ui/*`, `src/index.css`, `tailwind.config.js`, `src/teacher/{App,pages/*,components/*}.tsx`, `src/student/App.tsx`, `docs/design/DESIGN_CONCEPT.md` · 스크린샷 `screenshots/v3/01·08·09·33` 대조 · 읽기 전용 리뷰(앱 코드 수정 없음)

## 0. 요약 판정 — **6.5 / 10**

**토대는 좋다.** 색 값이 `tokens.js` 한 곳에만 있고, 소스(`.tsx`)의 raw hex는 로고 SVG(`Chalk.tsx:14-19`) 하나뿐이다. 옛 팔레트(teal·slate·violet·sky·emerald·amber·rose) 클래스는 0건이다. `Badge`·`StatusPill`·`Card`·`Section`·`PageHeader`·`EmptyState`·`.btn-*`·`.input`·`LANE_COLOR` 같은 기본 부품도 갖춰져 있다. 다크 변형 짝도 거의 빠짐없이 붙어 있다(빠진 곳 4~5개).

**약점은 이 앱의 핵심 메시지인 "AI 초안 → 코드 검사 → 교사 승인" 표시 체계다.** 이 표시가 화면마다 손으로 다시 만들어졌다. 그 결과 같은 뜻이 4~5가지 모양으로 나오고, 같은 모양(점선, 노랑, board 초록, ShieldCheck)이 여러 뜻으로 쓰인다.

- **AI 초안 배지 5종**: `Badge ai`, `Pipeline` 미니칩, `MarkerChain`, `Next` 흰 점선 칩, `AiChip`
- **교사 승인 도장 3종**: `AiBadge`, `Next` 인라인, `MarkerChain`. 아이콘도 ShieldCheck와 Check로 갈린다.
- **코드 판정(실선 + 자) 표시**: 공용 부품이 없다. 파이프라인 단계 카드와 히어로에만 나오고, 정작 검증 게이트(S1·S2)에는 없다.
- **점선 테두리 26곳 중 AI 뜻은 6곳뿐**이다. 나머지는 빈 상태·장식·간접지도 카드·위반 구간·꼬리말이라서 "점선 = AI 밑그림"이라는 규칙이 묽어진다.
- **다크 모드 충돌**: 주 버튼이 분필 노랑으로 바뀌어 "교사 승인 도장"과 같은 색이 된다(스크린샷 33).

그밖에 같은 역할을 하는 부품의 중복이 있다. 숫자 타일 5종, 번호 원 6종, 범례 2종, 간접지도 카드 dl 2종, 학년 레인 컨테이너 2종이다. 임의 글자 크기(`text-[12px]` 49회, `text-[11px]` 12회)도 많은데, 11px는 콘셉트 문서가 정한 최소 12px 규칙을 어긴다.

| 영역 | 점수 | 한 줄 |
|---|---|---|
| 토큰·색 원천 | 9 | hex 0(로고 제외), 옛 팔레트 0, theme()로 CSS 변수 생성 |
| 기본 부품 재사용 | 6 | Badge/Section/btn은 잘 쓰지만 카드·타일·칩은 손으로 다시 만든 곳이 많다 |
| AI·코드·승인 표시 의미 일관성 | 4 | 같은 뜻이 다른 모양이고, 같은 모양이 다른 뜻이다 |
| 타이포·간격·반경·그림자 | 6 | 12/11/16px 임의값, shadow-sm과 shadow-paper 혼용, 같은 역할에 다른 반경 |
| 다크 모드 | 8 | 짝은 거의 완비. 빠진 곳 소수와 주 버튼 노랑 충돌 |

---

## 1. 인벤토리

### 1-1. 버튼

| 역할 | 실제 변형 | 위치(file:line) | 권장 정식 변형 |
|---|---|---|---|
| 주 행동 | `.btn-primary` | Design.tsx:185, Next.tsx:83, Live.tsx:124·211, Timeline.tsx:114 | 유지 |
| 주 행동(넓게) | `btn-primary w-full py-2.5` | Design.tsx:185 | `.btn-lg` 신설 |
| 칠판 위 CTA | `btn-chalk px-5 py-2.5 text-[16px]` / `btn-chalk px-4 py-2.5` | Overview.tsx:382 / Live.tsx:149 | `.btn-chalk.btn-lg` 하나로 |
| 칠판 위 보조 | `btn border border-chalkwhite/35 … hover:bg-white/10` (원오프) | Overview.tsx:385 | `.btn-on-board` 신설 |
| 보조 | `.btn-ghost` | 다수 | 유지 |
| 보조 작게 | `btn-ghost btn-sm` / `btn-ghost px-2 py-1 text-xs` / `btn-ghost px-2.5 py-1.5 text-xs` / `btn-ghost mt-3 w-full text-xs` | Design.tsx:347 / Overview.tsx:346 / App.tsx:214 / Overview.tsx:269 | 전부 `.btn-sm` |
| 아이콘 버튼 | `btn-ghost px-2`, `btn-ghost -ml-1 px-2`, 손으로 만든 `rounded p-0.5 …` | App.tsx:206·217, Live.tsx:342 | `.btn-icon` 신설 |
| 텍스트 링크 버튼 | `inline-flex … text-[12px] text-board-700 hover:underline` | Next.tsx:225, Live.tsx:277(summary) | `.btn-link` 신설 |
| 위험 | `.btn-danger btn-sm` | Next.tsx:282 | 유지 |
| 학생 큰 버튼 | `btn-primary min-h-[52px] rounded-xl text-lg` / `min-h-[56px]` | student/App.tsx:447 / 493 | `.btn-lg` + 높이 하나(56) |

버튼 안 아이콘 크기도 섞여 있다. 기본 크기 버튼에 15와 16(Design.tsx:186은 16, Next.tsx:84는 15), sm 버튼에 13과 14(CopyButton.tsx:22는 14, 나머지는 13)가 쓰인다.

### 1-2. 배지·알약·칩

| 역할 | 실제 변형(모양 요약) | 위치 | 권장 |
|---|---|---|---|
| 일반 상태 배지 | `Badge` rounded-md, 12px, ring | ui/Badge.tsx:20 | 정식 |
| 상태 알약(점+글) | `StatusPill` rounded-full, ring, 점 | ui/StatusPill.tsx:14 | 정식(진행 상태 전용) |
| **AI 초안** ① | `Badge tone="ai"` + Sparkles 11 | bits.tsx:34, Live.tsx:262 | **정식** |
| AI 초안 ② | `rounded border-dashed … px-1` + Sparkles 10, 글자 "AI" | Pipeline.tsx:113 | `<Badge tone="ai" size="xs">` |
| AI 초안 ③ | 칠판 위 `border-ai-300 bg-ai-500/15 text-ai-100` | Overview.tsx:87 | `Badge tone="ai" onBoard` |
| AI 초안 ④ | `border-white/80 bg-ai-700/70 text-white font-extrabold` + Sparkles 12, "AI 초안 · 승인 대기" | Next.tsx:200 | `AiBadge` 재사용(단색 머리 위 변형만 prop로) |
| AI 상태(live) ⑤ | rounded-full + dashed ai | App.tsx:148 | `StatusPill tone="ai"` 추가 |
| **코드 판정** ① | `rounded border-board-700/40 bg-board-50` + Ruler 10 | Pipeline.tsx:118 | `<CodeBadge>`(= `Badge tone="code"`) 신설 |
| 코드 판정 ② | 칠판 위 `border-chalkwhite/45` + Ruler 11 | Overview.tsx:91 | 같은 부품의 onBoard 변형 |
| 코드 판정 ③ | 글자만 "코드가 판정 · AI 아님"(아이콘 없음) | ViolationPanel.tsx:221 | `<CodeBadge>` |
| **교사 승인** ① | `AiBadge approved`: chalk-400, rounded-md, px-1.5, font-bold, ShieldCheck 11, shadow-sm | bits.tsx:30 | **정식** |
| 교사 승인 ② | 인라인 복제: px-2, font-extrabold, ShieldCheck 12 | Next.tsx:192 | `AiBadge` 사용 |
| 교사 승인 ③ | Check 11 strokeWidth 3, 그림자 없음 | Overview.tsx:95 | `AiBadge`(아이콘 ShieldCheck로 통일) |
| 반려 | `rounded-full bg-paper-card text-bad-700`(다크 없음) | Next.tsx:196 | `Badge tone="ink"` + X(콘셉트상 반려 = 회색) |
| 교사 수정 | `Badge tone="board"` | Live.tsx:262 | 승인과 구분되는 `Badge tone="ink"` + Pencil |
| 성취기준 코드 칩 | `StdChip`: rounded-md, font-mono 13px, ring, 안쪽 11px 상태칩 | bits.tsx:15 | 정식(안쪽 글자 12px로) |
| 성취기준 코드(인쇄) | 글자만 `[{code}]` font-mono | Next.tsx:371 | 인쇄용이라 허용 |
| "원문 확인됨" | StdChip 안쪽 `bg-ok-100` 11px / 근거 목록은 `Badge tone="ok"` "원문 확인" | bits.tsx:18 / Overview.tsx:261 | 둘 다 `Badge tone="ok"` + 같은 낱말 |
| 학년 칩 | `Badge tone="lo/hi"`(Live.tsx:260), 레인 머리 rounded-full 알약(TimelineGrid.tsx:287), `LANE_COLOR.*.chip`(정의만 있고 미사용) | — | `Badge tone=lo/hi` 하나로, `.chip` 삭제 |
| 평가 단계(◎○△) | `h-6 w-11 rounded-md` 색칩 | Design.tsx:435 | 허용(전용) |
| 위반 규칙 꼬리표 | `rounded bg-bad-600 text-white 11px`(TimelineGrid.tsx:94), `rounded bg-bad-600 px-1.5 12px`(Timeline.tsx:131), `Badge tone="bad"`(Design.tsx:464) | — | `Badge tone="bad" solid` |
| "교사 확인 필요" | `Badge tone="bad"`(Design.tsx:232) / 단색 `bg-bad-600 text-white 11px`(TimelineGrid.tsx:317) | — | 한 변형으로 통일 |

### 1-3. 카드·패널

| 역할 | 실제 변형 | 위치 | 권장 |
|---|---|---|---|
| 종이 카드 | `Card`: rounded-xl, border-ink-200, shadow-paper, print-plain | ui/Card.tsx:5 | 정식 |
| 손으로 만든 카드 | `print-plain rounded-xl border bg-paper-card shadow-sm` | Timeline.tsx:140 | `Card` |
| 파이프라인 단계 카드 | `rounded-xl border bg-paper-card shadow-sm` | Pipeline.tsx:100 | `Card` + 상태 border |
| 묶음 카드 | `rounded-xl border bg-paper-card shadow-paper` + 왼쪽 막대 | Live.tsx:257 | `Card` + `LaneAccent` |
| 다음 차시 카드 | `rounded-xl border-2 shadow-paper` + 상태 frame | Next.tsx:186 | `Card` + `DraftFrame` |
| 인쇄 미리보기 도구줄 | `rounded-xl border bg-paper-card p-3 shadow-sm` | Next.tsx:307 | `Card` |
| 학생 질문 카드 | `rounded-lg border shadow-sm` | Live.tsx:338 | 허용(목록 항목), shadow는 `shadow-paper` |
| 학년 레인 컨테이너 | `rounded-2xl border p-3` / `rounded-xl border p-2.5` | Next.tsx:100 / Live.tsx:221 | `<LanePanel>` 하나 |
| 칠판 면 | `chalkboard rounded-2xl shadow-board ring-1` ×3 | Overview.tsx:366, Live.tsx:140·165 | `<Chalkboard>` 부품 |
| 빈 상태 | `EmptyState`(점선) / 손으로 만든 점선 상자 ×4 | ui/EmptyState.tsx:6 / Live.tsx:231·298, Timeline.tsx:215 | `EmptyState size="sm"` |
| 숫자 타일 | 5종(§1-6) | — | `<StatTile>` |

### 1-4. 머리(eyebrow / title / desc)

| 역할 | 실제 | 위치 | 권장 |
|---|---|---|---|
| 쪽 머리 | `PageHeader`(eyebrow는 `.eyebrow` 손글씨 19px + 노란 막대, h1 24/28px) | Section.tsx:21-39, 모든 쪽(Overview 제외, 히어로라 허용) | 정식 |
| 섹션 머리 | `Section` h2 `text-base`(17px) | Section.tsx:10 | 정식 |
| 섹션 머리(복제) | h2 `text-[16px]` | Design.tsx:335, Timeline.tsx:145 | `text-base`, 또는 `Section` 사용 |
| 섹션 머리 + mono 꼬리 | `<span className="font-mono text-[12px] …">` 반복 | Design.tsx:195·451, Timeline.tsx:226 | `Section`에 `meta` prop 추가 |
| eyebrow 막대 복제 | `h-[3px] w-5 rounded-full bg-chalk-400` | Section.tsx:28, student/App.tsx:432 | `.eyebrow-bar` 클래스 |
| 작은 소제목 | `text-xs font-bold text-ink-500`, `.label`, `text-[12px] font-bold` 섞임 | Design.tsx:483, Next.tsx:224·253, ViolationPanel.tsx:219 | `.label` 하나 |

### 1-5. 입력

| 역할 | 실제 | 위치 | 권장 |
|---|---|---|---|
| 기본 입력/선택 | `.input` | Design.tsx:130 외 | 정식 |
| 작은 select | 손으로 만든 `rounded-md border px-1 py-0.5 text-[12px]`(focus 스타일 없음) | Live.tsx:323 | `.input-sm` |
| 인라인 편집 제목 | `.input border-transparent bg-transparent px-0 … focus:px-2` / `… px-1 py-1 hover:border-ink-200` | Next.tsx:208 / Live.tsx:265 | `.input-inline` |
| 체크박스 상자 | `h-[38px] rounded-lg border …`(입력 높이를 손으로 맞춤) | Design.tsx:180 | `.input` 높이 토큰 또는 `.input flex items-center` |
| 학생 textarea | `border-2 … focus:ring-4 ring-chalk-400/30` | student/App.tsx:476 | 허용(학생 전용). 포커스 링은 토큰과 맞추기 |

### 1-6. 숫자 타일(같은 역할, 5종)

| 위치 | 값 크기 | 꾸밈 |
|---|---|---|
| Overview.tsx:173-188 KpiCards | 36px | ChalkRule 짧은 줄 |
| Live.tsx:27-41 Counter | 32px | 아래 chalk-rule 색 막대 |
| Standards.tsx:302-309 | 32px | 없음 |
| ViolationPanel.tsx:172-182 Tile | 28px | 색 ring 바탕 |
| Overview.tsx:313-316 TodayLesson | text-lg / mono base | border 상자 |

권장: `<StatTile label value unit note tone accent>` 하나(값 32px 기본, `size="lg"`=36).

### 1-7. 번호 원(같은 역할, 6종)

CardView.tsx:22(h-4/h-5, board-900) · Next.tsx:235(h-6, 학년 단색) · Next.tsx:339(h-8, border-2, 인쇄) · Overview.tsx:143(h-10 + ring-offset) · Overview.tsx:52(h-5, 분필 테두리) · student/App.tsx:400(h-7, board-900).
권장: `<StepNo size="sm|md|lg" tone="board|lane|print">`.

### 1-8. 아이콘

lucide `size` 분포는 13(19회), 15(18), 16(18), 11(14), 14(11), 12(10), 20(5), 18·28(3), 10(2)로 인라인 크기만 10단계다. strokeWidth 덮어쓰기 3곳(Pipeline.tsx:77, TimelineGrid.tsx:311, Overview.tsx:96). 학생 페이지는 lucide 대신 손으로 그린 SVG를 쓴다(student/App.tsx:441, 503).
권장 규칙: 배지 11 · btn-sm 13 · btn 15 · 섹션 제목 16 · 배너 20 · 큰 상태 28.

### 1-9. 반경·그림자·점선

- 반경: rounded-xl 34, rounded-full 34, rounded-lg 29, rounded(4px) 23, rounded-md 13, rounded-sm 12, rounded-2xl 10. 칩 역할에 rounded/md/full 세 가지가 섞여 있다.
- 그림자: `shadow-sm` 11 · `shadow-paper` 7 · `shadow-lg` 5 · `shadow-board` 3 · `shadow-lift` 2 · `shadow-md` 1 · `shadow-xl` 1. 종이 위 카드에 Tailwind 기본(차가운 검정) `shadow-sm`과 토큰(따뜻한 갈색) `shadow-paper`가 섞인다. 호버는 콘셉트상 `shadow-lift`인데 TimelineGrid.tsx:305는 `hover:shadow-md`다.
- 점선(`dashed`) 26곳의 뜻 분류:

| 뜻 | 위치 | 수 |
|---|---|---|
| **AI 초안** | Badge.tsx:14, App.tsx:148, Pipeline.tsx:113, Overview.tsx:87, Next.tsx:182·200 | 6 |
| 위반 구간 | TimelineGrid.tsx:331·361 | 2 |
| 간접지도(□) | Overview.tsx:28·33·74·76(히어로 미니 그림) | 4 |
| 간접지도 카드 상자 | Design.tsx:248, Timeline.tsx:193 | 2 |
| 빈 상태·안내 | EmptyState.tsx:6, Live.tsx:231·298, Timeline.tsx:215 | 4 |
| 장식·구분 | Overview.tsx:50, Live.tsx:142·276, App.tsx:197·232, student/App.tsx:411·502, TimelineGrid.tsx:282(눈금) | 8 |
| 경고 | Live.tsx:180(localhost) | 1 |
| 쓰는 칸(인쇄) | Next.tsx:358 | 1 |

여기에 `.chalk-rule`(점선 그라데이션) 구분선이 PageHeader, 사이드바 그룹, KPI, Counter에 더 쓰인다.

---

## 2. 발견 사항

심각도: **P0** = 데모에서 핵심 메시지를 잘못 전달함 · **P1** = 일관성이 눈에 띄게 깨짐 · **P2** = 정리·부채. 품: **S** <30분 · **M** 1~2시간 · **L** 반나절 이상.

| ID | file:line | 문제 | 근거 | 심각도 | 구체 수정 | 품 |
|---|---|---|---|---|---|---|
| R4-01 | Badge.tsx:14, Pipeline.tsx:113, Overview.tsx:87, Next.tsx:200, App.tsx:148 | **"AI 초안" 표시가 5가지로 구현됨.** 반경(rounded/md/full), 테두리 색(ai-500/ai-300/white), 바탕(ai-50/ai-500·15/ai-700·70), 굵기(semibold/bold/extrabold), 아이콘 크기(10/11/12)가 제각각이다. | 스크린샷 09: 카드 머리의 보라 단색 칩과 01의 연보라 점선 칩이 서로 다른 부품처럼 보인다 | **P0** | `AiBadge`를 유일한 진입점으로 삼고 `variant: 'paper' \| 'board' \| 'onSolid'`, `size: 'xs' \| 'sm'`만 허용한다. Pipeline/Overview/Next의 인라인 span은 삭제한다. AiChip(live)은 `StatusPill tone="ai"`로 옮긴다. | M |
| R4-02 | bits.tsx:30, Next.tsx:192, Overview.tsx:95 | **"교사 승인" 도장 3종, 아이콘 2종.** AiBadge는 ShieldCheck 11 + font-bold + px-1.5, Next는 ShieldCheck 12 + extrabold + px-2, 히어로 MarkerChain은 **Check** 11. 히어로에서 처음 소개하는 표시와 실제 화면 표시가 다르다. | 콘셉트 §2 "교사 승인 = 노란 분필 도장 + 방패 체크" | **P0** | Next.tsx:191-203은 `<AiBadge approved />`로 바꾸고 반려만 따로 둔다. MarkerChain 세 칩을 `AiBadge`/`CodeBadge`의 `variant="board"`로 렌더해 소개와 실사용을 같은 부품으로 맞춘다. | S |
| R4-03 | Pipeline.tsx:118, Overview.tsx:91, ViolationPanel.tsx:221, Design.tsx:448-457 | **"코드가 판정(실선 + 자)" 표시에 공용 부품이 없음.** 파이프라인 카드와 히어로에만 Ruler가 있다. 코드 판정의 대표 화면인 검증 게이트(S1 Design.tsx:451, S2 ViolationPanel)는 mono 글자 "코드가 판정 · AI 아님"뿐이라 세 표시 중 하나가 S1·S2·S4 핵심 지점에서 빠진다. | grep `Ruler` 결과 Pipeline·Overview 2곳뿐 | **P0** | `Badge`에 `tone: 'code'`(board-50 바탕 + `border border-solid border-board-600` + Ruler)를 넣고 `CodeBadge`로 내보낸다. ViolationPanel.tsx:221, Design.tsx:451 섹션 제목, Next.tsx:123 "검사 통과" 줄에 붙인다. | S |
| R4-04 | 점선 26곳(§1-9 표) | **점선 = AI라는 규칙이 묽어짐.** 점선 26곳 중 AI 뜻은 6곳뿐이고, 빈 상태·장식·꼬리말·경고·간접지도에도 같은 점선이 쓰인다. 특히 간접지도 카드 상자(Design.tsx:248, Timeline.tsx:193)는 **AI가 쓴 카드인데 회색 점선**이라 "AI 점선"인지 "간접 점선"인지 읽을 수 없다. | 스크린샷 01: 간접지도 카드 회색 점선과 "AI 초안" 라벨 점선이 한 화면에 함께 나온다 | **P0** | 규칙: `border-dashed`는 `ai-*` 색과만 쓴다(위반 구간 오버레이만 예외로 문서화). 빈 상태·사이드바 안내·꼬리말·질문 없음·미분류는 실선 `border-ink-200` 또는 바탕만으로 바꾼다. 간접지도 카드 상자는 AI 초안이면 `border-dashed border-ai-400`, 승인 뒤에는 실선으로 바꾼다. 히어로 LaneBars의 □는 실제 타임라인처럼 `hatch-a/b`로 표시한다. | M |
| R4-05 | index.css:90, Next.tsx:182·192, bits.tsx:30 | **다크 모드에서 주 버튼과 승인 도장이 같은 노랑.** `.btn-primary` 다크가 `bg-chalk-400`이라 "다시 만들기", "AI로 묶기", "카드 만들기"가 승인 도장·승인 카드 테두리와 같은 색이 된다. 콘셉트는 chalk-400을 "이 다섯 곳만"이라고 정했다. | 스크린샷 33: "다시 만들기" 버튼, 카드 테두리, "교사 승인" 도장, 비활성 "승인" 버튼이 모두 노랑 | **P0** | 다크 `.btn-primary`는 `dark:bg-board-600 dark:text-chalkwhite dark:hover:bg-board-500`(칠판보다 밝은 초록)로 바꾼다. 노랑은 `.btn-chalk`(칠판 위 CTA)와 승인 표시에만 남긴다. | S |
| R4-06 | Live.tsx:257, Next.tsx:182 | **AI 초안 카드 틀 규칙이 S3과 S4에서 다름.** S4 다음 차시 카드는 초안 = 라벤더 점선 틀인데, S3 묶음 카드는 같은 "AI 초안"인데도 학년색 실선 틀이다. 콘셉트 §2는 "묶음 카드·다음 차시 카드에서 그대로 반복"이라고 적었다. | 스크린샷 08(실선) vs 09(점선) | P1 | `DraftFrame` 유틸(`status: 'draft' \| 'edited' \| 'approved' \| 'rejected'` → border 클래스)을 `ui/`에 만들고 Live 묶음 카드와 Next 카드가 함께 쓴다. 묶음은 `teacherEdited`이면 실선으로 바꾼다. | M |
| R4-07 | Pipeline.tsx:70·96·98·79, Design.tsx:464, ViolationPanel.tsx:208 | **같은 "위반"이 한 화면에서 두 색.** 파이프라인 "검사 · 위반 발견"과 "수리 · 남은 위반"은 warn(호박)인데, 같은 S1의 검증 게이트 "위반 R10"과 ViolationPanel은 bad(빨강)다. 특히 "남은 위반"은 승인을 막는 error인데 호박으로 보인다. | 스크린샷 01: 05 검사 카드는 노랑 테두리, 아래 게이트는 빨강 "위반 R10" | P1 | 콘셉트 표대로 위반 = `bad`. 고쳐진 위반(첫 검사)은 `warn` + "수리로 넘김", **남은 위반은 `bad`**로 나눈다. StepCard `tone`/`border`/Rail 노드 모두 `status==='error' && k==='수리'`이면 bad로. | S |
| R4-08 | Badge.tsx:3·7, Live.tsx:20·262, Next.tsx:79, Design.tsx:141·200, bits.tsx:42 | **`board` 배지 뜻이 넘침.** 주석부터 "승인·코드·녹화" 세 뜻이다. 실제로는 학년쌍 라벨, 진행 시간, 녹화 경로(replay), "교사 수정", "승인 n/n", 질문 유형 "어휘"에도 쓰인다. 승인 도장은 노랑인데 "승인 4/4" 집계는 초록이라 같은 '승인'이 두 색이다. | 스크린샷 09 머리: "승인 4/4" 초록 배지 옆 노랑 도장들 | P1 | `board`는 **코드 판정 전용**(R4-03 `code` tone)으로 좁힌다. 학년쌍·시간·녹화 경로는 `ink`, "승인 n/n"은 다 승인됐을 때 chalk 계열, "교사 수정"은 `ink` + Pencil, 질문 유형은 R4-09로 옮긴다. | M |
| R4-09 | Live.tsx:20 | **질문 유형(분류)에 상태색을 씀.** 오개념은 `bad`(위반 색), 절차 실수는 `warn`, 어휘는 `board`다. 학생 질문 유형이 "위반"이나 "코드 판정"처럼 읽힌다. "뜻 색은 하나에 하나" 규칙과도 어긋난다. | Badge.tsx:3 주석 | P1 | 유형은 모두 `Badge tone="ink"` + 유형별 작은 아이콘(오개념 AlertCircle, 어휘 BookA 등)으로 구분한다. 색은 학년(lo/hi)과 AI만 남긴다. | S |
| R4-10 | bits.tsx:42, Principles.tsx:418, App.tsx:147-150 | **AI 경로 표시에 AI·코드 표시 체계가 섞임.** `live`는 ai 점선(=AI 초안), `replay`는 board 실선(=코드 판정/승인 색)이다. 그런데 replay도 AI가 만든 결과(녹화)라서 "녹화된 AI 출력"이 "코드가 판정한 것"처럼 보인다. | 스크린샷 01 하단 AI 호출 경로: replay 칩이 모두 초록 실선 | P1 | SourceTag/AiChip/Principles 모드 배지는 경로(출처)를 말하는 **중립 메타 칩**으로 분리한다. 세 경로 모두 `ink` 바탕 + 아이콘(Cpu/History/Wrench)으로 바꾸고, AI 결과라는 사실은 옆 `AiBadge`가 맡는다. | S |
| R4-11 | Pipeline.tsx:77, ViolationPanel.tsx:191·229, Design.tsx:461, Next.tsx:124, Live.tsx:160, bits.tsx:31, App.tsx:54 | **ShieldCheck 아이콘이 4가지 뜻.** 교사 승인 도장, 코드 검사 통과, 개인정보 가림 카운터, "데이터·원칙" 메뉴에 모두 쓰인다. 승인(교사)과 통과(코드)가 같은 아이콘이라 표시 체계의 "선 모양으로도 구분" 원칙이 아이콘 수준에서 깨진다. | 콘셉트 §2 "코드가 판정 = 자 아이콘" | P1 | 아이콘 사전: 교사 승인 = ShieldCheck(전용), 코드 통과 = `Ruler` 또는 `CheckCircle2`, 개인정보 가림 = `EyeOff`, 메뉴 원칙 = `Scale`. Design.tsx:461, ViolationPanel.tsx:191·229, Next.tsx:124를 바꾼다. | S |
| R4-12 | Overview.tsx:173, Live.tsx:27, Standards.tsx:302, ViolationPanel.tsx:172, Overview.tsx:313 | **숫자 타일 5종 중복**(§1-6). 값 크기 36/32/32/28/18, 꾸밈 4종. | 스크린샷 08 Counter(아래 점선 막대) vs 25 Standards(꾸밈 없음) | P1 | `ui/StatTile.tsx` 하나(`label, value, unit, note?, tone?: 'neutral'\|'lo'\|'hi'\|'bad', size?`)를 만들고 다섯 곳을 바꾼다. Counter의 점선 색 막대는 R4-04에 따라 실선 `h-1` 막대로. | M |
| R4-13 | Timeline.tsx:140, Pipeline.tsx:100, Next.tsx:307, Live.tsx:257 | **`Card`를 손으로 다시 만들고 그림자도 다름.** `shadow-sm`(Tailwind 기본, 차가운 검정)과 `shadow-paper`(토큰, 따뜻한 갈색)가 같은 종이 카드 역할에 섞인다. Timeline.tsx:140은 `print-plain`까지 복제한다. | grep: shadow-sm 11회 vs shadow-paper 7회 | P1 | 네 곳을 `<Card className=…>`로 바꾼다. 종이 위에서는 `shadow-sm`을 금지(`shadow-paper`만), 호버는 `shadow-lift`(TimelineGrid.tsx:305의 `hover:shadow-md` 포함). | S |
| R4-14 | 버튼 원오프(§1-1 표) | **버튼 크기·변형 원오프 9곳.** `.btn-sm`과 같은 역할을 `px-2 py-1 text-xs`, `px-2.5 py-1.5 text-xs`로 다시 쓰고, 큰 버튼은 `py-2.5`/`text-[16px]`/`min-h-[52px]`/`min-h-[56px]`로 제각각이다. 칠판 위 보조 버튼(Overview.tsx:385)은 변형이 없다. | Overview.tsx:346·385, App.tsx:214, Live.tsx:149, student/App.tsx:447·493 | P1 | index.css에 `.btn-lg`(px-5 py-2.5 text-base, min-h-[48px]), `.btn-icon`(p-2 aspect-square), `.btn-on-board`(border-chalkwhite/35 text-chalkwhite hover:bg-white/10), `.btn-link`를 추가하고 원오프를 바꾼다. 학생 버튼은 `btn-primary btn-lg min-h-[56px]` 하나로. | S |
| R4-15 | 49×`text-[12px]`, 12×`text-[11px]`, 10×`text-[16px]`, Badge.tsx:20 | **글자 크기 토큰 밖 값이 70여 곳.** 11px는 콘셉트 §3 "가장 작은 글자 12px"을 어긴다(StdChip 상태칩 bits.tsx:18·22, 타임라인 눈금·위반 꼬리표 TimelineGrid.tsx:277·317·319·335, 근거 날짜 Overview.tsx:259, 질문 시각 Live.tsx:354, 메뉴 카운트 App.tsx:119, CardView.tsx:22). `text-[16px]`는 base(17)와 거의 같은 값을 따로 만든다. | grep 집계(§1, 임의값) | P1 | tailwind.config.js `fontSize`에 `'2xs': ['0.75rem', { lineHeight: '1.1rem' }]`(12px)를 추가하고 `text-[12px]`·`text-[11px]`를 모두 `text-2xs`로 바꾼다. `text-[16px]`는 `text-base`로(학생 본문 16px 이상 규칙도 충족). | M |
| R4-16 | Design.tsx:395-408, TimelineGrid.tsx:346-364 | **범례 2종.** 같은 ★■□ 범례인데 견본 모양(3×3 vs 5×3, 반반 알약 vs 두 견본), 낱말("■ 직접지도(교사가 곁에)" vs "■ 직접지도")이 다르다. | 스크린샷 01 레인 보드 위 범례 vs 09 미리보기 범례 | P2 | `TimelineLegend`에 `variant="board"`(교사 이동 항목 추가)를 넣고 Design.tsx 인라인 범례를 삭제한다. | S |
| R4-17 | CardView.tsx:7-34, Next.tsx:243-258 | **간접지도 카드 4행(끝 신호·막힐 때·산출물·안내 역할) 렌더링 복제.** 아이콘·라벨 배열과 dl 마크업이 두 곳에 있고, 라벨 위치(옆 vs 위)와 굵기(semibold vs bold)도 다르다. | — | P2 | `CardView`에 `layout="stacked"` prop을 추가해 Next에서 재사용한다. 행 정의 배열은 `CARD_ROWS` 하나로 내보낸다. | S |
| R4-18 | Next.tsx:100, Live.tsx:221 | **학년 레인 컨테이너 2종.** 같은 역할(학년별 열)인데 Next는 `rounded-2xl p-3 h2 text-base extrabold`, Live는 `rounded-xl p-2.5 span text-sm extrabold`다. | 스크린샷 08 vs 09 | P2 | `ui/LanePanel.tsx`(`lane, title, meta, children`)로 합친다. 반경은 카드보다 한 단계 큰 `rounded-2xl`로 통일. | S |
| R4-19 | CardView.tsx:22, Next.tsx:235·339, Overview.tsx:52·143, student/App.tsx:400 | **번호 원 6종**(§1-7). 크기 h-4~h-10, 바탕 3종(board-900, 학년 단색, 테두리). | — | P2 | `ui/StepNo.tsx`(`size, tone`). 인쇄용(border-2)만 `tone="print"`로 남긴다. | S |
| R4-20 | Design.tsx:232, TimelineGrid.tsx:317 | **"교사 확인 필요" 표시 2종.** S1은 연한 `Badge bad`, S2 타임라인은 단색 빨강 11px span이다. | — | P2 | 둘 다 `Badge tone="bad"`(블록 위에서는 `className="bg-bad-600 text-white"` 대신 `solid` 변형을 Badge에 정의). | S |
| R4-21 | bits.tsx:18, Overview.tsx:261 | **"원문 확인" 낱말과 모양이 2종.** StdChip 안은 "원문 확인됨"(ok-100, 11px, rounded), 근거 목록은 "원문 확인"(Badge ok). 상태 "확인 중"(warn)과 "원문 확인 필요"(warn)도 낱말이 다르다. | — | P2 | 상태 사전을 `shared`에 두고(`VERIFIED: '원문 확인됨'`, `PENDING: '원문 확인 필요'`) 두 곳 모두 `Badge`로 렌더한다. 안쪽 칩은 `Badge size="xs"`. | S |
| R4-22 | Live.tsx:323, Next.tsx:208, Live.tsx:265, Design.tsx:180 | **입력 변형 원오프.** MoveSelect는 `.input`을 쓰지 않아 포커스 링이 없고(전역 `:focus-visible`만 적용), 인라인 편집 input은 두 곳에서 다른 덮어쓰기를 쓰며, 체크박스 상자는 `h-[38px]` 매직 넘버로 높이를 맞춘다. | — | P2 | index.css에 `.input-sm`(px-1.5 py-0.5 text-2xs)과 `.input-inline`(투명 바탕, hover/focus에만 테두리)을 추가한다. 체크박스 상자는 `.input flex items-center gap-2`로. | S |
| R4-23 | Section.tsx:28, student/App.tsx:432, App.tsx:115, Pipeline.tsx:84·98·103 | **chalk-400 사용이 콘셉트의 "다섯 곳만"을 넘어섬.** 모든 쪽 eyebrow 막대, 학생 질문 머리 막대, 파이프라인 진행 shimmer와 링, 흐름 점선(chalk-500)에 쓰인다. 노랑이 흔해질수록 "승인 도장" 노랑의 무게가 줄어든다. | 콘셉트 §2 핵심 표 "이 다섯 곳만" | P2 | eyebrow 막대는 `bg-board-300`(종이)/`bg-chalk-300`(칠판)로, 파이프라인 진행 표시는 `board-400` shimmer로 바꾼다. 문서의 "다섯 곳"에 eyebrow를 넣을지는 둘 중 하나로 정리한다. | S |
| R4-24 | Design.tsx:394, Next.tsx:196·319, Timeline.tsx:216, QrCode.tsx:20 | **다크 짝이 빠진 곳.** `text-bad-700` 오류 문장(Design·Next·QrCode), 반려 알약 `bg-paper-card text-bad-700`(다크에서도 밝은 크림 알약), 빈 블록 상세 아이콘 `text-board-600`(다크 board-900 위에서 대비 약 2:1). | grep: dark: 없는 색 클래스 줄 | P2 | 오류 문장은 `<ErrorText>` 부품(`text-bad-700 dark:text-bad-300`)으로 모은다. 반려는 R4-02에 따라 `Badge tone="ink"`. Timeline.tsx:216에 `dark:text-board-300`. | S |
| R4-25 | Design.tsx:20, Timeline.tsx:17, gradeColors.ts:12·22·32 | **상수 중복과 죽은 토큰.** `NOISE_KO`가 두 파일에 똑같이 있다. `LANE_COLOR.*.chip`은 정의만 있고 쓰이지 않으며 다크 짝도 없다. | grep `.chip` 사용 0건 | P2 | `NOISE_KO`는 `ui/gradeColors.ts`(또는 `shared`)로 옮기고, `chip` 키는 삭제한다. | S |
| R4-26 | 반경 분포(§1-9) | **같은 칩 역할에 반경 3종**(Badge rounded-md, Pipeline 미니칩 rounded, StatusPill/AiChip/반려 rounded-full, StdChip 안쪽 rounded). | — | P2 | 규칙: 상태 알약(진행·연결) = `rounded-full`, 뜻 배지·칩 = `rounded-md`, 칩 안 칩 = `rounded-sm`. R4-01·02 정리와 함께 적용. | S |
| R4-27 | lucide `size` 10단계(§1-8) | **아이콘 크기가 같은 맥락에서 다름.** 기본 버튼 15/16, sm 버튼 13/14, AI 아이콘 10/11/12/16. 학생 페이지만 손으로 그린 SVG를 쓴다. | grep 집계 | P2 | §1-8 크기 규칙을 `ui/icons.ts`에 상수로(`ICON.badge=11, btnSm=13, btn=15 …`) 두고 바꾼다. 학생 SVG는 lucide `Check`·`Shield`로 교체(트리 셰이킹되어 번들 영향 미미). | S |

---

## 3. 권장 정리 순서(데모 전 최소 묶음)

1. **표시 체계 3부품 확정 (R4-01·02·03·10·11, 약 1.5시간)**: `ui/Marks.tsx`에 `AiBadge`(draft/approved), `CodeBadge`(Ruler, 실선), `ApprovedStamp`를 모으고 `variant: paper|board|onSolid`만 허용한다. Pipeline·Overview MarkerChain·Next·Live의 인라인 표시를 모두 이 부품으로 바꾼다. 히어로 소개 띠와 실화면이 **같은 부품**을 쓰게 되는 것이 핵심이다.
2. **점선 독점 (R4-04·06)**: `border-dashed`는 AI 전용으로 한다. 비AI 점선 약 18곳을 실선이나 바탕으로 바꾸고, 묶음 카드에 AI 점선 틀을 단다.
3. **색 뜻 정리 (R4-05·07·08·09)**: 다크 주 버튼을 초록으로, 남은 위반을 빨강으로, board 배지를 코드 판정 전용으로, 질문 유형을 중립으로 바꾼다.
4. **중복 부품 (R4-12·13·14·15)**: StatTile, Card 재사용, 버튼 크기 클래스, `text-2xs` 토큰.
5. 나머지 P2는 한 번에 쓸어 담는 정리 커밋으로 처리한다.

## 4. 잘된 점

- 색 원천이 한 곳(`tokens.js` → tailwind → `theme()` CSS 변수)에 있고 hex 하드코딩이 사실상 0이다.
- `LANE_COLOR` 한 객체가 학년색을 solid/hatch/text/soft/border/bar/dot 단계로 나눠 대비 규칙(600 흰 글자, 700 종이 위 글자)을 코드로 강제한다.
- `Section`/`PageHeader`/`EmptyState`/`StatusPill`/`Badge`가 실제로 대부분의 화면에서 쓰인다.
- 다크 모드를 `@media screen`으로 한정해 인쇄는 늘 밝게 나오고, `print-plain`·`no-print`·`avoid-break` 같은 인쇄 유틸이 체계적으로 붙어 있다.
- 파이프라인 단계 카드는 콘셉트대로 AI(점선) / 코드(실선 + Ruler) 미니 배지를 나란히 보여 준다. 이 패턴을 공용 부품으로 끌어올리면 R4-01·03이 함께 풀린다.

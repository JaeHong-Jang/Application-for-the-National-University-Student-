# W2. 오픈소스 레포 조사: 학급 상호작용·실시간·타임라인·인쇄물

- 대상: "복식·소인수 학급 수업 코티처" 해커톤 프로토타입의 (a) QR 실시간 질문/응답 보드, (b) 학생 응답 개념별 묶기와 후속활동 생성, (c) 2학년 레인 이중 트랙 수업 타임라인과 교사 직접지도 겹침 검사, (d) 학습지 인쇄와 QR, (e) 해커톤용 실시간 백엔드
- 조사일: 2026-11-06. 스타 수와 최근 push 날짜는 같은 날 GitHub REST/Search API로 직접 조회한 값이다.
- 검증 표기
  - **[열람]**: README나 공식 문서를 직접 열어 내용을 확인함
  - **[API]**: GitHub API로 스타·라이선스·최근 push만 확인함 (README 미열람)
  - **[스니펫]**: 검색 결과 요약만 봄. 사실관계 재확인 필요
  - **[배경지식]**: 이번 세션에서 검증하지 않은 일반 지식

---

## 0. 결론 먼저

1. **(a)는 직접 만드는 편이 빠르다.** Claper, ClassQuiz 같은 성숙한 도구는 Elixir·Svelte·FastAPI 스택이거나 AGPL/MPL 라이선스라서 해커톤 코드베이스에 넣기 어렵다. 대신 **Supabase + QR 무로그인 참여** 패턴을 쓴 작은 MIT 레포 4개(`jinnyjiinlee/live-qa-board`, `supabase-community/kahoot-alternative`, `iprithvitharun/hangout`, `NADTEST45/class-feedback`)에서 구조를 가져오면 2~4시간 안에 핵심 루프가 돈다.
2. **(b)는 임베딩 클러스터링보다 LLM 한 번 호출이 맞다.** 소인수 학급은 학년당 학생이 2~8명이라 응답이 수십 개를 넘지 않는다. BERTopic·UMAP·HDBSCAN 파이프라인은 데이터가 이 정도로 적으면 오히려 불안정하다. 그 단원의 개념 목록을 프롬프트에 넣고 JSON 스키마로 `{개념, 학생응답ID[], 오개념 여부, 후속활동}`을 받는 방식이 가장 단순하고 시연에도 잘 보인다. 임베딩은 선택 사항이다. 한국어 모델은 `nlpai-lab/KURE-v1`(MIT)나 `BAAI/bge-m3`가 무난하다.
3. **(c)는 직접 만드는 컴포넌트(dnd-kit 또는 포인터 이벤트)와 순수 함수 겹침 검사기 조합을 권한다.** 범위가 40분짜리 차시 하나라서 날짜 기반 Gantt 라이브러리를 들이면 오히려 일이 늘어난다. 대체안은 `react-calendar-timeline`(MIT)이다. groups 2개로 레인을 만들고 `moveResizeValidator`로 스냅을 거는 방식이다. 제약 솔버(OR-Tools, Timefold)는 블록 몇 개 수준에서는 과하다.
4. **(d)는 HTML/CSS 인쇄 페이지에 `@page A4`, Pretendard 웹폰트, `window.print()`(또는 `react-to-print`)를 붙이는 방식이 가장 안전하다.** `@react-pdf/renderer`는 TTF/WOFF 등록이 필요하고 한글 줄바꿈 검증 부담이 있다. QR은 `qrcode.react` 하나면 된다.
5. **(e)는 Next.js(App Router) + Supabase(Postgres + Realtime) + Vercel 조합.** Supabase Free 플랜은 동시 연결 200개, 초당 메시지 100개다(공식 문서 [열람]). 한 학급 시연에는 충분하다.

---

## 1. 후보 전체 목록 (총 70여 개)

스타·날짜는 2026-11-06 기준. "Lic."의 None은 라이선스 파일이 없다는 뜻이고, 이 경우 저작권이 유보되어 있으므로 코드 복사 금지, 참고만 가능하다.

### (a) 실시간 질문·응답 / 학급 응답 시스템 / 퀴즈 / 담벼락

| # | 레포 | ★ | 최근 push | Lic. | 스택 | 매핑 | 검증 |
|---|---|---|---|---|---|---|---|
| 1 | [ClaperCo/Claper](https://github.com/ClaperCo/Claper) | 825 | 2026-10-29 | AGPL-3.0 | Elixir/Phoenix LiveView, Postgres | (a) Q&A·투표·퀴즈·QR 무계정 참여 | [열람] |
| 2 | [Ralex91/Razzia](https://github.com/Ralex91/Razzia) (구 Rahoot) | 1,099 | 2026-11-03 | MIT | TS, pnpm 모노레포, WebSocket, Docker | (a) 카훗형 퀴즈 | [열람] |
| 3 | [mawoka-myblock/ClassQuiz](https://github.com/mawoka-myblock/ClassQuiz) | 736 | 2026-11-02 | MPL-2.0 | Svelte + FastAPI + python-socketio, Postgres, Redis | (a) 카훗형 퀴즈 | [API]+[스니펫] |
| 4 | [b310-digital/mindwendel](https://github.com/b310-digital/mindwendel) | 142 | 2026-10-28 | AGPL-3.0 | Elixir/Phoenix LiveView | (a) 익명 브레인스토밍·레이블·레인 / (b) LLM 아이디어 생성 | [열람] |
| 5 | [spacedeck/spacedeck-open](https://github.com/spacedeck/spacedeck-open) | 1,140 | 2026-11-06 | AGPL-3.0 | Node | (a) 패들렛형 화이트보드 | [API] |
| 6 | [particify/arsnova-webclient](https://github.com/particify/arsnova-webclient) / [arsnova-server](https://github.com/particify/arsnova-server) | 10 / 67 | 2026-11 | MIT / GPL-3.0 | Angular / Kotlin | (a) 대학용 ARS(Particify) | [스니펫] |
| 7 | [thm-projects/frag.jetzt](https://github.com/thm-projects/frag.jetzt) | 23 | 2025-06-04 | MIT | Angular + Spring Boot | (a) 익명 Q&A·AI 모더레이션 / (b) 키워드 클라우드 | [열람] |
| 8 | [PingoUPB/PINGOWebApp](https://github.com/PingoUPB/PINGOWebApp) | 68 | 2023-11-16 | EPL-1.0 | Rails | (a) 강의 응답 시스템 | [API] |
| 9 | [qlicker/qlicker](https://github.com/qlicker/qlicker) | 27 | 2026-10-23 | GPL-3.0 | JS | (a) 오픈소스 클리커 | [API] |
| 10 | [OSU-MC/Open-Response](https://github.com/OSU-MC/Open-Response) | 8 | 2026-06-05 | GPL-3.0 | JS | (a) 강의 투표 | [API] |
| 11 | [th-nuernberg/quiqui](https://github.com/th-nuernberg/quiqui) | 5 | 2026-10-16 | AGPL-3.0 | JS | (a) 무계정 ARS | [API] |
| 12 | [habit-ai/surprisal-live-kit](https://github.com/habit-ai/surprisal-live-kit) | 1 | 2026-10-29 | MIT | React 19/Vite + Vercel fn + Supabase(폴링) | (a) 멘티미터형 12종 슬라이드, QR·4자리 코드 | [열람] |
| 13 | [iprithvitharun/hangout](https://github.com/iprithvitharun/hangout) | 1 | 2026-08-02 | MIT | Vite/React 19 + Supabase Realtime | (a) QR 하나로 AMA·퀴즈·채팅 | [열람] |
| 14 | [jinnyjiinlee/live-qa-board](https://github.com/jinnyjiinlee/live-qa-board) | 1 | 2026-10-10 | MIT | 단일 HTML + Supabase Broadcast | (a) **한국어** QR Q&A·공감·투표·워드클라우드·TOPIC 모드 | [열람] |
| 15 | [NADTEST45/class-feedback](https://github.com/NADTEST45/class-feedback) | 0 | 2026-10-17 | MIT | Next.js 16 + Postgres(PGlite) | (a) **출구 티켓**: QR·3문항·무계정 | [열람] |
| 16 | [supabase-community/kahoot-alternative](https://github.com/supabase-community/kahoot-alternative) | 171 | 2026-05-15 | MIT | Next.js + Supabase(anon auth, postgres changes) | (a)(e) QR 로비·호스트/플레이어 | [열람] |
| 17 | [fecu89/pyxis](https://github.com/fecu89/pyxis) | 0 | 2026-10-13 | MIT | Next.js 16 + Prisma + Socket.IO + SSE | (a) **한국어** 카훗+패들렛+구글폼 | [열람] |
| 18 | [moonsugugu/wallboard](https://github.com/moonsugugu/wallboard) | 0 | 2026-10-02 | None | Vite/React + 자체 API | (a) **한국어** 실시간 포스트잇 담벼락 | [열람] |
| 19 | [geo-2026/M-TRAIN](https://github.com/geo-2026/M-TRAIN) | 0 | 2026-05-27 | None | Express + SPA + Claude API | (a)(d) **한국어** 실시간 질문 수집·한글 PDF·QR | [열람] |
| 20 | [toddeTV/stage-flow-tools](https://github.com/toddeTV/stage-flow-tools) | 17 | 2026-10-18 | Apache-2.0 | TS | (a) 발표용 실시간 퀴즈 | [API] |
| 21 | [binaryplease/omul](https://github.com/binaryplease/omul) | 7 | 2026-11-06 | AGPL-3.0 | TS | (a) 투표·워드클라우드·Q&A | [API] |
| 22 | [Hopvote/hopvote](https://github.com/Hopvote/hopvote) | 1 | 2026-10-27 | AGPL-3.0 | TS | (a) QR 투표·Q&A | [API] |
| 23 | [mftnakrsu/oyla](https://github.com/mftnakrsu/oyla) | 1 | 2026-10-19 | MIT | TS | (a) 투표·주관식 | [API] |
| 24 | [gdgutm/ask_easy](https://github.com/gdgutm/ask_easy) | 7 | 2026-10-09 | None | Next.js + Socket.IO + Redis | (a) 강의 Q&A·업보트 | [스니펫] |
| 25 | [alfredang/live-qna](https://github.com/alfredang/live-qna) | 4 | 2026-03-30 | None | Firebase | (a) Q&A·투표 | [API] |
| 26 | [aastroza/askstage](https://github.com/aastroza/askstage) | 2 | 2026-08-27 | MIT | TS | (a) Q&A·QR | [API] |
| 27 | [MetroCS/classroom-polling](https://github.com/MetroCS/classroom-polling) | 0 | 2026-07-12 | NOASSERTION | Firebase | (a) 무계정 학급 투표 | [스니펫] |
| 28 | [akash02ab/everyone-answers](https://github.com/akash02ab/everyone-answers) | 0 | 2024-01-29 | None | JS | (a) 학생별 응답 실시간 대시보드 | [스니펫] |
| 29 | [ethanbrimhall/kahoot-clone-nodejs](https://github.com/ethanbrimhall/kahoot-clone-nodejs) | 229 | 2022-12-08 | None | Node + Socket.IO | (a) 고전 카훗 클론 | [API] |
| 30 | [htlin222/kahoot-cf](https://github.com/htlin222/kahoot-cf) | 5 | 2026-05-21 | MIT | Cloudflare Workers + Durable Objects | (a)(e) | [API] |
| 31 | [partykit/tutorial-starter-partypoll](https://github.com/partykit/tutorial-starter-partypoll) | 6 | 2023-11-01 | None | PartyKit | (a)(e) 투표 스타터 | [API] |
| 32 | [ByeongsuKim/j-padlet](https://github.com/ByeongsuKim/j-padlet) | 0 | 2026-07-26 | MIT | TS | (a) "제주교육용 패들렛" | [API] |
| 33 | [ASQ-USI/ASQ](https://github.com/ASQ-USI/ASQ) | – | – | RPL-1.5 | Node | (a) 슬라이드+질문 | [스니펫] |

### (b) 짧은 응답 클러스터링·개념 추출 (한국어 포함)

| # | 레포/모델 | ★ / 다운로드 | 최근 | Lic. | 비고 | 검증 |
|---|---|---|---|---|---|---|
| 34 | [huggingface/text-clustering](https://github.com/huggingface/text-clustering) | 610 | 2024-03 (아카이브) | Apache-2.0 | 임베딩, 차원축소, 클러스터, LLM 라벨링 최소 파이프라인 | [열람] |
| 35 | [intellectronica/text-clustering-embedding-vs-prompting](https://github.com/intellectronica/text-clustering-embedding-vs-prompting) | 11 | 2023-08 | Unlicense | **임베딩 클러스터링 vs LLM 프롬프팅 비교 노트북**. 우리 판단 근거로 적합 | [API] |
| 36 | [michelle123lam/lloom](https://github.com/michelle123lam/lloom) | 169 | 2025-06 | BSD-3 | CHI 2024 Concept Induction. LLM으로 자연어 기준이 붙은 "개념" 생성 후 재적용 | [열람] |
| 37 | [MaartenGr/BERTopic](https://github.com/MaartenGr/BERTopic) | 7,933 | 2026-11 | MIT | 대규모 토픽모델. 소인수 데이터엔 과함 | [API] |
| 38 | [MaartenGr/KeyBERT](https://github.com/MaartenGr/KeyBERT) | 4,224 | 2026-08 | MIT | 키워드 추출 | [API] |
| 39 | [zhang-yu-wei/ClusterLLM](https://github.com/zhang-yu-wei/ClusterLLM) | 120 | 2023-10 | None | EMNLP 2023 LLM 가이드 클러스터링 | [API] |
| 40 | [ECNU-Text-Computing/Text-Clustering-via-LLM](https://github.com/ECNU-Text-Computing/Text-Clustering-via-LLM) | 18 | 2025-10 | None | "클러스터링을 LLM 분류로" 논문 코드. 우리 방식과 같은 발상 | [API] |
| 41 | [bandeerun/pyhercules](https://github.com/bandeerun/pyhercules) | 23 | 2026-05 | MIT | LLM 계층 클러스터링 | [API] |
| 42 | [arminpasalic/vectoria](https://github.com/arminpasalic/vectoria) | 29 | 2026-10 | MIT | 브라우저 내 임베딩·클러스터링 | [API] |
| 43 | [huggingface/sentence-transformers](https://github.com/huggingface/sentence-transformers) | 19,258 | 2026-11 | Apache-2.0 | 임베딩 표준 라이브러리 | [API] |
| 44 | [lmcinnes/umap](https://github.com/lmcinnes/umap), [scikit-learn-contrib/hdbscan](https://github.com/scikit-learn-contrib/hdbscan) | 8,288 / 3,158 | 2026-11 | BSD-3 | 차원축소/밀도 클러스터 | [API] |
| 45 | HF `nlpai-lab/KURE-v1` | 36.6만 DL, 102♥ | 2026-09 | MIT | 고려대 한국어 검색용 임베딩 | [API(HF)] |
| 46 | HF `BAAI/bge-m3` / `dragonkue/BGE-m3-ko` | 3,005만 / 7.1만 DL | – | MIT / Apache-2.0 | 다국어 / 한국어 파인튜닝 | [API(HF)] |
| 47 | HF `jhgan/ko-sroberta-multitask` | 126만 DL | 2026-06 | 미기재 | 한국어 SBERT 고전 | [API(HF)] |
| 48 | [BM-K/Sentence-Embedding-Is-All-You-Need](https://github.com/BM-K/Sentence-Embedding-Is-All-You-Need) | 214 | 2024-12 | CC-BY-SA-4.0 | 한국어 문장임베딩 모음 | [API] |
| 49 | [vercel/ai](https://github.com/vercel/ai) | 27,774 | 2026-11 | (Apache-2.0, API상 NOASSERTION) | `generateObject`+zod로 구조화 출력 | [API] |
| 50 | [Dhanunjaya18/AI-Classroom-Doubt-Detector](https://github.com/Dhanunjaya18/AI-Classroom-Doubt-Detector) | 0 | 2026-04 | None | 학생 질문 자동 그룹핑(설명만) | [스니펫] |

### (c) 타임라인·Gantt·드래그앤드롭·시간표 솔버

| # | 레포 | ★ | 최근 | Lic. | 비고 | 검증 |
|---|---|---|---|---|---|---|
| 51 | [namespace-ee/react-calendar-timeline](https://github.com/namespace-ee/react-calendar-timeline) | 2,161 | 2026-07 | MIT | groups=레인, items 드래그/리사이즈, `moveResizeValidator`, `dragSnap`, `itemRenderer`. React 18/19 | [열람] |
| 52 | [visjs/vis-timeline](https://github.com/visjs/vis-timeline) | 2,577 | 2026-11 | Apache-2.0/MIT 듀얼[배경지식] | groups, `onMoving`(드래그 중 위치 보정), `callback(null)`로 이동 취소, background item | [열람(docs)] |
| 53 | [xzdarcy/react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor) | 801 | 2026-01 | MIT | 초 단위 행(row)/액션 편집기(영상 편집기형). 40분 차시처럼 날짜 없는 짧은 범위에 맞음 | [API] |
| 54 | [frappe/gantt](https://github.com/frappe/gantt) | 6,157 | 2026-06 | MIT | 단순 Gantt, 일 단위 중심 | [API] |
| 55 | [svar-widgets/react-gantt](https://github.com/svar-widgets/react-gantt) | 215 | 2026-10 | MIT | React Gantt, 의존관계 | [API] |
| 56 | [MaTeMaTuK/gantt-task-react](https://github.com/MaTeMaTuK/gantt-task-react) | 1,097 | 2024-08 | MIT | **아카이브됨** | [API] |
| 57 | [karolkozer/planby](https://github.com/karolkozer/planby) | 1,722 | 2026-08 | Custom(All Rights Reserved) | EPG 타임라인. **드래그·리사이즈는 PRO(유료)** | [열람] |
| 58 | [neuronetio/gantt-schedule-timeline-calendar](https://github.com/neuronetio/gantt-schedule-timeline-calendar) | 3,643 | 2026-10 | NOASSERTION | 상용 라이선스 요소 있음. 비추천 | [API] |
| 59 | [schedule-x/schedule-x](https://github.com/schedule-x/schedule-x) | 2,609 | 2026-11 | MIT | 캘린더(주/일 뷰) | [API] |
| 60 | [bigcalendar/react-big-calendar](https://github.com/bigcalendar/react-big-calendar) | 8,763 | 2026-06 | MIT | 캘린더 + DnD addon | [API] |
| 61 | [fullcalendar/fullcalendar](https://github.com/fullcalendar/fullcalendar) | 20,751 | 2026-11 | MIT | Resource Timeline은 Premium[배경지식] | [API] |
| 62 | [melfore/konva-timeline](https://github.com/melfore/konva-timeline) | 81 | 2026-06 | MIT | 캔버스 기반 리소스 타임라인 | [API] |
| 63 | [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) | 17,782 | 2026-10 | MIT | 직접 구현 시 DnD 기반 | [API] |
| 64 | [mdobaid311/resource-scheduler](https://github.com/mdobaid311/resource-scheduler) | 3 | 2026-11 | None | "no double booking" 리소스 스케줄러(참고) | [API] |
| 65 | [google/or-tools](https://github.com/google/or-tools) | 14,338 | 2026-11 | Apache-2.0 | CP-SAT `NoOverlap` 제약. 자동 배치까지 가면 사용 | [API] |
| 66 | [TimefoldAI/timefold-solver](https://github.com/TimefoldAI/timefold-solver) | 1,857 | 2026-11 | Apache-2.0 | 시간표 예제 풍부(Java). 해커톤엔 과함 | [API] |
| 67 | [GEOSOFT-GLOBAL/timetablely](https://github.com/GEOSOFT-GLOBAL/timetablely) | 27 | 2026-08 | MIT | 학교 시간표 생성기. README에 솔버 설명 없음(초기 단계) | [열람] |
| 68 | [O2sa/Jadwali](https://github.com/O2sa/Jadwali) | 5 | 2026-10 | MIT | 결정적 학교 시간표 생성기 | [API] |
| 69 | [Azharzia10/Smart-Classroom-Timetable-Scheduler](https://github.com/Azharzia10/Smart-Classroom-Timetable-Scheduler) | 0 | 2025-09 | None | "Smart Scheduler for Multi-Grade Classrooms"(설명만) | [API] |

### (d) 인쇄물·PDF·QR·한글 폰트

| # | 레포 | ★ | 최근 | Lic. | 비고 | 검증 |
|---|---|---|---|---|---|---|
| 70 | [diegomura/react-pdf](https://github.com/diegomura/react-pdf) | 16,851 | 2026-11 | MIT | `Font.register`, **TTF/WOFF만 지원**, 가변폰트 비권장, `registerHyphenationCallback` | [열람(docs)] |
| 71 | [MatthewHerbst/react-to-print](https://github.com/MatthewHerbst/react-to-print) | 2,476 | 2026-09 | MIT | React 컴포넌트를 브라우저 인쇄로 | [API] |
| 72 | [pagedjs/pagedjs](https://github.com/pagedjs/pagedjs) | 1,561 | 2026-10 | MIT | CSS Paged Media 폴리필(머리말·쪽번호) | [API] |
| 73 | [gotenberg/gotenberg](https://github.com/gotenberg/gotenberg) | 13,528 | 2026-11 | MIT | Docker HTML→PDF API(Chromium) | [API] |
| 74 | [parallax/jsPDF](https://github.com/parallax/jsPDF) | 31,317 | 2026-11 | MIT | 클라이언트 PDF(한글은 폰트 임베드 필요[배경지식]) | [API] |
| 75 | [bubkoo/html-to-image](https://github.com/bubkoo/html-to-image) / [niklasvh/html2canvas](https://github.com/niklasvh/html2canvas) | 7,273 / 31,925 | 2026-11 / 2024-07 | MIT | DOM→이미지(흐릿한 인쇄가 단점) | [API] |
| 76 | [zpao/qrcode.react](https://github.com/zpao/qrcode.react) | 4,295 | 2026-11 | ISC[배경지식] | `<QRCodeSVG value=… />` | [API] |
| 77 | [soldair/node-qrcode](https://github.com/soldair/node-qrcode) | 8,184 | 2024-08 | MIT | 서버/CLI QR | [API] |
| 78 | [kozakdenys/qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 2,981 | 2026-02 | MIT | 로고 넣은 QR | [API] |
| 79 | [orioncactus/pretendard](https://github.com/orioncactus/pretendard) | 3,646 | 2026-07 | OFL-1.1 | 한글 웹폰트(CDN, 정적 TTF 제공) | [API] |
| 80 | [KwangYeonCHO/MathLab-Kids](https://github.com/KwangYeonCHO/MathLab-Kids) | 0 | 2026-10 | MIT | **한국어** 2022 개정 초등수학 A4 학습지. `@media print` + 브라우저 인쇄, 무로그인 | [열람] |

### (e) 실시간 백엔드·스타터

| # | 레포 | ★ | 최근 | Lic. | 비고 | 검증 |
|---|---|---|---|---|---|---|
| 81 | [supabase/supabase](https://github.com/supabase/supabase) / [supabase/realtime](https://github.com/supabase/realtime) | 114,596 / 7,677 | 2026-11 | Apache-2.0 | Broadcast·Presence·Postgres Changes | [API]+[열람(limits docs)] |
| 82 | [partykit/partykit](https://github.com/partykit/partykit) / [cloudflare/partykit](https://github.com/cloudflare/partykit) | 5,744 / 1,310 | 2026-10 / 2026-08 | MIT / ISC | Durable Objects 기반 방(room) 서버 | [API] |
| 83 | [liveblocks/liveblocks](https://github.com/liveblocks/liveblocks) | 4,770 | 2026-11 | NOASSERTION | 호스팅형 멀티플레이어. 우리 용도엔 과함 | [API] |
| 84 | [socketio/socket.io](https://github.com/socketio/socket.io) | 63,237 | 2026-11 | MIT | 자체 서버 필요(Vercel 서버리스와 궁합 나쁨[배경지식]) | [API] |
| 85 | [instantdb/instant](https://github.com/instantdb/instant) | 10,561 | 2026-11 | Apache-2.0 | 클라이언트 쿼리 + 실시간 + presence. Supabase 대안 | [API] |
| 86 | [yjs/yjs](https://github.com/yjs/yjs) | 23,027 | 2026-11 | MIT | CRDT. 공동편집이 필요할 때만 | [API] |
| 87 | [imbhargav5/nextbase-nextjs-supabase-starter](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | 834 | 2026-10 | MIT | Next.js 16 + Supabase + Tailwind 4 | [API] |
| 88 | [michaeltroya/supa-next-starter](https://github.com/michaeltroya/supa-next-starter) | 373 | 2026-05 | MIT | Next + Supabase + shadcn | [API] |
| 89 | [firebase/firebaseui-web](https://github.com/firebase/firebaseui-web) | 4,885 | 2026-11 | Apache-2.0 | Firebase 경로 택할 때 | [API] |

### 유사 사례: 복식(멀티그레이드) 학급 AI 보조 해커톤 레포

| # | 레포 | ★ | Lic. | 비고 | 검증 |
|---|---|---|---|---|---|
| 90 | [raj45alok/SahayakAI](https://github.com/raj45alok/SahayakAI) | 1 | MIT | About엔 "Multigrade, Multilingual Indian Primary Classrooms", README는 6~8학년 학습지·평가·일정 배포(AWS Bedrock). PDF/Word 학습지 출력 | [열람] |
| 91 | [ramnayudu/sahayak-ai](https://github.com/ramnayudu/sahayak-ai) | 1 | None | "AI co-teacher for rural multi-grade classrooms", Gemini + Firebase | [API] |
| 92 | [Saminathan-77/sahayak](https://github.com/Saminathan-77/sahayak) | 0 | None | "Google Agentic AI Day 2025 hackathon" 산출물로 명시 | [API] |
| 93 | [Adhish-Krishna/Sudar](https://github.com/Adhish-Krishna/Sudar), [Aadya-Madankar/Saahayak](https://github.com/Aadya-Madankar/Saahayak), [amaljyothis2003/Vidhya-Sathi](https://github.com/amaljyothis2003/Vidhya-Sathi) 등 10여 개 | 0~2 | 혼재 | 같은 문제정의(인도 다학년 학급 교사 지원)로 쏟아진 해커톤 레포 | [API] |

> 시사점: 2025년 Google Agentic AI Day 해커톤에 "다학년(multi-grade) 학급 교사 보조(Sahayak)" 문제가 나왔고 비슷한 레포가 대량으로 생겼다(검색 결과 다수 [API]). 다만 이들이 공통으로 다루는 것은 **학년별 자료 생성**이다. **실시간 학생 응답 수집**과 **두 학년 간 교사 직접지도 시간 충돌 관리**를 함께 묶은 레포는 찾지 못했다. 우리 아이디어의 차별점으로 쓸 만하다.

---

## 2. 심층 평가 Top 12

평가 축: 적합도(우리 a~e에 얼마나 맞나), 6~22h 안에 가져다 쓸 수 있나, 무엇을 빌릴까.

### ① jinnyjiinlee/live-qa-board — (a)에 가장 가까운 한국어 레퍼런스 [열람]
- **MIT, ★1, 2026-10.** UI·문서 모두 한국어.
- 기능: QR 스캔 후 닉네임(주사위 랜덤)만으로 참여한다. 질문 작성·수정·삭제, "나도 궁금해" 공감, 익명 옵션, 예/아니오·5점척도·객관식 투표, 워드클라우드(최대 3단어), 리액션, 공용 타이머가 있다. 발표자 화면에서는 고정, 답변완료 처리, 답변 메모, 승인 후 노출(모더레이션)을 쓸 수 있다. **TOPIC 모드**는 "오늘 가장 좋았던 건?" 같은 질문을 던지고 답변 보드로 전환하는 기능이다. 발표자 리모컨(폰), HTML 리포트·CSV 내보내기, `?room=`으로 방 분리도 지원한다.
- 구조: `index.html` 하나 + `config.js` + `supabase-js`, `qrcode-generator`(SRI 고정). **Supabase Realtime Broadcast만 쓰고 DB에는 저장하지 않는다.** 데이터는 발표자 브라우저에만 남는다. QR URL에 세션 토큰 `h=…`를 넣어 그 링크로만 참여하게 하고, 원격 명령에는 HMAC과 일회용 nonce를 쓴다.
- 우리에게: **TOPIC 모드가 사실상 우리 "자기주도 시간 응답 수집"과 같다.** 방 분리를 `?room=4학년` / `?room=6학년`으로 하면 그대로 복식 2레인이 된다.
- 한계: DB에 저장하지 않으니 (b) 클러스터링 입력으로 쓰려면 `insert` 한 줄과 테이블 추가가 필요하다. 바닐라 JS 단일 파일이라 React로 가면 코드는 못 쓰고 패턴만 가져온다.
- 적응 비용: 그대로 포크해 데모 → **1~2h**. React로 패턴 이식 → 3~4h.
- 빌릴 것: QR 토큰 방식, 공감 정렬 단축키(S), 모더레이션 토글, TOPIC 모드 UX, 발표자 리모컨 아이디어, 입력 검증 규칙.

### ② supabase-community/kahoot-alternative — Next.js + Supabase 정석 골격 [열람]
- **MIT, ★171, 2026-05.** Supabase 공식 블로그 글과 같이 볼 것.
- 구조: SSR 없이 쓰는 Next.js. 플레이어는 `/`, 호스트는 `/host`. 호스트 화면은 QR이 뜬 로비다. 플레이어는 이름만 넣고 들어온다. **익명 로그인(anonymous sign-in)**은 세션이 없을 때만 백그라운드에서 호출하고, 그 결과로 RLS를 건다. 실시간은 **Postgres Changes** 채널 하나에 `participants` INSERT, `games` UPDATE, `answers` 변경을 체인으로 묶어 구독한다. 테이블 6개, `supabase/migrations`.
- 우리에게: "교사가 단계를 바꾸면(games UPDATE) 학생 화면이 따라 바뀌고, 학생 응답(answers INSERT)이 교사 보드에 실시간으로 쌓이는" 구조가 우리 요구와 같다.
- 적응 비용: 클론 후 퀴즈 로직을 걷어내고 `submissions`로 바꾸기 → **3~4h**. `supabase start`(로컬 Docker)가 부담스러우면 클라우드 프로젝트에 마이그레이션 SQL만 붙여넣는다.
- 빌릴 것: anon auth + RLS 패턴, 채널 체인 구독 코드, 마이그레이션 구조, 호스트/참여자 라우팅.

### ③ iprithvitharun/hangout — "QR 하나 + Supabase 키 2개" 템플릿 [열람]
- **MIT, ★1, 커밋 2개.** Vite + React 19 + TS + Tailwind v4 + Supabase(Postgres+Realtime) + PWA.
- QR 체크인(이름만), AMA 질문 큐, 퀴즈, 라이브 챗, 포토월이 들어 있다. `supabase/setup.sql`은 여러 번 실행해도 안전하게 만들어져 있다. 호스트 콘솔 `/host`는 `set_host_secret` 함수로 비밀번호를 걸어 잠근다. Supabase가 없으면 인메모리로 대체돼 단일 기기 데모가 가능하다.
- 우리에게: **로그인 없는 교사 화면 보호**를 Postgres 함수 기반 비밀번호로 처리한 방식이 해커톤 수준에 딱 맞다. 오프라인 대체 모드는 발표장 Wi-Fi 사고 대비책이 된다.
- 적응 비용: AMA 큐 부분만 가져오기 → 2~3h. 커밋이 2개뿐이라 코드 품질은 확인되지 않았다.

### ④ NADTEST45/class-feedback — 출구 티켓 + 무계정 설계의 교과서 [열람]
- **MIT, ★0, 2026-10.** Next.js 16 App Router + Tailwind 4 + Postgres(운영) / **PGlite(로컬, DB 설치 불필요)**.
- 이해도(얼굴 5단계), 속도, "아직 헷갈리는 것" 3문항을 20초 안에 받는다. 강의별 private key는 SHA-256 해시만 저장하고 키는 URL fragment에 둔다. 학생은 localStorage + 쿠키의 랜덤 ID로 구분하고, 같은 브라우저는 한 번만 응답하되 수정은 허용한다. 전송에 실패하면 폰에 보관했다가 재시도한다. 교사 대시보드는 **"가장 헷갈려하는 학생 먼저" 정렬**하고, CSV는 BOM 포함·수식 주입 방어가 되어 있다. QR이 localhost를 가리키면 경고를 띄운다.
- 우리에게: 차시 끝 출구 티켓을 그대로 옮겨올 수 있다. 오프라인 재시도와 localhost 경고는 실제 교실 시연에서 바로 효과가 있는 디테일이다.
- 적응 비용: 2~3h(Next.js를 쓴다면 거의 그대로).

### ⑤ habit-ai/surprisal-live-kit — 웹소켓 없이 폴링으로 버티는 설계 [열람]
- **MIT, ★1.** React 19/Vite 8 + Vercel 서버리스 함수(`api/live.ts`) + Supabase Postgres(테이블 7개, RLS).
- **웹소켓 미사용**: 참여자는 1.2초, 발표자는 0.9초마다 폴링한다. 150대 부하 테스트 주장이 있으나 미검증이다. 슬라이드는 12종(투표, 워드클라우드, 주관식, 척도, 순위, 2×2, 퀴즈, Q&A 업보트 등)이다. 결과는 호스트가 공개하기 전까지 숨겨지고, 키워드 필터에 걸린 응답은 보류된다. 리포트는 CSV/JSON/Markdown으로 낼 수 있다.
- 우리에게: **학교망이 웹소켓을 막는 경우에 대비한 폴링 대체 경로**의 근거가 된다. "결과 숨김 후 공개"는 자기주도 시간에 친구 답을 베끼는 것을 막는 데 유용하다.
- 적응 비용: 아이디어만 가져오기 0.5h. 코드 포크 3~5h.

### ⑥ ClaperCo/Claper — 가장 성숙한 오픈소스 Slido/멘티미터 [열람]
- **AGPL-3.0**(API 기준. README는 GPLv3라고 적혀 있어 LICENSE 확인 필요). ★825, 2026-10. Elixir/Phoenix LiveView + Postgres + Oban.
- 익명 Q&A(인기순, 고정, 스레드 답변), 투표, 채점 퀴즈, 폼, 리액션, QR/코드 무계정 참여, 모더레이션(차단, 고정만 보기), PDF/PPT 업로드, 발표자·관리자 뷰, LTI 1.3, QTI/CSV 내보내기, 10개 언어. AI는 Mistral 실시간 자막만 있다.
- 우리에게: **기능 목록과 UX 기준선**으로 쓴다. 심사위원이 "Slido랑 뭐가 다르냐"고 물을 때 비교표의 기준점이 된다. 스택이 달라서(Elixir) 포크는 비현실적이고, AGPL이라 코드 복사도 피해야 한다.
- 적응 비용: 포크 시 10h 이상(비추천). 참고만 0.5h.

### ⑦ Ralex91/Razzia(구 Rahoot) — MIT 카훗 클론 중 가장 활발 [열람]
- **MIT, ★1,099, 2026-11.** TS pnpm 모노레포, Node 24, 웹(3000)과 소켓(3001) 포트 분리, Docker. 퀴즈와 결과를 `config/` 폴더에 파일로 저장한다. WebSocket 프로토콜이 문서화되어 있다(ESP32 부저 예시). HTTP API로 세션·퀴즈 CRUD를 할 수 있다. 참여는 방 코드 입력이고 QR은 없다.
- 우리에게: 후속활동으로 "학년별 미니 퀴즈"를 붙이고 싶을 때 쓸 수 있다. 다만 별도 소켓 서버가 필요해 Vercel 단독 배포와 맞지 않는다. 우선순위는 낮다.

### ⑧ geo-2026/M-TRAIN — 한국 교실 배포 노하우가 담긴 사례 [열람]
- **라이선스 없음(코드 복사 금지)**, ★0. Express(`server.js`)가 질문 수집, AI 프록시, PDF 생성, QR을 처리한다. 11화면 SPA. 데이터는 `state.json`. **나눔고딕(OFL)을 `app/fonts/`에 동봉해 OS와 무관하게 한글 PDF가 깨지지 않게 했다.**
- 배포 트릭: 교사 PC에서 `시작하기.bat` 더블클릭 → 콘솔에 학생 URL과 QR 출력. **Cloudflare 터널로 즉시 공개 URL**을 만들고, Render 무료 티어도 지원한다(15분 후 슬립). Claude API 키는 교사가 세션마다 브라우저에 입력하고 서버에는 저장하지 않는다.
- 우리에게: "교사 PC 한 대로 돌아간다"는 현장 실현성 서사, 한글 폰트 동봉, API 키를 저장하지 않는 설계. 발표 자료의 "현장 적용 가능성" 근거로 인용할 수 있다.

### ⑨ (b) 묶음: huggingface/text-clustering + intellectronica 비교 노트북 + LLooM [열람/API]
- `huggingface/text-clustering`(Apache-2.0, 아카이브): 의존성은 sentence-transformers, umap-learn, scikit-learn, faiss-cpu. `ClusterClassifier().fit(texts)`가 `embs, labels, summaries`를 돌려주고 LLM이 클러스터 주제를 라벨링한다. 노트북에서 몇 분이면 돈다. **대규모(수만 건)용**이다.
- `intellectronica/text-clustering-embedding-vs-prompting`(Unlicense): 임베딩으로 클러스터링한 결과와 LLM에 직접 묶게 한 결과를 비교한다. **우리 설계 결정("소량이면 프롬프팅")의 근거 자료**로 쓴다.
- `michelle123lam/lloom`(BSD-3, `pip install text_lloom`): GPT-4o/4o-mini로 텍스트 조각을 요약하고, **자연어 포함 기준이 붙은 개념**을 만든 뒤, 그 개념을 데이터에 다시 적용(점수화)하고 상위 개념으로 일반화한다. 논문은 Distill → Cluster → Synthesize → Score 4단계로 설명한다[배경지식]. 우리 프롬프트를 "개념 이름 + 포함 기준 + 해당 응답 ID"로 설계할 때 그대로 빌리면 좋다. 기준이 명시되니 교사가 결과를 신뢰하기 쉽다.
- 적응 비용: LLooM식 프롬프트 설계 1~2h. Python 파이프라인 도입은 4h 이상(비추천).

### ⑩ (c) namespace-ee/react-calendar-timeline (+ vis-timeline, react-timeline-editor) [열람]
- **MIT, ★2,161.** 현재 0.30.0-beta(React 18/19, dayjs + interactjs 피어 의존), 안정판은 0.28(moment).
- groups `{id,title,height,stackItems}`를 학년 레인 2개로 쓴다. items `{id,group,start_time,end_time,canMove,canResize,canChangeGroup}`에서 `canChangeGroup:false`로 블록이 다른 학년 레인으로 넘어가지 못하게 막는다. `dragSnap`은 기본 15분이므로 5분으로 바꾼다. `moveResizeValidator(action,itemId,time,edge)`는 보정된 시간을 돌려줘 이동을 막거나 스냅할 수 있다. `itemRenderer`로 블록 종류별 색을 칠한다. `minZoom` 기본 1시간은 40분 차시에 맞게 줄여야 한다.
- 한계: **레인을 넘나드는 겹침 금지(4학년 직접지도와 6학년 직접지도)는 내장되어 있지 않다.** `stackItems`는 같은 그룹 안의 시각적 겹침만 피한다. 결국 겹침 검사기는 직접 써야 한다.
- vis-timeline: `onMoving(item, callback)`에서 start/end/group을 허용 구간으로 보정하고, `onMove`에서 `callback(null)`로 놓기를 취소할 수 있다. **background item으로 다른 레인의 직접지도 구간을 회색 띠로 깔아 보여줄 수 있다.** 다만 React 래퍼가 없어 ref로 감싸야 한다.
- xzdarcy/react-timeline-editor(MIT, ★801): 초 단위 행/액션 편집기라 날짜 개념이 없고 0~2400초 범위를 그대로 쓸 수 있다. 미열람.
- 적응 비용: react-calendar-timeline 3~5h(날짜를 0분 기준 타임스탬프로 매핑하는 수고 포함). **직접 구현 2~4h**(아래 3절).

### ⑪ (d) 브라우저 인쇄(MathLab-Kids 방식) vs @react-pdf/renderer [열람]
- `KwangYeonCHO/MathLab-Kids`(MIT): Next.js 15 static export, `@media print` + Ctrl+P, A4 한 장에 25~30문항 밀도 자동 조절, 2~6단 레이아웃, 정답지 절취선. **한국 초등 2022 개정 교육과정 29개 프리셋.** 우리 학습지 출력과 같은 문제를 같은 방식으로 풀었다.
- `@react-pdf/renderer`: `Font.register({family, src})`, **TTF/WOFF만 지원하고 가변폰트는 비권장**이라 Pretendard 정적 TTF를 따로 받아 등록해야 한다. 하이픈 처리는 `registerHyphenationCallback(w => [w])`로 끄고, `hyphenationPenalty: Infinity`로 단어 경계에서만 줄바꿈하게 한다. 한글(어절이 길거나 공백이 없는 경우) 줄바꿈 동작은 공식 문서에 없다. **직접 테스트해야 한다.**
- 결론: 해커톤에서는 **HTML 인쇄 페이지 + `react-to-print`(또는 `window.print`)**가 빠르고 안전하다. 서버에서 PDF 파일 자체가 꼭 필요하면 Gotenberg(Docker)나 Puppeteer를 쓴다.

### ⑫ fecu89/pyxis — 한국 교사가 만든 카훗+패들렛+폼 통합 플랫폼 [열람]
- **MIT, ★0.** Next.js 16 + React 19 + Postgres/Prisma 7 + **Socket.IO(퀴즈) + SSE(패드)** + NextAuth(카카오 OAuth) + @dnd-kit. 6자리 PIN `/j/{pin}`, 닉네임 전용 참여, 공개 패드는 게스트 사진 업로드 후 승인 처리, CSV/XLSX/ZIP 내보내기, 관리자 센터.
- 우리에게: 한국 학교 현장의 기능 기대치(PIN, 카카오, XLSX)를 보여주는 기준선이다. 스택이 무거워(커스텀 Node 서버, Prisma, NextAuth) 포크는 해커톤 범위를 넘는다. **PIN 라우트 `/j/{pin}`과 dnd-kit 카드 보드 구현은 참고할 만하다.**

---

## 3. 파트별 권장 구현과 빌려올 것

### (a) QR 무로그인 실시간 보드
- 라우트: `/t/[sessionId]` 교사 보드, `/s/[code]?g=4` 학생 입력(학년 파라미터가 곧 레인), `/t/[sessionId]/qr` 전체화면 QR(학년별 QR 2개 나란히).
- 데이터(Supabase):
  ```sql
  sessions(id uuid pk, code text unique, title text, grades int[], phase text, teacher_secret_hash text, created_at)
  submissions(id uuid pk, session_id uuid, grade int, nickname text, kind text check (kind in ('question','answer','exit')),
              prompt_id uuid null, body text check (char_length(body) <= 300), created_at timestamptz default now())
  clusters(id uuid pk, session_id uuid, grade int, concept text, criteria text, submission_ids uuid[], is_misconception bool, follow_up jsonb)
  schedule_blocks(id uuid pk, session_id uuid, lane int, start_min int, end_min int, kind text, title text)
  ```
- 실시간: 교사 보드는 `postgres_changes`(INSERT on submissions, filter `session_id=eq.X`)로 받는다(② 패턴). 단계 전환(자기주도 → 직접지도)은 `sessions.phase` UPDATE 또는 Broadcast로 보낸다(① 패턴).
- 무계정 보호: 학생은 localStorage 랜덤 ID와 닉네임(④ 패턴). 교사 화면은 URL fragment 비밀키 해시(④)나 Postgres 함수 비밀번호(③) 중 하나만 쓴다.
- 대비책: 웹소켓이 막히면 2초 폴링으로 전환한다(⑤ 패턴, SWR `refreshInterval`).
- UX 차용: 공감(업보트) 정렬, 승인 후 노출, TOPIC 모드(①), "헷갈리는 학생 먼저" 정렬(④), 결과 숨김 후 공개(⑤).

### (b) 개념별 묶기와 후속활동
- **기본**: 서버 라우트 하나에서 LLM을 1회 호출하고 구조화 출력을 받는다(Vercel AI SDK `generateObject` + zod, 또는 Anthropic/OpenAI SDK의 JSON 스키마 출력).
  - 입력: 단원·차시 성취기준, 그 차시의 핵심 개념 후보 목록(교사 입력 또는 LLM 사전 생성), 학년별 `submissions`
  - 출력 스키마(LLooM식): `[{concept, criteria(포함 기준 한 문장), submission_ids[], is_misconception, evidence_quote, follow_up:{type:'짝토의'|'미니강의'|'보충학습지', grade, minutes, instructions}}]`
  - 장점: 응답이 2~40개 수준이면 임베딩보다 정확하고 설명이 붙는다. 한국어 초등생의 맞춤법 오류와 구어체에도 강하다.
- **선택(응답이 많을 때)**: 임베딩(OpenAI `text-embedding-3-small`, 또는 HF `nlpai-lab/KURE-v1`/`BAAI/bge-m3`) → 코사인 유사도 계층 클러스터(임계값) → 클러스터별 LLM 라벨링. BERTopic·UMAP·HDBSCAN은 샘플 수가 적으면 노이즈로 처리되는 비율이 높아 추천하지 않는다[배경지식].
- 검증: 같은 입력으로 3회 호출해 클러스터가 안정적인지 확인하고, 교사가 카드를 드래그해 클러스터를 옮길 수 있게 한다. "AI 제안 → 교사 확정" 흐름을 시연 포인트로 삼는다.

### (c) 이중 트랙 타임라인
- **권장: 직접 구현(약 150줄).** 이유는 범위가 40(또는 80)분 고정이고 레인이 2개뿐이며, 핵심 가치가 "교사 직접지도 겹침 경고"라서 라이브러리가 해 주는 일이 거의 없기 때문이다.
  - 렌더링: CSS grid로 1분을 n px로 잡고, `left = start_min * px`, `width = (end-start) * px`.
  - 드래그: dnd-kit(`restrictToHorizontalAxis` + 5분 스냅 modifier) 또는 pointer events 직접 처리. 레인 간 이동은 금지한다.
  - 검사기(순수 함수, 단위 테스트 가능):
    ```ts
    type Block = { id: string; lane: 0|1; start: number; end: number; kind: 'direct'|'self'|'group' };
    export function teacherConflicts(blocks: Block[]) {
      const d = blocks.filter(b => b.kind === 'direct').sort((a,b) => a.start - b.start);
      const out: [string,string][] = [];
      for (let i = 0; i < d.length; i++)
        for (let j = i + 1; j < d.length && d[j].start < d[i].end; j++)
          if (d[i].lane !== d[j].lane) out.push([d[i].id, d[j].id]);
      return out; // 충돌 쌍 → 빨간 테두리 + "4학년 직접지도와 6학년 직접지도가 10~15분 겹침"
    }
    ```
  - 시각 보조: 상대 레인의 직접지도 구간을 내 레인에 반투명 띠로 깐다(vis-timeline background item과 같은 발상).
  - 자동 배치: LLM이 차시 계획을 JSON 블록으로 제안하고, 충돌이 있으면 그리디로 한쪽 블록을 뒤로 민다. OR-Tools CP-SAT `AddNoOverlap`은 "자동 최적화" 기능을 시연할 때만 고려한다.
- 대체안: `react-calendar-timeline`(groups 2개, `canChangeGroup:false`, `dragSnap: 5분`, `moveResizeValidator`로 충돌 시 원위치). 피할 것: planby(DnD가 유료), gantt-task-react(아카이브), neuronetio GSTC(상용 라이선스).

### (d) 학습지 인쇄와 QR
- `/print/[sessionId]?grade=4` 페이지에 `@page { size: A4; margin: 15mm }`, Pretendard(CDN, OFL), `break-inside: avoid`를 걸고 `react-to-print`로 출력하거나 사용자가 "PDF로 저장"을 고르게 한다(⑪ MathLab-Kids 방식).
- 학습지 머리말에 `qrcode.react`의 `<QRCodeSVG value={studentUrl} />`를 넣는다. 종이 학습지에서 QR로 태블릿 응답 페이지로 바로 이어진다(종이와 디지털 연결 시연 포인트).
- react-pdf는 "PDF 파일 다운로드 버튼"이 꼭 필요할 때만 쓴다. Pretendard 정적 TTF를 등록하고 하이픈 처리를 끈 뒤 한글 줄바꿈을 실제로 출력해 확인한다.

### (e) 백엔드
- **Supabase(Postgres + Realtime) + Next.js on Vercel.** LLM 키는 Next.js Route Handler에서만 쓴다.
- Free 플랜 한도는 동시 연결 200, 초당 메시지 100, 초당 채널 조인 100이다(공식 Realtime Limits 문서). 학급 시연에는 충분하다.
- 대안 비교:
  - Firebase(Firestore `onSnapshot`): 팀이 익숙하면 동급이다. 다만 SQL이 없어 클러스터 집계가 불편하다.
  - InstantDB: 스키마 없이 빠르게 시작할 수 있지만 팀 학습 비용이 있다.
  - PartyKit/Cloudflare Durable Objects: 방 단위 상태에는 최적이지만 영속 DB를 따로 붙여야 한다.
  - Liveblocks/Yjs: 공동편집용이라 과하다.
  - Socket.IO: 별도 상주 서버가 필요해 Vercel과 궁합이 나쁘다.

---

## 4. 추천 최소 스택 조합

| 파트 | 선택 | 근거 레포 |
|---|---|---|
| 프레임워크 | Next.js(App Router) + TS + Tailwind + shadcn/ui | ②④ |
| (e) 실시간/DB | Supabase: `postgres_changes` 구독 + RLS, 교사 비밀은 해시 | ②③④ |
| (a) 참여 | `/s/[code]?g=학년` + localStorage ID + 닉네임, QR은 `qrcode.react` | ①④ |
| (a) 대비책 | 2초 폴링 | ⑤ |
| (b) 클러스터링 | LLM 1회 구조화 출력(LLooM식 "개념+포함기준"), 교사 드래그 보정 | ⑨ |
| (c) 타임라인 | 직접 구현(CSS grid + dnd-kit 5분 스냅) + `teacherConflicts()` 순수 함수 | ⑩ |
| (d) 인쇄 | HTML 인쇄 페이지 + `@page A4` + Pretendard + `react-to-print`, 머리말 QR | ⑪ |
| 배포 | Vercel + Supabase Cloud(서울 리전 선택 가능 여부는 확인 필요) | – |

### 시간 예산(22h 기준, 6h 압축안은 괄호)
1. Supabase 스키마, 세션 생성, QR, 학생 제출, 교사 실시간 보드 — 4h (6h안: 2h, ① 포크로 대체 가능)
2. LLM 클러스터링과 후속활동 카드 — 3h (1.5h)
3. 이중 트랙 타임라인과 충돌 검사(+LLM 초안 생성) — 4h (1.5h, 드래그 없이 폼 입력과 충돌 표시만)
4. 학습지 인쇄 페이지(학년별 + QR) — 2h (0.5h)
5. 출구 티켓, 결과 숨김/공개, 폴링 대체 — 2h (생략)
6. 시드 데이터(가상 4·6학년 응답 20개), 리허설, 버그 — 4h (0.5h)
7. 여유 — 3h

---

## 5. 라이선스·리스크 메모
- **AGPL/GPL**(Claper, mindwendel, spacedeck-open, quiqui, omul, Hopvote, qlicker, Open-Response, arsnova-server): 코드를 복사하면 우리 전체 소스를 같은 라이선스로 공개해야 한다. **UX와 기능 목록만 참고한다.**
- **MPL-2.0**(ClassQuiz): 파일 단위 카피레프트. 파일을 수정해 쓰면 해당 파일 공개 의무가 생긴다.
- **라이선스 없음**(M-TRAIN, wallboard, ask_easy, kahoot-clone-nodejs, everyone-answers, ramnayudu/sahayak-ai 등): 저작권이 유보되어 있다. 아이디어만 참고한다.
- **MIT/Apache로 코드 재사용 가능**: live-qa-board, kahoot-alternative, hangout, class-feedback, surprisal-live-kit, Razzia, pyxis, MathLab-Kids, react-calendar-timeline, dnd-kit, qrcode.react, react-to-print, react-pdf. 저작권 고지를 유지한다.
- 별 0~2개짜리 신규 레포(①③④⑤⑫)는 README만 봤고 코드는 검증하지 않았다. 포크하기 전에 `npm run build`가 통과하는지 먼저 확인한다.
- 학생 개인정보: 무로그인과 닉네임만 받는 설계를 유지하고, 응답 원문을 LLM에 보낼 때 실명이 들어가지 않게 한다(닉네임 → 임시 ID 치환).

---

## 6. 출처
- GitHub REST/Search API 조회(2026-11-06): 위 표의 모든 ★·push·라이선스 값
- [열람] README/문서: ClaperCo/Claper, Ralex91/Razzia, b310-digital/mindwendel, habit-ai/surprisal-live-kit, iprithvitharun/hangout, jinnyjiinlee/live-qa-board, geo-2026/M-TRAIN, NADTEST45/class-feedback, huggingface/text-clustering, michelle123lam/lloom, namespace-ee/react-calendar-timeline, [vis-timeline docs](https://visjs.github.io/vis-timeline/docs/timeline/), [Supabase 블로그: Kahoot alternative](https://supabase.com/blog/meetup-kahoot-alternative), supabase-community/kahoot-alternative, [react-pdf fonts](https://react-pdf.org/fonts), raj45alok/SahayakAI, thm-projects/frag.jetzt, moonsugugu/wallboard, fecu89/pyxis, KwangYeonCHO/MathLab-Kids, karolkozer/planby, GEOSOFT-GLOBAL/timetablely, [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- Hugging Face API: nlpai-lab/KURE-v1, BAAI/bge-m3, dragonkue/BGE-m3-ko, jhgan/ko-sroberta-multitask, snunlp/KR-SBERT-V40K-klueNLI-augSTS
- 검색 스니펫: [alternativeto Slido](https://alternativeto.net/software/sli-do), [alternativeto Mentimeter](https://www.alternativeto.net/software/mentimeter/), [selfhostyourself Slido](https://selfhostyourself.com/alternative-to/slido), ClassQuiz 스택([ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fmawoka-myblock%2FClassQuiz)), [Particify/ARSnova](https://github.com/particify/arsnova-webclient), [react-pdf textkit 6.1.0 하이픈 변경](https://newreleases.io/project/github/diegomura/react-pdf/release/@react-pdf%2Ftextkit@6.1.0)

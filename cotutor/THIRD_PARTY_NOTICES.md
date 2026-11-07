# THIRD_PARTY_NOTICES

| 출처 | 저작권자 | 라이선스 | 옮긴·참고한 것 | 이 저장소 위치 |
|---|---|---|---|---|
| kr-curriculum-2022 (github.com/bobthecodebuilder88/kr-curriculum-2022) | Bob Park (Huemone) | 코드 MIT / 데이터 공공누리(교육부 고시 원문) | `data/초/*.jsonl` 611건을 변환, `SKILL.md`의 "진술문 한 글자도 바꾸지 말 것" 규칙 | `data/standards.index.json`, `scripts/build-standards.ts` |
| k12-teacher-skills (github.com/anthropics/k12-teacher-skills) | Anthropic | Apache-2.0 | 개별화 규칙 R2·R3·R6, 루브릭 P1~P4를 한국어로 번안·수정 | `server/ai/prompts/nextCards.ts`, `eval/rubric.csv`, `LICENSES/k12-teacher-skills/` |
| worksheet-grab (github.com/pblsketch/worksheet-grab) | pblsketch | MIT | 학생판 정답 제거 2중 방어 패턴(코드 복사 없이 다시 구현) | `shared/worksheet.ts` |
| Claw-ED (github.com/SirhanMacx/Claw-ED) | EDUagent Contributors | MIT | `adaptive.py` 재지도 판정 아이디어, tiered 프롬프트 아이디어(번안) | `server/ai/pipeline/nextCards.ts` (RETEACH_THRESHOLD) |
| LLooM (github.com/michelle123lam/lloom) | Michelle Lam 외 | BSD-3 | "개념 + 포함 기준 + 응답 ID" 군집 출력 형식(아이디어) | `shared/contracts.ts` ClusterOut |
| class-feedback (github.com/NADTEST45/class-feedback) | NADTEST45 | MIT | localStorage ID, 실패 시 재시도, localhost QR 경고(아이디어) | `src/student/App.tsx`, `src/teacher/pages/Live.tsx` |
| Pretendard (github.com/orioncactus/pretendard, npm `pretendard`) | Kil Hyung-jin | SIL OFL 1.1 | 본문·UI 글꼴, 동적 subset woff2를 로컬 번들(CDN 없음) | `src/index.css` |
| Yeon Sung (Google Fonts, npm `@fontsource/yeon-sung`) | The Yeon Sung Project Authors | SIL OFL 1.1 | 손글씨(분필) 강조 글꼴, unicode-range 조각 woff2만 | `src/fonts/yeon-sung.css` |
| JetBrains Mono (npm `@fontsource/jetbrains-mono`) | JetBrains | SIL OFL 1.1 | 성취기준 코드·시각용 고정폭(latin 400·600 woff2) | `src/fonts/jetbrains-mono.css` |
| masdae-pass · masdae-market · 윤슬(경영정보학회) · TTA-Service | 이 프로젝트 학생 본인 | 본인 저작물 | UI 컴포넌트(Card·Badge·Section·EmptyState·CopyButton·FlowRail·StatusPill·QrCode), 앱 셸(사이드바·AI 상태 알약·다크 토글, masdae-pass `app/Layout.tsx`), 한눈에 화면(히어로·HowTo·KPI·근거 목록, `features/overview`), 파이프라인 단계 카드·검증 게이트(`features/agent-team`), index.css·tailwind 설정, SSE 버스·재연결, JSON 저장, LLM 호출 지점, fixture 녹화 방식, PII 정규식 | `src/ui/`, `src/teacher/App.tsx`, `src/teacher/pages/Overview.tsx`, `src/teacher/components/Pipeline.tsx`, `src/index.css`, `server/live/bus.ts`, `src/teacher/live.tsx`, `server/store/db.ts`, `server/ai/llm.ts`, `server/ai/fixtures.ts`, `shared/check/pii.ts` |

npm 의존성(React, Express, zod, qrcode, lucide-react, @anthropic-ai/sdk, Tailwind 등)은 각 패키지의 라이선스를 따른다.
코드·프롬프트 문구를 옮기지 않은 레포(라이선스 없음·GPL·AGPL·Proprietary)는 명세 §8-2의 금지 목록을 따랐다.

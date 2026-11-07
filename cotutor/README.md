# 함께반(가칭) — 복식학급 수업 코티처 프로토타입

두 학년을 한 교실에서 혼자 가르치는 담임교사를 위한 웹앱.
**"ChatGPT는 수업안을 쓰고, 함께반은 선생님의 동선을 짭니다."**

- S1 수업 설계: 2022 개정 성취기준에 맞춘 공통 도입(★) → 학년별 분리(■직접/□간접) → 공통 정리(★). 시간 골격은 코드가, 활동 문장은 AI 초안이 쓴다.
- S2 타임라인: 직접/간접지도 2레인과 코드 검사기(R1~R12). error가 0이어야 승인된다.
- S3 질문함: QR로 학생 질문 수집(계정·이름 없음), 개인정보 마스킹, AI 묶기.
- S4 다음 차시: 학년별 보충·심화 카드, 교사 승인 후에만 인쇄. 학생판에는 교사 메모가 없다.

## 실행

```bash
npm install
npm run build && npm start          # http://localhost:8787 (교사) · /s/?c=코드 (학생)
AI_MODE=replay npm start            # 키·인터넷 없이 녹화 응답으로 데모
npm run dev                         # 개발: vite + API(8787)
npm run typecheck && npm test       # 검사
npm run e2e                         # 서버를 띄운 뒤 Playwright 데모 완주 + screenshots/
```

| 환경변수 | 기본 | 설명 |
|---|---|---|
| `AI_MODE` | `live` | `live`(모델 호출) · `replay`(fixtures/ 재생) · `rules`(결정적 템플릿). live 실패 → replay → rules |
| `LLM_PROVIDER` | `ollama` | `ollama`(로컬 모델) · `anthropic`(Claude, 운영 목표) |
| `OLLAMA_BASE_URL` | `http://172.20.32.1:11434` | WSL에서 Windows 호스트 Ollama. 실패하면 localhost 시도 |
| `MODEL_LESSON` / `MODEL_CLUSTER` / `MODEL_JUDGE` | ollama: `ax4-light:q4_K_M` / `qwen3:4b-instruct-2507-q4_K_M` / `qwen2.5:7b` · anthropic: `claude-sonnet-5-5` / `claude-haiku-5-5` / `claude-opus-5-5` | |
| `AI_TIMEOUT_MS` | ollama 120000 · anthropic 20000 | |
| `PUBLIC_BASE_URL` | (없음) | QR 주소. 없으면 접속한 주소. localhost·사설 IP면 화면에 경고 |
| `TEACHER_KEY` | (없음) | 있으면 교사 API에 필요(최초 `?k=`로 받아 저장). 배포 시 반드시 설정 |
| `RETENTION_DAYS` | 7 | 학생 원문 보관 기간 |
| `PORT` / `DATA_DIR` | 8787 / `var` | |

## 데이터 원칙

교사 승인 전에는 학생에게 아무것도 나가지 않고 학생 페이지에는 AI 출력이 없다. 학생 계정·이름·사진을 받지 않는다. 제출 즉시 개인정보를 가리고 AI에는 가린 글만 보낸다. 원문은 교사만 보고 보관기간 뒤 지운다. 위기 신호는 AI가 해석하지 않고 교사 알림만 띄운다. 학생부 문장·점수를 만들지 않는다. **외부 LLM API 서버는 국외일 수 있으므로 개인정보를 보내지 않는다**(기본 Ollama 경로는 학교 PC 안에서 돈다).

## 출처

성취기준 원문: 교육부 고시 제2022-33호(한국교육과정평가원 NCIC). 코드 인덱스: kr-curriculum-2022(MIT), 비공식 기계 추출본을 사람이 대조함(데모 코드는 NCIC PDF와 자동 대조, 사람 최종 확인 필요 — BUILD_NOTES 참고).
복식학급 모형: 충청북도교육청 「초등학교 복식학급 운영 도움자료」(2025) 부분통합 모형.
옮긴 코드와 라이선스: `THIRD_PARTY_NOTICES.md`, `LICENSES/`. 빌드 중 정한 것과 한계: `BUILD_NOTES.md`.

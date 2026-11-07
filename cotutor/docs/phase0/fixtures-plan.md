# fixture 녹화 계획과 현황

`npm run record:fixtures`(dry-run) / `-- --live --seed`(실제 녹화). 앱의 파이프라인 함수를 그대로 돌려 `fixtures/<route>/<sha256(route+PROMPT_VERSION+정규화 입력)>.json`에 저장하고, 라우트마다 마지막 녹화본을 `default.json`으로 복사한다. 프롬프트 원문·키는 저장하지 않는다.

| 라우트 | 입력 | 현황 | 출처 |
|---|---|---|---|
| planner | 3·4 사회 [4사01-02]+[4사05-02] 40분 | 녹화 | ollama-live (ax4-light) |
| filler (첫 초안) | 같은 입력 | 녹화 후 R10 위반 1건 주입 | ollama-live+hand-edit |
| filler (수리) | 위반 목록 포함 | 녹화 | ollama-live |
| cluster | 시드 질문 12개 | 녹화 | ollama-live (qwen3:4b) |
| nextCards | 위 군집 | 녹화 | ollama-live (ax4-light) |
| blockCard | (S2 카드 만들기) | 없음 → rules 템플릿 | rules |
| Claude 녹화 | 같은 목록 | 키가 없어 하지 않음 | — |

다시 녹화할 때 남는 옛 해시 파일은 사람이 지운다(같은 입력이라도 모델 출력이 달라 filler 해시가 바뀐다).

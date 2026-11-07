# API 확인 기록

## Ollama (2026-11-06, Windows 호스트 GPU, WSL에서 http://172.20.32.1:11434)
- `/api/chat` + `format`(zod → `z.toJSONSchema`, `$schema` 제거) + `stream:false`: ax4-light·qwen3:4b 모두 스키마를 지키는 JSON을 냈다. 성취기준 코드는 `z.string()`으로 받고 R10으로 검사한다(정규식 알터네이션은 format에 넣지 않음).
- 첫 호출 모델 로딩 약 7.6초, 이후 계획 3.5~9초, 채움 14~16초, 군집 4~10초, 다음 차시 카드 18~21초(BUILD_NOTES §3).
- 구조화 실패 시 1회 수리 호출 경로는 구현했으나 이번 녹화에서는 실패가 없어 실제로 타지 않았다.

## Claude (미확인)
ANTHROPIC_API_KEY가 없어 아래를 확인하지 못했다. 키가 생기면 `LLM_PROVIDER=anthropic AI_MODE=live`로 확인하고 여기에 적는다.
- [ ] 구조화 출력에서 StdCode 정규식 알터네이션 허용 여부(현재는 z.string() 경로라 영향 없음)
- [ ] Sonnet 5.5 effort low 지연 5회 p50/p95
- [ ] 두 번째 호출부터 `usage.cache_read_input_tokens` > 0 (system 블록 cache_control)
- [ ] `fallbacks:'default'` + `server-side-fallback-2026-07-01` 수용 여부

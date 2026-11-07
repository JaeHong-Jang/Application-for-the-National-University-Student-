# 스키마 요약 (`shared/contracts.ts`, zod 4)

도메인 스키마는 앱 내부 검증용, LLM 출력 스키마는 구조화 출력용으로 나눈다. LLM 출력 스키마에는 `.min/.max/.length`·재귀·optional이 없고 성취기준 코드는 `z.string()`(R10이 검사).

| 스키마 | 주요 필드 | 비고 |
|---|---|---|
| Lesson | gradeA<gradeB, subject, units{A,B}, pairType, lessonType, method, durationMin, hasAssistant, commonTheme, standards[], segments[], blocks[], assessment[], status, aiMeta, edits[], previousLessonId | aiMeta에 sources·flaggedBlockIds·checkLog 추가(BUILD_NOTES §4-7) |
| Segment | id, kind(JOINT_INTRO/SPLIT/JOINT_WRAP), startMin, endMin | 골격이 고정 |
| TimelineBlock | id, segmentId, lane(A/B/ALL), startMin, endMin, mode(JOINT/DIRECT/INDIRECT), phase, activity, materials[], noise, card\|null, standardCodes[] | 시간·id·lane·mode는 코드가 정함 |
| IndirectCard | withWhom(혼자/짝/모둠), steps[2~5], doneSignal, ifStuck, output, guideRole, physicalRisk\|null | R4 |
| Assessment | lane, code, excellent(◎), good(○), needsSupport(△), method | |
| StudentResponse | id, sessionCode, grade, kind, promptId, text(마스킹), rawText(교사만), piiFlags[], safety, clientId, createdAt | |
| Cluster | id, sessionCode, label, criteria, lane, linkedCode\|null, type, questionIds[], representativeId, teacherEdited | |
| NextLessonCard | id, lessonId, lane, kind(보충/심화), title, targetCode, targetLevel(A/B/C), basedOnClusterIds[], minutes, card, teacherNote, status | teacherNote는 학생판에서 제거 |
| Violation | rule(R1~R12), severity, blockIds[], range\|null, message(한국어 한 문장) | |
| PlannerOut / FillerOut / ClusterOut / NextCardsOut / CriticOut | 명세 §5와 같음 | FillerOut에는 시간 필드 없음 |

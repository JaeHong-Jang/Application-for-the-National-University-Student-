// 평가 스크립트(부분 구현): 12시나리오에 앱 파이프라인을 그대로 돌려 M1·M2를 계산한다.
// npm run eval -- --mode rules|replay|live
// - M1 코드 환각률: 출력 전체에서 성취기준 코드를 뽑아 인덱스에 없거나 학년군이 틀린 비율(결정적)
// - M2 타임라인 위반: 첫 검사(수리 전)와 최종(수리 후) error 수
// - 기준선(범용 챗봇)·M3(Judge 루브릭)·M4(교사 수정률)는 아직 구현하지 않음 → 보고서에 "측정 예정"
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const mode = args[args.indexOf('--mode') + 1] ?? 'rules';
process.env.AI_MODE = ['live', 'replay', 'rules'].includes(mode) ? mode : 'rules';

const { generateLesson } = await import('../server/ai/pipeline/lesson.js');
const { lookup } = await import('../server/standards.js');
const { checkLesson, errorsOf } = await import('../shared/check/timeline.js');
const { band } = await import('../shared/check/standards.js');
const { status } = await import('../server/ai/llm.js');

type Scenario = { id: string; pairType: string; gradeA: number; gradeB: number; subject: string; units: { A: string | null; B: string | null }; durationMin: number; hasAssistant: boolean };
const { scenarios } = JSON.parse(readFileSync('eval/scenarios.json', 'utf8')) as { scenarios: Scenario[] };
const CODE_RE = /\[?([246](?:국|수|사|과|영|도|실|미|음|체|바|슬|즐)\d{2}-\d{2})\]?/g;

const rows = [];
for (const s of scenarios) {
  const t0 = Date.now();
  const lesson = await generateLesson(s, () => undefined);
  const text = JSON.stringify({ standards: lesson.standards, blocks: lesson.blocks, assessment: lesson.assessment });
  const codes = [...text.matchAll(CODE_RE)].map((m) => m[1]);
  const bands = new Set([band(lesson.gradeA), band(lesson.gradeB)]);
  const bad = codes.filter((c) => !lookup(c) || !bands.has(lookup(c)!.band));
  const finalErr = errorsOf(checkLesson(lesson, { lookup })).length;
  rows.push({
    id: s.id,
    pair: `${s.gradeA}·${s.gradeB} ${s.subject}`,
    pairType: s.pairType,
    ms: Date.now() - t0,
    codes: codes.length,
    m1: codes.length ? bad.length / codes.length : 0,
    firstErrors: lesson.aiMeta.checkLog[0]?.errors ?? [],
    repairs: lesson.aiMeta.repairs,
    finalErrors: finalErr,
    flagged: lesson.aiMeta.flaggedBlockIds.length,
    sources: [...new Set(lesson.aiMeta.sources.map((x) => x.origin))].join(', '),
  });
  console.log(`${s.id} ${s.gradeA}·${s.gradeB} ${s.subject}: M1 ${bad.length}/${codes.length}, 첫 검사 error ${rows.at(-1)!.firstErrors.join(',') || 0}, 수리 ${lesson.aiMeta.repairs}, 최종 error ${finalErr} (${Date.now() - t0}ms)`);
}

const avg = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0) / rows.length;
const report = `# 평가 보고서 (부분)

- 실행: ${new Date().toISOString()} · AI_MODE=${status.mode} · 공급자 ${status.provider} · 수업 모델 ${status.models.lesson}
- 한계: 파일럿 측정, 시나리오 12개, 교사 채점자 0명. 기준선(범용 챗봇)·M3·M4는 **측정 예정**.
- rules 모드 결과는 결정적 템플릿이라 "검사기·골격이 보장하는 하한"을 보여 줄 뿐 AI 품질 지표가 아니다.

| 시나리오 | 학년·교과 | 쌍 | M1 코드 오류 | 첫 검사 error | 수리 | 최종 error | 교사 확인 필요 블록 | 출처 | ms |
|---|---|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.id} | ${r.pair} | ${r.pairType} | ${(r.m1 * 100).toFixed(0)}% (${r.codes}개 중) | ${r.firstErrors.join(', ') || '0'} | ${r.repairs} | ${r.finalErrors} | ${r.flagged} | ${r.sources} | ${r.ms} |`).join('\n')}

**평균**: M1 ${(avg((r) => r.m1) * 100).toFixed(1)}% · 첫 검사 error 있는 시나리오 ${rows.filter((r) => r.firstErrors.length).length}/12 · 최종 error 합 ${rows.reduce((a, r) => a + r.finalErrors, 0)} · 평균 ${Math.round(avg((r) => r.ms))}ms

| 지표 | 상태 |
|---|---|
| M1 코드 환각률(우리) | 위 표 |
| M1 기준선 | 측정 예정(범용 챗봇 출력 필요) |
| M2 타임라인 위반 | 위 표(우리: 수리 전/후). 기준선은 측정 예정 |
| M3 루브릭(Judge) | 측정 예정 |
| M4 교사 수정률 | 파일럿 데이터 없음 → 측정 예정 |
`;
writeFileSync(`eval/REPORT${mode === 'rules' ? '' : `.${mode}`}.md`, report);
writeFileSync(`eval/results${mode === 'rules' ? '' : `.${mode}`}.json`, JSON.stringify(rows, null, 1));
console.log('eval/REPORT 작성');

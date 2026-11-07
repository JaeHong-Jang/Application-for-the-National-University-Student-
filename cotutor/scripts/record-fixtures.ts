// fixture 녹화 (TTA-Service scripts/record-fixtures.mjs 방식)
// npm run record:fixtures            → dry-run: 무엇을 녹화할지 목록만
// npm run record:fixtures -- --live  → 앱이 쓰는 파이프라인 함수를 그대로 돌려 fixtures/<route>/<hash>.json 저장
//   --no-inject  첫 채움 초안에 수리 장면용 위반을 넣지 않는다
//   --seed       결과 수업을 data/seed/lesson.seed.json으로 저장
import { copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const live = args.includes('--live');
const DEMO = { gradeA: 3, gradeB: 4, subject: '사회', units: { A: '우리가 사는 곳 - 더 살기 좋은 곳 만들기', B: '지도로 만나는 우리 지역 - 지도에서 우리 지역 찾기' }, durationMin: 40, hasAssistant: false };

const PLAN = [
  'planner   : 3·4학년 사회 [4사01-02]+[4사05-02] 40분 (MODEL_LESSON)',
  'filler    : 같은 입력, 첫 초안 (+ 수리 장면용 위반 1건 주입, 출처 표시 ollama-live+hand-edit)',
  'filler    : 위반 목록을 넣은 수리 호출',
  'cluster   : 시드 질문 12개 (MODEL_CLUSTER)',
  'nextCards : 위 군집 기반 학년별 보충·심화 카드',
];

if (!live) {
  console.log('[dry-run] 녹화할 라우트·입력:');
  PLAN.forEach((p) => console.log('  -', p));
  console.log('실제로 녹화하려면: npm run record:fixtures -- --live');
  process.exit(0);
}

process.env.AI_MODE = 'live';
process.env.RECORD_FIXTURES = '1';
process.env.DATA_DIR = process.env.DATA_DIR ?? 'var/record';

const { generateLesson } = await import('../server/ai/pipeline/lesson.js');
const { clusterResponses } = await import('../server/ai/pipeline/cluster.js');
const { generateNextCards } = await import('../server/ai/pipeline/nextCards.js');
const { saveFixture } = await import('../server/ai/fixtures.js');
const { healthCheck, status, modelOf } = await import('../server/ai/llm.js');
const { maskPII, hasSafetySignal } = await import('../shared/check/pii.js');
const { seedQuestions } = await import('../server/demo/fakeStudents.js');
const { FIXTURE_DIR } = await import('../server/paths.js');

await healthCheck();
console.log(`provider=${status.provider} base=${status.baseUrl} reachable=${status.reachable} lesson=${modelOf('lesson')} cluster=${modelOf('cluster')}`);
if (!status.reachable) throw new Error(`공급자에 닿지 않습니다: ${status.lastError}`);

// ---- 수업 ----
const t0 = Date.now();
const lesson = await generateLesson(
  DEMO,
  (step, st, detail) => console.log(`  [${step}] ${st} ${detail}`),
  {
    afterFirstFill: (out, hashInput) => {
      if (args.includes('--no-inject')) return out;
      // 수리 장면용: 4학년 간접지도 블록 하나에 교육과정에 없는 코드를 넣는다(LLM 코드 환각 재현)
      const target = out.blocks.find((b) => b.id === 'B1') ?? out.blocks[0];
      const injected = { ...out, blocks: out.blocks.map((b) => (b === target ? { ...b, standardCodes: ['4사05-07'] } : b)) };
      saveFixture('filler', hashInput, injected, {
        origin: 'ollama-live+hand-edit',
        provider: status.provider,
        model: modelOf('lesson'),
        extra: null,
        originNote: `Ollama 녹화 초안에 수리 장면용 R10 위반(블록 ${target.id}에 없는 코드 [4사05-07])을 수작업으로 넣음`,
      });
      return injected;
    },
  },
);
console.log(`lesson done in ${Date.now() - t0}ms, repairs=${lesson.aiMeta.repairs}, fixed=${lesson.aiMeta.violationsFixed.join(',')}, flagged=${lesson.aiMeta.flaggedBlockIds.join(',')}`);
console.log('sources:', lesson.aiMeta.sources.map((s) => `${s.step}:${s.origin}:${s.ms}ms`).join(' | '));

if (args.includes('--seed')) {
  writeFileSync('data/seed/lesson.seed.json', JSON.stringify({ ...lesson, id: 'L-seed-demo' }, null, 1));
  console.log('data/seed/lesson.seed.json 저장');
}

// ---- 군집 ----
const base = Date.parse('2026-11-18T10:00:00Z');
const responses = seedQuestions().map((q, i) => {
  const m = maskPII(q.text);
  return {
    id: `R-seed-${i + 1}`,
    sessionCode: 'DEMO',
    grade: q.lane === 'A' ? lesson.gradeA : lesson.gradeB,
    kind: 'question' as const,
    promptId: null,
    text: m.text,
    rawText: q.text,
    piiFlags: m.flags,
    safety: hasSafetySignal(q.text),
    clientId: `seed-${i + 1}`,
    createdAt: new Date(base + i * 1000).toISOString(),
  };
});
const t1 = Date.now();
const c = await clusterResponses('DEMO', lesson, responses);
console.log(`cluster done in ${Date.now() - t1}ms via ${c.run.source.origin}: ${c.clusters.length} clusters, unclustered ${c.run.unclustered.length}, removed: ${c.run.removed.join('; ')}`);
c.clusters.forEach((x) => console.log(`   ${x.lane} ${x.type} (${x.questionIds.length}) ${x.label}`));

// ---- 다음 차시 ----
const t2 = Date.now();
const n = await generateNextCards(lesson, c.clusters, responses);
console.log(`nextCards done in ${Date.now() - t2}ms via ${n.source.origin}; removed: ${n.removed.join('; ')}`);
n.cards.forEach((x) => console.log(`   ${x.lane} ${x.kind} ${x.title} [${x.targetCode}] ${x.targetLevel}`));

// 각 라우트 기본 fixture(default.json) = 이번에 가장 늦게 녹화된 파일(입력 해시가 안 맞을 때 쓰는 대체본)
for (const route of ['planner', 'filler', 'cluster', 'nextCards']) {
  const dir = join(FIXTURE_DIR, route);
  if (!existsSync(dir)) continue;
  const newest = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'default.json')
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (newest) copyFileSync(join(dir, newest.f), join(dir, 'default.json'));
}
console.log('녹화 완료');

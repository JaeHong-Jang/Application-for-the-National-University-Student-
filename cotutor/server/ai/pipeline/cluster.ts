// ⑦~⑨ 질문 → 필터 → Clusterer(1회 호출) → 코드 검사
import { randomUUID } from 'node:crypto';
import { ClusterOut, type Cluster, type ClusterRun, type Lesson, type StudentResponse } from '../../../shared/contracts.js';
import { runAI } from '../llm.js';
import type { FixtureFile } from '../fixtures.js';
import { CLUSTER_SYSTEM, clusterUser } from '../prompts/cluster.js';
import { clusterRules, jaccard } from '../rules/index.js';

type Q = { qid: string; id: string; lane: 'A' | 'B'; text: string };

export function laneCodes(lesson: Lesson) {
  return {
    A: lesson.standards.filter((s) => s.lane !== 'B').map((s) => s.code),
    B: lesson.standards.filter((s) => s.lane !== 'A').map((s) => s.code),
  };
}

/** fixture의 질문 id(q1..)를 지금 질문으로 옮긴다: 같은 텍스트 → 같은 학년에서 가장 비슷한 텍스트 */
export function adaptClusterFixture(f: FixtureFile, qs: Q[]): ClusterOut | null {
  const out = ClusterOut.safeParse(f.output);
  const texts = (f.extra as { qTexts?: Record<string, string> } | null)?.qTexts;
  if (!out.success || !texts) return null;
  const map = new Map<string, string>();
  const used = new Set<string>();
  for (const [fq, key] of Object.entries(texts)) {
    const [lane, ...rest] = key.split('|');
    const text = rest.join('|');
    const same = qs.find((q) => !used.has(q.qid) && q.lane === lane && q.text === text);
    const near = same ?? qs.filter((q) => !used.has(q.qid) && q.lane === lane).map((q) => ({ q, s: jaccard(q.text, text) })).filter((x) => x.s >= 0.3).sort((a, b) => b.s - a.s)[0]?.q;
    if (near) map.set(fq, near.qid), used.add(near.qid);
  }
  const clusters = out.data.clusters
    .map((c) => {
      const ids = c.questionIds.map((x) => map.get(x)).filter((x): x is string => Boolean(x));
      return { ...c, questionIds: ids, representativeId: map.get(c.representativeId) ?? ids[0] ?? '' };
    })
    .filter((c) => c.questionIds.length);
  // 새 질문(녹화에 없던 것)은 같은 학년의 가장 비슷한 군집으로, 없으면 미분류
  const unclustered = out.data.unclustered.map((x) => map.get(x)).filter((x): x is string => Boolean(x));
  for (const q of qs.filter((x) => !used.has(x.qid))) {
    const best = clusters
      .filter((c) => c.lane === q.lane)
      .map((c) => ({ c, s: Math.max(...c.questionIds.map((id) => jaccard(qs.find((x) => x.qid === id)?.text ?? '', q.text))) }))
      .sort((a, b) => b.s - a.s)[0];
    if (best && best.s >= 0.15) best.c.questionIds.push(q.qid);
    else unclustered.push(q.qid);
  }
  return { clusters, flags: out.data.flags.map((x) => ({ ...x, questionId: map.get(x.questionId) ?? '' })).filter((x) => x.questionId), unclustered };
}

/** 코드 검사: 없는 id, 중복 소속, 학년 불일치, 이번 차시 밖 코드, SAFETY 질문을 걸러 미분류로 */
export function validateClusters(out: ClusterOut, qs: Q[], codes: { A: string[]; B: string[] }) {
  const removed: string[] = [];
  const byQid = new Map(qs.map((q) => [q.qid, q]));
  const safety = new Set(out.flags.filter((f) => f.kind === 'SAFETY').map((f) => f.questionId));
  const seen = new Set<string>();
  const clusters = out.clusters
    .map((c) => {
      const lane = c.lane === 'ALL' ? (byQid.get(c.questionIds[0])?.lane ?? 'A') : c.lane;
      const ids = c.questionIds.filter((id) => {
        const q = byQid.get(id);
        if (!q) return removed.push(`없는 질문 id ${id} 제거`), false;
        if (safety.has(id)) return removed.push(`SAFETY 질문 ${id} 군집에서 제외`), false;
        if (seen.has(id)) return removed.push(`중복 소속 ${id} 제거`), false;
        if (q.lane !== lane) return removed.push(`학년이 다른 질문 ${id} 제거`), false;
        seen.add(id);
        return true;
      });
      let linked = c.linkedCode && c.linkedCode !== 'null' ? c.linkedCode.replace(/[[\]\s]/g, '') : null;
      if (linked && !codes[lane as 'A' | 'B'].includes(linked)) {
        removed.push(`이번 차시 밖 코드 [${linked}] → 연결 없음`);
        linked = null;
      }
      return { ...c, lane, questionIds: ids, linkedCode: linked, representativeId: ids.includes(c.representativeId) ? c.representativeId : (ids[0] ?? '') };
    })
    .filter((c) => c.questionIds.length);
  const unclustered = qs.map((q) => q.qid).filter((id) => !seen.has(id) && !safety.has(id));
  return { clusters, unclustered, flags: out.flags.filter((f) => byQid.has(f.questionId)), removed };
}

export async function clusterResponses(sessionCode: string, lesson: Lesson, responses: StudentResponse[]): Promise<{ clusters: Cluster[]; run: ClusterRun }> {
  const questions = responses.filter((r) => r.kind === 'question').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // 위기 신호는 AI에 보내지 않는다(코드 사전 플래그)
  const sent = questions.filter((r) => !r.safety);
  const qs: Q[] = sent.map((r, i) => ({ qid: `q${i + 1}`, id: r.id, lane: r.grade === lesson.gradeA ? 'A' : 'B', text: r.text }));
  const codes = laneCodes(lesson);
  const gradeOf = (l: 'A' | 'B') => (l === 'A' ? lesson.gradeA : lesson.gradeB);
  const user = clusterUser({
    lessonCodes: `A(${lesson.gradeA}학년): ${codes.A.join(', ')} / B(${lesson.gradeB}학년): ${codes.B.join(', ')}`,
    questions: qs.map((q) => `${q.qid} [${q.lane}·${gradeOf(q.lane)}학년] ${q.text}`).join('\n'),
  });
  const qTexts = Object.fromEntries(qs.map((q) => [q.qid, `${q.lane}|${q.text}`]));
  const res = await runAI({
    route: 'cluster',
    role: 'cluster',
    system: CLUSTER_SYSTEM,
    user,
    schema: ClusterOut,
    hashInput: { codes, qs: qs.map((q) => `${q.lane}|${q.text}`) },
    rules: () => clusterRules(qs.map((q) => ({ id: q.qid, lane: q.lane, text: q.text })), codes),
    adapt: (f) => adaptClusterFixture(f, qs),
    extra: { qTexts },
  });
  const v = validateClusters(res.out, qs, codes);
  const realId = (qid: string) => qs.find((q) => q.qid === qid)!.id;
  const clusters: Cluster[] = v.clusters.map((c) => ({
    id: `C-${randomUUID().slice(0, 6)}`,
    sessionCode,
    label: c.label,
    criteria: c.criteria,
    lane: c.lane as 'A' | 'B',
    linkedCode: c.linkedCode,
    type: c.type,
    questionIds: c.questionIds.map(realId),
    representativeId: realId(c.representativeId),
    teacherEdited: false,
  }));
  const safetyFlags = questions.filter((r) => r.safety).map((r) => ({ questionId: r.id, kind: 'SAFETY' as const }));
  const run: ClusterRun = {
    sessionCode,
    flags: [...safetyFlags, ...v.flags.map((f) => ({ ...f, questionId: realId(f.questionId) }))],
    unclustered: v.unclustered.map(realId),
    source: res.source,
    at: new Date().toISOString(),
    removed: v.removed,
  };
  return { clusters, run };
}

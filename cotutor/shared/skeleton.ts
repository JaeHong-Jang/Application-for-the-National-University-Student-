// 지도방법별 골격 템플릿. 시간 구성은 코드가 고정하고, AI는 내용만 채운다.
// D=40 기준(충북 매뉴얼 예시). 다른 D는 비율로 조정하고 5분 단위로 반올림한다.
import type { Lane, Method, Mode, Segment, TimelineBlock } from './contracts.js';

const r5 = (x: number) => Math.round(x / 5) * 5;

type Spec = { id: string; seg: string; lane: Lane; mode: Mode; s: number; e: number };

function blank(x: Spec, D: number): TimelineBlock {
  const phase = x.mode === 'JOINT' ? (x.s === 0 ? '도입' : '정리') : '전개';
  void D;
  return { id: x.id, segmentId: x.seg, lane: x.lane, startMin: x.s, endMin: x.e, mode: x.mode, phase, activity: '', materials: [], noise: 'normal', card: null, standardCodes: [] };
}

export function buildSkeleton(method: Method, D: number): { segments: Segment[]; blocks: TimelineBlock[] } {
  if (method === '부분통합') {
    const intro = D === 40 ? 7 : Math.max(5, r5((D * 7) / 40));
    const mid = D - 2 * intro;
    const half = D === 40 ? 13 : r5(mid / 2);
    const a = intro;
    const b = intro + half;
    const c = D - intro;
    const segments: Segment[] = [
      { id: 'S1', kind: 'JOINT_INTRO', startMin: 0, endMin: a },
      { id: 'S2', kind: 'SPLIT', startMin: a, endMin: c },
      { id: 'S3', kind: 'JOINT_WRAP', startMin: c, endMin: D },
    ];
    const specs: Spec[] = [
      { id: 'J1', seg: 'S1', lane: 'ALL', mode: 'JOINT', s: 0, e: a },
      { id: 'A1', seg: 'S2', lane: 'A', mode: 'DIRECT', s: a, e: b },
      { id: 'B1', seg: 'S2', lane: 'B', mode: 'INDIRECT', s: a, e: b },
      { id: 'A2', seg: 'S2', lane: 'A', mode: 'INDIRECT', s: b, e: c },
      { id: 'B2', seg: 'S2', lane: 'B', mode: 'DIRECT', s: b, e: c },
      { id: 'J2', seg: 'S3', lane: 'ALL', mode: 'JOINT', s: c, e: D },
    ];
    return { segments, blocks: specs.map((x) => blank(x, D)) };
  }
  if (method === '분리') {
    const h = r5(D / 2);
    const segments: Segment[] = [{ id: 'S1', kind: 'SPLIT', startMin: 0, endMin: D }];
    const specs: Spec[] = [
      { id: 'A1', seg: 'S1', lane: 'A', mode: 'DIRECT', s: 0, e: h },
      { id: 'B1', seg: 'S1', lane: 'B', mode: 'INDIRECT', s: 0, e: h },
      { id: 'A2', seg: 'S1', lane: 'A', mode: 'INDIRECT', s: h, e: D },
      { id: 'B2', seg: 'S1', lane: 'B', mode: 'DIRECT', s: h, e: D },
    ];
    return { segments, blocks: specs.map((x) => blank(x, D)) };
  }
  // 시간차: A ■□■□ / B □■□■
  const q = D === 40 ? [8, 20, 28] : [r5((D * 8) / 40), r5(D / 2), r5((D * 28) / 40)];
  const t = [0, ...q, D];
  const segments: Segment[] = [{ id: 'S1', kind: 'SPLIT', startMin: 0, endMin: D }];
  const specs: Spec[] = [];
  for (let i = 0; i < 4; i++) {
    specs.push({ id: `A${i + 1}`, seg: 'S1', lane: 'A', mode: i % 2 === 0 ? 'DIRECT' : 'INDIRECT', s: t[i], e: t[i + 1] });
    specs.push({ id: `B${i + 1}`, seg: 'S1', lane: 'B', mode: i % 2 === 0 ? 'INDIRECT' : 'DIRECT', s: t[i], e: t[i + 1] });
  }
  return { segments, blocks: specs.map((x) => blank(x, D)) };
}

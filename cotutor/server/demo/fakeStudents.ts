// 가상 학생: 시드 질문 12개를 0.5~1.5초 간격으로 보낸다(윤슬 sim/customers.ts 패턴)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from '../paths.js';

export interface SeedQuestion { lane: 'A' | 'B'; text: string }
export const seedQuestions = (): SeedQuestion[] => (JSON.parse(readFileSync(join(DATA_DIR, 'seed', 'questions.seed.json'), 'utf8')) as { questions: SeedQuestion[] }).questions;

const running = new Set<string>();

export function sendFakeStudents(code: string, submit: (q: SeedQuestion, clientId: string) => void, opts: { minMs?: number; maxMs?: number } = {}): boolean {
  if (running.has(code)) return false;
  running.add(code);
  const qs = seedQuestions();
  const min = opts.minMs ?? 500;
  const max = opts.maxMs ?? 1500;
  let i = 0;
  const next = () => {
    if (i >= qs.length) return void running.delete(code);
    const q = qs[i];
    submit(q, `fake-${code}-${i + 1}`);
    i++;
    setTimeout(next, min + Math.random() * (max - min));
  };
  setTimeout(next, 200);
  return true;
}

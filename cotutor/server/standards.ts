// 성취기준 인덱스(611건) + 데모 대조본(textVerified) 겹치기
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { StandardEntry } from '../shared/contracts.js';
import { band } from '../shared/check/standards.js';
import { DATA_DIR } from './paths.js';

const index = JSON.parse(readFileSync(join(DATA_DIR, 'standards.index.json'), 'utf8')) as StandardEntry[];
const demoFile = join(DATA_DIR, 'standards.demo.json');
const demo = existsSync(demoFile) ? (JSON.parse(readFileSync(demoFile, 'utf8')) as StandardEntry[]) : [];
const byCode = new Map(index.map((s) => [s.code, s]));
for (const d of demo) byCode.set(d.code, { ...byCode.get(d.code)!, ...d });

export const getStandard = (code: string) => byCode.get(code);
export const lookup = (code: string) => byCode.get(code);
export const allStandards = () => [...byCode.values()];

/** 교과 × 두 학년의 학년군에 맞는 성취기준 */
export function standardsFor(subject: string, gradeA: number, gradeB: number): StandardEntry[] {
  const bands = new Set([band(gradeA), band(gradeB)]);
  return allStandards().filter((s) => s.subject === subject && bands.has(s.band));
}

export const SUBJECTS = [...new Set(index.map((s) => s.subject))];

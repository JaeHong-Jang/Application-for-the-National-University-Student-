// data/units.demo.csv (단원명 ↔ 성취기준 코드 예시 매핑)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './paths.js';

export interface UnitRow { grade: number; subject: string; semester: number; unit: string; lesson: string; codes: string[]; month: number; note: string }

export const units: UnitRow[] = readFileSync(join(DATA_DIR, 'units.demo.csv'), 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => {
    const [grade, subject, semester, unit, lesson, codes, month, note] = line.split(',');
    return { grade: +grade, subject, semester: +semester, unit, lesson, codes: codes.split(';'), month: +month, note };
  });

/** "우리가 사는 곳 - 더 살기 좋은 곳 만들기" 같은 표시 이름 */
export const unitLabel = (u: UnitRow) => `${u.unit} - ${u.lesson}`;
export const findUnit = (grade: number, subject: string, label: string | null) =>
  label ? units.find((u) => u.grade === grade && u.subject === subject && unitLabel(u) === label) : undefined;

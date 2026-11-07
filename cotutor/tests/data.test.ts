import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const index = JSON.parse(readFileSync('data/standards.index.json', 'utf8')) as { code: string; textVerified: boolean }[];
const demo = JSON.parse(readFileSync('data/standards.demo.json', 'utf8')) as { code: string; textVerified: boolean }[];

describe('성취기준 데이터', () => {
  it('611건, 코드 중복 0', () => {
    expect(index).toHaveLength(611);
    expect(new Set(index.map((s) => s.code)).size).toBe(611);
  });
  it('데모 코드(4사01-*, 4사05-*, 4수01-*) 전부 NCIC 대조 완료', () => {
    for (const c of ['4사01-02', '4사05-02', '4수01-03']) expect(demo.find((d) => d.code === c)?.textVerified).toBe(true);
    expect(demo.every((d) => d.textVerified)).toBe(true);
  });
  it('units.demo.csv의 코드는 모두 인덱스에 있다', () => {
    const codes = new Set(index.map((s) => s.code));
    const rows = readFileSync('data/units.demo.csv', 'utf8').trim().split('\n').slice(1);
    for (const r of rows) for (const c of r.split(',')[5].split(';')) expect(codes.has(c)).toBe(true);
  });
  it('평가 시나리오 12개', () => {
    const s = JSON.parse(readFileSync('eval/scenarios.json', 'utf8'));
    expect(s.scenarios).toHaveLength(12);
  });
  it('.gitignore에 .env', () => expect(readFileSync('.gitignore', 'utf8')).toContain('.env'));
});

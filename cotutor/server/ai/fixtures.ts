// replay fixture 조회·녹화 (TTA-Service llm.ts 패턴을 입력 해시 키로 바꿈)
// fixtures/<route>/<sha256(route+PROMPT_VERSION+정규화 입력)>.json, 없으면 fixtures/<route>/default.json
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE_DIR } from '../paths.js';
import { PROMPT_VERSION } from './prompts/version.js';

export interface FixtureFile {
  route: string;
  hash: string;
  promptVersion: string;
  /** 'ollama-live' | 'anthropic-live' | 'hand-authored' | 'ollama-live+hand-edit' */
  origin: string;
  originNote: string | null;
  recordedWith: { provider: string; model: string | null; at: string; promptVersion: string };
  extra: unknown;
  output: unknown;
}

/** 키 순서를 고정한 JSON(같은 입력 → 같은 해시) */
export function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object')
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  return JSON.stringify(v ?? null);
}

export const fixtureHash = (route: string, input: unknown) => createHash('sha256').update(`${route}\n${PROMPT_VERSION}\n${stable(input)}`).digest('hex').slice(0, 24);

export function findFixture(route: string, input: unknown): { file: FixtureFile; exact: boolean } | null {
  const dir = join(FIXTURE_DIR, route);
  const exact = join(dir, `${fixtureHash(route, input)}.json`);
  if (existsSync(exact)) return { file: JSON.parse(readFileSync(exact, 'utf8')), exact: true };
  const def = join(dir, 'default.json');
  if (existsSync(def)) return { file: JSON.parse(readFileSync(def, 'utf8')), exact: false };
  return null;
}

export function saveFixture(
  route: string,
  input: unknown,
  output: unknown,
  meta: { origin: string; provider: string; model: string | null; extra: unknown; originNote?: string | null; asDefault?: boolean },
): string {
  const dir = join(FIXTURE_DIR, route);
  mkdirSync(dir, { recursive: true });
  const hash = fixtureHash(route, input);
  const file: FixtureFile = {
    route,
    hash,
    promptVersion: PROMPT_VERSION,
    origin: meta.origin,
    originNote: meta.originNote ?? null,
    recordedWith: { provider: meta.provider, model: meta.model, at: new Date().toISOString(), promptVersion: PROMPT_VERSION },
    extra: meta.extra,
    output,
  };
  const path = join(dir, `${meta.asDefault ? 'default' : hash}.json`);
  writeFileSync(path, JSON.stringify(file, null, 1));
  return path;
}

/** 화면 하단 표시용: 지금 가진 fixture의 출처 종류 */
export function fixtureOrigins(): string[] {
  if (!existsSync(FIXTURE_DIR)) return [];
  const out = new Set<string>();
  for (const route of readdirSync(FIXTURE_DIR)) {
    const dir = join(FIXTURE_DIR, route);
    try {
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) out.add((JSON.parse(readFileSync(join(dir, f), 'utf8')) as FixtureFile).origin);
    } catch {
      /* 파일 아님 */
    }
  }
  return [...out];
}

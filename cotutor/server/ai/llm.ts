// LLM 호출 지점 하나(윤슬 harness/llm.ts에서 옮겨 고침).
// 공급자: LLM_PROVIDER=ollama(기본, 로컬 모델) | anthropic(Claude, 운영 목표)
// 모드: AI_MODE=live(기본) | replay | rules. live 실패·시간초과·스키마 불일치면 replay fixture → rules로 내려간다.
// 로그에는 프롬프트·원문 응답을 남기지 않는다(소요 시간·토큰 수만).
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { AiSource, AiStatus } from '../../shared/contracts.js';
import { findFixture, saveFixture, type FixtureFile } from './fixtures.js';
import { PROMPT_VERSION } from './prompts/version.js';

export type ModelRole = 'lesson' | 'cluster' | 'judge';
type Provider = 'ollama' | 'anthropic';

const provider: Provider = process.env.LLM_PROVIDER === 'anthropic' ? 'anthropic' : 'ollama';
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const requested = (process.env.AI_MODE ?? 'live') as AiStatus['mode'];
// Claude 경로인데 키가 없으면 자동으로 rules가 아니라 replay로 둔다(녹화본 → 규칙 순으로 내려가므로 결과는 같다)
const mode: AiStatus['mode'] = ['live', 'replay', 'rules'].includes(requested) ? (requested === 'live' && provider === 'anthropic' && !hasKey ? 'replay' : requested) : 'live';

const DEFAULT_MODELS: Record<Provider, Record<ModelRole, string>> = {
  ollama: { lesson: 'ax4-light:q4_K_M', cluster: 'qwen3:4b-instruct-2507-q4_K_M', judge: 'qwen2.5:7b' },
  anthropic: { lesson: 'claude-sonnet-5-5', cluster: 'claude-haiku-5-5', judge: 'claude-opus-5-5' },
};
const models: Record<ModelRole, string> = {
  lesson: process.env.MODEL_LESSON || DEFAULT_MODELS[provider].lesson,
  cluster: process.env.MODEL_CLUSTER || DEFAULT_MODELS[provider].cluster,
  judge: process.env.MODEL_JUDGE || DEFAULT_MODELS[provider].judge,
};
const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? (provider === 'ollama' ? 120_000 : 20_000));
const ollamaCandidates = [process.env.OLLAMA_BASE_URL || 'http://172.20.32.1:11434', 'http://localhost:11434'].map((u) => u.replace(/\/$/, ''));
let ollamaBase = ollamaCandidates[0];

const client = provider === 'anthropic' && hasKey ? new Anthropic() : null;

export const status: AiStatus = { mode, provider, models, baseUrl: provider === 'ollama' ? ollamaBase : null, reachable: null, lastError: null, fixtureOrigins: [] };

/** 시작 시 1회: 공급자에 닿는지 확인한다(모델 목록/짧은 호출) */
export async function healthCheck(): Promise<void> {
  if (mode !== 'live') return;
  if (provider === 'ollama') {
    for (const base of ollamaCandidates) {
      try {
        const r = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!r.ok) continue;
        const tags = (await r.json()) as { models?: { name: string }[] };
        ollamaBase = base;
        status.baseUrl = base;
        const names = new Set((tags.models ?? []).map((m) => m.name));
        const missing = Object.values(models).filter((m) => !names.has(m));
        status.reachable = true;
        status.lastError = missing.length ? `Ollama에 없는 모델: ${missing.join(', ')}` : null;
        return;
      } catch {
        /* 다음 후보 */
      }
    }
    status.reachable = false;
    status.lastError = `Ollama에 닿지 않음(${ollamaCandidates.join(', ')}) → 녹화 응답·규칙으로 대체`;
    return;
  }
  if (!client) return;
  try {
    const m = await client.models.retrieve(models.lesson);
    status.reachable = Boolean(m.id);
  } catch (err) {
    status.reachable = false;
    status.lastError = `health: ${(err as Error).message}`;
  }
}

function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

async function ollamaChat(model: string, messages: { role: string; content: string }[], schema: z.ZodType, signal: AbortSignal) {
  const res = await fetch(`${ollamaBase}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false, keep_alive: '30m', format: jsonSchemaOf(schema), options: { temperature: 0.2, num_ctx: 8192, num_predict: 3000 }, messages }),
    signal,
  });
  if (!res.ok) throw new Error(`Ollama ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { message?: { content?: string }; eval_count?: number; prompt_eval_count?: number };
  return { content: data.message?.content ?? '', evalCount: data.eval_count ?? 0, promptCount: data.prompt_eval_count ?? 0 };
}

const issuesText = (e: z.ZodError) => e.issues.slice(0, 8).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');

/** Ollama: JSON 스키마 format + zod 검증. 실패하면 zod 오류를 넣어 1회 수리 호출 */
async function askOllama<S extends z.ZodType>(route: string, model: string, system: string, user: string, schema: S): Promise<z.infer<S>> {
  const signal = AbortSignal.timeout(timeoutMs);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const t0 = Date.now();
  const first = await ollamaChat(model, messages, schema, signal);
  let parsed = safeJson(first.content);
  let r = schema.safeParse(parsed);
  console.log(`[llm] ${route} ollama ${model} ${Date.now() - t0}ms in=${first.promptCount} out=${first.evalCount} ok=${r.success}`);
  if (r.success) return r.data;
  const why = parsed === undefined ? 'JSON 파싱 실패' : issuesText(r.error);
  const t1 = Date.now();
  const second = await ollamaChat(
    model,
    [...messages, { role: 'assistant', content: first.content }, { role: 'user', content: `위 JSON이 스키마 검증에 실패했습니다: ${why}\n같은 내용으로 스키마에 맞는 JSON 전체를 다시 출력하세요.` }],
    schema,
    signal,
  );
  parsed = safeJson(second.content);
  r = schema.safeParse(parsed);
  console.log(`[llm] ${route} ollama repair ${Date.now() - t1}ms ok=${r.success}`);
  if (r.success) return r.data;
  throw new Error(`스키마 불일치(수리 1회 후): ${parsed === undefined ? 'JSON 파싱 실패' : issuesText(r.error)}`);
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

/** Claude: 구조화 출력. Sonnet/Opus 5.5에만 server-side fallback을 붙인다(Haiku 5.5는 없음). thinking·temperature·prefill·강제 tool_choice는 보내지 않는다 */
async function askAnthropic<S extends z.ZodType>(route: string, role: ModelRole, system: string, user: string, schema: S, effort: 'low' | 'medium' | 'high'): Promise<z.infer<S>> {
  if (!client) throw new Error('ANTHROPIC_API_KEY 없음');
  const model = models[role];
  const sys = [{ type: 'text' as const, text: system, cache_control: { type: 'ephemeral' as const } }];
  const t0 = Date.now();
  if (model.includes('haiku')) {
    const res = await client.messages.parse(
      { model, max_tokens: 16000, output_config: { effort, format: zodOutputFormat(schema) }, system: sys, messages: [{ role: 'user', content: user }] },
      { timeout: timeoutMs },
    );
    console.log(`[llm] ${route} ${model} ${Date.now() - t0}ms stop=${res.stop_reason} cache_read=${res.usage.cache_read_input_tokens ?? 0} out=${res.usage.output_tokens}`);
    if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') throw new Error(`stop_reason=${res.stop_reason}`);
    if (!res.parsed_output) throw new Error('구조화 출력 없음');
    return res.parsed_output as z.infer<S>;
  }
  const res = await client.beta.messages.parse(
    {
      model,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format: betaZodOutputFormat(schema) },
      system: sys,
      messages: [{ role: 'user', content: user }],
    },
    { timeout: timeoutMs },
  );
  console.log(`[llm] ${route} ${model} ${Date.now() - t0}ms stop=${res.stop_reason} cache_read=${res.usage.cache_read_input_tokens ?? 0} out=${res.usage.output_tokens}`);
  if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') throw new Error(`stop_reason=${res.stop_reason}`);
  if (!res.parsed_output) throw new Error('구조화 출력 없음');
  return res.parsed_output as z.infer<S>;
}

export interface RunOpts<S extends z.ZodType> {
  route: string;
  role: ModelRole;
  system: string;
  user: string;
  schema: S;
  effort?: 'low' | 'medium' | 'high';
  hashInput: unknown; // replay 키(정규화 입력)
  rules: () => z.infer<S>;
  /** fixture를 지금 입력에 맞게 옮긴다(질문 ID 재매핑 등). 없으면 그대로 */
  adapt?: (f: FixtureFile) => unknown;
  /** 녹화할 때 같이 남길 부가 정보(질문 원문 대신 마스킹 텍스트 등) */
  extra?: unknown;
  record?: boolean;
  /** 입력 해시가 정확히 맞는 fixture만 쓴다(수업 라우트: 다른 교과 내용이 섞이지 않게 기본 fixture 대신 rules) */
  exactOnly?: boolean;
}

export interface RunResult<T> {
  out: T;
  source: AiSource;
}

export async function runAI<S extends z.ZodType>(o: RunOpts<S>): Promise<RunResult<z.infer<S>>> {
  const t0 = Date.now();
  const src = (s: Omit<AiSource, 'ms' | 'step'>): AiSource => ({ step: o.route, ms: Date.now() - t0, ...s });
  let liveError: string | null = null;
  if (mode === 'live') {
    try {
      const out =
        provider === 'ollama'
          ? await askOllama(o.route, models[o.role], o.system, o.user, o.schema)
          : await askAnthropic(o.route, o.role, o.system, o.user, o.schema, o.effort ?? 'low');
      status.lastError = null;
      if (o.record || process.env.RECORD_FIXTURES === '1')
        saveFixture(o.route, o.hashInput, out, { origin: provider === 'ollama' ? 'ollama-live' : 'anthropic-live', provider, model: models[o.role], extra: o.extra ?? null });
      return { out, source: src({ mode: 'live', provider, model: models[o.role], origin: `live·${provider}`, note: null }) };
    } catch (err) {
      liveError = err instanceof Anthropic.APIError ? `API ${err.status} ${err.message}` : (err as Error).message;
      status.lastError = `${o.route}: ${liveError}`;
      console.error('[llm]', status.lastError);
    }
  }
  if (mode !== 'rules') {
    const f = findFixture(o.route, o.hashInput);
    if (f && (f.exact || !o.exactOnly)) {
      const candidate = o.adapt ? o.adapt(f.file) : f.file.output;
      const parsed = o.schema.safeParse(candidate);
      if (parsed.success) {
        const originKo = f.file.origin === 'hand-authored' ? '수작업 예시' : `${f.file.origin.startsWith('ollama') ? 'ollama 녹화' : 'Claude 녹화'}${f.file.origin.includes('hand-edit') ? '+위반 주입' : ''}`;
        return {
          out: parsed.data,
          source: src({
            mode: 'replay',
            provider: 'fixture',
            model: f.file.recordedWith.model,
            origin: `replay·${originKo}${f.exact ? '' : '(기본)'}`,
            note: [f.file.originNote, liveError ? `live 실패 후 대체: ${liveError}` : null].filter(Boolean).join(' / ') || null,
          }),
        };
      }
    }
  }
  return { out: o.rules(), source: src({ mode: 'rules', provider: 'rules', model: null, origin: 'rules', note: liveError ? `live 실패 후 대체: ${liveError}` : null }) };
}

export const aiMode = () => mode;
export const aiProvider = () => provider;
export const modelOf = (r: ModelRole) => models[r];
export { PROMPT_VERSION };

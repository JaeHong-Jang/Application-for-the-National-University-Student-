// 저장: JSON 파일 하나(var/store.json). 데모 리셋은 시드에서 다시 만든다. (윤슬 store/db.ts 패턴)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiSource, Cluster, ClusterRun, Lesson, NextLessonCard, Session, StudentResponse } from '../../shared/contracts.js';
import { DATA_DIR, STORE_DIR } from '../paths.js';

export interface Db {
  lessons: Lesson[];
  currentLessonId: string | null;
  sessions: Session[];
  currentSessionCode: string | null;
  responses: StudentResponse[];
  clusters: Cluster[];
  clusterRuns: ClusterRun[];
  cards: NextLessonCard[];
  cardRuns: { lessonId: string; sessionCode: string; source: AiSource; at: string; removed: string[]; mode: string }[];
}

const STORE_FILE = join(STORE_DIR, 'store.json');
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? 7);
let db: Db | null = null;

function fromSeed(): Db {
  const lesson = JSON.parse(readFileSync(join(DATA_DIR, 'seed', 'lesson.seed.json'), 'utf8')) as Lesson;
  return {
    lessons: [lesson],
    currentLessonId: lesson.id,
    sessions: [],
    currentSessionCode: null,
    responses: [],
    clusters: [],
    clusterRuns: [],
    cards: [],
    cardRuns: [],
  };
}

export function resetFromSeed(): Db {
  db = fromSeed();
  save();
  return db;
}

export function get(): Db {
  if (db) return db;
  if (existsSync(STORE_FILE)) {
    try {
      db = { ...fromSeed(), ...(JSON.parse(readFileSync(STORE_FILE, 'utf8')) as Db) };
    } catch {
      db = fromSeed();
    }
  } else db = fromSeed();
  purgeRaw();
  return db;
}

/** 보관기간이 지난 원문은 지운다(마스킹본만 남김) */
export function purgeRaw(now = Date.now()) {
  const limit = RETENTION_DAYS * 86400_000;
  for (const r of get().responses) if (r.rawText && now - Date.parse(r.createdAt) > limit) r.rawText = '';
}

export function save() {
  mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_FILE, JSON.stringify(db, null, 1));
}

export const currentLesson = () => {
  const d = get();
  return d.lessons.find((l) => l.id === d.currentLessonId) ?? d.lessons[d.lessons.length - 1] ?? null;
};
export const session = (code: string) => get().sessions.find((s) => s.code === code);
export const responsesOf = (code: string) => get().responses.filter((r) => r.sessionCode === code);

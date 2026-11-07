// 경로. npm 스크립트는 프로젝트 루트에서 돈다(dev: tsx, start: dist-server).
import { resolve } from 'node:path';

export const ROOT = resolve(process.env.APP_ROOT ?? process.cwd());
export const DATA_DIR = resolve(ROOT, 'data');
export const STORE_DIR = resolve(ROOT, process.env.DATA_DIR ?? 'var');
export const FIXTURE_DIR = resolve(ROOT, process.env.FIXTURE_DIR ?? 'fixtures');
export const DIST_DIR = resolve(ROOT, 'dist');

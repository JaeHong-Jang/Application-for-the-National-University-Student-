// 이벤트 버스(윤슬 harness/trace.ts 패턴). 최근 이벤트를 메모리에 두고 새로 붙은 화면에 먼저 재생한다.
import { EventEmitter } from 'node:events';
import type { StreamEvent } from '../../shared/contracts.js';

const MAX_EVENTS = 400;

class Bus {
  private emitter = new EventEmitter();
  private recent: StreamEvent[] = [];
  constructor() {
    this.emitter.setMaxListeners(200);
  }
  emit(e: StreamEvent) {
    // 파이프라인 단계는 재생하지 않는다(새 화면에 지난 진행이 다시 뜨지 않게)
    if (e.type !== 'pipeline.step') {
      this.recent.push(e);
      if (this.recent.length > MAX_EVENTS) this.recent.shift();
    }
    this.emitter.emit('event', e);
  }
  subscribe(fn: (e: StreamEvent) => void): () => void {
    this.emitter.on('event', fn);
    return () => this.emitter.off('event', fn);
  }
  replay(session?: string): StreamEvent[] {
    return this.recent.filter((e) => matches(e, session));
  }
  clear() {
    this.recent = [];
  }
}

export function matches(e: StreamEvent, session?: string): boolean {
  if (!session) return true;
  if (e.type === 'response') return e.response.sessionCode === session;
  if (e.type === 'safety') return e.sessionCode === session;
  if (e.type === 'session') return e.session.code === session;
  return true;
}

export const bus = new Bus();

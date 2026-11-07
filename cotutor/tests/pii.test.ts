import { describe, expect, it } from 'vitest';
import { findPII, hasSafetySignal, maskPII } from '../shared/check/pii';

describe('PII 마스킹', () => {
  it('전화번호', () => {
    const m = maskPII('우리 마을 가게 아저씨 번호 010-1234-5678 적어도 되요?');
    expect(m.text).toBe('우리 마을 가게 아저씨 번호 [전화번호] 적어도 되요?');
    expect(m.flags).toEqual(['PHONE']);
  });
  it('붙여 쓴 번호·대표번호', () => {
    expect(maskPII('01012345678').flags).toContain('PHONE');
    expect(maskPII('1588-1234로 전화').flags).toContain('PHONE');
  });
  it('이메일', () => expect(maskPII('kid@school.kr 로 보내요').text).toContain('[이메일]'));
  it('주민번호', () => expect(maskPII('150101-3123456').flags).toContain('RRN'));
  it('호명 + 때렸 → NAME_LIKE', () => {
    const m = maskPII('민수가 때렸어요');
    expect(m.text).toBe('○○가 때렸어요');
    expect(m.flags).toContain('NAME_LIKE');
  });
  it('자기 이름 소개', () => {
    const m = maskPII('제 이름은 김하늘이에요');
    expect(m.text).not.toContain('김하늘');
    expect(m.flags).toContain('NAME_LIKE');
  });
  it('주소', () => expect(maskPII('춘천시 효자동 123에 살아요').flags).toContain('ADDRESS_LIKE'));
  it('평범한 질문은 그대로', () => {
    for (const q of ['방위표가 뭐에요', '축척이 머예요', '지도에 우리집은 왜 없어요', '친구가 지도를 봤어요']) expect(maskPII(q)).toEqual({ text: q, flags: [] });
  });
  it('R12용 findPII', () => expect(findPII('연락처 010-2222-3333')).toEqual(['PHONE']));
});

describe('위기 신호(단위 테스트에만 둔 예시)', () => {
  it('잡는다', () => {
    expect(hasSafetySignal('요즘 죽고 싶어요')).toBe(true);
    expect(hasSafetySignal('친구가 자꾸 괴롭혀요')).toBe(true);
  });
  it('일반 질문은 아님', () => expect(hasSafetySignal('북쪽은 항상 위에 있어요?')).toBe(false));
});

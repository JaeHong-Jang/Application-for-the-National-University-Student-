// R12 + 학생 제출 마스킹. 전화·이메일·주민번호 정규식은 masdae-market gates.py에서 옮김.
import type { PiiFlag } from '../contracts.js';

const PHONE_RE = /(?<!\d)0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}(?!\d)|(?<!\d)0\d{9,10}(?!\d)|\+\d{1,3}[-.\s]?\(?\d{1,4}\)?(?:[-.\s]?\d{2,4}){2,3}(?!\d)|(?<!\d)1[5-9]\d{2}[-.\s]\d{4}(?!\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const RRN_RE = /(?<!\d)\d{6}-?[1-4]\d{6}(?!\d)/g;
// "철수가 때렸", "민지한테 맞았", "제 이름은 김하늘" 같은 호명
const NAME_ACT_RE = /([가-힣]{2,3})(?:이가|가|이랑|랑|한테|이한테|이는|는)(?=\s*(?:때렸|때려|괴롭|놀렸|놀려|욕|밀었|맞았|싸웠))/g;
const NAME_INTRO_RE = /(제\s*이름은|내\s*이름은|저는|나는)\s*([가-힣]{2,4})(?=(?:이에요|예요|입니다|이야|야)?)/g;
const ADDRESS_RE = /[가-힣]+(?:시|군|구)\s*[가-힣0-9]+(?:동|읍|면|리|로|길)\s*\d+(?:-\d+)?(?:\s*번지)?|\d+\s*동\s*\d+\s*호/g;
const NOT_NAMES = new Set(['우리', '친구', '선생', '선생님', '엄마', '아빠', '누나', '언니', '오빠', '형', '동생', '사람', '아저씨', '아줌마', '학생', '그거', '이거', '저거', '모르']);

export const SAFETY_WORDS = ['자해', '죽고 싶', '죽고싶', '죽을래', '때려', '때렸', '괴롭혀', '괴롭힘', '괴롭혔', '맞았어', '학대', '자살', '없어지고 싶'];

export function maskPII(text: string): { text: string; flags: PiiFlag[] } {
  const flags = new Set<PiiFlag>();
  let t = text;
  t = t.replace(RRN_RE, () => (flags.add('RRN'), '[주민번호]'));
  t = t.replace(PHONE_RE, () => (flags.add('PHONE'), '[전화번호]'));
  t = t.replace(EMAIL_RE, () => (flags.add('EMAIL'), '[이메일]'));
  t = t.replace(ADDRESS_RE, () => (flags.add('ADDRESS_LIKE'), '[주소]'));
  t = t.replace(NAME_ACT_RE, (m, name: string) => {
    if (NOT_NAMES.has(name)) return m;
    flags.add('NAME_LIKE');
    return m.replace(name, '○○');
  });
  t = t.replace(NAME_INTRO_RE, (m, lead: string, name: string) => {
    if (NOT_NAMES.has(name)) return m;
    flags.add('NAME_LIKE');
    return `${lead} ○○`;
  });
  return { text: t, flags: [...flags] };
}

export const hasSafetySignal = (text: string) => SAFETY_WORDS.some((w) => text.includes(w));

/** R12용: 남아 있는 PII 종류 */
export function findPII(text: string): PiiFlag[] {
  return maskPII(text).flags;
}

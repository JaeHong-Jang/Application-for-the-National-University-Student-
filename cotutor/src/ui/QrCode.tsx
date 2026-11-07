// masdae-market QrCode.tsx를 다시 포맷하고 단순화(qrcode 패키지 사용, 인코더 직접 구현 없음)
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCode({ value, size = 240 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: 540, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => active && setSrc(url))
      .catch(() => active && setError('QR 그림을 만들지 못했어요.'));
    return () => {
      active = false;
    };
  }, [value]);
  return (
    <div className="inline-flex flex-col items-center">
      {src ? <img src={src} width={size} height={size} alt={`학생 접속 QR ${value}`} className="h-auto max-w-full rounded-lg border border-ink-200" /> : <div style={{ width: size, height: size }} className="rounded-lg bg-ink-100" />}
      {error && <p role="alert" className="mt-2 text-xs text-bad-700 dark:text-bad-300">{error}</p>}
    </div>
  );
}

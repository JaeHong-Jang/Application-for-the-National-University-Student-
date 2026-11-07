import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyButton({ text, label = '복사하기' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className="btn-ghost btn-sm no-print" aria-live="polite">
      {done ? <Check size={13} aria-hidden className="text-board-600" /> : <Copy size={13} aria-hidden />}
      {done ? '복사했어요' : label}
    </button>
  );
}

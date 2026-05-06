import { useEffect, useRef } from 'react';

type Handler = () => void;
const registry = new Map<string, Handler[]>();

function registerKey(key: string, handler: Handler): () => void {
  const k = key.toLowerCase();
  if (!registry.has(k)) registry.set(k, []);
  registry.get(k)!.push(handler);
  return () => {
    const stack = registry.get(k);
    if (!stack) return;
    const i = stack.lastIndexOf(handler);
    if (i !== -1) stack.splice(i, 1);
    if (stack.length === 0) registry.delete(k);
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if ((e.target as HTMLElement).isContentEditable) return;
    const stack = registry.get(e.key.toLowerCase());
    if (!stack || stack.length === 0) return;
    e.preventDefault();
    stack[stack.length - 1]();
  });
}

export function useShortcut(key: string | undefined, handler: Handler, disabled = false) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!key || disabled) return;
    return registerKey(key, () => ref.current());
  }, [key, disabled]);
}

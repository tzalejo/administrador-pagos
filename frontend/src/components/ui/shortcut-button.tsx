import { useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from './button';
import { useShortcut } from '@/lib/shortcuts';

interface Props extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  shortcut?: string;
  asChild?: boolean;
}

function withUnderline(text: string, letter: string): ReactNode {
  const idx = text.toLowerCase().indexOf(letter.toLowerCase());
  if (idx === -1) return null;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="underline underline-offset-2">{text[idx]}</span>
      {text.slice(idx + 1)}
    </span>
  );
}

export function ShortcutBtn({ shortcut, disabled, onClick, children, ...props }: Props) {
  const clickRef = useRef(onClick);
  clickRef.current = onClick;

  useShortcut(shortcut, () => (clickRef.current as (() => void) | undefined)?.(), !!disabled);

  let content: ReactNode = children;
  if (shortcut && typeof children === 'string') {
    content = withUnderline(children, shortcut) ?? (
      <>
        {children}
        <kbd className="ml-1.5 inline-flex items-center rounded border border-current/20 px-1 font-sans text-[10px] opacity-40 leading-none">
          {shortcut}
        </kbd>
      </>
    );
  }

  return (
    <Button disabled={disabled} onClick={onClick} {...props}>
      {content}
    </Button>
  );
}

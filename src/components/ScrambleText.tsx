/**
 * ScrambleText — the signature decode micro-interaction: text resolves from
 * random glyphs left→right on mount, and re-scrambles on hover/focus (the
 * "password cracker" effect). Pure rAF, honors reduced motion by rendering
 * the final string immediately. The trailing caret blinks lunar-ice.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+<>/';
const TICK_MS = 28;

interface ScrambleTextProps {
  text: string;
  className?: string;
  /** show the blinking terminal caret after the text */
  caret?: boolean;
  /** replay the decode whenever the pointer enters */
  replayOnHover?: boolean;
  as?: 'span' | 'div';
}

export default function ScrambleText({ text, className, caret, replayOnHover = true, as: Tag = 'span' }: ScrambleTextProps) {
  const reduceMotion = useReducedMotion();
  const [output, setOutput] = useState(text);
  const [settled, setSettled] = useState(true);
  const frameRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    stop();
    let tick = 0;
    setSettled(false);
    timerRef.current = setInterval(() => {
      tick += 1;
      /* resolve roughly one third of a character per tick, left to right */
      const resolved = Math.min(text.length, Math.floor(tick / 3));
      let next = text.slice(0, resolved);
      for (let i = resolved; i < text.length; i += 1) {
        const ch = text[i];
        next += ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      frameRef.current += 1;
      setOutput(next);
      if (resolved >= text.length) {
        stop();
        setSettled(true);
      }
    }, TICK_MS);
  }, [stop, text]);

  useEffect(() => {
    if (reduceMotion) {
      setOutput(text);
      setSettled(true);
      return undefined;
    }
    play();
    return stop;
  }, [play, stop, reduceMotion, text]);

  return (
    <Tag
      className={cn('scramble-text', className)}
      onPointerEnter={replayOnHover && !reduceMotion ? play : undefined}
      aria-label={text}
    >
      <span aria-hidden>{output}</span>
      {caret && (
        <span
          aria-hidden
          className={cn(
            'ml-2 inline-block h-[.82em] w-[2px] translate-y-[.08em] rounded-full bg-cyan align-baseline',
            settled ? 'animate-pulse' : 'opacity-100',
          )}
          style={settled ? undefined : { animation: 'none' }}
        />
      )}
    </Tag>
  );
}

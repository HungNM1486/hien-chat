"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const SCRAMBLE_GLYPHS = "█▓▒░01ABEF47@#$%&╳⌁◆◇";
const SCRAMBLE_LIMIT = 160;
const BATCH_SIZE = 10;

function randomGlyph(): string {
  return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]!;
}

function isInstantChar(char: string): boolean {
  return char === " " || char === "\n" || char === "\t";
}

interface CharState {
  display: string;
  settled: boolean;
  glowing: boolean;
}

function buildScrambled(letters: string[]): CharState[] {
  return letters.map((char) =>
    isInstantChar(char)
      ? { display: char, settled: true, glowing: false }
      : { display: randomGlyph(), settled: false, glowing: false },
  );
}

interface DecryptRevealProps {
  text: string;
  onAnimatingChange?: (animating: boolean) => void;
}

export function DecryptReveal({
  text,
  onAnimatingChange,
}: DecryptRevealProps) {
  const letters = useMemo(() => Array.from(text), [text]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [phase, setPhase] = useState<"scan" | "reveal" | "done">("scan");
  const [chars, setChars] = useState<CharState[]>(() => buildScrambled(letters));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!reduceMotion) return;
    onAnimatingChange?.(false);
  }, [onAnimatingChange, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    setPhase("scan");
    setChars(buildScrambled(letters));
    onAnimatingChange?.(true);

    const scanTimer = window.setTimeout(() => setPhase("reveal"), 560);
    return () => window.clearTimeout(scanTimer);
  }, [letters, onAnimatingChange, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || phase !== "reveal") return;

    let index = 0;
    const timers: number[] = [];
    const intervals: number[] = [];

    const trackTimeout = (id: number) => {
      timers.push(id);
      return id;
    };

    const clearGlow = (charIndex: number) => {
      trackTimeout(
        window.setTimeout(() => {
          setChars((prev) => {
            const next = [...prev];
            const current = next[charIndex];
            if (!current) return prev;
            next[charIndex] = { ...current, glowing: false };
            return next;
          });
        }, 240),
      );
    };

    const settleChar = (charIndex: number, target: string, withGlow: boolean) => {
      setChars((prev) => {
        const next = [...prev];
        next[charIndex] = {
          display: target,
          settled: true,
          glowing: withGlow,
        };
        return next;
      });
      if (withGlow) clearGlow(charIndex);
    };

    const scrambleChar = (charIndex: number, target: string) => {
      let flicker = 0;
      const intervalId = window.setInterval(() => {
        if (flicker < 5) {
          setChars((prev) => {
            const next = [...prev];
            next[charIndex] = {
              display: randomGlyph(),
              settled: false,
              glowing: false,
            };
            return next;
          });
          flicker++;
          return;
        }
        settleChar(charIndex, target, true);
        window.clearInterval(intervalId);
      }, 30);
      intervals.push(intervalId);
    };

    const revealNext = () => {
      if (index >= letters.length) {
        trackTimeout(
          window.setTimeout(() => {
            setPhase("done");
            onAnimatingChange?.(false);
          }, 360),
        );
        return;
      }

      const useBatch = index >= SCRAMBLE_LIMIT;
      const batchEnd = Math.min(
        index + (useBatch ? BATCH_SIZE : 1),
        letters.length,
      );

      for (let i = index; i < batchEnd; i++) {
        const target = letters[i]!;
        if (isInstantChar(target)) {
          settleChar(i, target, false);
          continue;
        }
        if (i < SCRAMBLE_LIMIT) {
          scrambleChar(i, target);
        } else {
          settleChar(i, target, true);
        }
      }

      index = batchEnd;
      trackTimeout(window.setTimeout(revealNext, index < SCRAMBLE_LIMIT ? 26 : 14));
    };

    trackTimeout(window.setTimeout(revealNext, 100));

    return () => {
      for (const id of timers) window.clearTimeout(id);
      for (const id of intervals) window.clearInterval(id);
    };
  }, [letters, onAnimatingChange, phase, reduceMotion]);

  if (reduceMotion) {
    return (
      <p className="whitespace-pre-wrap break-words text-[length:var(--font-size-base)] leading-[1.45]">
        {text}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "decrypt-reveal-shell",
        phase === "scan" && "is-scanning",
        phase === "reveal" && "is-revealing",
        phase === "done" && "is-done",
      )}
    >
      {phase !== "done" && (
        <>
          <div className="decrypt-scan-beam" aria-hidden />
          <div className="decrypt-scan-flare" aria-hidden />
          <div className="decrypt-noise-layer" aria-hidden />
        </>
      )}
      <p
        className="decrypt-reveal-text whitespace-pre-wrap break-words text-[length:var(--font-size-base)] leading-[1.45]"
        aria-label={text}
      >
        {chars.map((char, index) => (
          <span
            key={`${index}-${letters[index]}`}
            aria-hidden
            className={cn(
              "decrypt-char",
              char.settled && "is-settled",
              !char.settled && "is-scrambling",
              char.glowing && "is-glowing",
            )}
          >
            {char.display}
          </span>
        ))}
      </p>
    </div>
  );
}

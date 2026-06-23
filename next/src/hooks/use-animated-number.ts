import { useEffect, useRef, useState } from "react";

const ANIMATION_DURATION = 620;

export function useAnimatedNumber(target: number, disabled: boolean): number {
  const [display, setDisplay] = useState(target);
  const previous = useRef(target);

  useEffect(() => {
    if (disabled) {
      previous.current = target;
      return;
    }

    if (previous.current === target) return;

    let frame = 0;
    const start = performance.now();
    const from = previous.current;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / ANIMATION_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    previous.current = target;
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [disabled, target]);

  return disabled ? target : display;
}

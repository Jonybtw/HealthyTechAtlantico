"use client";

import { motion, AnimatePresence, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { useReducedEffects } from "@/hooks/use-reduced-effects";

// Page wrapper
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedEffects();

  return (
    <motion.div
      variants={reducedMotion ? undefined : pageVariants}
      initial={false}
      animate={reducedMotion ? undefined : "visible"}
      exit={reducedMotion ? undefined : "exit"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade-in wrapper
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const reducedMotion = useReducedEffects();

  return (
    <motion.div
      initial={false}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? undefined
          : { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered list container
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedEffects();

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariants}
      initial={false}
      animate={reducedMotion ? undefined : "visible"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedEffects();

  return (
    <motion.div
      variants={reducedMotion ? undefined : itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale-in (cards, modals)
export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedEffects();

  return (
    <motion.div
      initial={false}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={
        reducedMotion
          ? undefined
          : { duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Number counter
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reducedMotion = useReducedEffects();

  return (
    <motion.span
      key={value}
      initial={false}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reducedMotion ? undefined : { duration: 0.3 }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

// AnimatePresence re-export
export { AnimatePresence, motion };

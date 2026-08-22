"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const PREMIUM_EASE = [0.21, 0.47, 0.32, 0.98] as const;

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number; // seconds
  duration?: number; // seconds
  distance?: number; // pixels to travel from
  once?: boolean; // only animate once (default true)
  className?: string;
}

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 40,
  once = true,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-80px 0px" });
  const shouldReduce = useReducedMotion();

  const getInitial = (): { opacity: number; x?: number; y?: number } => {
    if (shouldReduce) return { opacity: 0 };
    const moves: Record<Direction, { opacity: number; x?: number; y?: number }> = {
      up: { opacity: 0, y: distance },
      down: { opacity: 0, y: -distance },
      left: { opacity: 0, x: distance },
      right: { opacity: 0, x: -distance },
      none: { opacity: 0 },
    };
    return moves[direction];
  };

  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : getInitial()}
      transition={{
        duration: shouldReduce ? 0.1 : duration,
        delay: shouldReduce ? 0 : delay,
        ease: PREMIUM_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger container — animates children one after another
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: shouldReduce ? 0 : staggerDelay } },
      }}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item — use inside StaggerContainer
export function StaggerItem({
  children,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}) {
  const shouldReduce = useReducedMotion();

  const getVariants = () => {
    if (shouldReduce) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      };
    }
    const moves: Record<Direction, { x?: number; y?: number }> = {
      up: { y: 30 },
      down: { y: -30 },
      left: { x: 30 },
      right: { x: -30 },
      none: {},
    };
    return {
      hidden: { opacity: 0, ...moves[direction] },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: { duration: 0.55, ease: PREMIUM_EASE },
      },
    };
  };

  return (
    <motion.div variants={getVariants()} className={className}>
      {children}
    </motion.div>
  );
}

// Counter animation — numbers count up when scrolled into view.
// Renders the final value server-side for SEO/no-JS, then counts
// from 0 with an eased rAF loop once the element enters the viewport.
export function CountUp({
  end,
  suffix = "",
  prefix = "",
  duration = 2,
  className = "",
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const shouldReduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (shouldReduce) {
      setDisplay(end);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      // easeOutCubic — fast start, gentle landing
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, shouldReduce, end, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: shouldReduce ? 0.1 : 0.4 }}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}

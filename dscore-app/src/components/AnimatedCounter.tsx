import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

// Counts from 0 → target value with a cubic ease-out when scrolled into view.
// Uses Motion's useMotionValue so it doesn't re-render on every frame.
export default function AnimatedCounter({ value, decimals = 0, prefix = '', suffix = '', duration = 1.2 }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.34, 1.1, 0.64, 1],
    });
    return controls.stop;
  }, [isInView, value, duration, motionVal]);

  return (
    <span ref={ref} className="inline-flex items-baseline">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

'use client';

import { useScroll, useSpring, motion } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, var(--accent), var(--accent-vivid), #818CF8)',
        transformOrigin: '0%',
        zIndex: 100,
        boxShadow: '0 0 8px var(--accent-glow)',
      }}
    />
  );
}

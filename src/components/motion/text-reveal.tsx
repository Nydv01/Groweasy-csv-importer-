'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

export function TextReveal({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'end 0.25'],
  });

  const words = text.split(' ');

  return (
    <span ref={containerRef} className={`relative z-0 inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </span>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: any;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <span className="relative mr-2 lg:mr-3 mt-1 inline-block">
      <span className="absolute opacity-15" style={{ color: 'var(--text-primary)' }}>{children}</span>
      <motion.span style={{ opacity, color: 'var(--text-primary)' }} className="relative">
        {children}
      </motion.span>
    </span>
  );
}

'use client';

import { useEffect, useRef } from 'react';

export function AmbientBackground({ state }: { state: 'idle' | 'processing' | 'completed' }) {
  return (
    <div className={`ambient-bg ${state}`} aria-hidden="true">
      {/* Animated mesh gradient */}
      <div className="mesh-gradient" />

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Dot grid pattern */}
      <div className="grid-pattern" />
    </div>
  );
}

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // When scroll is 0 (top of page), the card is flat (0deg) and normal size (1).
  // As the user scrolls down, the card tilts backward and zooms out (scales down)
  const rotate = useTransform(scrollYProgress, [0, 0.6], [0, 15]);
  const scale = useTransform(scrollYProgress, [0, 0.6], isMobile ? [1, 0.9] : [1, 0.92]);
  const translate = useTransform(scrollYProgress, [0, 0.6], [0, 80]);

  return (
    <div
      className="w-full flex flex-col items-center justify-center relative p-2 md:p-10"
      ref={containerRef}
      style={{
        minHeight: isMobile ? '80vh' : '100vh',
        paddingTop: isMobile ? '1rem' : '2rem',
      }}
    >
      {/* Title */}
      <Header translate={translate} titleComponent={titleComponent} />
      
      {/* Centered 3D perspective card wrapper */}
      <div
        className="w-full max-w-4xl mx-auto relative mt-6"
        style={{
          perspective: '1200px',
        }}
      >
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

export function Header({ translate, titleComponent }: { translate: MotionValue<number>; titleComponent: React.ReactNode }) {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="w-full max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
}

export function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        transformOrigin: 'top center',
        boxShadow:
          '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
      }}
      className="w-full max-w-4xl mx-auto border border-glass p-2 md:p-4 bg-glass rounded-[24px] shadow-2xl backdrop-blur-md"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-glass border border-glass">
        {children}
      </div>
    </motion.div>
  );
}

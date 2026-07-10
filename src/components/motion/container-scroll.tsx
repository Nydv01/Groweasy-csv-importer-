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

  const scaleDimensions = () => {
    return isMobile ? [0.85, 0.95] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 0.5], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <div
      className="flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
      style={{
        minHeight: isMobile ? '80vh' : '110vh',
        paddingTop: isMobile ? '2rem' : '4rem',
      }}
    >
      <div
        className="w-full relative"
        style={{
          perspective: '1000px',
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
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
      className="max-w-5xl mx-auto text-center"
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
        boxShadow:
          '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
      }}
      className="max-w-4xl -mt-6 mx-auto w-full border border-glass p-2 md:p-4 bg-glass rounded-[24px] shadow-2xl backdrop-blur-md"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-glass border border-glass">
        {children}
      </div>
    </motion.div>
  );
}

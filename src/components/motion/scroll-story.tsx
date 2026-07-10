'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const STAGES = [
  {
    title: 'Upload anything',
    description: 'Facebook Lead Ads, Google Ads exports, CRM dumps, messy spreadsheets — any CSV structure works.',
    sourceColumns: ['"Customer Name"', '"WhatsApp No."', '"Lead Stage"', '"Campaign"', '"Assigned To"', '"Date Added"'],
  },
  {
    title: 'See what AI understood',
    description: 'Intelligent field mapping connects your arbitrary columns to the GrowEasy CRM schema with confidence indicators.',
    mappings: [
      { from: '"Customer Name"', to: 'name', conf: 'high' },
      { from: '"WhatsApp No."', to: 'mobile', conf: 'high' },
      { from: '"Lead Stage"', to: 'crm_status', conf: 'likely' },
      { from: '"Assigned To"', to: 'lead_owner', conf: 'likely' },
    ],
  },
  {
    title: 'Receive clean CRM data',
    description: 'Validated, normalized records ready for your pipeline. Invalid leads automatically identified and explained.',
    crmFields: ['name', 'email', 'mobile', 'company', 'city', 'crm_status', 'lead_owner', 'data_source'],
  },
];

export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });

  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (v) => {
      if (v < 0.33) setActiveStage(0);
      else if (v < 0.66) setActiveStage(1);
      else setActiveStage(2);
    });
    return unsubscribe;
  }, [smoothProgress]);

  const opacity0 = useTransform(smoothProgress, [0, 0.15, 0.28, 0.33], [0, 1, 1, 0]);
  const opacity1 = useTransform(smoothProgress, [0.3, 0.4, 0.6, 0.66], [0, 1, 1, 0]);
  const opacity2 = useTransform(smoothProgress, [0.6, 0.7, 0.9, 1], [0, 1, 1, 0.8]);
  const y0 = useTransform(smoothProgress, [0, 0.15, 0.28, 0.33], [40, 0, 0, -30]);
  const y1 = useTransform(smoothProgress, [0.3, 0.4, 0.6, 0.66], [40, 0, 0, -30]);
  const y2 = useTransform(smoothProgress, [0.6, 0.7, 0.9, 1], [40, 0, 0, 0]);

  if (reducedMotion) {
    return (
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h2 className="text-title" style={{ textAlign: 'center', marginBottom: 48 }}>
          How it <span className="text-gradient">works</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {STAGES.map((stage, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.9375rem', flexShrink: 0, fontFamily: 'var(--font-display)',
                boxShadow: '0 4px 16px var(--accent-glow)',
              }}>
                {i + 1}
              </div>
              <div>
                <h3 className="text-heading" style={{ marginBottom: 6 }}>{stage.title}</h3>
                <p className="text-body">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative', minHeight: '250vh',
        borderTop: '1px solid var(--border)', marginTop: 80,
      }}
    >
      {/* Section title */}
      <motion.div
        style={{
          position: 'absolute', top: 40, left: 0, right: 0,
          textAlign: 'center', zIndex: 5,
        }}
      >
        <h2 className="text-title">
          How it <span className="text-gradient">works</span>
        </h2>
      </motion.div>

      {/* Sticky container */}
      <div style={{
        position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
        display: 'flex', overflow: 'hidden',
      }}>
        {/* Left: Visualization */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', position: 'relative',
        }}>
          {/* Stage 0: Scattered source columns */}
          <motion.div style={{ opacity: opacity0, y: y0, position: 'absolute' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 340, justifyContent: 'center' }}>
              {STAGES[0].sourceColumns!.map((col, i) => (
                <motion.div
                  key={col}
                  initial={{ rotate: (i - 3) * 5, y: i * 3 }}
                  animate={{
                    rotate: [(i - 3) * 5, (i - 3) * 2, (i - 3) * 5],
                    y: [i * 3, i * 3 - 6, i * 3],
                  }}
                  transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    padding: '10px 16px', background: 'var(--bg-surface)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontSize: '0.8125rem', color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)',
                    backdropFilter: 'blur(8px)', fontFamily: 'var(--font-mono)',
                  }}
                >
                  {col}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stage 1: Mapping connections */}
          <motion.div style={{ opacity: opacity1, y: y1, position: 'absolute' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STAGES[1].mappings?.map((m, i) => (
                <motion.div
                  key={m.from}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8125rem' }}
                >
                  <span style={{
                    padding: '8px 14px', background: 'var(--bg-surface)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text-secondary)', minWidth: 140, fontFamily: 'var(--font-mono)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    {m.from}
                  </span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.125rem' }}
                  >
                    →
                  </motion.span>
                  <span className="text-mono" style={{
                    padding: '8px 14px', background: 'var(--accent-glow)',
                    border: '1px solid var(--accent)', borderRadius: 8,
                    color: 'var(--accent)', fontWeight: 600,
                  }}>
                    {m.to}
                  </span>
                  <span className={`confidence-${m.conf}`} style={{ fontSize: '0.6875rem' }}>
                    {m.conf === 'high' ? '●' : '◐'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stage 2: Clean CRM fields */}
          <motion.div style={{ opacity: opacity2, y: y2, position: 'absolute' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 320 }}>
              {STAGES[2].crmFields?.map((field, i) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-mono"
                  style={{
                    padding: '10px 14px', background: 'var(--accent-glow)',
                    border: '1px solid var(--accent)', borderRadius: 10,
                    color: 'var(--accent)', fontSize: '0.75rem',
                    fontWeight: 600, textAlign: 'center',
                    boxShadow: '0 2px 8px var(--accent-glow)',
                  }}
                >
                  {field}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Text stages */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
          <div>
            {STAGES.map((stage, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: activeStage === i ? 1 : 0.15,
                  y: activeStage === i ? 0 : 10,
                  scale: activeStage === i ? 1 : 0.97,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginBottom: i < STAGES.length - 1 ? 52 : 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: activeStage === i
                      ? 'linear-gradient(135deg, var(--accent), var(--accent-deep))'
                      : 'var(--bg-elevated)',
                    color: activeStage === i ? 'white' : 'var(--text-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.75rem',
                    transition: 'all 0.4s ease', fontFamily: 'var(--font-display)',
                    boxShadow: activeStage === i ? '0 4px 16px var(--accent-glow)' : 'none',
                  }}>
                    {i + 1}
                  </div>
                  <h3 className="text-heading">{stage.title}</h3>
                </div>
                <p className="text-body" style={{ paddingLeft: 46 }}>{stage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

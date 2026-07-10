'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { TextReveal } from '@/components/motion/text-reveal';

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

  // Opacities & translations for each stage
  const opacity0 = useTransform(smoothProgress, [0, 0.12, 0.28, 0.33], [0, 1, 1, 0]);
  const opacity1 = useTransform(smoothProgress, [0.3, 0.38, 0.6, 0.66], [0, 1, 1, 0]);
  const opacity2 = useTransform(smoothProgress, [0.6, 0.68, 0.88, 1], [0, 1, 1, 0.8]);

  const y0 = useTransform(smoothProgress, [0, 0.15, 0.28, 0.33], [40, 0, 0, -30]);
  const y1 = useTransform(smoothProgress, [0.3, 0.4, 0.6, 0.66], [40, 0, 0, -30]);
  const y2 = useTransform(smoothProgress, [0.6, 0.7, 0.88, 1], [40, 0, 0, 0]);

  // Timeline progress line filling
  const timelineProgress = useTransform(smoothProgress, [0.1, 0.9], ['0%', '100%']);

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
        position: 'relative', minHeight: '260vh',
        borderTop: '1px solid var(--border)', marginTop: 80,
      }}
    >
      {/* Section Title */}
      <div style={{ position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
        <h2 className="text-title" style={{ fontSize: '2rem' }}>
          How it <span className="text-gradient">works</span>
        </h2>
      </div>

      {/* Sticky layout container */}
      <div style={{
        position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
        display: 'flex', overflow: 'hidden',
      }}>
        
        {/* Left column: Highly Animated Visualizations */}
        <div style={{
          flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', position: 'relative', perspective: '1200px',
        }}>
          
          {/* STAGE 0: Messy Columns + Scanning Laser */}
          <motion.div
            style={{ opacity: opacity0, y: y0, position: 'absolute', width: '100%', maxWidth: 420 }}
            className="flex flex-col items-center"
          >
            {/* Visual drop container card */}
            <div className="w-full border border-glass bg-glass p-8 rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-height-[240px]">
              {/* Horizontal Sweeping Laser Line */}
              <motion.div
                animate={{
                  top: ['0%', '100%', '0%'],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, var(--accent), var(--accent-vivid), var(--accent), transparent)',
                  boxShadow: '0 0 14px var(--accent)',
                  zIndex: 5,
                }}
              />

              {/* Messy column badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                {STAGES[0].sourceColumns!.map((col, i) => (
                  <motion.div
                    key={col}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 160,
                      damping: 15,
                      delay: i * 0.08,
                    }}
                    style={{
                      padding: '10px 16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      boxShadow: 'var(--shadow-sm)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {col}
                  </motion.div>
                ))}
              </div>

              {/* Background scanning feedback indicator */}
              <motion.div
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ marginTop: 24, fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                🔍 Analyzing CSV Structure...
              </motion.div>
            </div>
          </motion.div>

          {/* STAGE 1: AI Bezier Connecting Lines + Streaming Particles */}
          <motion.div
            style={{ opacity: opacity1, y: y1, position: 'absolute', width: '100%', maxWidth: 480 }}
            className="flex flex-col items-center"
          >
            <div className="w-full border border-glass bg-glass p-6 rounded-[24px] shadow-2xl relative">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: 20, position: 'relative' }}>
                
                {/* Source Column list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2 }}>
                  {STAGES[1].mappings?.map((m, i) => (
                    <motion.div
                      key={m.from}
                      style={{
                        padding: '8px 12px', background: 'var(--bg-surface)',
                        border: '1px solid var(--border)', borderRadius: 8,
                        fontSize: '0.75rem', color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)', minWidth: 120,
                      }}
                    >
                      {m.from}
                    </motion.div>
                  ))}
                </div>

                {/* SVG Connecting Curves Area */}
                <div style={{ flex: 1, position: 'relative', minWidth: 80 }}>
                  <svg width="100%" height="110" viewBox="0 0 100 110" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
                    {STAGES[1].mappings?.map((_, i) => {
                      const y = i * 32 + 16;
                      const pathId = `path-${i}`;
                      return (
                        <g key={i}>
                          {/* S-curve path */}
                          <path
                            id={pathId}
                            d={`M 0 ${y} C 40 ${y}, 60 ${y}, 100 ${y}`}
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          {/* Animated particle flow along the path */}
                          <motion.path
                            d={`M 0 ${y} C 40 ${y}, 60 ${y}, 100 ${y}`}
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="2"
                            strokeDasharray="10 120"
                            animate={{ strokeDashoffset: [-130, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Target Column list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2 }}>
                  {STAGES[1].mappings?.map((m, i) => (
                    <motion.div
                      key={m.to}
                      style={{
                        padding: '8px 12px', background: 'var(--accent-glow)',
                        border: '1px solid var(--accent)', borderRadius: 8,
                        fontSize: '0.75rem', color: 'var(--accent)',
                        fontFamily: 'var(--font-mono)', fontWeight: 600,
                        minWidth: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      {m.to}
                      <span className={`confidence-${m.conf}`} style={{ fontSize: '0.625rem' }}>●</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Neural network pulse */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                <span className="logo-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="status-dot" />
                  AI Intelligence Mapping Active
                </span>
              </div>
            </div>
          </motion.div>

          {/* STAGE 2: Interactive Clean Grid Compilation */}
          <motion.div
            style={{ opacity: opacity2, y: y2, position: 'absolute', width: '100%', maxWidth: 450 }}
            className="flex flex-col items-center"
          >
            <div className="w-full border border-glass bg-glass p-6 rounded-[24px] shadow-2xl relative overflow-hidden">
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ✓ GROW-CRM Output Stream
              </p>
              
              {/* Clean database mini grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', background: 'var(--bg-inset)', padding: 6, borderRadius: 12 }}>
                {[
                  { name: 'Nitin Yadav', phone: '+91 9982312211', status: 'GOOD_LEAD' },
                  { name: 'John Doe', phone: '+1 4153322123', status: 'SALE_DONE' },
                  { name: 'Sarah Connor', phone: '+1 6509982312', status: 'FOLLOW_UP' },
                ].map((row, i) => (
                  <motion.div
                    key={row.name}
                    initial={{ opacity: 0, x: -30 }}
                    animate={activeStage === 2 ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      type: 'spring',
                      stiffness: 140,
                      damping: 14,
                      delay: i * 0.15,
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 8,
                      fontSize: '0.75rem', border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Checkmark drawing effect */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-good)" strokeWidth="3" strokeLinecap="round">
                        <motion.path
                          d="M20 6L9 17l-5-5"
                          initial={{ pathLength: 0 }}
                          animate={activeStage === 2 ? { pathLength: 1 } : {}}
                          transition={{ duration: 0.5, delay: i * 0.2 + 0.3 }}
                        />
                      </svg>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</span>
                    </div>
                    <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{row.phone}</span>
                  </motion.div>
                ))}
              </div>

              {/* Progress usability stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span className="text-caption">Clean record compile rate</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.875rem' }}>98.4%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vertical timeline track line spacer */}
        <div style={{ width: '4px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '15%', bottom: '15%', width: '2px', background: 'var(--border)' }} />
          <motion.div
            style={{
              position: 'absolute', top: '15%', height: timelineProgress, width: '3px',
              background: 'linear-gradient(to bottom, var(--accent), var(--accent-vivid))',
              boxShadow: '0 0 8px var(--accent-glow)',
            }}
          />
        </div>

        {/* Right column: Timeline text stages */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          padding: '2rem 3rem 2rem 2rem', zIndex: 2,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 60, width: '100%' }}>
            {STAGES.map((stage, i) => {
              const isActive = activeStage === i;
              return (
                <motion.div
                  key={i}
                  animate={{
                    opacity: isActive ? 1 : 0.15,
                    x: isActive ? 0 : -10,
                    scale: isActive ? 1.02 : 0.98,
                  }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Glowing circular step numbers */}
                    <motion.div
                      animate={isActive ? {
                        scale: [1, 1.12, 1],
                        boxShadow: '0 0 20px var(--accent-glow)',
                        borderColor: 'var(--accent)',
                      } : {
                        scale: 1,
                        boxShadow: 'none',
                        borderColor: 'var(--border)',
                      }}
                      style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: isActive
                          ? 'linear-gradient(135deg, var(--accent), var(--accent-deep))'
                          : 'var(--bg-elevated)',
                        color: isActive ? 'white' : 'var(--text-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.875rem', border: '2px solid transparent',
                        transition: 'all 0.3s ease', fontFamily: 'var(--font-display)',
                      }}
                    >
                      {i + 1}
                    </motion.div>
                    <h3 className="text-heading" style={{ fontSize: '1.25rem' }}>
                      {stage.title}
                    </h3>
                  </div>
                  <div style={{ paddingLeft: 52 }}>
                    {isActive ? (
                      <TextReveal text={stage.description} />
                    ) : (
                      <p className="text-body" style={{ opacity: 0.5 }}>{stage.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

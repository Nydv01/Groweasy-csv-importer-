'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatNumber } from '@/lib/utils';
import { motionPresets, springPresets, staggerChildren, fadeInUp } from '@/lib/motion/presets';
import type { FieldMapping, BatchProgress } from '@/types/import';

// Pipeline stages
const PIPELINE_STAGES = [
  { id: 'read', label: 'Reading Structure', icon: '📄', description: 'Analyzing column headers and data patterns' },
  { id: 'detect', label: 'Detecting Columns', icon: '🔍', description: 'Understanding field relationships' },
  { id: 'map', label: 'Mapping CRM Properties', icon: '🧠', description: 'AI mapping source fields to CRM schema' },
  { id: 'validate', label: 'Processing Records', icon: '⚡', description: 'Validating and normalizing contact information' },
  { id: 'complete', label: 'Completing Import', icon: '✅', description: 'Finalizing records and computing statistics' },
];

function getActiveStageIndex(phase: string): number {
  if (!phase) return 0;
  const p = phase.toLowerCase();
  if (p.includes('reading') || p.includes('structure')) return 0;
  if (p.includes('detecting') || p.includes('column')) return 1;
  if (p.includes('mapping') || p.includes('crm')) return 2;
  if (p.includes('processing') || p.includes('batch') || p.includes('validat') || p.includes('retry')) return 3;
  if (p.includes('complete')) return 4;
  return 3;
}

export function ProcessingView() {
  const { data, dispatch } = useAppState();
  const reducedMotion = useReducedMotion();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [activeMapping, setActiveMapping] = useState(0);
  const [progress, setProgress] = useState({
    phase: 'Reading structure',
    currentBatch: 0,
    totalBatches: 0,
    processedRecords: 0,
    totalRecords: data.parsedCSV?.rowCount || 0,
    detail: '',
  });
  const fetchResults = useCallback(async (jobId: string) => {
    try {
      const [resultsRes, skippedRes] = await Promise.all([
        fetch(`/api/imports/${jobId}/results`),
        fetch(`/api/imports/${jobId}/skipped`),
      ]);
      const resultsData = await resultsRes.json();
      const skippedData = await skippedRes.json();

      dispatch({
        type: 'SET_RESULTS',
        results: resultsData.records || [],
        skipped: skippedData.records || [],
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: {
          title: 'Failed to load results',
          message: 'Processing completed but results could not be retrieved.',
          recoverable: true,
        },
      });
    }
  }, [dispatch]);

  // Connect to SSE
  useEffect(() => {
    if (!data.jobId) return;

    const es = new EventSource(`/api/imports/${data.jobId}/process`);
    eventSourceRef.current = es;

    es.addEventListener('init', (e) => {
      const d = JSON.parse(e.data);
      if (d.fieldMappings?.length) {
        setMappings(d.fieldMappings);
        dispatch({ type: 'SET_FIELD_MAPPINGS', mappings: d.fieldMappings });
      }
    });

    es.addEventListener('progress', (e) => {
      const d = JSON.parse(e.data);
      setProgress(prev => ({ ...prev, ...d }));
      dispatch({ type: 'UPDATE_PROGRESS', progress: d });
      dispatch({ type: 'SET_STATE', state: 'batch-progress' });
    });

    es.addEventListener('mapping', (e) => {
      const d = JSON.parse(e.data);
      if (d.mappings) {
        setMappings(d.mappings);
        dispatch({ type: 'SET_FIELD_MAPPINGS', mappings: d.mappings });
      }
      setProgress(prev => ({ ...prev, phase: d.phase || prev.phase }));
    });

    es.addEventListener('batch_complete', (e) => {
      const d = JSON.parse(e.data);
      setProgress(prev => ({
        ...prev,
        currentBatch: d.batch,
        totalBatches: d.totalBatches,
        processedRecords: d.processedRecords,
        totalRecords: d.totalRecords,
      }));
    });

    es.addEventListener('retry', (e) => {
      const d = JSON.parse(e.data);
      setProgress(prev => ({
        ...prev,
        phase: `Retrying batch ${d.batch} — attempt ${d.attempt} of ${d.maxRetries}`,
      }));
    });

    es.addEventListener('complete', (e) => {
      const d = JSON.parse(e.data);
      dispatch({ type: 'STOP_TIMER' });
      dispatch({ type: 'SET_FIELD_MAPPINGS', mappings: d.fieldMappings || mappings });

      // Fetch results
      fetchResults(data.jobId!);
      es.close();
    });

    es.addEventListener('error', (e) => {
      // SSE connection error vs server event
      if (es.readyState === EventSource.CLOSED) return;
    });

    return () => {
      es.close();
    };
  }, [data.jobId, fetchResults, dispatch, mappings]);

  // Cycle through active mapping for animation
  useEffect(() => {
    if (mappings.length === 0) return;
    const mapped = mappings.filter(m => m.crm_field !== 'unmapped');
    if (mapped.length === 0) return;
    const interval = setInterval(() => {
      setActiveMapping(prev => (prev + 1) % mapped.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [mappings]);



  const activeStage = getActiveStageIndex(progress.phase);
  const progressPercent = progress.totalRecords > 0
    ? (progress.processedRecords / progress.totalRecords) * 100
    : 0;
  const mappedFields = mappings.filter(m => m.crm_field !== 'unmapped');

  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px' }}>
      {/* Processing Header */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionPresets.spatial}
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <motion.div
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            background: 'var(--accent-glow)',
            border: '2px solid var(--accent)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
            <path d="M9 15l2 2 4-4" />
          </svg>
        </motion.div>

        <h2 className="text-title" style={{ marginBottom: 8 }}>
          AI is mapping your data
        </h2>
        <p className="text-body">
          {progress.phase}
          {progress.detail && ` — ${progress.detail}`}
        </p>

        {/* Main progress bar */}
        <div style={{ marginTop: 20, maxWidth: 400, margin: '20px auto 0' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: '0.8125rem',
          }}>
            <span className="text-caption tabular-nums">
              {progress.totalBatches > 0
                ? `Batch ${progress.currentBatch} of ${progress.totalBatches}`
                : 'Analyzing structure'
              }
            </span>
            <span className="tabular-nums" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.8125rem' }}>
              {progress.totalRecords > 0
                ? `${formatNumber(progress.processedRecords)} / ${formatNumber(progress.totalRecords)}`
                : ''
              }
            </span>
          </div>
          <div className={`progress-bar ${progress.totalBatches === 0 ? 'progress-indeterminate' : ''}`}>
            <div
              className="progress-fill"
              style={{ width: progress.totalBatches > 0 ? `${progressPercent}%` : undefined }}
            />
          </div>
        </div>
      </motion.div>

      {/* Pipeline Stages */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.1)}
        style={{ marginBottom: 48 }}
      >
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = i === activeStage;
          const isCompleted = i < activeStage;
          const isPending = i > activeStage;

          return (
            <div key={stage.id}>
              <motion.div
                variants={fadeInUp(i * 0.05)}
                className={`pipeline-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                style={{ opacity: isPending ? 0.4 : 1 }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{stage.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    marginBottom: 2,
                  }}>
                    {stage.label}
                  </p>
                  <p className="text-caption">{stage.description}</p>
                </div>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springPresets.snappy}
                    style={{ color: 'var(--status-good)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.div>
                )}
                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ color: 'var(--accent)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className={`pipeline-connector ${isCompleted ? 'active' : ''}`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Field Mapping Visualization — The Signature Visual */}
      <AnimatePresence>
        {mappedFields.length > 0 && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionPresets.spatial}
          >
            <h3 className="text-heading" style={{ marginBottom: 16, textAlign: 'center' }}>
              Field Intelligence
            </h3>

            <div className="mapping-visualization">
              {/* Source Column */}
              <div className="mapping-column">
                <p className="text-caption" style={{ marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6875rem' }}>
                  Source Fields
                </p>
                {mappedFields.map((m, i) => (
                  <motion.div
                    key={m.source_column}
                    className={`mapping-token source ${i === activeMapping ? 'active' : ''}`}
                    initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: i === activeMapping ? 4 : 0,
                      borderColor: i === activeMapping ? 'var(--accent)' : 'var(--border)',
                    }}
                    transition={{ delay: i * 0.05, ...motionPresets.standard }}
                  >
                    &quot;{m.source_column}&quot;
                  </motion.div>
                ))}
              </div>

              {/* Connection Area with SVG lines */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minWidth: 60,
              }}>
                <svg
                  width="100%"
                  height={mappedFields.length * 42}
                  viewBox={`0 0 100 ${mappedFields.length * 42}`}
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', inset: 0, paddingTop: 30 }}
                >
                  {mappedFields.map((_, i) => {
                    const y = i * 42 + 18;
                    const isActive = i === activeMapping;
                    return (
                      <motion.path
                        key={i}
                        d={`M 0 ${y} C 40 ${y}, 60 ${y}, 100 ${y}`}
                        fill="none"
                        stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth={isActive ? 2 : 1}
                        strokeDasharray={isActive ? 'none' : '4 4'}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: isActive ? 1 : 0.4 }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                      />
                    );
                  })}
                </svg>

                {/* Center AI indicator */}
                <motion.div
                  animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    boxShadow: '0 0 20px var(--accent-glow)',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>🧠</span>
                </motion.div>
              </div>

              {/* Target Column */}
              <div className="mapping-column">
                <p className="text-caption" style={{ marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6875rem' }}>
                  CRM Fields
                </p>
                {mappedFields.map((m, i) => (
                  <motion.div
                    key={m.crm_field}
                    className={`mapping-token target ${i === activeMapping ? 'active' : ''}`}
                    initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
                    animate={{
                      opacity: 1,
                      x: i === activeMapping ? -4 : 0,
                    }}
                    transition={{ delay: i * 0.05 + 0.2, ...motionPresets.standard }}
                  >
                    {m.crm_field}
                    <span className={`confidence-${m.confidence}`} style={{ marginLeft: 6, fontSize: '0.6875rem' }}>
                      {m.confidence === 'high' ? '●' : m.confidence === 'likely' ? '◐' : '○'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Active mapping reasoning */}
            {mappedFields[activeMapping] && (
              <motion.div
                key={activeMapping}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionPresets.micro}
                style={{
                  textAlign: 'center',
                  marginTop: 16,
                  padding: '10px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  {mappedFields[activeMapping].confidence === 'high' ? 'High confidence' :
                    mappedFields[activeMapping].confidence === 'likely' ? 'Likely match' : 'Needs review'}
                </span>
                {' · '}
                {mappedFields[activeMapping].reasoning}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

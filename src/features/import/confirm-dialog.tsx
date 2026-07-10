'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatNumber } from '@/lib/utils';
import { motionPresets, springPresets } from '@/lib/motion/presets';

export function ConfirmDialog() {
  const { data, dispatch } = useAppState();
  const reducedMotion = useReducedMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rowCount = data.parsedCSV?.rowCount || 0;

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: data.fileInfo?.name,
          records: data.parsedCSV?.rows,
          headers: data.parsedCSV?.headers,
        }),
      });

      const job = await response.json();
      if (!response.ok) throw new Error(job.error || 'Failed to create import');

      dispatch({ type: 'SET_JOB_ID', jobId: job.id });
      dispatch({ type: 'START_TIMER' });
      dispatch({ type: 'SET_STATE', state: 'processing' });

      await fetch(`/api/imports/${job.id}/process`, { method: 'POST' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: {
          title: 'Import failed',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          recoverable: true,
        },
      });
      setIsSubmitting(false);
    }
  }, [data, dispatch, isSubmitting]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'SET_STATE', state: 'preview' });
  }, [dispatch]);

  const features = [
    { icon: '🔍', text: 'AI will inspect available fields and understand your data structure' },
    { icon: '📦', text: 'Records are processed in small batches for reliability' },
    { icon: '🚫', text: 'Leads without email or mobile will be automatically skipped' },
    { icon: '👁️', text: 'Source data remains visible for comparison after processing' },
  ];

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm AI processing">
      <motion.div
        className="confirm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCancel}
      />

      <motion.div
        className="confirm-content"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
        transition={springPresets.gentle}
      >
        {/* Icon */}
        <motion.div
          initial={reducedMotion ? {} : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...springPresets.bouncy, delay: 0.15 }}
          style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent-glow), rgba(129,140,248,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, color: 'var(--accent)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </motion.div>

        <h3 className="text-title" style={{ marginBottom: 10 }}>
          Map <span className="text-gradient">{formatNumber(rowCount)}</span> records with AI?
        </h3>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map((item, i) => (
              <motion.div
                key={item.text}
                initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...motionPresets.standard, delay: 0.2 + i * 0.07 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                }}
              >
                <span style={{ fontSize: '0.875rem', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                {item.text}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
            Review preview
          </button>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleConfirm}
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.03 } : {}}
            whileTap={!isSubmitting ? { scale: 0.97 } : {}}
            style={{ minWidth: 170 }}
          >
            {isSubmitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                </svg>
              </motion.span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Start AI mapping
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

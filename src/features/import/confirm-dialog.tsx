'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatNumber, pluralize } from '@/lib/utils';
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
      // 1. Create import job
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

      // 2. Start processing
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
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        transition={springPresets.gentle}
      >
        {/* Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'var(--accent-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: 'var(--accent)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
            <path d="M9 15l2 2 4-4" />
          </svg>
        </div>

        <h3 className="text-title" style={{ marginBottom: 8 }}>
          Ready to map {formatNumber(rowCount)} {rowCount === 1 ? 'record' : 'records'}?
        </h3>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🔍', text: 'AI will inspect the available fields and understand your data structure' },
              { icon: '📦', text: 'Records are processed in small batches for reliability' },
              { icon: '🚫', text: 'Leads without email or mobile number will be automatically skipped' },
              { icon: '👁️', text: 'Source data remains visible for comparison after processing' },
            ].map((item) => (
              <div
                key={item.text}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontSize: '0.75rem', marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Review preview
          </button>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleConfirm}
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            style={{ minWidth: 160 }}
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

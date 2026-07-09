'use client';

import { motion } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatNumber } from '@/lib/utils';
import { SKIP_REASON_LABELS, type SkipReason } from '@/types/import';
import { motionPresets, staggerChildren, fadeInUp } from '@/lib/motion/presets';
import type { CrmRecord } from '@/types/crm';

export function SkippedView() {
  const { data, dispatch } = useAppState();
  const reducedMotion = useReducedMotion();
  const { skipped } = data;

  // Group by reason
  const byReason = skipped.reduce((acc, r) => {
    const reason = r.skip_reason || 'UNKNOWN';
    if (!acc[reason]) acc[reason] = [];
    acc[reason].push(r);
    return acc;
  }, {} as Record<string, typeof skipped>);

  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionPresets.standard}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: 'SET_STATE', state: 'results' })}
            style={{ marginLeft: -8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to results
          </button>
        </div>

        <h2 className="text-title" style={{ marginBottom: 4 }}>
          {formatNumber(skipped.length)} Skipped {skipped.length === 1 ? 'Record' : 'Records'}
        </h2>
        <p className="text-body">
          These records were excluded because they didn&apos;t meet the minimum CRM requirements.
        </p>
      </motion.div>

      {/* Summary by reason */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.05)}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}
      >
        {Object.entries(byReason).map(([reason, records]) => (
          <motion.div
            key={reason}
            variants={fadeInUp()}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
            }}
          >
            <span className="tabular-nums" style={{ fontWeight: 600 }}>
              {records.length}
            </span>
            <span style={{ color: 'var(--text-tertiary)', margin: '0 6px' }}>·</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {SKIP_REASON_LABELS[reason as SkipReason] || reason}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Records List */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.03)}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {skipped.map((record, idx) => (
          <motion.div
            key={record.source_row_index}
            variants={fadeInUp()}
            className="skipped-record"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="text-caption tabular-nums" style={{ fontWeight: 600 }}>
                Row {record.source_row_index + 1}
              </span>
              <span className="skip-reason">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
                </svg>
                {SKIP_REASON_LABELS[record.skip_reason as SkipReason] || record.mapping_notes || 'Unknown reason'}
              </span>
            </div>

            {/* Show available values */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(record.record)
                .filter(([, v]) => v)
                .slice(0, 6)
                .map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '4px 10px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                    }}
                  >
                    <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.6875rem' }}>
                      {key}:
                    </span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{String(value).slice(0, 40)}</span>
                  </div>
                ))
              }
              {Object.entries(record.record).filter(([, v]) => v).length === 0 && (
                <span className="text-caption" style={{ fontStyle: 'italic' }}>
                  No usable data in this record
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

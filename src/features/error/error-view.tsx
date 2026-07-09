'use client';

import { motion } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { motionPresets } from '@/lib/motion/presets';

export function ErrorView() {
  const { data, dispatch } = useAppState();
  const error = data.error;

  if (!error) return null;

  const hasPartialResults = data.results.length > 0;

  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionPresets.spatial}
        style={{ textAlign: 'center' }}
      >
        {/* Error icon */}
        <div style={{
          width: 56,
          height: 56,
          margin: '0 auto 20px',
          borderRadius: 16,
          background: 'rgba(220, 38, 38, 0.08)',
          border: '2px solid rgba(220, 38, 38, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--status-error)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-title" style={{ marginBottom: 8 }}>
          {error.title}
        </h2>
        <p className="text-body" style={{ marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          {error.message}
        </p>

        {/* Data safety message */}
        {hasPartialResults && (
          <div className="trust-banner" style={{
            justifyContent: 'center',
            marginBottom: 24,
            background: 'var(--accent-subtle)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            {data.results.length} records are safely processed
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {error.recoverable && data.jobId && (
            <motion.button
              className="btn btn-primary"
              onClick={() => {
                dispatch({ type: 'SET_STATE', state: 'processing' });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Retry
            </motion.button>
          )}
          {hasPartialResults && (
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'SET_STATE', state: 'results' })}
            >
              View partial results
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Start over
          </button>
        </div>
      </motion.div>
    </section>
  );
}

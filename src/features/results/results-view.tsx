'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatNumber, formatPercentage, formatDuration, pluralize } from '@/lib/utils';
import { CRM_FIELDS, CRM_STATUS_LABELS, type CrmStatus, type CrmRecord } from '@/types/crm';
import { motionPresets, staggerChildren, fadeInUp } from '@/lib/motion/presets';
import type { ProcessedRecord } from '@/types/import';

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span>;
  const cls =
    status === 'GOOD_LEAD_FOLLOW_UP' ? 'status-follow-up' :
    status === 'DID_NOT_CONNECT' ? 'status-no-connect' :
    status === 'BAD_LEAD' ? 'status-bad-lead' :
    status === 'SALE_DONE' ? 'status-sale-done' : '';
  const label = CRM_STATUS_LABELS[status as CrmStatus] || status;
  return <span className={`status-badge ${cls}`}>{label}</span>;
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => setDisplay(value), 0);
      return () => clearTimeout(timer);
    }
    const startTime = Date.now();
    const startVal = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration, reducedMotion]);

  return <>{formatNumber(display)}</>;
}

export function ResultsView() {
  const { data, dispatch } = useAppState();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [showMappings, setShowMappings] = useState(false);
  const [scrollShadow, setScrollShadow] = useState({ left: false, right: false });

  const { results, skipped, fieldMappings, startTime, endTime } = data;
  const totalProcessed = results.length + skipped.length;
  const successRate = totalProcessed > 0 ? (results.length / totalProcessed) * 100 : 0;
  const duration = startTime && endTime ? endTime - startTime : 0;

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (statusFilter !== 'all' && r.record.crm_status !== statusFilter) return false;
      if (sourceFilter !== 'all' && r.record.data_source !== sourceFilter) return false;
      if (search) {
        const lower = search.toLowerCase();
        return Object.values(r.record).some(v => v?.toLowerCase().includes(lower));
      }
      return true;
    });
  }, [results, statusFilter, sourceFilter, search]);

  // Scroll shadows
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setScrollShadow({
        left: el.scrollLeft > 5,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 5,
      });
    };
    check();
    el.addEventListener('scroll', check);
    return () => el.removeEventListener('scroll', check);
  }, [filteredResults]);

  // Copy
  const handleCopy = useCallback((value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedCell(key);
    setTimeout(() => setCopiedCell(null), 1500);
  }, []);

  // Export CSV
  const handleExport = useCallback(() => {
    const headers = CRM_FIELDS.join(',');
    const rows = results.map(r =>
      CRM_FIELDS.map(f => {
        const val = r.record[f as keyof CrmRecord] || '';
        // Escape commas and quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groweasy_crm_import_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [results]);

  // Get unique statuses and sources
  const statuses = useMemo(() => {
    const s = new Set(results.map(r => r.record.crm_status).filter(Boolean));
    return Array.from(s);
  }, [results]);

  const sources = useMemo(() => {
    const s = new Set(results.map(r => r.record.data_source).filter(Boolean));
    return Array.from(s);
  }, [results]);

  const MAX_VISIBLE = 200;
  const visibleResults = filteredResults.slice(0, MAX_VISIBLE);

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Completion Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.08)}
        style={{ marginBottom: 32 }}
      >
        <motion.div variants={fadeInUp()} style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={reducedMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: 'var(--accent-glow)',
              border: '2px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </motion.div>
          <h2 className="text-title" style={{ marginBottom: 4 }}>
            Import Complete
          </h2>
          <p className="text-body">
            Your data has been intelligently mapped to the GrowEasy CRM schema
          </p>
        </motion.div>

        {/* Metrics */}
        <motion.div
          variants={fadeInUp(0.1)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div className="metric-card accent">
            <div className="metric-value"><AnimatedNumber value={results.length} /></div>
            <div className="metric-label">Imported</div>
          </div>
          <div className="metric-card">
            <div className="metric-value"><AnimatedNumber value={skipped.length} /></div>
            <div className="metric-label">Skipped</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{successRate.toFixed(1)}%</div>
            <div className="metric-label">Usable</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{fieldMappings.filter(m => m.crm_field !== 'unmapped').length}</div>
            <div className="metric-label">Fields Mapped</div>
          </div>
          {duration > 0 && (
            <div className="metric-card">
              <div className="metric-value" style={{ fontSize: '1.25rem' }}>{formatDuration(duration)}</div>
              <div className="metric-label">Duration</div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={fadeInUp(0.15)}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.button
            className="btn btn-primary"
            onClick={handleExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Clean CSV
          </motion.button>
          {skipped.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'SET_STATE', state: 'skipped-inspection' })}
            >
              View {formatNumber(skipped.length)} skipped
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => setShowMappings(!showMappings)}
          >
            {showMappings ? 'Hide' : 'Inspect'} field mappings
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Import another file
          </button>
        </motion.div>
      </motion.div>

      {/* Field Mappings Panel */}
      <AnimatePresence>
        {showMappings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionPresets.standard}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div className="card" style={{ padding: '1rem' }}>
              <h4 className="text-heading" style={{ marginBottom: 12 }}>Field Mapping Intelligence</h4>
              <div style={{ display: 'grid', gap: 6 }}>
                {fieldMappings.filter(m => m.crm_field !== 'unmapped').map(m => (
                  <div
                    key={m.source_column}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>&quot;{m.source_column}&quot;</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                    <span className="text-mono" style={{ color: 'var(--accent)' }}>{m.crm_field}</span>
                    <span className={`confidence-${m.confidence}`} style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {m.confidence === 'high' ? 'High' : m.confidence === 'likely' ? 'Likely' : 'Review'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Table */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...motionPresets.spatial, delay: 0.3 }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            flex: '1',
            maxWidth: 280,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11L14 14" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search results..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                width: '100%',
                fontFamily: 'var(--font-display)',
              }}
            />
          </div>

          {/* Status filter */}
          {statuses.length > 0 && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
              }}
            >
              <option value="all">All statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{CRM_STATUS_LABELS[s as CrmStatus] || s}</option>
              ))}
            </select>
          )}

          {/* Source filter */}
          {sources.length > 0 && (
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
              }}
            >
              <option value="all">All sources</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <span className="text-caption tabular-nums" style={{ marginLeft: 'auto' }}>
            {formatNumber(filteredResults.length)} records
          </span>
        </div>

        {/* Table */}
        <div className="data-grid-container">
          <div ref={scrollRef} className="data-grid-scroll" style={{ maxHeight: 500 }}>
            <div className={`scroll-shadow-left ${scrollShadow.left ? 'visible' : ''}`} />
            <div className={`scroll-shadow-right ${scrollShadow.right ? 'visible' : ''}`} />

            <table className="data-grid">
              <thead>
                <tr>
                  <th className="row-number">#</th>
                  {CRM_FIELDS.map(field => (
                    <th key={field} className="text-mono">{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleResults.map((r, idx) => (
                  <tr key={r.source_row_index}>
                    <td className="row-number">{r.source_row_index + 1}</td>
                    {CRM_FIELDS.map(field => {
                      const value = r.record[field as keyof CrmRecord] || '';
                      const cellKey = `${r.source_row_index}-${field}`;

                      if (field === 'crm_status') {
                        return (
                          <td key={field}>
                            <StatusBadge status={value} />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={field}
                          onClick={() => value && handleCopy(value, cellKey)}
                          title={value.length > 25 ? value : undefined}
                          className={copiedCell === cellKey ? 'copy-flash' : ''}
                          style={{ cursor: value ? 'pointer' : 'default' }}
                        >
                          {value || <span style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {visibleResults.length === 0 && (
                  <tr>
                    <td
                      colSpan={CRM_FIELDS.length + 1}
                      style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {search || statusFilter !== 'all' || sourceFilter !== 'all'
                        ? 'No records match your filters'
                        : 'No records processed'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredResults.length > MAX_VISIBLE && (
          <p className="text-caption" style={{ marginTop: 8, textAlign: 'center' }}>
            Showing first {MAX_VISIBLE} of {formatNumber(filteredResults.length)} records. Export CSV for full data.
          </p>
        )}
      </motion.div>

      {/* Copy toast */}
      <AnimatePresence>
        {copiedCell && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              zIndex: 100,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

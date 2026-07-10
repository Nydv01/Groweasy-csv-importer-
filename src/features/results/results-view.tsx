'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatNumber, formatDuration } from '@/lib/utils';
import { CRM_FIELDS, CRM_STATUS_LABELS, type CrmStatus, type CrmRecord } from '@/types/crm';
import { motionPresets, springPresets, staggerChildren, fadeInUp } from '@/lib/motion/presets';
import { AnimatedCounter } from '@/components/effects/animated-counter';
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

// Celebration particles on mount
function CelebrationBurst() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);

  useEffect(() => {
    const colors = ['#34D399', '#6EE7B7', '#818CF8', '#F472B6', '#FBBF24', '#60A5FA'];
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 50 + Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.5,
    }));
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="celebration-particle"
          style={{
            left: `${p.x}%`,
            bottom: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </>
  );
}

// Circular progress ring
function ProgressRing({ value, size = 72, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="var(--accent)" strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
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

  const handleCopy = useCallback((value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedCell(key);
    setTimeout(() => setCopiedCell(null), 1500);
  }, []);

  const handleExport = useCallback(() => {
    const headers = CRM_FIELDS.join(',');
    const rows = results.map(r =>
      CRM_FIELDS.map(f => {
        const val = r.record[f as keyof CrmRecord] || '';
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

  const statuses = useMemo(() => Array.from(new Set(results.map(r => r.record.crm_status).filter(Boolean))), [results]);
  const sources = useMemo(() => Array.from(new Set(results.map(r => r.record.data_source).filter(Boolean))), [results]);

  const MAX_VISIBLE = 200;
  const visibleResults = filteredResults.slice(0, MAX_VISIBLE);

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Celebration */}
      {!reducedMotion && <CelebrationBurst />}

      {/* Completion Header */}
      <motion.div initial="hidden" animate="visible" variants={staggerChildren(0.08)} style={{ marginBottom: 36 }}>
        <motion.div variants={fadeInUp()} style={{ textAlign: 'center', marginBottom: 36 }}>
          {/* Success icon */}
          <motion.div
            initial={reducedMotion ? {} : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...springPresets.bouncy, delay: 0.2 }}
            style={{
              width: 64, height: 64, margin: '0 auto 20px', borderRadius: 20,
              background: 'linear-gradient(135deg, var(--accent-glow), rgba(129,140,248,0.08))',
              border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </motion.div>
          <h2 className="text-title" style={{ marginBottom: 6 }}>
            Import <span className="text-gradient">Complete</span>
          </h2>
          <p className="text-body">
            Your data has been intelligently mapped to the GrowEasy CRM schema
          </p>
        </motion.div>

        {/* Metrics */}
        <motion.div
          variants={fadeInUp(0.1)}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}
        >
          <div className="metric-card accent">
            <div className="metric-value"><AnimatedCounter value={results.length} /></div>
            <div className="metric-label">Imported</div>
          </div>
          <div className="metric-card">
            <div className="metric-value"><AnimatedCounter value={skipped.length} /></div>
            <div className="metric-label">Skipped</div>
          </div>
          <div className="metric-card">
            <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ProgressRing value={successRate} size={40} strokeWidth={3} />
              <span><AnimatedCounter value={successRate} decimals={1} suffix="%" /></span>
            </div>
            <div className="metric-label">Usable</div>
          </div>
          <div className="metric-card">
            <div className="metric-value"><AnimatedCounter value={fieldMappings.filter(m => m.crm_field !== 'unmapped').length} /></div>
            <div className="metric-label">Fields Mapped</div>
          </div>
          {duration > 0 && (
            <div className="metric-card">
              <div className="metric-value" style={{ fontSize: '1.375rem' }}>{formatDuration(duration)}</div>
              <div className="metric-label">Duration</div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp(0.15)} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.button className="btn btn-primary btn-lg" onClick={handleExport} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Clean CSV
          </motion.button>
          {skipped.length > 0 && (
            <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_STATE', state: 'skipped-inspection' })}>
              View {formatNumber(skipped.length)} skipped
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowMappings(!showMappings)}>
            {showMappings ? 'Hide' : 'Inspect'} field mappings
          </button>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'RESET' })}>
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
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 className="text-heading" style={{ marginBottom: 14 }}>
                <span className="text-gradient">Field Mapping Intelligence</span>
              </h4>
              <div style={{ display: 'grid', gap: 6 }}>
                {fieldMappings.filter(m => m.crm_field !== 'unmapped').map(m => (
                  <div
                    key={m.source_column}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto 1fr auto',
                      gap: 12, alignItems: 'center', padding: '10px 14px',
                      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>&quot;{m.source_column}&quot;</span>
                    <span style={{ color: 'var(--accent)' }}>→</span>
                    <span className="text-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{m.crm_field}</span>
                    <span className={`confidence-${m.confidence}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
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
        initial={reducedMotion ? {} : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...motionPresets.spatial, delay: 0.3 }}
      >
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', flex: '1', maxWidth: 280, backdropFilter: 'blur(8px)',
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
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '0.8125rem', color: 'var(--text-primary)', width: '100%',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {statuses.length > 0 && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', cursor: 'pointer',
              }}
            >
              <option value="all">All statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{CRM_STATUS_LABELS[s as CrmStatus] || s}</option>
              ))}
            </select>
          )}

          {sources.length > 0 && (
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              style={{
                padding: '8px 12px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', cursor: 'pointer',
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
                {visibleResults.map((r) => (
                  <tr key={r.source_row_index}>
                    <td className="row-number">{r.source_row_index + 1}</td>
                    {CRM_FIELDS.map(field => {
                      const value = r.record[field as keyof CrmRecord] || '';
                      const cellKey = `${r.source_row_index}-${field}`;
                      if (field === 'crm_status') return <td key={field}><StatusBadge status={value} /></td>;
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
                      style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}
                    >
                      {search || statusFilter !== 'all' || sourceFilter !== 'all' ? 'No records match your filters' : 'No records processed'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredResults.length > MAX_VISIBLE && (
          <p className="text-caption" style={{ marginTop: 10, textAlign: 'center' }}>
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
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              padding: '10px 20px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600,
              zIndex: 100, boxShadow: 'var(--shadow-lg)',
            }}
          >
            ✓ Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

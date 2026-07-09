'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatFileSize, pluralize, truncateFilename, delimiterLabel, formatNumber } from '@/lib/utils';
import { motionPresets } from '@/lib/motion/presets';

export function PreviewWorkspace() {
  const { data, dispatch } = useAppState();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(false);
  const [scrollRight, setScrollRight] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const { parsedCSV, fileInfo } = data;

  // Scroll shadow detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setScrollLeft(el.scrollLeft > 5);
      setScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [parsedCSV]);

  // Filter rows based on search
  const filteredRows = parsedCSV?.rows.filter(row => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return Object.values(row).some(v => v?.toLowerCase().includes(lower));
  }) || [];

  // Visible rows (virtualization for large datasets)
  const MAX_VISIBLE = 200;
  const visibleRows = filteredRows.slice(0, MAX_VISIBLE);
  const hasMore = filteredRows.length > MAX_VISIBLE;

  // Copy cell value
  const handleCopy = useCallback((value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedCell(key);
    setTimeout(() => setCopiedCell(null), 1500);
  }, []);

  // Confirm action
  const handleConfirm = useCallback(() => {
    dispatch({ type: 'SET_STATE', state: 'confirming' });
  }, [dispatch]);

  // Reset
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  if (!parsedCSV || !fileInfo) return null;

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* Header */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionPresets.standard}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 className="text-title" style={{ marginBottom: 4 }}>
            {truncateFilename(fileInfo.name, 40)}
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span className="text-caption tabular-nums">{formatNumber(fileInfo.rows)} {fileInfo.rows === 1 ? 'row' : 'rows'}</span>
            <span className="text-caption tabular-nums">{fileInfo.columns} {fileInfo.columns === 1 ? 'column' : 'columns'}</span>
            <span className="text-caption">{formatFileSize(fileInfo.size)}</span>
            <span className="text-caption">{delimiterLabel(fileInfo.delimiter)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            Choose another file
          </button>
          <motion.button
            className="btn btn-primary"
            onClick={handleConfirm}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
              <circle cx="12" cy="15" r="1" fill="currentColor" />
            </svg>
            Map with AI
          </motion.button>
        </div>
      </motion.div>

      {/* Trust banner */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...motionPresets.standard, delay: 0.1 }}
      >
        <div className="trust-banner" style={{ marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v.5M8 7v4" strokeLinecap="round" />
          </svg>
          Preview only — no data has been sent to AI
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...motionPresets.standard, delay: 0.15 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 12,
        }}
      >
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
          maxWidth: 300,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11L14 14" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search preview..."
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

        <span className="text-caption tabular-nums">
          {search ? `${formatNumber(filteredRows.length)} matching` : `${formatNumber(visibleRows.length)} of ${formatNumber(parsedCSV.rowCount)} shown`}
          {hasMore && !search ? ` (showing first ${MAX_VISIBLE})` : ''}
        </span>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...motionPresets.spatial, delay: 0.2 }}
        className="data-grid-container"
      >
        <div ref={scrollRef} className="data-grid-scroll">
          {/* Scroll shadows */}
          <div className={`scroll-shadow-left ${scrollLeft ? 'visible' : ''}`} />
          <div className={`scroll-shadow-right ${scrollRight ? 'visible' : ''}`} />

          <table className="data-grid">
            <thead>
              <tr>
                <th className="row-number">#</th>
                {parsedCSV.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="row-number">{rowIdx + 1}</td>
                  {parsedCSV.headers.map((header) => {
                    const value = row[header] || '';
                    const cellKey = `${rowIdx}-${header}`;
                    return (
                      <td
                        key={header}
                        onClick={() => value && handleCopy(value, cellKey)}
                        title={value.length > 30 ? value : undefined}
                        className={copiedCell === cellKey ? 'copy-flash' : ''}
                        style={{ cursor: value ? 'pointer' : 'default' }}
                      >
                        {value || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', opacity: 0.5 }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Copy feedback */}
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

// Need to import AnimatePresence
import { AnimatePresence } from 'framer-motion';

'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatFileSize, truncateFilename, pluralize, delimiterLabel } from '@/lib/utils';
import { sampleCSVs, createSampleFile, downloadSampleCSV } from '@/lib/csv/sample-data';
import { motionPresets, springPresets } from '@/lib/motion/presets';
import Papa from 'papaparse';

export function UploadZone() {
  const { data, dispatch } = useAppState();
  const reducedMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parseProgress, setParseProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFileAccepted = data.state === 'file-accepted' || data.state === 'parsing';

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!file) return 'No file selected';

    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'csv') return `Invalid file type: .${ext}. Please upload a .csv file.`;

    if (file.size === 0) return 'File is empty. Please upload a CSV with data.';

    if (file.size > 50 * 1024 * 1024) return `File too large (${formatFileSize(file.size)}). Maximum size is 50 MB.`;

    return null;
  }, []);

  // Parse CSV using PapaParse
  const parseCSV = useCallback((file: File) => {
    dispatch({ type: 'SET_STATE', state: 'parsing' });
    setParseProgress('Reading structure');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: (results) => {
        setParseProgress('Detecting columns');

        setTimeout(() => {
          setParseProgress('Preparing preview');

          setTimeout(() => {
            const headers = results.meta.fields || [];
            const rows = results.data as Record<string, string>[];
            const delimiter = results.meta.delimiter || ',';

            if (headers.length === 0) {
              setError('Could not detect headers. Please ensure the CSV has a header row.');
              dispatch({ type: 'SET_STATE', state: 'initial' });
              return;
            }

            // Check for duplicate headers
            const seen = new Set<string>();
            const dupes: string[] = [];
            for (const h of headers) {
              if (seen.has(h)) dupes.push(h);
              seen.add(h);
            }

            dispatch({
              type: 'SET_FILE_INFO',
              fileInfo: {
                name: file.name,
                size: file.size,
                rows: rows.length,
                columns: headers.length,
                delimiter,
                encoding: 'UTF-8',
                headers,
              },
            });

            dispatch({
              type: 'SET_PARSED_CSV',
              parsedCSV: {
                headers,
                rows,
                rawRows: rows.map(r => headers.map(h => r[h] || '')),
                delimiter,
                rowCount: rows.length,
                columnCount: headers.length,
              },
            });

            setParseProgress(null);
          }, 300);
        }, 400);
      },
      error: (err: Error) => {
        setError(`Parse error: ${err.message}`);
        dispatch({ type: 'SET_STATE', state: 'initial' });
        setParseProgress(null);
      },
    });
  }, [dispatch]);

  // Handle file selection
  const handleFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    dispatch({ type: 'SET_FILE', file });

    // Start parsing after brief delay for absorption animation
    setTimeout(() => parseCSV(file), 600);
  }, [dispatch, validateFile, parseCSV]);

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    dispatch({ type: 'SET_STATE', state: 'drag-over' });
  }, [dispatch]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if actually leaving the zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setIsDragOver(false);
      dispatch({ type: 'SET_STATE', state: 'initial' });
    }
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  // Handle sample CSV
  const handleSample = useCallback((index: number) => {
    const sample = sampleCSVs[index];
    const file = createSampleFile(sample);
    handleFile(file);
  }, [handleFile]);

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 40px' }}>
      {/* Main headline */}
      <AnimatePresence mode="wait">
        {!isFileAccepted && (
          <motion.div
            key="headline"
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={motionPresets.spatial}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <h1 className="text-display" style={{ marginBottom: 12 }}>
              Upload any CSV.{' '}
              <span style={{ color: 'var(--accent)' }}>AI understands</span> the structure.
            </h1>
            <p className="text-body" style={{ maxWidth: 480, margin: '0 auto', fontSize: '1.0625rem' }}>
              Any columns. Any structure. One clean CRM.
            </p>
            <p className="text-caption" style={{ marginTop: 8, maxWidth: 440, margin: '8px auto 0' }}>
              Preview locally. Confirm manually. AI maps only when you&apos;re ready.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Surface */}
      <AnimatePresence mode="wait">
        {!isFileAccepted ? (
          <motion.div
            key="upload-surface"
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
            transition={motionPresets.spatial}
          >
            <div
              className={`upload-surface ${isDragOver ? 'drag-over' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Upload CSV file"
            >
              <div className="upload-border-glow" />

              <motion.div
                className="upload-icon"
                animate={isDragOver ? { scale: 1.1, rotate: 0 } : { scale: 1 }}
                transition={springPresets.snappy}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </motion.div>

              <AnimatePresence mode="wait">
                {isDragOver ? (
                  <motion.p
                    key="drag-text"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={motionPresets.micro}
                    style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--accent)' }}
                  >
                    Release to inspect your data
                  </motion.p>
                ) : (
                  <motion.div
                    key="idle-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={motionPresets.micro}
                  >
                    <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>
                      Drop your CSV here
                    </p>
                    <p className="text-caption">
                      or <span style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>browse files</span> · .csv up to 50 MB
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={motionPresets.standard}
                  style={{
                    marginTop: 12,
                    padding: '10px 16px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--status-error)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* File Accepted / Parsing State */
          <motion.div
            key="file-summary"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...motionPresets.spatial, delay: 0.1 }}
          >
            <div className="file-summary">
              <div className="file-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>
                  {data.file ? truncateFilename(data.file.name) : ''}
                </p>
                <p className="text-caption">
                  {data.file ? formatFileSize(data.file.size) : ''}
                  {data.fileInfo && ` · ${pluralize(data.fileInfo.rows, 'row')} · ${pluralize(data.fileInfo.columns, 'column')}`}
                </p>
              </div>
              {parseProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ color: 'var(--accent)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                  <span className="text-caption" style={{ color: 'var(--accent)' }}>
                    {parseProgress}
                  </span>
                </div>
              )}
            </div>

            {/* Parsing progress bar */}
            {parseProgress && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginTop: 12 }}
              >
                <div className="progress-bar progress-indeterminate">
                  <div className="progress-fill" />
                </div>
              </motion.div>
            )}

            {/* Column tokens emerging during parsing */}
            {parseProgress && data.fileInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  justifyContent: 'center',
                }}
              >
                {data.fileInfo.headers.slice(0, 8).map((header, i) => (
                  <motion.span
                    key={header}
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, ...motionPresets.standard }}
                    className="text-mono"
                    style={{
                      padding: '4px 10px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {truncateFilename(header, 20)}
                  </motion.span>
                ))}
                {data.fileInfo.headers.length > 8 && (
                  <span className="text-caption" style={{ padding: '4px 10px' }}>
                    +{data.fileInfo.headers.length - 8} more
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust indicators */}
      {!isFileAccepted && (
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...motionPresets.standard, delay: 0.3 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginTop: 24,
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '🔒', text: 'Local preview first' },
            { icon: '🧠', text: 'Intelligent mapping' },
            { icon: '🚫', text: 'Invalid leads skipped' },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </motion.div>
      )}

      {/* Sample CSVs */}
      {!isFileAccepted && (
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: 32, textAlign: 'center' }}
        >
          <p className="text-caption" style={{ marginBottom: 10 }}>
            Try a sample CSV
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {sampleCSVs.map((sample, i) => (
              <button
                key={sample.filename}
                className="sample-link"
                onClick={() => handleSample(i)}
                title={sample.description}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
                {sample.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

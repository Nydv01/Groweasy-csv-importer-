'use client';

import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Header } from '@/components/layout/header';
import { AmbientBackground, CursorGlow } from '@/components/layout/background';
import { ScrollProgress } from '@/components/layout/scroll-progress';
import { UploadZone } from '@/features/upload/upload-zone';
import { PreviewWorkspace } from '@/features/preview/preview-workspace';
import { ConfirmDialog } from '@/features/import/confirm-dialog';
import { ProcessingView } from '@/features/processing/processing-view';
import { ResultsView } from '@/features/results/results-view';
import { SkippedView } from '@/features/skipped/skipped-view';
import { ErrorView } from '@/features/error/error-view';
import { ScrollStory } from '@/components/motion/scroll-story';
import { motion, AnimatePresence } from 'framer-motion';
import { motionPresets } from '@/lib/motion/presets';

export function AppOrchestrator() {
  const { data } = useAppState();
  const { theme, toggleTheme, mounted } = useTheme();
  const reducedMotion = useReducedMotion();

  const ambientState =
    data.state === 'processing' || data.state === 'batch-progress'
      ? 'processing'
      : data.state === 'results'
        ? 'completed'
        : 'idle';

  const showUpload = ['initial', 'drag-over', 'file-accepted', 'parsing'].includes(data.state);
  const showPreview = data.state === 'preview';
  const showConfirm = data.state === 'confirming';
  const showProcessing = data.state === 'processing' || data.state === 'batch-progress';
  const showResults = data.state === 'results';
  const showSkipped = data.state === 'skipped-inspection';
  const showError = data.state === 'error';

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 32, margin: '0 auto 24px' }} />
          <div className="skeleton" style={{ width: '100%', height: 320, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollProgress />
      <AmbientBackground state={ambientState} />
      {!reducedMotion && <CursorGlow />}
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {showUpload && (
            <motion.div
              key="upload"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
              transition={motionPresets.spatial}
            >
              <UploadZone />
            </motion.div>
          )}

          {showPreview && (
            <motion.div
              key="preview"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={motionPresets.spatial}
            >
              <PreviewWorkspace />
            </motion.div>
          )}

          {showProcessing && (
            <motion.div
              key="processing"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={motionPresets.spatial}
            >
              <ProcessingView />
            </motion.div>
          )}

          {showResults && (
            <motion.div
              key="results"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={motionPresets.spatial}
            >
              <ResultsView />
            </motion.div>
          )}

          {showSkipped && (
            <motion.div
              key="skipped"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={motionPresets.standard}
            >
              <SkippedView />
            </motion.div>
          )}

          {showError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={motionPresets.standard}
            >
              <ErrorView />
            </motion.div>
          )}
        </AnimatePresence>

        {showConfirm && <ConfirmDialog />}

        {/* Scroll Story — only visible on initial/preview */}
        {(data.state === 'initial' || data.state === 'results') && (
          <ScrollStory />
        )}
      </main>
    </>
  );
}

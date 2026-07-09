'use client';

import { AppStateProvider } from '@/hooks/use-app-state';
import { AppOrchestrator } from '@/components/app-orchestrator';

export default function Home() {
  return (
    <AppStateProvider>
      <AppOrchestrator />
    </AppStateProvider>
  );
}

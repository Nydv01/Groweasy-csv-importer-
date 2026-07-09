// ============================================================
// Central Application State Machine
// ============================================================

'use client';

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { AppState, FileInfo, ParsedCSV, BatchProgress, FieldMapping, ProcessedRecord } from '@/types/import';

interface AppData {
  state: AppState;
  file: File | null;
  fileInfo: FileInfo | null;
  parsedCSV: ParsedCSV | null;
  jobId: string | null;
  progress: BatchProgress | null;
  fieldMappings: FieldMapping[];
  results: ProcessedRecord[];
  skipped: ProcessedRecord[];
  error: { title: string; message: string; recoverable: boolean } | null;
  startTime: number | null;
  endTime: number | null;
}

type Action =
  | { type: 'SET_STATE'; state: AppState }
  | { type: 'SET_FILE'; file: File }
  | { type: 'SET_FILE_INFO'; fileInfo: FileInfo }
  | { type: 'SET_PARSED_CSV'; parsedCSV: ParsedCSV }
  | { type: 'SET_JOB_ID'; jobId: string }
  | { type: 'UPDATE_PROGRESS'; progress: Partial<BatchProgress> }
  | { type: 'SET_FIELD_MAPPINGS'; mappings: FieldMapping[] }
  | { type: 'SET_RESULTS'; results: ProcessedRecord[]; skipped: ProcessedRecord[] }
  | { type: 'SET_ERROR'; error: { title: string; message: string; recoverable: boolean } }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'RESET' };

const initialState: AppData = {
  state: 'initial',
  file: null,
  fileInfo: null,
  parsedCSV: null,
  jobId: null,
  progress: null,
  fieldMappings: [],
  results: [],
  skipped: [],
  error: null,
  startTime: null,
  endTime: null,
};

function appReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, state: action.state };
    case 'SET_FILE':
      return { ...state, file: action.file, state: 'file-accepted' };
    case 'SET_FILE_INFO':
      return { ...state, fileInfo: action.fileInfo };
    case 'SET_PARSED_CSV':
      return { ...state, parsedCSV: action.parsedCSV, state: 'preview' };
    case 'SET_JOB_ID':
      return { ...state, jobId: action.jobId };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: state.progress
          ? { ...state.progress, ...action.progress }
          : { currentBatch: 0, totalBatches: 0, processedRecords: 0, totalRecords: 0, successfulRecords: 0, skippedRecords: 0, failedBatches: 0, retriedBatches: 0, currentPhase: '', fieldMappings: [], ...action.progress },
      };
    case 'SET_FIELD_MAPPINGS':
      return { ...state, fieldMappings: action.mappings };
    case 'SET_RESULTS':
      return { ...state, results: action.results, skipped: action.skipped, state: 'results' };
    case 'SET_ERROR':
      return { ...state, error: action.error, state: 'error' };
    case 'START_TIMER':
      return { ...state, startTime: Date.now() };
    case 'STOP_TIMER':
      return { ...state, endTime: Date.now() };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue {
  data: AppData;
  dispatch: React.Dispatch<Action>;
  setAppState: (state: AppState) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(appReducer, initialState);

  const setAppState = useCallback((state: AppState) => {
    dispatch({ type: 'SET_STATE', state });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AppContext.Provider value={{ data, dispatch, setAppState, reset }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

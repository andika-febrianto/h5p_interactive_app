import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FrameResult } from '../types/storyboard';
import { getClientId } from '../lib/clientId';
import { fetchProgress, upsertProgress, clearProgress, ApiError } from '../lib/api';

interface ProgressState {
  results: Record<string, FrameResult>;
  setResult: (result: FrameResult) => void;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  totalFrames: number;
  /** Highest frame index the learner is allowed to jump to (review is always allowed below this). */
  furthestIndex: number;
  resetProgress: () => void;
  /** True while the initial progress fetch for this module is in flight. */
  loading: boolean;
  /** Set if the initial progress fetch failed (e.g. backend unreachable). */
  error: string | null;
}

const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({
  children,
  totalFrames,
  moduleId,
  disableApi = false,
}: {
  children: ReactNode;
  totalFrames: number;
  moduleId: string;
  /** When true, never calls the backend or reads a real clientId — used for
   *  the teacher's live frame preview, which must have zero side effects. */
  disableApi?: boolean;
}) {
  const clientId = useMemo(() => (disableApi ? 'preview' : getClientId()), [disableApi]);
  const [results, setResults] = useState<Record<string, FrameResult>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!disableApi);
  const [error, setError] = useState<string | null>(null);

  // Load this module's progress from the backend once on mount (and whenever
  // the module changes), then resume at the first not-yet-completed frame.
  useEffect(() => {
    if (disableApi) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProgress(clientId, moduleId)
      .then((data) => {
        if (cancelled) return;
        setResults(data);
        const completed = Object.values(data).filter((r) => r.completed).length;
        setCurrentIndex(Math.min(completed, totalFrames));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Gagal memuat progres.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, moduleId, disableApi]);

  const setResult = (result: FrameResult) => {
    setResults((prev) => ({ ...prev, [result.frameId]: result }));
    if (disableApi) return; // preview mode: stop here, no network call
    upsertProgress({
      clientId,
      moduleId,
      frameSlug: result.frameId,
      completed: result.completed,
      correct: result.correct,
      total: result.total,
    }).catch((err) => {
      console.error('Failed to save progress:', err);
    });
  };

  const resetProgress = () => {
    setResults({});
    setCurrentIndex(0);
    if (disableApi) return;
    clearProgress(clientId, moduleId).catch((err) => {
      console.error('Failed to reset progress:', err);
    });
  };

  const value = useMemo(
    () => ({
      results,
      setResult,
      currentIndex,
      setCurrentIndex,
      totalFrames,
      furthestIndex: Object.values(results).filter((r) => r.completed).length,
      resetProgress,
      loading,
      error,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, currentIndex, totalFrames, moduleId, loading, error]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

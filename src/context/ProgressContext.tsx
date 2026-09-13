import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { FrameResult, UserRole } from '../types/storyboard'
import { getClientId } from '../lib/clientId'

import {
  fetchProgress,
  fetchAssignmentProgress,
  fetchChildrenAssignmentProgress,
  upsertProgress,
  clearProgress,
  ApiError,
} from '../lib/api'

interface ProgressState {
  results: Record<string, FrameResult>
  setResult: (result: FrameResult) => void

  currentIndex: number
  setCurrentIndex: (i: number) => void

  totalFrames: number

  /**
   * Highest frame index the learner is allowed to jump to.
   * Review is always allowed below this.
   */
  furthestIndex: number

  resetProgress: () => void

  /**
   * True while the initial progress fetch is in flight.
   */
  loading: boolean

  /**
   * Set if the initial progress fetch failed.
   */
  error: string | null
}

const ProgressContext = createContext<ProgressState | null>(null)

export function ProgressProvider({
  children,
  totalFrames,
  moduleId,
  disableApi = false,
  assignmentId,
  userRole,
  childId,
}: {
  children: ReactNode
  totalFrames: number
  moduleId: string

  /**
   * When true, never calls the backend or reads a real clientId.
   *
   * This is ONLY for teacher/live preview.
   */
  disableApi?: boolean

  /**
   * When set, progress belongs to this assignment.
   */
  assignmentId?: string | null

  /**
   * User role.
   *
   * STUDENT:
   *   Can read and write progress.
   *
   * PARENT:
   *   Can read child's progress but cannot write.
   *
   * TEACHER:
   *   Normally preview only, using disableApi=true.
   */
  userRole?: UserRole

  /**
   * Child whose assignment progress is being viewed.
   *
   * Required when a PARENT is viewing a child's assignment progress.
   */
  childId?: string | null
}) {
  /**
   * Preview mode deliberately does not use a real clientId.
   *
   * IMPORTANT:
   * Parent is NOT preview mode.
   *
   * Parent viewing a child's progress should use:
   *   disableApi={false}
   */
  const clientId = useMemo(
    () => (disableApi ? 'preview' : getClientId()),
    [disableApi],
  )

  const [results, setResults] = useState<Record<string, FrameResult>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(!disableApi)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load the correct type of progress.
   *
   * Rules:
   *
   * 1. disableApi
   *    → do nothing
   *
   * 2. STUDENT + assignmentId
   *    → load student's assignment-specific progress
   *
   * 3. PARENT + childId + assignmentId
   *    → load child's assignment-specific progress
   *
   * 4. Otherwise
   *    → use the existing module-level progress endpoint
   */
  useEffect(() => {
    if (disableApi) {
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)

    let progressRequest: Promise<Record<string, FrameResult>>

    if (userRole === 'PARENT' && childId && assignmentId) {
      /**
       * Parent is viewing a child's real progress.
       *
       * Parent READS progress.
       * Parent does NOT write progress.
       */
      progressRequest = fetchChildrenAssignmentProgress(
        childId,
        moduleId,
        assignmentId,
      )
    } else if (userRole === 'STUDENT' && assignmentId) {
      /**
       * Student is working on a specific assignment.
       *
       * Progress must be isolated by assignment.
       */
      progressRequest = fetchAssignmentProgress(moduleId, assignmentId)
    } else {
      /**
       * Existing behavior.
       *
       * No assignment-specific progress.
       */
      progressRequest = fetchProgress(clientId, moduleId)
    }

    progressRequest
      .then((data) => {
        if (cancelled) return

        setResults(data)

        const completed = Object.values(data).filter((r) => r.completed).length

        setCurrentIndex(Math.min(completed, totalFrames))
      })
      .catch((err) => {
        if (cancelled) return

        setError(
          err instanceof ApiError ? err.message : 'Gagal memuat progres.',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    clientId,
    moduleId,
    assignmentId,
    childId,
    userRole,
    disableApi,
    totalFrames,
  ])

  /**
   * Update one frame's result.
   *
   * Local state is ALWAYS updated so the UI can respond immediately.
   *
   * Backend behavior:
   *
   * - Preview → no API
   * - Parent → no API
   * - Teacher → no API
   * - Student → save to API
   */
  const setResult = (result: FrameResult) => {
    setResults((prev) => ({
      ...prev,
      [result.frameId]: result,
    }))

    /**
     * Preview mode:
     * local state only.
     */
    if (disableApi) return

    /**
     * Only STUDENT is allowed to write progress.
     *
     * Parent can read progress but cannot modify it.
     */
    if (userRole && userRole !== 'STUDENT') return

    upsertProgress({
      clientId,
      moduleId,
      frameSlug: result.frameId,
      completed: result.completed,
      correct: result.correct,
      total: result.total,

      /**
       * If this is an assignment, save under that assignment.
       * Otherwise preserve old module-level behavior.
       */
      assignmentId: assignmentId ?? undefined,
    }).catch((err) => {
      console.error('Failed to save progress:', err)
    })
  }

  /**
   * Reset progress.
   *
   * Only STUDENT is allowed to clear backend progress.
   *
   * Parent viewing a child's progress must never be able
   * to delete/reset that child's progress.
   */
  const resetProgress = () => {
    /**
     * Always reset local UI state.
     */
    setResults({})
    setCurrentIndex(0)

    /**
     * Preview has no backend state.
     */
    if (disableApi) return

    /**
     * Only STUDENT can reset backend progress.
     */
    if (userRole && userRole !== 'STUDENT') return

    clearProgress(clientId, moduleId, assignmentId ?? undefined).catch(
      (err) => {
        console.error('Failed to reset progress:', err)
      },
    )
  }

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
    [
      results,
      currentIndex,
      totalFrames,
      loading,
      error,
      assignmentId,
      userRole,
      childId,
      disableApi,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)

  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider')
  }

  return ctx
}

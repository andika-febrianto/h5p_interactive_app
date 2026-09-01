import type {
  Module as ModuleType,
  Subject as SubjectType,
  FrameResult,
  Frame,
  User,
  UserRole,
} from '../types/storyboard'

export type Module = ModuleType
export type Subject = SubjectType

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const ACCESS_TOKEN_KEY = 'h5p-access-token'
const REFRESH_TOKEN_KEY = 'h5p-refresh-token'

/** Origin the API is served from (e.g. "http://localhost:4000"), derived by
 *  stripping the trailing "/api". Used to build absolute URLs for uploaded
 *  files, which are served statically by the backend at "/uploads/...". */
function getApiOrigin(): string {
  return API_URL.replace(/\/api\/?$/, '')
}

export class ApiError extends Error {
  status?: number
  code?: string
  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}
function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}
function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}
function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Routes that must never trigger an auto-refresh-and-retry — a 401 from
// these means "wrong credentials" or "refresh token itself is dead", not
// "access token expired, try refreshing".
const NO_REFRESH_RETRY_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
]

// Concurrent requests that all hit a 401 at the same time must share a
// single refresh attempt — otherwise each would rotate the refresh token
// and invalidate the others' retries.
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) {
          clearTokens()
          return false
        }
        const data = (await res.json()) as {
          accessToken: string
          refreshToken: string
        }
        setTokens(data.accessToken, data.refreshToken)
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

async function request<T>(
  path: string,
  options?: RequestInit,
  isRetry = false,
): Promise<T> {
  const token = getAccessToken()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    })
  } catch {
    throw new ApiError(
      'Tidak bisa terhubung ke server. Pastikan backend berjalan dan VITE_API_URL sudah benar.',
    )
  }

  // Access token expired mid-session: transparently refresh and retry once,
  // so the user never has to notice or re-type their password every 15 minutes.
  if (
    res.status === 401 &&
    !isRetry &&
    !NO_REFRESH_RETRY_PATHS.includes(path)
  ) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, options, true)
    }
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({}) as { error?: string; code?: string })
    throw new ApiError(
      body.error ?? `Permintaan gagal (${res.status})`,
      res.status,
      body.code,
    )
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface ModuleSummary extends Omit<Module, 'frames'> {
  frameCount: number
  firstFrameKind: Frame['kind']
}

// ---------- Content (read) ----------

export function fetchSubjects(): Promise<Subject[]> {
  return request('/subjects')
}

export function fetchSubject(id: string): Promise<Subject> {
  return request(`/subjects/${encodeURIComponent(id)}`)
}

export function fetchModules(params: {
  grade?: number
  semester?: number
  subjectId?: string
}): Promise<ModuleSummary[]> {
  const qs = new URLSearchParams()
  if (params.grade !== undefined) qs.set('grade', String(params.grade))
  if (params.semester !== undefined) qs.set('semester', String(params.semester))
  if (params.subjectId) qs.set('subjectId', params.subjectId)
  return request(`/modules?${qs.toString()}`)
}

export function fetchModule(id: string): Promise<Module> {
  return request(`/modules/${encodeURIComponent(id)}`)
}

// ---------- Progress ----------

export function fetchProgress(
  clientId: string,
  moduleId: string,
): Promise<Record<string, FrameResult>> {
  const qs = new URLSearchParams({ clientId, moduleId })
  return request(`/progress?${qs.toString()}`)
}

export function fetchProgressSummary(
  clientId: string,
): Promise<Record<string, number>> {
  const qs = new URLSearchParams({ clientId })
  return request(`/progress/summary?${qs.toString()}`)
}

export function upsertProgress(body: {
  clientId: string
  moduleId: string
  frameSlug: string
  completed: boolean
  correct: number
  total: number
}): Promise<FrameResult> {
  return request('/progress', { method: 'POST', body: JSON.stringify(body) })
}

export function clearProgress(
  clientId: string,
  moduleId: string,
): Promise<void> {
  const qs = new URLSearchParams({ clientId, moduleId })
  return request(`/progress?${qs.toString()}`, { method: 'DELETE' })
}

// ---------- Auth ----------

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

/** Persists both tokens from a successful login/register/refresh response. */
export function persistAuthResponse(res: AuthResponse): void {
  setTokens(res.accessToken, res.refreshToken)
}

export function registerAccount(body: {
  name: string
  email: string
  password: string
  role: UserRole
  grade?: number
  semester?: number
}): Promise<AuthResponse> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function login(body: {
  email: string
  password: string
}): Promise<AuthResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

export function fetchMe(): Promise<User> {
  return request('/auth/me')
}

/** Revokes the current session on the server (best-effort) and always clears
 *  local tokens regardless of whether the server call succeeds. */
export async function logoutSession(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' })
  } finally {
    clearTokens()
  }
}

export function hasStoredSession(): boolean {
  return getAccessToken() !== null || getRefreshToken() !== null
}

export interface SessionInfo {
  id: string
  createdAt: string
  expiresAt: string
  userAgent: string | null
  current: boolean
}

export function fetchSessions(): Promise<SessionInfo[]> {
  return request('/auth/sessions')
}

/** Revokes any of the current user's OWN sessions by id — e.g. to log out a
 *  lost device remotely. Revoking the current session just means the next
 *  refresh attempt will fail; it doesn't instantly kill the live access token. */
export function revokeSession(id: string): Promise<void> {
  return request(`/auth/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ---------- Teacher reports ----------

export interface StudentOverviewRow {
  id: string
  name: string
  email: string
  modulesTouched: number
  framesCompleted: number
  correct: number
  total: number
  accuracyPct: number | null
}

export function fetchStudentOverview(): Promise<StudentOverviewRow[]> {
  return request('/reports/overview')
}

// ---------- Content (write — teacher only) ----------

export function createSubject(body: {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  accent: string
}): Promise<Subject> {
  return request('/subjects', { method: 'POST', body: JSON.stringify(body) })
}

export function updateSubject(
  id: string,
  body: Record<string, unknown>,
): Promise<Subject> {
  return request(`/subjects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteSubject(id: string): Promise<void> {
  return request(`/subjects/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function createModule(body: {
  id: string
  subjectId: string
  grade: number
  semester: 1 | 2
  title: string
  subtitle: string
  summary: string
  estimatedMinutes: string
  accent: string
}): Promise<Module> {
  return request('/modules', { method: 'POST', body: JSON.stringify(body) })
}

export function updateModule(
  id: string,
  body: Record<string, unknown>,
): Promise<Module> {
  return request(`/modules/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteModule(id: string): Promise<void> {
  return request(`/modules/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function createFrame(
  moduleId: string,
  frame: Record<string, unknown>,
): Promise<Frame> {
  return request(`/modules/${encodeURIComponent(moduleId)}/frames`, {
    method: 'POST',
    body: JSON.stringify(frame),
  })
}

export function updateFrame(
  moduleId: string,
  slug: string,
  frame: Record<string, unknown>,
): Promise<Frame> {
  return request(
    `/modules/${encodeURIComponent(moduleId)}/frames/${encodeURIComponent(slug)}`,
    {
      method: 'PUT',
      body: JSON.stringify(frame),
    },
  )
}

export function deleteFrame(moduleId: string, slug: string): Promise<void> {
  return request(
    `/modules/${encodeURIComponent(moduleId)}/frames/${encodeURIComponent(slug)}`,
    {
      method: 'DELETE',
    },
  )
}

export function reorderFrames(
  moduleId: string,
  order: string[],
): Promise<void> {
  return request(`/modules/${encodeURIComponent(moduleId)}/frames/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ order }),
  })
}

// ---------- Billing / Subscription ----------

export interface Plan {
  id: string
  name: string
  priceIdr: number
  interval: 'trial' | 'month'
  trialDays: number | null
  features: string[]
}

export function fetchPlans(): Promise<Plan[]> {
  return request('/plans')
}

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED'

export interface MySubscription {
  status: SubscriptionStatus
  planId: string
  planName: string
  currentPeriodEnd: string
  daysLeft: number
  isExpired: boolean
  cancelAtPeriodEnd: boolean
}

export function fetchMySubscription(): Promise<MySubscription> {
  return request('/subscription/me')
}

/** Stops auto-renewal. Access stays valid until currentPeriodEnd (standard
 *  "cancel takes effect at period end" behavior) — see backend/README.md. */
export function cancelSubscription(): Promise<{
  status: SubscriptionStatus
  currentPeriodEnd: string
}> {
  return request('/subscription/cancel', { method: 'POST' })
}

export interface PaymentHistoryRow {
  id: string
  planName: string
  amount: number
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'
  invoiceUrl: string | null
  paidAt: string | null
  createdAt: string
}

export function fetchPaymentHistory(): Promise<PaymentHistoryRow[]> {
  return request('/subscription/payments')
}

/** Starts a checkout for a paid plan — returns the Xendit-hosted invoice URL
 *  to redirect the browser to. The plan only actually upgrades once Xendit
 *  confirms payment (server-side webhook), not immediately after this call. */
export function createCheckout(
  planId: 'basic' | 'pro',
): Promise<{ invoiceUrl: string }> {
  return request('/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  })
}

// ---------- Uploads (teacher only) ----------

export interface UploadResult {
  url: string
  filename: string
  mimetype: string
  size: number
}

/** Uploads a PDF/image file and returns its absolute URL (backend origin +
 *  the served path), ready to drop straight into a frame's src/poster/imageUrl. */
export async function uploadFile(file: File): Promise<UploadResult> {
  const doUpload = async (isRetry = false): Promise<UploadResult> => {
    const token = getAccessToken()
    const formData = new FormData()
    formData.append('file', file)

    let res: Response
    try {
      res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
        // Deliberately no Content-Type header — the browser sets the correct
        // multipart boundary automatically when the body is a FormData.
      })
    } catch {
      throw new ApiError('Tidak bisa terhubung ke server saat mengunggah file.')
    }

    if (res.status === 401 && !isRetry) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return doUpload(true)
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { error?: string })
      throw new ApiError(
        body.error ?? `Unggah gagal (${res.status})`,
        res.status,
      )
    }
    return (await res.json()) as UploadResult
  }

  const data = await doUpload()
  return { ...data, url: `${getApiOrigin()}${data.url}` }
}

// ---------- Parent ----------

export interface ChildInfo {
  id: string
  name: string
  email: string
  grade: number | null
  semester: number | null
  birthDate: string | null
  gender: string | null
}

export interface ModuleProgress {
  moduleId: string
  title: string
  subjectId: string
  completed: number
  total: number
  correct: number
  accuracy: number
}

export interface ReadingProgressItem {
  id: string
  childId: string
  materialId: string
  materialType: string
  title: string
  totalPages: number
  currentPage: number
  status: string
  lastReadAt: string
}

export interface ParentAssignment {
  id: string
  parentId: string
  childId: string
  title: string
  description: string | null
  materialId: string | null
  dueDate: string | null
  status: string
  notes: string | null
  child?: { id: string; name: string; email: string }
  createdAt: string
}

// Children
export function fetchChildren(): Promise<ChildInfo[]> {
  return request('/parent/children')
}

export function addChild(body: {
  name: string
  email: string
  password: string
  grade: number
  semester: number
  birthDate?: string
  gender?: string
}): Promise<ChildInfo> {
  return request('/parent/children', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function unlinkChild(childId: string): Promise<void> {
  return request(`/parent/children/${encodeURIComponent(childId)}`, {
    method: 'DELETE',
  })
}

// Child progress
export function fetchChildProgress(childId: string): Promise<ModuleProgress[]> {
  return request(`/parent/children/${encodeURIComponent(childId)}/progress`)
}

// Reading progress
export function fetchChildReading(childId: string): Promise<ReadingProgressItem[]> {
  return request(`/parent/children/${encodeURIComponent(childId)}/reading`)
}

export function upsertReadingProgress(
  childId: string,
  body: {
    materialId: string
    materialType: 'module' | 'book' | 'article'
    title: string
    totalPages?: number
    currentPage?: number
    status?: 'not_started' | 'in_progress' | 'completed'
  },
): Promise<ReadingProgressItem> {
  return request(`/parent/children/${encodeURIComponent(childId)}/reading`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Assignments
export function fetchAssignments(): Promise<ParentAssignment[]> {
  return request('/parent/assignments')
}

export function createAssignment(body: {
  childId: string
  title: string
  description?: string
  materialId?: string
  dueDate?: string
}): Promise<ParentAssignment> {
  return request('/parent/assignments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateAssignment(
  id: string,
  body: Partial<{
    title: string
    description: string
    materialId: string
    dueDate: string
    status: string
    notes: string
  }>,
): Promise<ParentAssignment> {
  return request(`/parent/assignments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteAssignment(id: string): Promise<void> {
  return request(`/parent/assignments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchChildAssignments(
  childId: string,
): Promise<ParentAssignment[]> {
  return request(
    `/parent/children/${encodeURIComponent(childId)}/assignments`,
  )
}

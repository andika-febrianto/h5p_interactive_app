import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const studyRouter = Router()
studyRouter.use(requireAuth)

function requireString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function startOfUtcDay(d: Date): Date {
  // return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()))
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] // Sunday-first, matches JS getUTCDay()

interface LogSessionBody {
  moduleId?: string
  frameSlug?: string
  durationSeconds?: number
  activityType?: string
}

// POST /api/study/log
// Body: { moduleId, frameSlug, durationSeconds, activityType? }
// Called by a STUDENT after finishing a frame, with how long they spent on it.
// Accumulates onto today's row rather than creating a new row per frame.
studyRouter.post('/log', async (req, resolve, next) => {
  try {
    const role = req.auth!.role
    if (role !== 'STUDENT') {
      resolve
        .status(403)
        .json({ error: 'Hanya siswa yang bisa mencatat sesi belajar' })

      return
    }

    const childId = req.auth!.userId
    const body = req.body as LogSessionBody

    const moduleId = requireString(body.moduleId)
    const frameSlug = requireString(body.frameSlug)
    const activityType = requireString(body.activityType)
    const durationSeconds =
      typeof body.durationSeconds === 'number' && body.durationSeconds > 0
        ? Math.min(body.durationSeconds, 3600) // cap a single frame at 1h — guards against a stuck timer sending a bogus value
        : null

    if (!durationSeconds) {
      resolve
        .status(400)
        .json({ error: '"durationSeconds" must be a positive number' })
      return
    }

    const today = startOfUtcDay(new Date())
    await prisma.studySession.upsert({
      where: { childId_date: { childId, date: today } },
      create: {
        childId,
        date: today,
        durationSeconds,
        moduleId: moduleId ?? undefined,
        frameSlug: frameSlug ?? undefined,
        activityType: activityType ?? undefined,
      },
      update: {
        durationSeconds: { increment: durationSeconds },
        // Keep the most recent frame/module touched, mainly for debugging —
        // the weekly chart only reads the aggregate total, not these fields.
        moduleId: moduleId ?? undefined,
        frameSlug: frameSlug ?? undefined,
        activityType: activityType ?? undefined,
      },
    })

    resolve.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
})

// GET /api/study/weekly?childId=&weekStart=YYYY-MM-DD
// - STUDENT: childId is ignored, always returns their own week.
// - PARENT: childId is required; must be a linked child.
// weekStart defaults to the most recent Monday (UTC). Returns 7 days,
// Monday→Sunday, in the exact shape ParentDashboard's barData expects.
studyRouter.get('/weekly', async (req, res, next) => {
  try {
    const role = req.auth!.role
    const authUserId = req.auth!.userId
    let childId: string

    if (role === 'STUDENT') {
      childId = authUserId
    } else if (role === 'PARENT') {
      const requestedChildId = requireString(req.query.childId)
      if (!requestedChildId) {
        res
          .status(400)
          .json({ error: '"childId" query param is required for parents' })
        return
      }
      const relationship = await prisma.parentChild.findUnique({
        where: {
          parentId_childId: { parentId: authUserId, childId: requestedChildId },
        },
      })
      if (!relationship) {
        res
          .status(404)
          .json({ error: 'Murid tidak terhubung dengan akun Anda' })
        return
      }
      childId = requestedChildId
    } else {
      res.status(403).json({ error: 'Akses ditolak' })
      return
    }

    // Resolve week start: either the given date's Monday, or this week's Monday
    const requestedWeekStart = requireString(req.query.weekStart)
    const anchor = requestedWeekStart
      ? new Date(requestedWeekStart)
      : new Date()
    if (isNaN(anchor.getTime())) {
      res.status(400).json({ error: '"weekStart" must be a a valid date' })
      return
    }

    const anchorUtc = startOfUtcDay(anchor)
    const dow = anchorUtc.getUTCDay() // 0=Sun..6=Sat
    const daysSinceMonday = dow === 0 ? 6 : dow - 1
    const monday = new Date(anchorUtc)

    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
    const nextMonday = new Date(monday)
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7)

    const sessions = await prisma.studySession.findMany({
      where: { childId, date: { gte: monday, lt: nextMonday } },
    })
    const byDate = new Map(
      sessions.map((s) => [
        startOfUtcDay(s.date).toISOString(),
        s.durationSeconds,
      ]),
    )

    // ── Per-day subject breakdown ──────────────────────────────────
    // Query ProgressRecord for completed frames on each day of the week.
    // Group by moduleId → resolve module title + subject name → distribute
    // the day's total minutes proportionally by frame count.
    const clientId = `user:${childId}`
    const allProgress = await prisma.progressRecord.findMany({
      where: {
        clientId,
        completed: true,
        updatedAt: { gte: monday, lt: nextMonday },
      },
      select: { moduleId: true, updatedAt: true },
    })

    // Collect unique module IDs to resolve names in one query
    const moduleIds = [...new Set(allProgress.map((r) => r.moduleId))]
    const modules = moduleIds.length > 0
      ? await prisma.module.findMany({
          where: { id: { in: moduleIds } },
          select: {
            id: true,
            title: true,
            subject: { select: { name: true, shortName: true } },
          },
        })
      : []
    const moduleMap = new Map(modules.map((m) => [m.id, m]))

    // Group progress records by day index (Mon=0..Sun=6) and moduleId
    const framesByDayAndModule: Array<Map<string, number>> = Array.from({ length: 7 }, () => new Map())
    for (const rec of allProgress) {
      const recDate = startOfUtcDay(rec.updatedAt)
      const dayIdx = Math.round((recDate.getTime() - monday.getTime()) / 86400000)
      if (dayIdx < 0 || dayIdx > 6) continue
      const cur = framesByDayAndModule[dayIdx]
      cur.set(rec.moduleId, (cur.get(rec.moduleId) ?? 0) + 1)
    }

    const today = startOfUtcDay(new Date())
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setUTCDate(d.getUTCDate() + i)

      const seconds = byDate.get(d.toISOString()) ?? 0
      const min = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0

      // Build subject breakdown for this day
      const moduleFrameCounts = framesByDayAndModule[i]
      const totalFrames = [...moduleFrameCounts.values()].reduce((a, b) => a + b, 0)
      const breakdown = totalFrames > 0 && min > 0
        ? [...moduleFrameCounts.entries()].map(([modId, frameCount]) => {
            const mod = moduleMap.get(modId)
            const subjectName = mod?.subject?.shortName || mod?.subject?.name || 'Lainnya'
            const moduleTitle = mod?.title || 'Modul'
            return {
              subject: subjectName,
              module: moduleTitle,
              minutes: Math.max(1, Math.round((frameCount / totalFrames) * min)),
              frames: frameCount,
            }
          }).sort((a, b) => b.minutes - a.minutes)
        : []

      return {
        day: DAY_LABELS[d.getUTCDay()],
        date: d.toISOString().slice(0, 10),
        min,
        active: min > 0,
        isToday: d.getTime() === today.getTime(),
        breakdown,
      }
    })
    const maxMin = Math.max(...days.map((d) => d.min), 0)
    const result = days.map((d) => ({
      ...d,
      // "peak" is the highest day this week, but only if there's actually
      // been any activity — otherwise every day at 0 would tie for peak.
      peak: maxMin > 0 && d.min === maxMin,
    }))

    res.json({ weekStart: monday.toISOString().slice(0, 10), days: result })
  } catch (err) {
    next(err)
  }
})
